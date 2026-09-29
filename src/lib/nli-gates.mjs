#!/usr/bin/env node
/**
 * NLI Gate Evidence — classifier-backed checks for the quality gates.
 *
 * NLI models answer one relation well: does a *delivered artifact* entail a
 * *claimed property* of it. Two gates fit that shape exactly, so those are the
 * two this module runs on — chosen deliberately, not exhaustively:
 *
 *   post-draft       Does the drafted **prose** entail the awareness-map claims
 *                    the draft makes about itself? (the structural gate only
 *                    checks those claims are present, not that they are true)
 *   revision-verify  Does the **revision entry** (delivered) entail the critique
 *                    item's **recommendation** (the claimed property)?
 *
 * Gates whose relation is *correspondence* rather than entailment (e.g. an
 * outline's setup↔payoff pairing) are intentionally NOT run through NLI — the
 * classifier scores those unreliably, and a noisy step erodes gate trust.
 *
 * Output discipline (kept minimal for prompt injection):
 *   • only the most suspicious findings surface, capped, lowest entailment first
 *   • one compact markdown block + a pass/fail summary line
 *   • full findings persisted to .opencode/cache/nli-evidence/<gate>.json
 *     and the injection block to .opencode/cache/nli-evidence/<gate>.md
 *
 * Graceful by contract: if the classifier is disabled/unavailable, returns
 * { skipped: true } and the gate behaves exactly as before.
 *
 * Environment:
 *   NLI_MAX_SCAN        pairs scored per gate (default 12)
 *   NLI_MAX_PAIRS       findings surfaced in the injected block (default 6)
 *   NLI_WARN_THRESHOLD  entailment below this is "unsupported" (default 0.5)
 *
 * CLI:
 *   node .opencode/lib/nli-gates.mjs --gate post-draft|revision-verify \
 *        [project-root] [--chapter N] [--round N] [--json] [--quiet]
 */

import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const MAX_SCAN = parseInt(process.env.NLI_MAX_SCAN || '12', 10)
const MAX_PAIRS = parseInt(process.env.NLI_MAX_PAIRS || '6', 10)
const WARN_THRESHOLD = parseFloat(process.env.NLI_WARN_THRESHOLD || '0.5')
const MAX_PREMISE = 900

export const NLI_GATES = ['post-draft', 'revision-verify']
export function isNliGate(gate) {
  return NLI_GATES.includes(gate)
}

// ─── helpers ────────────────────────────────────────────────────────────────

const readIf = p => (existsSync(p) ? readFileSync(p, 'utf-8') : '')

function trim(s, n = 160) {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}

/** Scored pairs → findings (lowest entailment first). */
function toFindings(scored) {
  return scored
    .map(s => ({
      kind: s.pair.kind,
      label: s.pair.label,
      ref: s.pair.ref,
      entailment: Number(s.entailment.toFixed(4)),
      verdict: s.entailment < WARN_THRESHOLD ? 'unsupported' : 'supported',
    }))
    .sort((a, b) => a.entailment - b.entailment)
}

// ─── extractors (premise = delivered artifact, hypothesis = claimed property) ─

function findDraftFile(projectRoot, chapterNumber) {
  const dir = join(projectRoot, 'book', 'drafts')
  if (!existsSync(dir)) return null
  if (chapterNumber != null) {
    const f = readdirSync(dir).find(n => new RegExp(`^chapter_0*${chapterNumber}\\.xml$`).test(n))
    if (f) return join(dir, f)
  }
  const any = readdirSync(dir).filter(n => /^chapter_\d+\.xml$/.test(n)).sort().pop()
  return any ? join(dir, any) : null
}

