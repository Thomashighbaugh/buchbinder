#!/usr/bin/env node
/**
 * buchbinder-models — prefetch the local ONNX models.
 *
 * Downloads (once, into the shared model cache) the three Transformers.js
 * models Buchbinder uses, so first use at query time is instant and offline:
 *
 *   embedder    Xenova/bge-base-en-v1.5        (~110 MB q8)
 *   reranker    Xenova/bge-reranker-base       (~280 MB q8)
 *   classifier  Xenova/nli-deberta-v3-xsmall   (~70 MB q8)
 *
 * The installer and refresh run this automatically. It is tolerant: a failure
 * to fetch any model is a warning, not an error — retrieval degrades gracefully.
 *
 * Usage:
 *   node bin/fetch-models.mjs [--only embedder,reranker,classifier] [--quiet]
 *
 * Honours ONNX_OFFLINE=1 (skips remote fetches), ONNX_CACHE_DIR, and the
 * model-id env vars (ONNX_EMBED_MODEL, RERANK_MODEL, CLASSIFIER_MODEL).
 */

import { fileURLToPath } from 'url'
import { resolveModelCacheDir, isOnnxOffline, sharedModelCacheDir } from '../src/lib/onnx-runtime.mjs'

const args = process.argv.slice(2)
let only = null
let quiet = false
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--only') only = (args[++i] || '').split(',').map(s => s.trim())
  else if (args[i] === '--quiet') quiet = true
}

const log = (...a) => { if (!quiet) console.log(...a) }

async function main() {
  const { getOnnxEmbedder, ONNX_EMBED_MODEL } = await import('../src/lib/embedder.mjs')
  const { getReranker, RERANK_MODEL } = await import('../src/lib/reranker.mjs')
  const { getNliModel, CLASSIFIER_MODEL } = await import('../src/lib/classifier.mjs')

  const targets = [
    { name: 'embedder', model: ONNX_EMBED_MODEL, load: () => getOnnxEmbedder() },
    { name: 'reranker', model: RERANK_MODEL, load: () => getReranker() },
    { name: 'classifier', model: CLASSIFIER_MODEL, load: () => getNliModel() },
  ].filter(t => !only || only.includes(t.name))

  log(`[models] cache: ${sharedModelCacheDir()}`)
  if (isOnnxOffline()) {
    log('[models] ONNX_OFFLINE=1 — skipping downloads (using any cached models only)')
  }

  let failures = 0
  for (const t of targets) {
    const cached = resolveModelCacheDir(t.model)
    log(`[models] ${t.name}: ${t.model}`)
    try {
      await t.load()
      log(`[models]   ✓ ready (${cached})`)
    } catch (err) {
      failures++
      log(`[models]   ✗ unavailable: ${err.message}`)
    }
  }

  if (failures > 0) {
    log(`[models] ${failures} model(s) unavailable — retrieval will degrade gracefully until they can be fetched.`)
  } else {
    log('[models] all models ready.')
  }
  // Never fail the install because a model could not be fetched.
  process.exit(0)
}

if (process.argv[1] && import.meta.url === `file://${fileURLToPath(new URL(import.meta.url))}`) {
  main().catch(err => {
    console.error(`[models] ${err.message}`)
    process.exit(0)
  })
}
