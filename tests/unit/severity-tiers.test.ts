import { describe, it, expect } from 'vitest'
import {
  tierRank,
  filterByTier,
  classifySuggestion,
  summarizeTiers,
  formatSuggestionSet,
  type SuggestionSet,
  type TieredSuggestion,
} from '../../src/lib/severity-tiers.js'

describe('severity-tiers', () => {
  const mk = (tier: TieredSuggestion['tier'], id: string): TieredSuggestion => ({
    id,
    tier,
    category: 'test',
    title: id,
    description: 'd',
    rationale: 'r',
  })

  it('ranks tiers from must-fix (0) to fyi (3)', () => {
    expect(tierRank('must-fix')).toBe(0)
    expect(tierRank('should-consider')).toBe(1)
    expect(tierRank('your-call')).toBe(2)
    expect(tierRank('fyi')).toBe(3)
  })

  it('filters suggestions by minimum tier inclusively', () => {
    const set: SuggestionSet = {
      phase: 'draft',
      timestamp: 't',
      filterLevel: 'must-fix',
      suggestions: [mk('must-fix', 'a'), mk('should-consider', 'b'), mk('your-call', 'c'), mk('fyi', 'd')],
    }
    expect(filterByTier(set, 'must-fix').map((s) => s.id)).toEqual(['a'])
    expect(filterByTier(set, 'should-consider').map((s) => s.id)).toEqual(['a', 'b'])
    expect(filterByTier(set, 'fyi').map((s) => s.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('classifies raw suggestions by blocking/warning/preference flags', () => {
    const blocking = classifySuggestion({ category: 'x', title: 't', description: 'd', rationale: 'r', isBlocking: true })
    const warn = classifySuggestion({ category: 'x', title: 't', description: 'd', rationale: 'r', isWarning: true })
    const pref = classifySuggestion({ category: 'x', title: 't', description: 'd', rationale: 'r', isPreference: true })
    const fyi = classifySuggestion({ category: 'x', title: 't', description: 'd', rationale: 'r' })
    expect(blocking.tier).toBe('must-fix')
    expect(blocking.gateRef).toBe('x')
    expect(warn.tier).toBe('should-consider')
    expect(pref.tier).toBe('your-call')
    expect(fyi.tier).toBe('fyi')
  })

  it('summarizes and formats suggestion sets', () => {
    const set: SuggestionSet = {
      phase: 'critique',
      chapter: 2,
      timestamp: 't',
      filterLevel: 'fyi',
      suggestions: [mk('must-fix', 'a'), mk('fyi', 'b')],
    }
    const summary = summarizeTiers(set)
    expect(summary.total).toBe(2)
    expect(summary['must-fix']).toBe(1)
    expect(summary['fyi']).toBe(1)
    const out = formatSuggestionSet(set, 'fyi')
    expect(out).toContain('Suggestions: critique — Chapter 2')
    expect(out).toContain('MUST FIX')
    expect(out).toContain('FYI')
  })
})