/** post-draft: each awareness-map claim must be entailed by the chapter's own prose. */
function extractPostDraftPairs(projectRoot, chapterNumber) {
  const file = findDraftFile(projectRoot, chapterNumber)
  if (!file) return []
  const xml = readIf(file)
  if (!xml) return []

  const prose = xml
    .replace(/<awareness-map>[\s\S]*?<\/awareness-map>/g, ' ')
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PREMISE)
  if (prose.length < 80) return []

  const claims = []
  const push = (kind, ref, text) => {
    if (text && text.trim()) claims.push({ kind, ref, text: text.trim() })
  }
  for (const m of xml.matchAll(/<payoff-from\s+ref="([^"]+)">([\s\S]*?)<\/payoff-from>/g)) push('payoff-from', m[1], m[2])
  for (const m of xml.matchAll(/<sets-up\s+ref="([^"]+)">([\s\S]*?)<\/sets-up>/g)) push('sets-up', m[1], m[2])
  for (const m of xml.matchAll(/<anchor\s+name="([^"]+)">([\s\S]*?)<\/anchor>/g)) push('anchor', m[1], m[2])

  return claims.slice(0, MAX_SCAN).map(c => ({
    kind: c.kind,
    label: `${c.kind} "${c.ref}": ${trim(c.text, 70)}`,
    ref: 'drafted prose',
    premise: prose, // delivered
    hypothesis: c.text.slice(0, MAX_PREMISE), // claimed
  }))
}

