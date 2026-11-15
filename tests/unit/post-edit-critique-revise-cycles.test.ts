import { describe, it, expect } from 'vitest'
import review from '../../src/tools/hubs/buchbinder/review.js'
import pacingAudit from '../../src/tools/hubs/buchbinder/pacing-audit.js'
import hookReview from '../../src/tools/hubs/buchbinder/hook-review.js'
import readThrough from '../../src/tools/hubs/buchbinder/read-through.js'
import verify from '../../src/tools/hubs/buchbinder/verify.js'

type SpecLike = {
  label: string
  description: string
  reminder: string
  phases?: string
  detailedDescription: string
  warnings?: string[]
  examples?: { input: string; approach: string }[]
}

function text(s: SpecLike) {
  return [s.description, s.reminder, s.detailedDescription, ...(s.warnings || []), ...(s.examples || []).map(e => `${e.input} ${e.approach}`)].join('\n')
}

describe('post-edit pre-publish phases — independent critique-revise cycle contract', () => {
  const phases: [string, SpecLike, RegExp[]][] = [
    ['review', review as any, [/Continuity scan contradictions are HARD BLOCKS/i, /Do not hand off to publish unless the review cycle passes/i]],
    ['pacing-audit', pacingAudit as any, [/Requires at least 3 chapters/i]],
    ['hook-review', hookReview as any, [/weak\/missing hooks/i]],
    ['read-through', readThrough as any, [/Belief breaks, immersion breaks, and trust failures/i, /deus ex machina/i]],
  ]

  it.each(phases)('%s declares an independent critique-revise cycle with critique/revise/re-run and max 3 cycles', (label, spec, _extra) => {
    expect(spec.label).toBe(label)
    expect(spec.phases).toMatch(/7-11|11/)
    const t = text(spec)
    expect(t).toMatch(/independent critique-revise cycle/i)
    expect(t).toMatch(/critique/i)
    expect(t).toMatch(/revise/i)
    expect(t).toMatch(/re-(review|audit|check|read)/i)
    expect(t).toMatch(/(up to\s*(\*\*)?3(\*\*)?\s*cycles|or\s*(\*\*)?3(\*\*)?\s*cycles|3 cycles)/i)
    expect(t).toMatch(/Pass/i)
  })

  it.each(phases)('%s requires fixing/reporting blockers instead of stopping at a single report', (label, spec, extra) => {
    const t = text(spec)
    expect(t).toMatch(/do not (stop|one-shot|treat a single|report "done")/i)
    expect(t).toMatch(/block|remaining blockers|not passing after 3 cycles/i)
    for (const re of extra) expect(t).toMatch(re)
  })

  it('review enforces pre-publish gate behavior and step-0 visualization refresh per cycle', () => {
    const t = text(review as any)
    expect(t).toMatch(/Step 0 \(REQUIRED\).*Generate Visualizations First/i)
    expect(t).toMatch(/before each re-review cycle/i)
    expect(t).toMatch(/Cycles are \*\*independent\*\* per review run\/mode/i)
    expect(t).toMatch(/Only a passing review may hand off to publish/i)
  })

  it('pacing-audit, hook-review, and read-through provide cycle-aware verdict/reporting and handoff via router', () => {
    for (const spec of [pacingAudit, hookReview, readThrough] as SpecLike[]) {
      const t = text(spec)
      expect(t).toMatch(/Cycle \[N\]/)
      expect(t).toMatch(/Verdict/i)
      expect(t).toMatch(/buchbinder-router/i)
      expect(t).toMatch(/action: "route"/i)
    }
  })
})

describe('verify spec — independent critique-revise cycles for fixable checks', () => {
  it('defines verify as an on-demand gate runner over phases 7-11 with cycle contract', () => {
    expect(verify.label).toBe('verify')
    expect(verify.phases).toBe('7-11')
    const t = text(verify as any)
    expect(t).toMatch(/independent critique-revise cycles/i)
    expect(t).toMatch(/check \(critique\)[\s\S]*apply fixes\/revisions[\s\S]*re-run the same check/i)
    expect(t).toMatch(/(up to\s*(\*\*)?3(\*\*)?\s*cycles|or\s*(\*\*)?3(\*\*)?\s*cycles|3 cycles)/i)
  })

  it('applies critique-revise cycles to fixable subcommands/gates and exempts voice-init as setup', () => {
    const t = text(verify as any)
    expect(t).toMatch(/voice-check.*continuity.*style.*gates/i)
    expect(t).toMatch(/voice-init.*generation\/setup action, not a critique-revise cycle/i)
    expect(t).toMatch(/If issues are found, do not stop at the first report/i)
  })

  it('treats continuity contradictions and hard-block gate failures as blockers resolved before pass', () => {
    const t = text(verify as any)
    expect(t).toMatch(/Continuity \*\*contradictions\*\*[\s\S]*hard[- ]blocks?/i)
    expect(t).toMatch(/hard-block failures must be resolved before reporting pass/i)
    expect(t).toMatch(/remaining blockers if not passing after 3 cycles/i)
  })

  it('documents step-0 visualization pre-generation and refresh before re-checks', () => {
    const t = text(verify as any)
    expect(t).toMatch(/Step 0 \(REQUIRED\) — Generate Visualizations First/i)
    expect(t).toMatch(/before each re-check cycle/i)
  })

  it('exposes warnings/examples covering cycle behavior per major subcommand', () => {
    const warnings = (verify.warnings || []).join('\n')
    expect(warnings).toMatch(/check → fix → re-check, up to 3 cycles/i)
    expect(warnings).toMatch(/voice-init is a setup\/generation action/i)
    expect(warnings).toMatch(/Continuity contradictions and hard-block gate failures must be resolved/i)

    const examples = (verify.examples || []).map(e => `${e.input} ${e.approach}`).join('\n')
    expect(examples).toMatch(/voice-init[\s\S]*setup action/i)
    expect(examples).toMatch(/voice-check[\s\S]*critique-revise cycle/i)
    expect(examples).toMatch(/continuity[\s\S]*critique-revise cycle/i)
    expect(examples).toMatch(/style enforcement[\s\S]*critique-revise cycle/i)
    expect(examples).toMatch(/gates[\s\S]*critique-revise cycle/i)
  })
})
