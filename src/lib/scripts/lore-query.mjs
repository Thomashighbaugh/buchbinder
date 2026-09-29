#!/usr/bin/env bun
/**
 * Lore Query — Semantic Lorebook Retriever
 *
 * Reads lorebook/knowledge/outline/draft files and retrieves the most relevant
 * chunks for a given query using a two-stage retrieval pipeline:
 *   1. Embedding — the configured embedding backend (ONNX by default; Ollama
 *      opt-in via EMBED_BACKEND=ollama) ranks candidates by cosine similarity.
 *   2. Reranking — an optional in-process ONNX cross-encoder
 *      (@huggingface/transformers, default Xenova/bge-reranker-base) re-scores
 *      the top candidates jointly. See ../reranker.mjs.
 *
 * Modes:
 *   query    (default) — Retrieve top-K chunks for a query. Uses the
 *                         precomputed on-disk index when present, otherwise
 *                         re-embeds chunks on the fly.
 *   build              — Build or incrementally update the on-disk index.
 *                         Delegates to index-builder.mjs.
 *   status             — Print index status and exit.
 *
 * Pinning (v3.1):
 *   --pin-chapter N    Include chapter N's draft verbatim in the output
 *                      (bypasses the index; reads the file directly via
 *                      xml-draft-chunker.chunkWholeChapter).
 *   --pin-side SIDE    Which adjacent chapters to pin: 'previous', 'next',
 *                      'both'. Default: 'previous'.
 *
 * Usage:
 *   bun lore-query.mjs [project-root] --query "..." [--top 5] [--rerank]
 *                      [--rerank-backend onnx|ollama|none]
 *                      [--pin-chapter N] [--pin-side previous|next|both]
 *   bun lore-query.mjs [project-root] --build [--force]
 *   bun lore-query.mjs [project-root] --status
 *
 * Project root defaults to process.cwd().
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { loadIndex, buildIndex, printStatus, scanSources, chunkSource } from '../index-builder.mjs'
import { chunkWholeChapter, resolveDraftFilePath } from '../xml-draft-chunker.mjs'
import { embed, activeEmbedBackend, activeEmbedModel } from '../embedder.mjs'
import { rerankDocuments as onnxRerank, RERANK_MODEL as ONNX_RERANK_MODEL, isRerankDisabled } from '../reranker.mjs'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'

// Rerank backend: 'onnx' (default, in-process cross-encoder) | 'ollama' | 'none'
const RERANK_BACKEND = process.env.RERANK_BACKEND || 'onnx'
// Only used by the 'ollama' backend — the ONNX model id lives in reranker.mjs.
const OLLAMA_RERANK_MODEL = process.env.OLLAMA_RERANK_MODEL || 'hans-tech/bge-reranker-v2-m3:260522'

// ─── Cosine Similarity ─────────────────────────────────────────────────────

function cosineSimilarity(a, b) {
    let dot = 0, na = 0, nb = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// ─── Reranking ─────────────────────────────────────────────────────────────

/**
 * Rerank candidate documents against the query.
 *
 * Backends (selected by RERANK_BACKEND / --rerank-backend):
 *   • onnx   (default) — in-process ONNX cross-encoder (@huggingface/transformers,
 *                        Xenova/bge-reranker-base). No server, no provider calls.
 *   • ollama           — POST ${OLLAMA_URL}/api/rerank (only useful on Ollama
 *                        builds that expose that endpoint).
 *   • none             — skip reranking.
 *
 * Returns a new, score-sorted array of the input documents. Throws on failure;
 * callers fall back to cosine distance ordering.
 */
async function rerankOnnx(query, documents) {
    const ranked = await onnxRerank(query, documents.map(d => d.text))
    return ranked.map(r => ({ ...documents[r.index], score: r.score }))
}

