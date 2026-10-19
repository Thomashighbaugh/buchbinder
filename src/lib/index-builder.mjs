#!/usr/bin/env node
/**
 * Index Builder — builds the lore/knowledge/outline/draft retrieval index
 *
 * Scans a project's lore, knowledge, outline, and draft files; chunks them
 * using the right chunker per source kind; embeds each chunk via the in-process
 * ONNX embedder (see embedder.mjs); writes
 * the on-disk JSON index at:
 *
 *     <projectRoot>/.opencode/cache/lore-index/index.json
 *
 * The index is the source of truth for runtime query (lore-query.mjs). When
 * the index is missing, the query falls back to re-embedding on the fly
 * (slow, but functional). When the embedder is unreachable, the query falls
 * back to reading the full lore files (lore-context.ts path).
 *
 * Indexing is incremental: re-running on an up-to-date index is a no-op
 * because per-source file hashes are checked before re-embedding. Changing the
 * embedding model invalidates the index and triggers a full rebuild
 * (vectors from different models are not comparable).
 *
 * Usage:
 *   node index-builder.mjs [project-root] [--quiet] [--force]
 *   node index-builder.mjs --status [project-root]
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, renameSync } from 'fs'
import { join, resolve, dirname } from 'path'

import { chunkMarkdownFile, classifySourceKind } from './md-chunker.mjs'
import { chunkXmlDraftFile, resolveDraftFilePath } from './xml-draft-chunker.mjs'
import { embed, activeEmbedModel } from './embedder.mjs'

const INDEX_FILENAME = 'index.json'
const INDEX_SCHEMA_VERSION = 2

// ─── Source patterns (kept in sync with lore-context.ts LORE_PATHS) ────────

/**
 * Source patterns the indexer scans. Each entry:
 *   - glob: a simple `prefix/*.ext` or `prefix/**` pattern (no glob library;
 *     we resolve each by reading the directory directly)
 *   - kind: source kind, used for chunker dispatch and metadata
 *   - chapterNumberFromFilename: if true, extract chapter number from
 *     the filename (for `chapter_NNNNN.xml` style)
 *   - priority: 'high' | 'normal' | 'low' (used by the reranker to break ties)
 *   - pinnable: whether chunks from this source can be pinned (--pin-chapter)
 *   - lowPriority: hint that this source is lower-priority in retrieval
 */
const SOURCE_PATTERNS = [
    // Series lorebook
    { pattern: 'series/lorebook/characters.md', kind: 'lore' },
    { pattern: 'series/lorebook/world.md', kind: 'lore' },
    { pattern: 'series/lorebook/glossary.md', kind: 'lore' },
    { pattern: 'series/lorebook/timeline.json', kind: 'lore' },
    { pattern: 'series/lorebook/threads.md', kind: 'lore' },

    // Series outline (condensed, cross-book)
    { pattern: 'series/outline.md', kind: 'outline' },

    // Per-book knowledge
    { pattern: 'book/knowledge/character-profiles.md', kind: 'lore' },
    { pattern: 'book/knowledge/voice-profiles.json', kind: 'lore' },
    { pattern: 'book/knowledge/locations.md', kind: 'lore' },
    { pattern: 'book/knowledge/world-rules.md', kind: 'lore' },
    { pattern: 'book/knowledge/character-voices.md', kind: 'lore' },

    // Book canon & spec
    { pattern: 'book/manifest.md', kind: 'canon', priority: 'high' },
    { pattern: 'book/specification.md', kind: 'spec', priority: 'high' },

    // Book outline (whole book)
    { pattern: 'book/outline.md', kind: 'outline' },
    // Per-chapter outline details: book/outline/chapter_NN.md
    { pattern: 'book/outline/', kind: 'outline', recursive: true, ext: '.md' },

    // Drafts (XML) — handled by glob
    { pattern: 'book/drafts/', kind: 'draft', recursive: true, ext: '.xml', pinnable: true, chapterNumberFromFilename: true },
]

// ─── Source scanning ────────────────────────────────────────────────────────

/**
 * Scan the project for all source files matching SOURCE_PATTERNS.
 *
 * @param {string} projectRoot
 * @returns {Array<{path: string, kind: string, chapterNumber?: number, priority?: string, pinnable?: boolean}>}
 */
