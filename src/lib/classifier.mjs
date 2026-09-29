#!/usr/bin/env node
/**
 * Classifier — local zero-shot / NLI classifier (ONNX).
 *
 * A natural-language-inference cross-encoder used to turn qualitative
 * judgements into local, reproducible, model-independent *evidence*. This is
 * intended as evidence for the hard-block quality gates (does this chapter
 * entail its outline beat?), the premise stress-test, and non-fiction
 * claim↔source checks — never as an authority in place of the reviewer.
 *
 *   entailmentScore(premise, hypothesis) → P(entailment) + full distribution
 *   classify(text, labels)               → zero-shot label ranking
 *
 * Environment:
 *   CLASSIFIER_MODEL     NLI model (default Xenova/nli-deberta-v3-xsmall)
 *   CLASSIFIER_DISABLED=1  disable entirely
 *
 * CLI:
 *   node src/lib/classifier.mjs --entail "premise" "hypothesis"
 *   node src/lib/classifier.mjs --labels "foreshadowing,pacing,continuity" "some passage"
 */

import { loadTransformers, configureOnnxEnv, DEFAULT_DTYPE } from './onnx-runtime.mjs'

export const CLASSIFIER_MODEL = process.env.CLASSIFIER_MODEL || 'Xenova/nli-deberta-v3-xsmall'
const DISABLED = process.env.CLASSIFIER_DISABLED === '1'

let nliPromise = null

/** Lazily load the NLI tokenizer + sequence-classification model. */
export function getNliModel() {
  if (DISABLED) return Promise.reject(new Error('CLASSIFIER_DISABLED=1 — classifier disabled'))
  if (!nliPromise) {
    nliPromise = (async () => {
      const { AutoTokenizer, AutoModelForSequenceClassification } = await loadTransformers()
      await configureOnnxEnv(CLASSIFIER_MODEL)
      const tokenizer = await AutoTokenizer.from_pretrained(CLASSIFIER_MODEL)
      const model = await AutoModelForSequenceClassification.from_pretrained(CLASSIFIER_MODEL, { dtype: DEFAULT_DTYPE })
      const id2label = model.config?.id2label || { 0: 'contradiction', 1: 'neutral', 2: 'entailment' }
      return { tokenizer, model, id2label }
    })().catch(err => {
      nliPromise = null
      throw err
    })
  }
  return nliPromise
}

function softmax(xs) {
  const m = Math.max(...xs)
  const e = xs.map(x => Math.exp(x - m))
  const s = e.reduce((a, b) => a + b, 0) || 1
  return e.map(x => x / s)
}

/**
 * NLI score for a (premise, hypothesis) pair.
 *
 * @returns {Promise<{ entailment: number, distribution: Record<string, number> }>}
 */
export async function entailmentScore(premise, hypothesis) {
  const { tokenizer, model, id2label } = await getNliModel()
  const enc = await tokenizer([premise], {
    text_pair: [hypothesis],
    padding: true,
    truncation: true,
  })
  const { logits } = await model(enc)
  const probs = softmax(Array.from(logits.data))

  let entailIdx = 0
  for (const [i, label] of Object.entries(id2label)) {
    if (String(label).toLowerCase().includes('entail')) entailIdx = Number(i)
  }
  const distribution = {}
  for (const [i, label] of Object.entries(id2label)) distribution[label] = probs[Number(i)] ?? 0
  return { entailment: probs[entailIdx] ?? 0, distribution }
}

/**
 * Zero-shot classification: rank arbitrary labels for a text by entailment.
 *
 * @param {string} text
 * @param {string[]} labels
 * @param {{ hypothesisTemplate?: string }} [opts]
 * @returns {Promise<Array<{ label: string, score: number }>>} sorted desc
 */
export async function classify(text, labels, opts = {}) {
  const template = opts.hypothesisTemplate || 'This text is about {}.'
  const out = []
  for (const label of labels) {
    const { entailment } = await entailmentScore(text, template.replace('{}', label))
    out.push({ label, score: entailment })
  }
  return out.sort((a, b) => b.score - a.score)
}

export function isClassifierDisabled() {
  return DISABLED
}

// ─── CLI ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const mode = args[0]
  if (mode === '--entail') {
    const premise = args[1] || ''
    const hypothesis = args[2] || ''
    const r = await entailmentScore(premise, hypothesis)
    console.log(`[classifier] model=${CLASSIFIER_MODEL}`)
    console.log(`  entailment: ${r.entailment.toFixed(4)}`)
    console.log(`  distribution: ${JSON.stringify(r.distribution)}`)
    return
  }
  if (mode === '--labels') {
    const labels = (args[1] || '').split(',').map(s => s.trim()).filter(Boolean)
    const text = args[2] || ''
    const ranked = await classify(text, labels)
    console.log(`[classifier] model=${CLASSIFIER_MODEL}`)
    for (const r of ranked) console.log(`  ${r.score.toFixed(4)}  ${r.label}`)
    return
  }
  console.error('Usage: node classifier.mjs --entail "premise" "hypothesis"')
  console.error('       node classifier.mjs --labels "labelA,labelB" "text"')
  process.exit(1)
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(`[classifier] ${err.message}`)
    process.exit(1)
  })
}
