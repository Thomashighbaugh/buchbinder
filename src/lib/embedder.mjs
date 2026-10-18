#!/usr/bin/env node
/**
 * Embedder — in-process ONNX embedding.
 *
 * A single backend: ONNX via @huggingface/transformers, mean pooled + L2
 * normalized. No server, no network at query time, works offline and in CI.
 *
 * The index records the model that produced its vectors; queries use the
 * index's recorded model when present so an existing index keeps working
 * after a config change.
 *
 * Environment:
 *   ONNX_EMBED_MODEL   ONNX embedding model (default Xenova/bge-base-en-v1.5, 768-d)
 *
 * CLI self-test:
 *   node src/lib/embedder.mjs "some text" "another text"
 */

import { loadTransformers, configureOnnxEnv, DEFAULT_DTYPE } from './onnx-runtime.mjs'

export const ONNX_EMBED_MODEL = process.env.ONNX_EMBED_MODEL || 'Xenova/bge-base-en-v1.5'

/** The active embedding model id. */
export function activeEmbedModel() {
  return ONNX_EMBED_MODEL
}

// ─── ONNX embedding ─────────────────────────────────────────────────────────

const extractors = new Map()

/** Lazily load (once per model id) the feature-extraction pipeline. */
export function getOnnxEmbedder(model = ONNX_EMBED_MODEL) {
  if (!extractors.has(model)) {
    const p = (async () => {
      const { pipeline } = await loadTransformers()
      await configureOnnxEnv(model)
      return pipeline('feature-extraction', model, { dtype: DEFAULT_DTYPE })
    })().catch(err => {
      extractors.delete(model)
      throw err
    })
    extractors.set(model, p)
  }
  return extractors.get(model)
}

async function embedOnnx(texts, model) {
  const extractor = await getOnnxEmbedder(model)
  const out = await extractor(texts, { pooling: 'mean', normalize: true })
  // out is a Tensor of shape [batch, dim]
  return typeof out.tolist === 'function' ? out.tolist() : Array.from(out.data)
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Embed one or more texts.
 *
 * @param {string|string[]} texts
 * @param {{ model?: string }} [opts]
 * @returns {Promise<number[][]>}
 */
export async function embed(texts, opts = {}) {
  const arr = Array.isArray(texts) ? texts : [texts]
  if (arr.length === 0) return []
  const model = opts.model || activeEmbedModel()
  return embedOnnx(arr, model)
}

/** Embed a single text → number[]. */
export async function embedOne(text, opts = {}) {
  const [vec] = await embed([text], opts)
  return vec
}

export function embeddingDim(vec) {
  return Array.isArray(vec) ? vec.length : 0
}

// ─── CLI self-test ──────────────────────────────────────────────────────────

async function main() {
  const texts = process.argv.slice(2)
  const list = texts.length ? texts : ['first text', 'second, unrelated text']
  const model = activeEmbedModel()
  const vecs = await embed(list, { model })
  console.log(`[embedder] model=${model} dim=${vecs[0]?.length}`)
  for (let i = 0; i < list.length; i++) {
    console.log(`  #${i}  ${list[i].slice(0, 60)}  [${vecs[i].slice(0, 4).map(v => v.toFixed(4)).join(', ')}, …]`)
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(`[embedder] ${err.message}`)
    process.exit(1)
  })
}
