#!/usr/bin/env node
/**
 * ONNX Cross-Encoder Reranker
 *
 * Two-stage retrieval's second stage: after the embedding index produces a
 * cosine-ranked candidate list, a cross-encoder re-scores each (query, passage)
 * pair jointly and reorders candidates by true relevance — a bi-encoder compares
 * query and passage independently, a cross-encoder sees them together.
 *
 * Runs entirely in-process via @huggingface/transformers over onnxruntime —
 * no server-side rerank API and no provider API requests. The default model
 * (`Xenova/bge-reranker-base`) is an XLMRobertaForSequenceClassification
 * cross-encoder with a single output logit; Transformers.js has no `rerank`
 * pipeline, so we run AutoModel directly and sigmoid the logit.
 *
 * Failure is non-fatal by contract: callers catch and fall back to distance
 * ordering, identical to rerank-less retrieval.
 *
 * Environment:
 *   RERANK_MODEL       model id (default: Xenova/bge-reranker-base)
 *   RERANK_DTYPE       ONNX weight dtype (default: q8; ONNX_DTYPE also honoured)
 *   RERANK_MAX_LENGTH  tokenizer max length (default: 512)
 *   RERANK_CACHE_DIR   explicit model cache dir (see onnx-runtime.mjs)
 *   RERANK_OFFLINE=1   never download; use an already-cached model or fail
 *   RERANK_DISABLED=1  skip reranking entirely
 *
 * CLI self-test:
 *   node src/lib/reranker.mjs "query" "passage A" "passage B" ...
 */

import { loadTransformers, configureOnnxEnv, isOnnxOffline, DEFAULT_DTYPE } from './onnx-runtime.mjs'

export const RERANK_MODEL = process.env.RERANK_MODEL || 'Xenova/bge-reranker-base'
const RERANK_MAX_LENGTH = parseInt(process.env.RERANK_MAX_LENGTH || '512', 10)
const RERANK_DISABLED = process.env.RERANK_DISABLED === '1'

let rerankerPromise = null

async function loadReranker() {
  const { AutoTokenizer, AutoModel } = await loadTransformers()
  const { env } = await configureOnnxEnv(RERANK_MODEL)

  if (isOnnxOffline() && !env.cacheDir) {
    throw new Error(`rerank model ${RERANK_MODEL} is not cached and offline mode is on — skipping rerank`)
  }

  const tokenizer = await AutoTokenizer.from_pretrained(RERANK_MODEL)
  const model = await AutoModel.from_pretrained(RERANK_MODEL, { dtype: DEFAULT_DTYPE })
  return { tokenizer, model }
}

/** Lazily load (once per process) the cross-encoder. Resets on failure. */
export function getReranker() {
  if (RERANK_DISABLED) {
    return Promise.reject(new Error('RERANK_DISABLED=1 — reranking skipped'))
  }
  if (!rerankerPromise) {
    rerankerPromise = loadReranker().catch(err => {
      rerankerPromise = null
      throw err
    })
  }
  return rerankerPromise
}

const sigmoid = x => 1 / (1 + Math.exp(-x))

/**
 * Rerank documents against a query with the in-process ONNX cross-encoder.
 *
 * @param {string} query
 * @param {Array<string|{text?: string}>} documents
 * @param {{ maxLength?: number }} [opts]
 * @returns {Promise<Array<{index: number, score: number}>>} sorted by score desc
 */
export async function rerankDocuments(query, documents, opts = {}) {
  if (!Array.isArray(documents) || documents.length === 0) return []
  const { tokenizer, model } = await getReranker()

  const queries = documents.map(() => query)
  const passages = documents.map(d => (typeof d === 'string' ? d : (d && d.text) || String(d)))
  const maxLength = opts.maxLength || RERANK_MAX_LENGTH

  const enc = await tokenizer(queries, {
    text_pair: passages,
    padding: true,
    truncation: true,
    max_length: maxLength,
  })
  const { logits } = await model(enc)
  const data = Array.from(logits.data)

  return data
    .map((logit, index) => ({ index, score: sigmoid(logit) }))
    .sort((a, b) => b.score - a.score)
}

export function isRerankDisabled() {
  return RERANK_DISABLED
}

// ─── CLI self-test ──────────────────────────────────────────────────────────

async function main() {
  const [query, ...rest] = process.argv.slice(2)
  const q = query || 'creative values and quality baseline'
  const docs = rest.length
    ? rest
    : [
        'Core values and quality baseline for the manuscript.',
        'Chapter 7: the protagonist buys bread at the market.',
        'Thematic statement, non-negotiables, and style principles.',
      ]

  const ranked = await rerankDocuments(q, docs)
  console.log(`[reranker] model=${RERANK_MODEL} dtype=${DEFAULT_DTYPE}`)
  console.log(`[reranker] query: ${q}`)
  for (const r of ranked) {
    console.log(`  score=${r.score.toFixed(4)}  #${r.index}  ${docs[r.index].slice(0, 80)}`)
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(`[reranker] ${err.message}`)
    process.exit(1)
  })
}