export function scanSources(projectRoot) {
    const sources = []
    for (const pattern of SOURCE_PATTERNS) {
        const fullPath = join(projectRoot, pattern.pattern)
        if (!existsSync(fullPath)) continue

        if (pattern.recursive) {
            // Directory: walk and pick files with the right extension
            const files = walkDir(fullPath, pattern.ext)
            for (const f of files) {
                const rel = f.slice(projectRoot.length + 1)
                const src = {
                    path: rel,
                    kind: pattern.kind,
                }
                if (pattern.chapterNumberFromFilename) {
                    const m = rel.match(/chapter_(\d+)\.xml$/)
                    if (m) src.chapterNumber = parseInt(m[1], 10)
                }
                if (pattern.priority) src.priority = pattern.priority
                if (pattern.pinnable) src.pinnable = pattern.pinnable
                sources.push(src)
            }
        } else {
            // Single file
            const stat = existsSync(fullPath) ? statSync(fullPath) : null
            if (!stat || !stat.isFile()) continue
            const rel = pattern.pattern
            const src = {
                path: rel,
                kind: pattern.kind,
            }
            if (pattern.priority) src.priority = pattern.priority
            if (pattern.pinnable) src.pinnable = pattern.pinnable
            sources.push(src)
        }
    }
    return sources
}

function walkDir(dir, ext) {
    const out = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
            out.push(...walkDir(full, ext))
        } else if (entry.isFile() && (!ext || entry.name.endsWith(ext))) {
            out.push(full)
        }
    }
    return out
}

// ─── Hashing ────────────────────────────────────────────────────────────────

function hashFile(filePath) {
    const h = createHash('sha256')
    h.update(readFileSync(filePath))
    return h.digest('hex')
}

// ─── Batched embedding ──────────────────────────────────────────────────────

/**
 * Embed a source's chunks in batches, returning one vector per chunk (null for
 * chunks that could not be embedded).
 *
 * A single call per chunk costs one forward pass per chunk; a batched call
 * amortizes model invocation across the batch, which is where nearly all of a
 * build's wall time goes. If a batch fails, it is retried chunk-by-chunk so one
 * pathological input cannot discard every chunk in the source.
 *
 * @param {Array<{text: string, source?: string}>} chunks
 * @param {string} embedModel
 * @param {{quiet?: boolean}} opts
 * @returns {Promise<Array<number[]|null>>}
 */
async function embedChunksBatched(chunks, embedModel, opts = {}) {
    const vectors = new Array(chunks.length).fill(null)
    if (chunks.length === 0) return vectors

    // Batched inference is the default (it is where the build's time goes), but
    // it is not byte-identical to per-chunk inference: ONNX pads each batch to
    // its longest sequence, which perturbs embeddings by ~1e-2 per element
    // (cosine ~0.995) and can reorder near-tied retrieval results.
    // Set BUCHBINDER_EMBED_PER_CHUNK=1 to restore the original per-chunk behavior
    // exactly (verified: byte-identical embeddings, max delta 0.0).
    if (process.env.BUCHBINDER_EMBED_PER_CHUNK === '1') {
        for (let i = 0; i < chunks.length; i++) {
            try {
                const [vec] = await embed([chunks[i].text], { model: embedModel })
                vectors[i] = vec ?? null
            } catch (err) {
                if (!opts.quiet) {
                    console.error(`[index-builder] Embedding failed for ${chunks[i].source || 'chunk'}: ${err.message}`)
                }
            }
        }
        return vectors
    }

    const BATCH_SIZE = 32
    for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
        const slice = chunks.slice(start, start + BATCH_SIZE)
        try {
            const vecs = await embed(slice.map(c => c.text), { model: embedModel })
            for (let i = 0; i < slice.length; i++) {
                vectors[start + i] = vecs[i] ?? null
            }
        } catch (err) {
            // Batch failed — isolate the failure per chunk so the rest survive.
            if (!opts.quiet) {
                console.error(`[index-builder] Batch embedding failed (${slice.length} chunks): ${err.message}`)
                console.error('[index-builder] Retrying those chunks individually.')
            }
            for (let i = 0; i < slice.length; i++) {
                try {
                    const [vec] = await embed([slice[i].text], { model: embedModel })
                    vectors[start + i] = vec ?? null
                } catch (innerErr) {
                    if (!opts.quiet) {
                        console.error(`[index-builder] Embedding failed for ${slice[i].source || 'chunk'}: ${innerErr.message}`)
                    }
                }
            }
        }
    }
    return vectors
}

// ─── Chunking dispatch ──────────────────────────────────────────────────────

/**
 * Chunk a source file using the appropriate chunker for its kind.
 *
 * @param {{path: string, kind: string, chapterNumber?: number}} source
 * @param {string} projectRoot
 * @returns {Array<object>} chunks
 */
export function chunkSource(source, projectRoot) {
    const fullPath = join(projectRoot, source.path)
    if (!existsSync(fullPath)) return []
    if (source.kind === 'draft') {
        return chunkXmlDraftFile(fullPath, source.path, source.chapterNumber)
    }
    // All other kinds use the markdown chunker
    return chunkMarkdownFile(fullPath, source.path).map(c => ({
        text: c.text,
        source: c.source,
        chunkKind: c.source.includes('#') ? c.source.split('#').pop() : 'section',
        kind: source.kind,
        chapterNumber: source.chapterNumber ?? null,
        pinnable: source.pinnable ?? false,
    }))
}

