import { describe, it, expect } from 'vitest'
import spec from '../../src/tools/hubs/buchbinder/critique.js'

const desc = () => spec.detailedDescription || ''

describe('critique spec — reader/pass coverage contract', () => {
  it('defines critique with required identity and descriptive fields', () => {
    expect(spec.label).toBe('critique')
    expect(spec.phases).toBe('8')
    expect(spec.description).toMatch(/critique/i)
    expect(spec.reminder).toMatch(/reader|pass/i)
    expect(desc().length).toBeGreaterThan(200)
  })

  it('documents primary reader modes and enforces no single-reader shortcut for comprehensive/all-readers', () => {
    const d = desc()
    expect(d).toMatch(/cold-read/i)
    expect(d).toMatch(/alpha reader/i)
    expect(d).toMatch(/beta reader/i)
    expect(d).toMatch(/peer/i)
    expect(d).toMatch(/sensitivity/i)
    expect(d).toMatch(/comprehensive/i)
    expect(d).toMatch(/all-readers/i)
    expect(d).toMatch(/No single-reader shortcut/i)
    expect(d).toMatch(/every reader\/pass required by the selected mode|every applicable reader\/pass/i)
    expect(d).toMatch(/alpha, beta, and sensitivity|alpha \+ beta/i)
  })

  it('requires explicit reader/pass queue execution and full-coverage artifacts before consolidation', () => {
    const d = desc()
    expect(d).toMatch(/reader\/pass queue/i)
    expect(d).toMatch(/Coverage checklist in summary \(required\)|reader coverage checklist/i)
    expect(d).toMatch(/per-reader outputs|per-reader consolidated findings|readers\/<reader>\.md/i)
    expect(d).toMatch(/after all required readers\/passes complete|after \*\*all required reader passes\*\* complete/i)
    expect(d).toMatch(/reader\/pass provenance|ID.*reader\/pass|C1-ALPHA-001/i)
  })

  it('requires all passes for personas, adversarial, and swarm modes', () => {
    const d = desc()
    expect(d).toMatch(/personas[\s\S]*all 5 personas/i)
    expect(d).toMatch(/Genre Fan[\s\S]*Casual Reader[\s\S]*Literary Critic[\s\S]*Subject Expert[\s\S]*Skeptical Reviewer/i)
    expect(d).toMatch(/adversarial[\s\S]*Defender \+ Challenger \+ Synthesis|run defender, challenger, and synthesis/i)
    expect(d).toMatch(/swarm[\s\S]*All 4 swarm analysts|all 4 analysts/i)
    expect(d).toMatch(/continuity-auditor[\s\S]*developmental-editor[\s\S]*sensitivity-reader[\s\S]*line-editor|Structural, Prose, Continuity, Momentum/i)
  })

  it('auto-selects comprehensive for final/pre-edit or late-draft critique and blocks premature completion', () => {
    const d = desc()
    expect(d).toMatch(/final pre-edit\/pre-revise pass, late draft|late-draft\/pre-edit pass|final[\s\S]*late-draft/i)
    expect(d).toMatch(/comprehensive/i)
    expect(d).toMatch(/Do not declare pre-edit critique complete until all required readers\/passes have run|do not hand off to revise\/edit claiming pre-edit critique is complete unless every required reader\/pass/i)
  })

  it('exposes warnings/examples reinforcing full reader coverage and handoff only after all passes', () => {
    const warnings = (spec.warnings || []).join('\n')
    expect(warnings).toMatch(/All required readers\/passes must complete/i)
    expect(warnings).toMatch(/no single-reader shortcut/i)
    expect(warnings).toMatch(/Coverage checklist and per-reader outputs\/consolidated report/i)

    const examples = (spec.examples || []).map(e => `${e.input} ${e.approach}`).join('\n')
    expect(examples).toMatch(/every required reader\/pass|every applicable reader/i)
    expect(examples).toMatch(/all 5 personas|personas/i)
    expect(examples).toMatch(/defender, challenger, and synthesizer passes/i)
  })
})
