/**
 * ONNX Runtime — shared helpers for Buchbinder's local ONNX model stack.
 *
 * The embedder, reranker, and classifier all load Transformers.js models
 * through here so that cache resolution, dtype, and offline behaviour are
 * defined in exactly one place.
 *
 * Model cache resolution (highest priority first):
 *   1. $ONNX_CACHE_DIR / $RERANK_CACHE_DIR / $BUCHBINDER_MODEL_CACHE (explicit)
 *   2. An already-populated shared cache — ~/.cache/buchbinder/models
 *   3. An existing copy in a project node_modules or the global OpenCode config
 *   4. The shared cache (used as the download target)
 *
 * A shared cache means the three models (~0.5 GB total) download once for the
 * whole machine and are reused by every Buchbinder project.
 *
 * Environment:
 *   ONNX_CACHE_DIR / BUCHBINDER_MODEL_CACHE  explicit model cache directory
 *   ONNX_DTYPE                               ONNX weight dtype (default q8)
 *   ONNX_OFFLINE=1                           never download; use cache or fail
 */

import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const DEFAULT_DTYPE = process.env.ONNX_DTYPE || process.env.RERANK_DTYPE || 'q8'

/** Shared, machine-wide model cache (a sibling of the OpenCode config cache). */
export function sharedModelCacheDir() {
  return (
    process.env.ONNX_CACHE_DIR ||
    process.env.RERANK_CACHE_DIR ||
    process.env.BUCHBINDER_MODEL_CACHE ||
    join(os.homedir(), '.cache', 'buchbinder', 'models')
  )
}

/** Legacy/compat cache locations that may already hold a downloaded model. */
function fallbackCacheDirs() {
  return [
    join(__dirname, '..', '..', 'node_modules', '@huggingface', 'transformers', '.cache'),
    join(os.homedir(), '.config', 'opencode', 'node_modules', '@huggingface', 'transformers', '.cache'),
  ]
}

function hasModel(base, modelId) {
  const dir = join(base, ...modelId.split('/'))
  return existsSync(join(dir, 'config.json')) || existsSync(join(dir, 'onnx'))
}

/** Resolve the cache dir to use for a model, reusing an existing copy when possible. */
export function resolveModelCacheDir(modelId) {
  const explicit = process.env.ONNX_CACHE_DIR || process.env.RERANK_CACHE_DIR
  if (explicit) return explicit
  const shared = sharedModelCacheDir()
  for (const base of [shared, ...fallbackCacheDirs()]) {
    if (hasModel(base, modelId)) return base
  }
  return shared
}

export function isOnnxOffline() {
  return (
    process.env.ONNX_OFFLINE === '1' ||
    process.env.RERANK_OFFLINE === '1' ||
    process.env.BUCHBINDER_ONNX_OFFLINE === '1'
  )
}

/** Import @huggingface/transformers with a helpful error if it is missing. */
export async function loadTransformers() {
  try {
    return await import('@huggingface/transformers')
  } catch (err) {
    throw new Error(
      `@huggingface/transformers is not installed — run \`npm install @huggingface/transformers\` (${err.message})`
    )
  }
}

/** Configure the Transformers.js env for a model and return { env, cacheDir }. */
export async function configureOnnxEnv(modelId) {
  const { env } = await loadTransformers()
  const cacheDir = resolveModelCacheDir(modelId)
  try {
    mkdirSync(cacheDir, { recursive: true })
  } catch {
    /* best effort */
  }
  env.cacheDir = cacheDir
  env.allowRemoteModels = !isOnnxOffline()
  return { env, cacheDir }
}