/** revision-verify: each revision entry must entail the critique recommendation it addresses. */
function extractRevisionPairs(projectRoot, round) {
  const itemsPath = join(projectRoot, 'book', 'critique', `round-${round}`, 'items.json')
  const logPath = join(projectRoot, 'book', 'revisions', 'revision-log.md')
  if (!existsSync(itemsPath) || !existsSync(logPath)) return []

  let items = []
  try {
    items = JSON.parse(readFileSync(itemsPath, 'utf-8'))
  } catch {
    return []
  }
  const log = readIf(logPath)
  // Split on revision headings (robust; `\Z` is not a JS regex metacharacter).
  const entries = log
    .split(/(?=^## Revision \d+:)/m)
    .filter(s => /^## Revision \d+:/.test(s))

  const byItem = new Map()
  for (const entry of entries) {
    const id = entry.match(/Source:\s*Critique round \d+,\s*item\s*(\S+)/)?.[1]
    if (id) byItem.set(id, entry)
  }

  const pairs = []
  for (const item of items) {
    const entry = byItem.get(String(item.id))
    if (!entry) continue
    const rec = item.recommendation || item.summary || ''
    if (!rec) continue
    const body = entry
      .replace(/^## Revision \d+:.*$/m, '')
      .replace(/^Source:.*$/m, '')
      .replace(/^Status:.*$/m, '')
      .trim()
    if (!body) continue
    pairs.push({
      kind: 'revision',
      label: `item ${item.id}: ${trim(rec, 80)}`,
      ref: 'revision entry',
      premise: body.slice(0, MAX_PREMISE), // delivered
      hypothesis: rec.slice(0, MAX_PREMISE), // claimed
    })
  }
  return pairs.slice(0, MAX_SCAN)
}

function extractPairs(gate, ctx) {
  switch (gate) {
    case 'post-draft': return extractPostDraftPairs(ctx.projectRoot, ctx.chapterNumber)
    case 'revision-verify': return extractRevisionPairs(ctx.projectRoot, ctx.critiqueRound ?? 1)
    default: return []
  }
}

// ─── runner ─────────────────────────────────────────────────────────────────

function renderBlock(gate, findings, summary, model) {
  const lines = [`### NLI evidence — ${gate}`]
  const flagged = findings.filter(f => f.verdict === 'unsupported').slice(0, MAX_PAIRS)
  for (const f of flagged) {
    lines.push(`⚠ ${f.kind}: ${f.label} — not supported by ${f.ref} (p=${f.entailment})`)
  }
  lines.push(summary)
  lines.push(`*model: ${model} · threshold ${WARN_THRESHOLD}*`)
  return lines.join('\n')
}

export async function runNliGate(gate, ctx) {
  if (!isNliGate(gate)) return { gate, skipped: true, reason: `no NLI step for gate '${gate}'` }

  let classifier
  try {
    classifier = await import('./classifier.mjs')
    if (classifier.isClassifierDisabled()) return { gate, skipped: true, reason: 'classifier disabled' }
  } catch (err) {
    return { gate, skipped: true, reason: `classifier unavailable: ${err.message}` }
  }

  const pairs = extractPairs(gate, ctx)
  if (pairs.length === 0) {
    const summary = '∅ NLI: no checkable pairs found'
    return {
      gate,
      skipped: false,
      findings: [],
      summary,
      supported: 0,
      unsupported: 0,
      evidence: [summary],
      markdown: `### NLI evidence — ${gate}\n${summary}`,
      evidencePath: null,
    }
  }

  let scored
  try {
    const { entailmentScore } = classifier
    scored = []
    for (const pair of pairs) {
      const { entailment } = await entailmentScore(pair.premise, pair.hypothesis)
      scored.push({ pair, entailment })
    }
  } catch (err) {
    return { gate, skipped: true, reason: `NLI failed: ${err.message}` }
  }

  const findings = toFindings(scored)
  const unsupported = findings.filter(f => f.verdict === 'unsupported')
  const supported = findings.length - unsupported.length
  const summary = unsupported.length === 0
    ? `✓ NLI: all ${findings.length} claim(s) entailed by their source`
    : `⚠ NLI: ${unsupported.length}/${findings.length} claim(s) not entailed by their source`

  const evidence = unsupported.slice(0, MAX_PAIRS).map(
    f => `⚠ ${f.kind}: ${f.label} — not supported by ${f.ref} (p=${f.entailment})`
  )
  evidence.push(summary)

  const block = renderBlock(gate, findings, summary, classifier.CLASSIFIER_MODEL)

  let evidencePath = null
  try {
    const dir = join(ctx.projectRoot, '.opencode', 'cache', 'nli-evidence')
    mkdirSync(dir, { recursive: true })
    const payload = {
      gate,
      generatedAt: new Date().toISOString(),
      model: classifier.CLASSIFIER_MODEL,
      threshold: WARN_THRESHOLD,
      summary,
      supported,
      unsupported: unsupported.length,
      findings,
    }
    writeFileSync(join(dir, `${gate}.json`), JSON.stringify(payload, null, 2) + '\n', 'utf-8')
    writeFileSync(join(dir, `${gate}.md`), block + '\n', 'utf-8')
    evidencePath = join(dir, `${gate}.json`)
  } catch {
    /* persistence is best-effort */
  }

  return {
    gate,
    skipped: false,
    findings,
    summary,
    supported,
    unsupported: unsupported.length,
    evidence,
    markdown: block,
    evidencePath,
  }
}

// ─── CLI ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  let gate = null
  let projectRoot = process.cwd()
  let chapterNumber = null
  let critiqueRound = 1
  let json = false
  let quiet = false

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--gate') gate = args[++i]
    else if (a === '--chapter') chapterNumber = parseInt(args[++i], 10) || null
    else if (a === '--round') critiqueRound = parseInt(args[++i], 10) || 1
    else if (a === '--json') json = true
    else if (a === '--quiet') quiet = true
    else if (!a.startsWith('--')) projectRoot = a
  }

  if (!gate) {
    console.error(`Usage: node nli-gates.mjs --gate <${NLI_GATES.join('|')}> [project-root] [--chapter N] [--round N] [--json]`)
    process.exit(1)
  }

  const result = await runNliGate(gate, { projectRoot, chapterNumber, critiqueRound })
  if (json) {
    console.log(JSON.stringify(result, null, 2))
    return
  }
  if (result.skipped) {
    if (!quiet) console.log(`∅ NLI (${gate}) skipped: ${result.reason}`)
    return
  }
  console.log(result.markdown)
  if (result.evidencePath && !quiet) console.log(`\n*Stored: ${result.evidencePath}*`)
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(`[nli-gates] ${err.message}`)
    process.exit(0)
  })
}
