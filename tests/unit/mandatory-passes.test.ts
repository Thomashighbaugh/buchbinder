import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import {
  MANDATORY_PASSES,
  detectMandatoryPasses,
  latestCritiqueRound,
  ledgerPasses,
  readCritiqueCoverage,
  readLedgerEntry,
  readPipelineLedger,
} from '../../src/lib/mandatory-passes.js'
import pipelineLedger from '../../src/tools/pipeline-ledger.js'

const SUMMARY = [
  '# Critique — Round 1',
  '',
  '**Mode**: comprehensive',
  '',
  '## Reader/Pass Coverage',
  '',
  '| Reader | Status | Items |',
  '|--------|--------|-------|',
  '| alpha | complete | 12 |',
  '| beta | complete | 8 |',
  '| peer | complete | 5 |',
  '| sensitivity | complete | 3 |',
  '',
].join('\n')

describe('mandatory-pass ledger', () => {
  let tmp = ''

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'buchbinder-passes-'))
    await fs.ensureDir(path.join(tmp, 'book'))
  })

  afterEach(async () => {
    if (tmp) await fs.remove(tmp)
  })

  async function writeCritiqueRound(
    round: number,
    readers: { id: string; body: string }[],
    summary = SUMMARY
  ) {
    const dir = path.join(tmp, 'book', 'critique', `round-${round}`)
    await fs.ensureDir(path.join(dir, 'readers'))
    await fs.writeFile(path.join(dir, 'summary.md'), summary, 'utf-8')
    for (const reader of readers) {
      await fs.writeFile(path.join(dir, 'readers', `${reader.id}.md`), reader.body, 'utf-8')
    }
  }

  async function writeLedger(file: string, verdict = 'Pass', cycles = 1) {
    const dir = path.join(tmp, 'book', 'pipeline')
    await fs.ensureDir(dir)
    await fs.writeFile(
      path.join(dir, file),
      `# Ledger\n\n**Verdict**: ${verdict}\n**Cycles**: ${cycles}\n`,
      'utf-8'
    )
  }

  describe('ledger files', () => {
    it('treats a missing ledger file as not present', () => {
      const entry = readLedgerEntry(tmp, MANDATORY_PASSES[0])
      expect(entry.present).toBe(false)
      expect(entry.verdict).toBeNull()
      expect(ledgerPasses(entry)).toBe(false)
    })

    it('treats an empty ledger file as not present', async () => {
      await fs.ensureDir(path.join(tmp, 'book', 'pipeline'))
      await fs.writeFile(path.join(tmp, 'book', 'pipeline', 'edit.md'), '   \n', 'utf-8')
      const entry = readLedgerEntry(tmp, MANDATORY_PASSES[0])
      expect(entry.present).toBe(false)
      expect(ledgerPasses(entry)).toBe(false)
    })

    it('reads verdict and cycles from a ledger file', async () => {
      await writeLedger('edit.md', 'Pass', 3)
      const entry = readLedgerEntry(tmp, MANDATORY_PASSES[0])
      expect(entry.present).toBe(true)
      expect(entry.verdict).toBe('Pass')
      expect(entry.cycles).toBe(3)
      expect(ledgerPasses(entry)).toBe(true)
    })

    it('does not pass on a non-Pass verdict', async () => {
      await writeLedger('edit.md', 'Fail')
      const entry = readLedgerEntry(tmp, MANDATORY_PASSES[0])
      expect(entry.present).toBe(true)
      expect(ledgerPasses(entry)).toBe(false)
    })

    it('reads every mandatory pass from disk', async () => {
      const ledger = readPipelineLedger(tmp)
      expect(Object.keys(ledger)).toHaveLength(MANDATORY_PASSES.length)
      expect(Object.values(ledger).every((entry) => entry.present === false)).toBe(true)
    })
  })

  describe('critique reader coverage', () => {
    it('reports no round when no critique directory exists', () => {
      expect(latestCritiqueRound(tmp)).toBeNull()
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.round).toBeNull()
      expect(coverage.complete).toBe(false)
    })

    it('picks the highest numbered round', async () => {
      await writeCritiqueRound(1, [{ id: 'alpha', body: 'x' }])
      await writeCritiqueRound(3, [{ id: 'alpha', body: 'x' }])
      expect(latestCritiqueRound(tmp)).toBe(3)
      expect(readCritiqueCoverage(tmp).round).toBe(3)
    })

    it('is complete when every required reader has a non-empty report', async () => {
      await writeCritiqueRound(1, [
        { id: 'alpha', body: 'alpha findings' },
        { id: 'beta', body: 'beta findings' },
        { id: 'peer', body: 'peer findings' },
        { id: 'sensitivity', body: 'sensitivity findings' },
      ])
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.mode).toBe('comprehensive')
      expect(coverage.required).toEqual(['alpha', 'beta', 'peer', 'sensitivity'])
      expect(coverage.missing).toEqual([])
      expect(coverage.complete).toBe(true)
    })

    it('is incomplete when a required reader file is missing', async () => {
      await writeCritiqueRound(1, [
        { id: 'alpha', body: 'alpha findings' },
        { id: 'beta', body: 'beta findings' },
      ])
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.complete).toBe(false)
      expect(coverage.missing).toEqual(['peer', 'sensitivity'])
      expect(coverage.evidence).toMatch(/missing readers/)
    })

    it('is incomplete when a required reader file is empty', async () => {
      await writeCritiqueRound(1, [
        { id: 'alpha', body: 'alpha findings' },
        { id: 'beta', body: 'beta findings' },
        { id: 'peer', body: 'peer findings' },
        { id: 'sensitivity', body: '   ' },
      ])
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.complete).toBe(false)
      expect(coverage.missing).toEqual(['sensitivity'])
    })

    it('is incomplete when the round has no coverage checklist', async () => {
      await writeCritiqueRound(1, [{ id: 'alpha', body: 'alpha findings' }], '# Critique\n\nNo checklist here.\n')
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.required).toEqual([])
      expect(coverage.complete).toBe(false)
    })

    it('derives the required set from the mode, not from a partial checklist', async () => {
      const partial = [
        '# Critique — Round 1',
        '',
        '**Mode**: comprehensive',
        '',
        '| Reader | Status | Items |',
        '|--------|--------|-------|',
        '| alpha | complete | 12 |',
        '',
      ].join('\n')
      await writeCritiqueRound(1, [{ id: 'alpha', body: 'alpha findings' }], partial)
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.required).toEqual(['alpha', 'beta', 'peer', 'sensitivity'])
      expect(coverage.missing).toEqual(['beta', 'peer', 'sensitivity'])
      expect(coverage.complete).toBe(false)
    })

    it('honours a reader the checklist marks not applicable', async () => {
      const summary = [
        '# Critique — Round 1',
        '',
        '**Mode**: comprehensive',
        '',
        '| Reader | Status | Items |',
        '|--------|--------|-------|',
        '| alpha | complete | 12 |',
        '| beta | complete | 8 |',
        '| peer | n/a | 0 |',
        '| sensitivity | complete | 3 |',
        '',
      ].join('\n')
      await writeCritiqueRound(
        1,
        [
          { id: 'alpha', body: 'alpha findings' },
          { id: 'beta', body: 'beta findings' },
          { id: 'sensitivity', body: 'sensitivity findings' },
        ],
        summary
      )
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.required).toEqual(['alpha', 'beta', 'sensitivity'])
      expect(coverage.missing).toEqual([])
      expect(coverage.complete).toBe(true)
    })

    it('reads the inline reader coverage list', async () => {
      const summary = [
        '# Critique — Round 1',
        '',
        '**Mode**: comprehensive',
        '**Reader coverage**: [alpha ✓, beta ✓, peer ✓/n/a, sensitivity ✓/n/a]',
        '',
      ].join('\n')
      await writeCritiqueRound(
        1,
        [
          { id: 'alpha', body: 'alpha findings' },
          { id: 'beta', body: 'beta findings' },
        ],
        summary
      )
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.required).toEqual(['alpha', 'beta'])
      expect(coverage.complete).toBe(true)
    })

    it('requires all five personas for personas mode', async () => {
      const summary = '# Critique\n\n**Mode**: personas\n\n**Reader coverage**: [all personas ✓]\n'
      await writeCritiqueRound(
        1,
        [
          { id: 'genre-fan', body: 'fan findings' },
          { id: 'casual-reader', body: 'casual findings' },
          { id: 'literary-critic', body: 'critic findings' },
          { id: 'subject-expert', body: 'expert findings' },
        ],
        summary
      )
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.required).toHaveLength(5)
      expect(coverage.missing).toEqual(['skeptical-reviewer'])
      expect(coverage.complete).toBe(false)
    })

    it('requires defender, challenger, and synthesis for adversarial mode', async () => {
      const summary = '# Critique\n\n**Mode**: adversarial\n\n**Reader coverage**: [defender/challenger/synthesis ✓]\n'
      await writeCritiqueRound(
        1,
        [
          { id: 'defender', body: 'defender findings' },
          { id: 'challenger', body: 'challenger findings' },
        ],
        summary
      )
      const coverage = readCritiqueCoverage(tmp)
      expect(coverage.required).toEqual(['defender', 'challenger', 'synthesis'])
      expect(coverage.missing).toEqual(['synthesis'])
    })
  })

  describe('mandatory pass detection', () => {
    it('reports every pass outstanding on a fresh project', () => {
      const passes = detectMandatoryPasses(tmp)
      expect(passes[0].id).toBe('critique-coverage')
      expect(passes.every((pass) => pass.status === 'outstanding')).toBe(true)
      expect(passes).toHaveLength(MANDATORY_PASSES.length + 1)
    })

    it('marks passes complete only when their ledger file says Pass', async () => {
      await writeCritiqueRound(1, [
        { id: 'alpha', body: 'a' },
        { id: 'beta', body: 'b' },
        { id: 'peer', body: 'c' },
        { id: 'sensitivity', body: 'd' },
      ])
      await writeLedger('edit.md', 'Pass', 2)
      await writeLedger('continuity.md', 'Fail', 1)

      const passes = detectMandatoryPasses(tmp)
      const byId = Object.fromEntries(passes.map((pass) => [pass.id, pass]))
      expect(byId['critique-coverage'].status).toBe('complete')
      expect(byId['edit'].status).toBe('complete')
      expect(byId['continuity'].status).toBe('outstanding')
      expect(byId['continuity'].evidence).toMatch(/verdict Fail/)
      expect(byId['pacing'].status).toBe('outstanding')
      expect(byId['pacing'].evidence).toMatch(/missing/)
    })

    it('reports coverage outstanding when a reader is missing even if the ledger files exist', async () => {
      await writeCritiqueRound(1, [{ id: 'alpha', body: 'alpha findings' }])
      for (const pass of MANDATORY_PASSES) await writeLedger(pass.ledgerFile, 'Pass', 1)

      const passes = detectMandatoryPasses(tmp)
      const byId = Object.fromEntries(passes.map((pass) => [pass.id, pass]))
      expect(byId['critique-coverage'].status).toBe('outstanding')
      expect(byId['edit'].status).toBe('complete')
    })
  })
})