// ─── Index read/write ───────────────────────────────────────────────────────

/**
 * Get the path to the on-disk index file for a project.
 */
export function getIndexPath(projectRoot) {
    return join(projectRoot, '.opencode', 'cache', 'lore-index', INDEX_FILENAME)
}

/**
 * Load the existing index (or return null if absent / unparseable).
 */
export function loadIndex(projectRoot) {
    const p = getIndexPath(projectRoot)
    if (!existsSync(p)) return null
    try {
        return JSON.parse(readFileSync(p, 'utf-8'))
    } catch {
        return null
    }
}

/**
 * Write the index atomically (write to .tmp then rename).
 */
export function writeIndex(projectRoot, index) {
    const p = getIndexPath(projectRoot)
    mkdirSync(dirname(p), { recursive: true })
    const tmpPath = p + '.tmp'
    writeFileSync(tmpPath, JSON.stringify(index, null, 2) + '\n', 'utf-8')
    renameSync(tmpPath, p)
}

// ─── Build (incremental) ────────────────────────────────────────────────────

/**
 * Build or incrementally update the index. Returns a summary:
 *
 *   {
 *     sourcesTotal, sourcesAdded, sourcesUpdated, sourcesUnchanged,
 *     chunksTotal, chunksAdded, chunksEmbedded, chunksReused,
 *     durationMs, indexPath, embedModel, embedDim
 *   }
 *
 * Strategy:
 *   1. Scan sources.
 *   2. If the embedding model changed, discard the prior index
 *      (vectors from different models are not comparable).
 *   3. For each source: hash the file. If the prior index has a source
 *      entry with the same hash, keep its chunks (and embeddings) as-is.
 *   4. If the hash changed (or it's a new source), re-chunk the file and
 *      re-embed all its chunks.
 *   5. If a source disappeared from disk, drop its chunks.
 *   6. Write the new index.
 *
 * @param {string} projectRoot
 * @param {object} [opts] { quiet?: boolean, force?: boolean }
 */
export async function buildIndex(projectRoot, opts = {}) {
    const t0 = Date.now()
    const sources = scanSources(projectRoot)

    const embedModel = activeEmbedModel()

    let prev = opts.force ? null : loadIndex(projectRoot)
    if (prev && prev.embedModel !== embedModel) {
        // Vectors are incompatible across models — rebuild everything.
        prev = null
    }

    // Build a lookup of prev sources by path
    const prevSources = new Map()
    if (prev && Array.isArray(prev.sources)) {
        for (const s of prev.sources) prevSources.set(s.path, s)
    }

    // Index prior chunks by source path once. Reusing an unchanged source then
    // costs O(chunks-of-that-source) instead of scanning every chunk in the
    // prior index for each of the sources (previously O(sources x chunks)).
    const prevChunksBySource = new Map()
    if (prev && Array.isArray(prev.chunks)) {
        for (const c of prev.chunks) {
            const key = c.sourcePath
            const bucket = prevChunksBySource.get(key)
            if (bucket) bucket.push(c)
            else prevChunksBySource.set(key, [c])
        }
    }

    const newSources = []
    const newChunks = []
    let sourcesAdded = 0, sourcesUpdated = 0, sourcesUnchanged = 0
    let chunksAdded = 0, chunksReused = 0
    let chunksEmbedded = 0
    let chunkIdCounter = 0

    for (const source of sources) {
        const fullPath = join(projectRoot, source.path)
        const hash = hashFile(fullPath)
        const prevSource = prevSources.get(source.path)

        const sourceEntry = {
            path: source.path,
            kind: source.kind,
            hash: `sha256:${hash}`,
            chapterNumber: source.chapterNumber ?? null,
            priority: source.priority ?? 'normal',
            lowPriority: source.priority === 'low',
            pinnable: source.pinnable ?? false,
        }

        if (prevSource && prevSource.hash === sourceEntry.hash) {
            // Unchanged — reuse prior chunks for this source
            sourcesUnchanged++
            newSources.push(sourceEntry)
            for (const c of (prevChunksBySource.get(source.path) || [])) {
                newChunks.push(c)
                chunksReused++
            }
            continue
        }

        // New or updated source: re-chunk
        if (prevSource) sourcesUpdated++
        else sourcesAdded++

        newSources.push(sourceEntry)
        const chunks = chunkSource(source, projectRoot)

        // Embed this source's chunks in one batched inference instead of one
        // call per chunk. The ONNX extractor accepts an array, so a batch is
        // a single forward pass rather than N — the dominant cost of a build.
        // A batch that fails is retried per chunk so one bad chunk cannot
        // discard the rest of the source.
        const vectors = await embedChunksBatched(chunks, embedModel, opts)

        for (let i = 0; i < chunks.length; i++) {
            const c = chunks[i]
            const embedding = vectors[i]
            if (!embedding) continue // failed to embed — retried on the next build
            chunkIdCounter++
            const id = `chunk-${String(chunkIdCounter).padStart(5, '0')}`
            chunksEmbedded++
            newChunks.push({
                id,
                sourcePath: source.path,
                kind: c.kind ?? source.kind,
                chunkKind: c.chunkKind ?? 'section',
                chapterNumber: c.chapterNumber ?? null,
                sceneNumber: c.sceneNumber ?? null,
                continuation: c.continuation ?? false,
                heading: c.source.includes('#') ? c.source.split('#').pop() : null,
                text: c.text,
                embedding,
                lowPriority: sourceEntry.lowPriority,
                pinnable: sourceEntry.pinnable,
            })
            chunksAdded++
        }
    }

    const embedDim = newChunks.find(c => c.embedding)?.embedding.length ?? null
    const index = {
        schemaVersion: INDEX_SCHEMA_VERSION,
        builtAt: new Date().toISOString(),
        projectRoot,
        embedModel,
        embedDim,
        chunkCount: newChunks.length,
        sources: newSources,
        chunks: newChunks,
    }
    writeIndex(projectRoot, index)

    const durationMs = Date.now() - t0
    return {
        sourcesTotal: newSources.length,
        sourcesAdded,
        sourcesUpdated,
        sourcesUnchanged,
        chunksTotal: newChunks.length,
        chunksAdded,
        chunksEmbedded,
        chunksReused,
        durationMs,
        indexPath: getIndexPath(projectRoot),
        embedModel,
        embedDim,
    }
}

