#!/usr/bin/env node
/**
 * Embedder — pluggable embedding backend.
 *
 * Two backends:
 *   • onnx   (default) — in-process ONNX via @huggingface/transformers, mean
 *                        pooled + L2 normalized. No server, no network at query
 *                        time, works offline and in CI.
 *   • ollama            — POST /api/embed (opt-in; matches the global OpenCode
 *                        config's hybrid setup).
 *
 * `EMBED_BACKEND=onnx|ollama` selects the backend. The index records which
 * backend/model produced its vectors; queries use the index's recorded value
 * when present so an existing index keeps working after a config change.
 *
 * Environment:
 *   EMBED_BACKEND      onnx (default) | ollama
 *   ONNX_EMBED_MODEL   ONNX embedding model (default Xenova/bge-base-en-v1.5, 768-d)
 *   OLLAMA_EMBED_MODEL Ollama embedding model (default pedrohml/mxbai-embed-large:latest, 1024-d)
 *   EMBED_MODEL        alias for OLLAMA_EMBED_MODEL (back-compat)
 *   OLLAMA_URL         Ollama endpoint (default http://127.0.0.1:11434)
 *
 * CLI self-test:
 *   node src/lib/embedder.mjs "some text" "another text"
 */

import { loadTransformers, configureOnnxEnv, DEFAULT_DTYPE } from './onnx-runtime.mjs'

export const EMBED_BACKEND = process.env.EMBED_BACKEND || 'onnx'
export const ONNX_EMBED_MODEL = process.env.ONNX_EMBED_MODEL || 'Xenova/bge-base-en-v1.5'
export const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || process.env.EMBED_MODEL || 'pedrohml/mxbai-embed-large:latest'
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'

/** Normalize the requested backend to a known value. */
export function activeEmbedBackend() {
  return EMBED_BACKEND === 'ollama' ? 'ollama' : 'onnx'
}

/** Default model id for a backend. */
export function activeEmbedModel(backend = activeEmbedBackend()) {
  return backend === 'ollama' ? OLLAMA_EMBED_MODEL : ONNX_EMBED_MODEL
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

// ─── Ollama embedding ───────────────────────────────────────────────────────

async function embedOllama(texts, model) {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: texts }),
  })
  if (!res.ok) throw new Error(`Ollama embed error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data.embeddings
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Embed one or more texts.
 *
 * @param {string|string[]} texts
 * @param {{ backend?: 'onnx'|'ollama', model?: string }} [opts]
 * @returns {Promise<number[][]>}
 */
export async function embed(texts, opts = {}) {
  const arr = Array.isArray(texts) ? texts : [texts]
  if (arr.length === 0) return []
  const backend = opts.backend || activeEmbedBackend()
  const model = opts.model || activeEmbedModel(backend)
  return backend === 'ollama' ? embedOllama(arr, model) : embedOnnx(arr, model)
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
  const backend = activeEmbedBackend()
  const model = activeEmbedModel(backend)
  const vecs = await embed(list, { backend, model })
  console.log(`[embedder] backend=${backend} model=${model} dim=${vecs[0]?.length}`)
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