describe('pipeline-ledger tool', () => {
  let tmp = ''

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'buchbinder-ledger-'))
    await fs.ensureDir(path.join(tmp, 'book'))
  })

  afterEach(async () => {
    if (tmp) await fs.remove(tmp)
  })

  it('writes a ledger file that reads back as a passing pass', async () => {
    const result = await pipelineLedger.execute({
      action: 'write',
      pass: 'continuity',
      verdict: 'Pass',
      cycles: 2,
      scope: 'Chapters 1-6 (6 chapters)',
      projectRoot: tmp,
    })
    expect(String(result)).toMatch(/Recorded pass 'continuity'/)

    const file = path.join(tmp, 'book', 'pipeline', 'continuity.md')
    expect(await fs.pathExists(file)).toBe(true)
    const body = await fs.readFile(file, 'utf-8')
    expect(body).toMatch(/\*\*Verdict\*\*: Pass/)
    expect(body).toMatch(/\*\*Cycles\*\*: 2/)

    const entry = readLedgerEntry(tmp, MANDATORY_PASSES.find((p) => p.id === 'continuity')!)
    expect(ledgerPasses(entry)).toBe(true)
  })

  it('records a failing verdict as outstanding', async () => {
    await pipelineLedger.execute({
      action: 'write',
      pass: 'review',
      verdict: 'Fail',
      projectRoot: tmp,
    })
    const entry = readLedgerEntry(tmp, MANDATORY_PASSES.find((p) => p.id === 'review')!)
    expect(entry.present).toBe(true)
    expect(ledgerPasses(entry)).toBe(false)
  })

  it('requires a pass for the write action and rejects unknown passes', async () => {
    expect(String(await pipelineLedger.execute({ action: 'write', projectRoot: tmp }))).toMatch(
      /requires a 'pass' argument/
    )
    expect(
      String(await pipelineLedger.execute({ action: 'write', pass: 'nope', projectRoot: tmp }))
    ).toMatch(/unknown pass/)
  })

  it('status lists outstanding passes and refuses to claim completion', async () => {
    const output = String(await pipelineLedger.execute({ action: 'status', projectRoot: tmp }))
    expect(output).toMatch(/outstanding pass\(es\)/)
    expect(output).not.toMatch(/The pipeline may report complete/)
  })

  it('status reports completion only when every ledger file and the critique coverage pass', async () => {
    for (const pass of MANDATORY_PASSES) {
      await pipelineLedger.execute({ action: 'write', pass: pass.id, verdict: 'Pass', projectRoot: tmp })
    }
    const round = path.join(tmp, 'book', 'critique', 'round-1', 'readers')
    await fs.ensureDir(round)
    await fs.writeFile(
      path.join(tmp, 'book', 'critique', 'round-1', 'summary.md'),
      '**Mode**: comprehensive\n',
      'utf-8'
    )
    for (const reader of ['alpha', 'beta', 'peer', 'sensitivity']) {
      await fs.writeFile(path.join(round, `${reader}.md`), 'findings', 'utf-8')
    }

    const output = String(await pipelineLedger.execute({ action: 'status', projectRoot: tmp }))
    expect(output).toMatch(/All mandatory passes recorded/)
  })

  it('coverage reports missing readers', async () => {
    const round = path.join(tmp, 'book', 'critique', 'round-1', 'readers')
    await fs.ensureDir(round)
    await fs.writeFile(
      path.join(tmp, 'book', 'critique', 'round-1', 'summary.md'),
      '**Mode**: comprehensive\n',
      'utf-8'
    )
    await fs.writeFile(path.join(round, 'alpha.md'), 'findings', 'utf-8')

    const output = String(await pipelineLedger.execute({ action: 'coverage', projectRoot: tmp }))
    expect(output).toMatch(/Missing: beta, peer, sensitivity/)
    expect(output).toMatch(/Complete: no/)
  })
})
