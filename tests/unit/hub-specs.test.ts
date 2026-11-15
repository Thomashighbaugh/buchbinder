import { describe, it, expect } from 'vitest'
import { specs, subcommands } from '../../src/tools/hubs/buchbinder/index.js'
import { getDelegation } from '../../src/tools/hub-data.js'

describe('buchbinder hub specs registry', () => {
  it('exports a non-empty specs array matching subcommands identity slice', () => {
    expect(Array.isArray(specs)).toBe(true)
    expect(specs.length).toBeGreaterThan(0)
    expect(subcommands.length).toBe(specs.length)
  })

  it('has unique, non-empty labels', () => {
    const labels = specs.map((s) => s.label)
    expect(labels.every((l) => typeof l === 'string' && l.trim().length > 0)).toBe(true)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('each spec has required descriptive fields and detailedDescription', () => {
    for (const s of specs) {
      expect(s.description, `${s.label} description`).toBeTruthy()
      expect(s.reminder, `${s.label} reminder`).toBeTruthy()
      expect(typeof s.detailedDescription, `${s.label} detailedDescription`).toBe('string')
      expect(s.detailedDescription.length, `${s.label} detailedDescription length`).toBeGreaterThan(20)
    }
  })

  it('identity slice mirrors core fields from specs', () => {
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i]
      const id = subcommands[i]
      expect(id.label).toBe(s.label)
      expect(id.description).toBe(s.description)
      expect(id.reminder).toBe(s.reminder)
      expect(id.phases).toBe(s.phases)
    }
  })

  it('delegation resolves to a valid type and target shape', () => {
    for (const s of specs) {
      const d = getDelegation(s as any)
      expect(['skill', 'agent', 'command', 'inline']).toContain(d.type)
      if (d.type !== 'inline') {
        expect(typeof d.target === 'string' || d.target === undefined).toBe(true)
      }
    }
  })

  it('includes key workflow phases', () => {
    const labels = new Set(specs.map((s) => s.label))
    for (const expected of ['guided', 'outline', 'draft', 'critique', 'revise', 'publish', 'refresh-index', 'resume']) {
      expect(labels.has(expected), `missing ${expected}`).toBe(true)
    }
  })
})
