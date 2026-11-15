import { describe, it, expect } from 'vitest'
import revise from '../../src/tools/hubs/buchbinder/revise.js'
import critique from '../../src/tools/hubs/buchbinder/critique.js'

type SpecLike = {
  label: string
  description: string
  reminder: string
  detailedDescription: string
  tools?: string[]
  warnings?: string[]
}

function text(s: SpecLike) {
  return [s.description, s.reminder, s.detailedDescription, ...(s.warnings || [])].join('\n')
}

describe('revise spec — critique reader coverage gate (pre-revision hard block)', () => {
  it('verifies critique reader coverage before any revision planning', () => {
    const d = revise.detailedDescription
    expect(d).toMatch(/### 0\. Verify Critique Reader Coverage \(REQUIRED — HARD BLOCK\)/i)
    expect(d).toMatch(/HARD BLOCK|HARD\)/i)
    expect(d).toMatch(/before (planning|categoris|categoriz)/i)
    expect(d).toMatch(/readers\/<reader>\.md/i)
    expect(d).toMatch(/coverage checklist/i)
  })

  it('supports both swarm and sequential subagent execution with identical artifacts', () => {
    const d = revise.detailedDescription
    expect(d).toMatch(/Swarm/i)
    expect(d).toMatch(/Sequential/i)
    expect(d).toMatch(/subagent|task/i)
    expect(d).toMatch(/same per-reader files and the same coverage checklist/i)
  })

  it('forbids revising from a partial reader set and forbids asking the user', () => {
    const d = revise.detailedDescription
    expect(d).toMatch(/Never proceed to revision with a partial reader set/i)
    expect(d).toMatch(/Never ask the user whether to run the remaining readers/i)
    expect(d).toMatch(/do not ask/i)
  })

  it('declares the task tool so missing readers can actually be run', () => {
    expect(revise.tools || []).toContain('task')
  })

  it('warns that partial reader coverage blocks revision', () => {
    const warnings = (revise.warnings || []).join('\n')
    expect(warnings).toMatch(/Critique reader coverage is a HARD BLOCK/i)
    expect(warnings).toMatch(/never revise from a partial reader set/i)
  })
})

describe('revise handoff — no free-floating optional passes', () => {
  it('does not offer proofread, compile/export, or review as next steps', () => {
    const d = revise.detailedDescription
    const handoff = d.slice(d.indexOf('### 8. Next Steps'))
    expect(handoff).toMatch(/Do not offer proofread, compile\/export, or review as free-floating next steps/i)
  })
})

describe('critique spec — pre-edit mode selection is automatic, not a question', () => {
  it('never asks the user to choose the mode before a pre-edit critique', () => {
    const d = critique.detailedDescription
    expect(d).toMatch(/Never ask the user to choose the mode before a pre-edit critique/i)
    expect(d).toMatch(/auto-select `comprehensive`|auto-select comprehensive/i)
    expect(d).toMatch(/single-reader mode/i)
  })
})