async function rerankOllama(query, documents) {
    const res = await fetch(`${OLLAMA_URL}/api/rerank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_RERANK_MODEL,
            query,
            documents: documents.map(d => d.text),
        }),
    })
    if (!res.ok) throw new Error(`Ollama rerank error: ${res.status} ${res.statusText}`)
    const data = await res.json()
    const results = data.results || data.scores || data.rankings
    if (!Array.isArray(results)) throw new Error('Ollama /api/rerank returned no results array')
    return results
        .map(r => {
            const idx = typeof r === 'number' ? null : (r.index ?? r.corpus_id)
            const score = typeof r === 'number' ? r : (r.relevance_score ?? r.score)
            const doc = idx != null && documents[idx] ? documents[idx] : null
            return doc ? { ...doc, score } : null
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
}

async function rerank(query, documents, backend = RERANK_BACKEND) {
    if (backend === 'none' || isRerankDisabled()) {
        throw new Error('reranking disabled')
    }
    if (backend === 'ollama') return rerankOllama(query, documents)
    return rerankOnnx(query, documents)
}

/** Human-readable label for the active reranker (for transparency in output). */
function rerankLabel(backend) {
    if (backend === 'ollama') return `ollama (${OLLAMA_RERANK_MODEL})`
    return `onnx (${ONNX_RERANK_MODEL})`
}

// ─── Index-backed query ────────────────────────────────────────────────────

async function queryWithIndex(index, queryVec, query, topK, doRerank, backend = RERANK_BACKEND) {
    // Score every chunk in the index against the query vector
    const scored = []
    for (const chunk of index.chunks) {
        if (!chunk.embedding) continue
        const score = cosineSimilarity(queryVec, chunk.embedding)
        scored.push({ ...chunk, score })
    }
    scored.sort((a, b) => b.score - a.score)
    const candidates = scored.slice(0, doRerank ? topK * 3 : topK)
    if (doRerank && candidates.length > 1) {
        try {
            return await rerank(query, candidates, backend)
        } catch (err) {
            console.error(`[lore-query] Rerank failed (backend=${backend}): ${err.message}`)
            if (backend === 'onnx') {
                console.error(`[lore-query] Is @huggingface/transformers installed and ${ONNX_RERANK_MODEL} cached?`)
            }
            console.error('[lore-query] Falling back to distance ordering.')
            return candidates
        }
    }
    return candidates
}

// ─── Fallback: re-embed on the fly (no index) ──────────────────────────────

async function queryWithoutIndex(projectRoot, query, topK, doRerank, backend, embedBackend, embedModel) {
    // Re-embed everything by walking sources again
    const sources = scanSources(projectRoot)
    const allChunks = []
    for (const source of sources) {
        const chunks = chunkSource(source, projectRoot)
        allChunks.push(...chunks)
    }
    if (allChunks.length === 0) return []

    let queryVec
    try {
        const [v] = await embed([query], { backend: embedBackend, model: embedModel })
        queryVec = v
    } catch (err) {
        console.error(`[lore-query] Embedding failed (${embedBackend}): ${err.message}`)
        return []
    }

    const scored = []
    for (const chunk of allChunks) {
        try {
            const [vec] = await embed([chunk.text], { backend: embedBackend, model: embedModel })
            scored.push({ ...chunk, score: cosineSimilarity(queryVec, vec) })
        } catch {
            // skip
        }
    }
    scored.sort((a, b) => b.score - a.score)
    const candidates = scored.slice(0, doRerank ? topK * 3 : topK)
    if (doRerank && candidates.length > 1) {
        try {
            return await rerank(query, candidates, backend)
        } catch {
            return candidates
        }
    }
    return candidates
}

// ─── Pinned chapter resolution ─────────────────────────────────────────────

function resolvePins(chapter, side) {
    const pins = []
    if (side === 'previous' || side === 'both') {
        if (chapter - 1 >= 1) pins.push(chapter - 1)
    }
    if (side === 'next' || side === 'both') {
        pins.push(chapter + 1)
    }
    return pins
}

function loadPinnedChapters(projectRoot, chapterNumbers) {
    const pinned = []
    for (const n of chapterNumbers) {
        const filePath = resolveDraftFilePath(projectRoot, n)
        if (!filePath) continue
        const rel = filePath.slice(projectRoot.length + 1)
        pinned.push(chunkWholeChapter(filePath, rel, n))
    }
    return pinned
}

// ─── Output formatting ─────────────────────────────────────────────────────

/** Format a 0..1 relevance score as a percentage, avoiding a misleading "0%". */
function fmtPct(score) {
    const pct = score * 100
    if (pct > 0 && pct < 1) return '<1%'
    return `${pct.toFixed(0)}%`
}

function formatOutput(query, pinned, semantic, topK, rerankInfo = null) {
    const lines = []
    lines.push('## 📚 Relevant Lore Context')
    lines.push('')
    lines.push(`*Retrieved for query: "${query}"*`)
    lines.push(`*Source: series lorebook + per-book knowledge + outline + drafts*`)
    if (rerankInfo) {
        lines.push(`*Reranker: ${rerankInfo}*`)
    }
    if (pinned.length > 0) {
        const labels = pinned.map(p => p.sourcePath || p.source).join(', ')
        lines.push(`*Pinned (adjacent chapters, verbatim for continuity): ${labels}*`)
    }
    lines.push(`*Semantic top-${Math.min(semantic.length, topK)} (relevance: ${semantic.slice(0, topK).map(c => fmtPct(c.score)).join(', ')})*`)
    lines.push('')
    lines.push('---')
    lines.push('')

    for (const chunk of pinned) {
        const src = chunk.sourcePath || chunk.source
        lines.push(`**From: \`${src}\`**  (PINNED — verbatim for continuity)`)
        lines.push('')
        lines.push('```xml')
        lines.push(chunk.text)
        lines.push('```')
        lines.push('')
    }

    for (const chunk of semantic.slice(0, topK)) {
        lines.push(`**From: \`${chunk.sourcePath}${chunk.heading ? '#' + chunk.heading : ''}\`**  (relevance: ${fmtPct(chunk.score)})`)
        lines.push('')
        const fence = chunk.kind === 'draft' ? 'xml' : 'markdown'
        lines.push('```' + fence)
        lines.push(chunk.text)
        lines.push('```')
        lines.push('')
    }

    lines.push('---')
    lines.push('*End of relevant lore context*')
    lines.push('')
    return lines.join('\n')
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2)
    let projectRoot = process.cwd()
    let query = ''
    let topK = 5
    let doRerank = false
    let rerankBackend = RERANK_BACKEND
    let mode = 'query' // 'query' | 'build' | 'status'
    let force = false
    let pinChapter = null
    let pinSide = 'previous'

    for (let i = 0; i < args.length; i++) {
        const a = args[i]
        if (a === '--query') {
            query = args[++i] || ''
        } else if (a === '--top') {
            topK = parseInt(args[++i], 10) || 5
        } else if (a === '--rerank') {
            doRerank = true
        } else if (a === '--rerank-backend') {
            rerankBackend = args[++i] || RERANK_BACKEND
        } else if (a === '--build') {
            mode = 'build'
        } else if (a === '--status') {
            mode = 'status'
        } else if (a === '--force') {
            force = true
        } else if (a === '--pin-chapter') {
            pinChapter = parseInt(args[++i], 10) || null
        } else if (a === '--pin-side') {
            pinSide = args[++i] || 'previous'
        } else if (!a.startsWith('--') && !query) {
            projectRoot = resolve(a)
        }
    }

    // ── build / status modes ──
    if (mode === 'build') {
        return buildIndex(projectRoot, { force })
    }
    if (mode === 'status') {
        return printStatus(projectRoot)
    }

    // ── query mode ──
    if (!query) {
        console.error('Usage: bun lore-query.mjs [project-root] --query "..." [--top N] [--rerank] [--rerank-backend onnx|ollama|none]')
        console.error('       bun lore-query.mjs [project-root] --build [--force]')
        console.error('       bun lore-query.mjs [project-root] --status')
        process.exit(1)
    }

    // Load index (if present). Use the index's recorded embedding backend/model
    // so an existing index keeps working after a config change.
    const index = loadIndex(projectRoot)
    if (!index) {
        console.error('[lore-query] No precomputed index found. Run `npx buchbinder-index` to build one for faster retrieval. Continuing with on-the-fly embedding...')
    }
    const embedBackend = index?.embedBackend || activeEmbedBackend()
    const embedModel = index?.embedModel || activeEmbedModel(embedBackend)
    if (index && (embedBackend !== activeEmbedBackend() || embedModel !== activeEmbedModel(activeEmbedBackend()))) {
        console.error(`[lore-query] Index embedder (${embedBackend}: ${embedModel}) differs from configured (${activeEmbedBackend()}: ${activeEmbedModel()}). Using the index's embedder; run \`npx buchbinder-index --force\` to rebuild with the new one.`)
    }

    // Load pinned chapters (always from disk, not from index)
    const pinned = pinChapter ? loadPinnedChapters(projectRoot, resolvePins(pinChapter, pinSide)) : []

    // Get query embedding
    let queryVec
    try {
        const [v] = await embed([query], { backend: embedBackend, model: embedModel })
        queryVec = v
    } catch (err) {
        console.error(`[lore-query] Embedding failed (${embedBackend}: ${embedModel}): ${err.message}`)
        console.error('[lore-query] Falling back to lore-context.ts full-file read.')
        console.log('')
        return
    }

    // Score chunks
    let semantic
    if (index) {
        semantic = await queryWithIndex(index, queryVec, query, topK, doRerank, rerankBackend)
    } else {
        semantic = await queryWithoutIndex(projectRoot, query, topK, doRerank, rerankBackend, embedBackend, embedModel)
    }

    const rerankInfo = doRerank && rerankBackend !== 'none' ? rerankLabel(rerankBackend) : null
    console.log(formatOutput(query, pinned, semantic, topK, rerankInfo))
}

main().catch(err => {
    console.error(`[lore-query] Fatal: ${err.message}`)
    console.log('')
    process.exit(0) // Exit 0 so the caller doesn't hard-crash on lore failures
})
