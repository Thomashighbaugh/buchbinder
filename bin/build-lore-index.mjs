#!/usr/bin/env node
/**
 * buchbinder-index — Build or update the lore/knowledge/outline/draft index
 * and verify ONNX reranker functionality.
 *
 * Thin CLI wrapper around src/lib/index-builder.mjs. Installed by the
 * per-project installer into .opencode/tools/lib/scripts/ alongside
 * lore-query.mjs, and exposed as the `buchbinder-index` bin entry.
 *
 * After a successful index build, this command warms and smoke-tests the
 * included in-process ONNX cross-encoder reranker (onnxruntime via
 * @huggingface/transformers, default Xenova/bge-reranker-base) so
 * `refresh-index` covers reranker functionality as well as embeddings.
 *
 * Usage:
 *   node bin/build-lore-index.mjs [project-root] [--force] [--quiet]
 *   node bin/build-lore-index.mjs --status [project-root]
 *
 * If project-root is omitted, defaults to the current working directory.
 *
 * Exits:
 *   0  — success (index built; reranker warmup reported, non-fatal if unavailable)
 *   1  — status mode, no index found
 *   2  — index build failed (e.g. the ONNX embedder could not be loaded)
 */

import { resolve } from 'path'
import { ensureDeps } from './lib/bootstrap.mjs'

// Resolve modules relative to this script (bin/build-lore-index.mjs → ../src/lib/*)
const here = new URL(import.meta.url).pathname
const indexBuilderPath = resolve(here, '../../src/lib/index-builder.mjs')
const rerankerPath = resolve(here, '../../src/lib/reranker.mjs')
// Bootstrap package deps first so this runs from a bare clone (no node_modules).
await ensureDeps()
const { buildIndex, printStatus } = await import(indexBuilderPath)

const args = process.argv.slice(2)
let projectRoot = process.cwd()
let statusOnly = false
let force = false
let quiet = false

for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--status') statusOnly = true
    else if (a === '--force') force = true
    else if (a === '--quiet') quiet = true
    else if (a === '--help' || a === '-h') {
        console.log('Usage: node bin/build-lore-index.mjs [project-root] [--force] [--quiet]')
        console.log('       node bin/build-lore-index.mjs --status [project-root]')
        console.log('')
        console.log('Builds/updates the semantic lore index and warms/verifies the ONNX reranker.')
        process.exit(0)
    } else if (!a.startsWith('--')) {
        projectRoot = resolve(a)
    }
}

async function warmAndVerifyReranker() {
    try {
        const { getReranker, rerankDocuments, RERANK_MODEL, isRerankDisabled } = await import(rerankerPath)
        if (typeof isRerankDisabled === 'function' && isRerankDisabled()) {
            if (!quiet) console.log('[buchbinder-index] Reranker: skipped (RERANK_DISABLED=1)')
            return { ok: false, skipped: true }
        }
        await getReranker()
        const ranked = await rerankDocuments(
            'creative values and quality baseline',
            [
                'Core values and quality baseline for the manuscript.',
                'Chapter 7: the protagonist buys bread at the market.',
                'Thematic statement, non-negotiables, and style principles.',
            ],
        )
        if (!quiet) {
            console.log(`[buchbinder-index] Reranker: ready (${RERANK_MODEL})`)
            const top = ranked[0]
            if (top) console.log(`[buchbinder-index] Reranker smoke-test: top score=${top.score.toFixed(4)} idx=${top.index}`)
        }
        return { ok: true }
    } catch (err) {
        if (!quiet) {
            console.warn(`[buchbinder-index] Reranker: unavailable (${err.message})`)
            console.warn('[buchbinder-index] Retrieval will degrade gracefully without reranking; re-fetch models when possible (node bin/fetch-models.mjs --only reranker).')
        }
        return { ok: false, error: err.message }
    }
}

if (statusOnly) {
    printStatus(projectRoot)
    process.exit(0)
}

try {
    const summary = await buildIndex(projectRoot, { force, quiet })
    if (!quiet) {
        console.log('')
        console.log(`  Index ready: ${summary.indexPath}`)
        console.log(`  ${summary.chunksTotal} chunks from ${summary.sourcesTotal} sources`)
        console.log(`  Build time:  ${(summary.durationMs / 1000).toFixed(1)}s`)
    }

    // Include reranker functionality (ONNX cross-encoder / onnxruntime) as part of refresh-index.
    await warmAndVerifyReranker()

    process.exit(0)
} catch (err) {
    console.error(`[buchbinder-index] Build failed: ${err.message}`)
    process.exit(2)
}