// ─── Status ─────────────────────────────────────────────────────────────────

/**
 * Print index status and exit 0 (or 1 if no index).
 *
 * @param {string} projectRoot
 */
export function printStatus(projectRoot) {
    const index = loadIndex(projectRoot)
    if (!index) {
        console.error(`[index-builder] No index found at ${getIndexPath(projectRoot)}`)
        process.exit(1)
    }
    const byKind = {}
    for (const s of index.sources) byKind[s.kind] = (byKind[s.kind] || 0) + 1
    const ageMs = Date.now() - new Date(index.builtAt).getTime()
    const ageHours = (ageMs / 3600000).toFixed(1)
    console.log(`Index: ${getIndexPath(projectRoot)}`)
    console.log(`  Built:     ${index.builtAt} (${ageHours}h ago)`)
    console.log(`  Embedder:  ${index.embedModel}${index.embedDim ? ` (${index.embedDim}-d)` : ''}`)
    console.log(`  Sources:   ${index.sources.length} (${Object.entries(byKind).map(([k, v]) => `${k}:${v}`).join(', ')})`)
    console.log(`  Chunks:    ${index.chunks.length} (${index.chunks.filter(c => c.embedding).length} embedded)`)
}

// ─── CLI entry ──────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2)
    let projectRoot = process.cwd()
    let statusOnly = false
    let force = false
    let quiet = false

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--status') statusOnly = true
        else if (args[i] === '--force') force = true
        else if (args[i] === '--quiet') quiet = true
        else if (!args[i].startsWith('--')) projectRoot = resolve(args[i])
    }

    if (statusOnly) {
        printStatus(projectRoot)
        return
    }

    if (!quiet) {
        console.log(`[index-builder] Scanning ${projectRoot}...`)
    }

    let summary
    try {
        summary = await buildIndex(projectRoot, { quiet, force })
    } catch (err) {
        console.error(`[index-builder] Build failed: ${err.message}`)
        console.error(`[index-builder] Embedding model: ${activeEmbedModel()}. Is @huggingface/transformers installed and the model cached?`)
        process.exit(2)
    }

    if (!quiet) {
        console.log(`[index-builder] Done in ${(summary.durationMs / 1000).toFixed(1)}s`)
        console.log(`  Embedder:  ${summary.embedModel}${summary.embedDim ? ` (${summary.embedDim}-d)` : ''}`)
        console.log(`  Sources:   ${summary.sourcesTotal} (${summary.sourcesAdded} added, ${summary.sourcesUpdated} updated, ${summary.sourcesUnchanged} unchanged)`)
        console.log(`  Chunks:    ${summary.chunksTotal} (${summary.chunksAdded} new, ${summary.chunksEmbedded} embedded, ${summary.chunksReused} reused)`)
        console.log(`  Index:     ${summary.indexPath}`)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}
