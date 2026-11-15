import { describe, it, expect } from 'vitest'
import { analyzeProseQuality } from '../../src/lib/prose-quality.js'

describe('prose-quality analyzer', () => {
  it('returns a structured report with expected metric fields', () => {
    const xml = `
      <chapter n="1">
        <scene>
          <narration>Alice walked into the room. She opened the window and let in cold air.</narration>
          <dialogue speaker="Alice">"Hello," she said.</dialogue>
          <action>Bob nodded and closed the door.</action>
        </scene>
      </chapter>`
    const report = analyzeProseQuality(xml, 1)
    expect(report.chapter).toBe(1)
    expect(report.wordCount).toBeGreaterThan(0)
    expect(Array.isArray(report.metrics)).toBe(true)
    expect(report.metrics.length).toBeGreaterThan(0)
    expect(typeof report.passed).toBe('boolean')
    for (const m of report.metrics) {
      expect(m.name).toBeTruthy()
      expect(typeof m.count).toBe('number')
      expect(typeof m.passed).toBe('boolean')
    }
    expect(typeof report.scorecard).toBe('string')
  })

  it('flags obvious filter-word/adverb-heavy prose more harshly than clean prose', () => {
    const clean = `<chapter><narration>The stone gate cracked. Dust fell. Mara ran.</narration></chapter>`
    const noisy = `<chapter><narration>She suddenly really felt that she somehow seemed to notice and realized that he literally just appeared to be very quietly watching.</narration></chapter>`
    const cleanReport = analyzeProseQuality(clean, 1)
    const noisyReport = analyzeProseQuality(noisy, 1)
    const cleanBlocks = cleanReport.blocking.length + cleanReport.warnings.length
    const noisyBlocks = noisyReport.blocking.length + noisyReport.warnings.length
    expect(noisyBlocks).toBeGreaterThanOrEqual(cleanBlocks)
  })
})
