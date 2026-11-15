import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { splitOutline } from '../../src/lib/outline-splitter.js'

describe('outline-splitter', () => {
  let tmp = ''

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'buchbinder-outline-'))
    await fs.ensureDir(path.join(tmp, 'book'))
  })

  afterEach(async () => {
    if (tmp) await fs.remove(tmp)
  })

  it('splits chapter headings into per-chapter files and index', async () => {
    const outline = [
      '# Outline',
      '',
      '## Arc 1: Beginning',
      '',
      '## Chapter 1: Arrival',
      '**Pacing:** Calm',
      '**Characters Present:** Alice, Bob',
      'Scene one.',
      '',
      '## Chapter 2: Trouble',
      '**Pacing:** Rising',
      'Scene two.',
      '',
    ].join('\n')
    await fs.writeFile(path.join(tmp, 'book', 'outline.md'), outline, 'utf-8')

    const result = await splitOutline(tmp, { track: 'fiction' })
    expect(result.chapters).toBe(2)
    expect(result.index.total_chapters).toBe(2)
    expect(result.index.chapters.map((c) => c.file)).toEqual(['chapter_01.md', 'chapter_02.md'])
    expect(await fs.pathExists(path.join(tmp, 'book', 'outline', 'chapter_01.md'))).toBe(true)
    expect(await fs.pathExists(path.join(tmp, 'book', 'outline', '_index.json'))).toBe(true)
    const ch1 = await fs.readFile(path.join(tmp, 'book', 'outline', 'chapter_01.md'), 'utf-8')
    expect(ch1).toContain('Chapter 1')
    expect(ch1).toContain('Arrival')
  })

  it('supports section unit for non-fiction tracks', async () => {
    const outline = ['## Section 1: Intro', 'Text', '', '## Section 2: Methods', 'Text'].join('\n')
    await fs.writeFile(path.join(tmp, 'book', 'outline.md'), outline, 'utf-8')
    const result = await splitOutline(tmp, { track: 'non-fiction' })
    expect(result.index.unit).toBe('section')
    expect(result.index.chapters[0].file).toBe('section_01.md')
    expect(await fs.pathExists(path.join(tmp, 'book', 'outline', 'section_02.md'))).toBe(true)
  })

  it('throws when outline.md is missing', async () => {
    await expect(splitOutline(tmp, { track: 'fiction' })).rejects.toThrow(/outline\.md/)
  })

  it('respects dryRun by not writing output files', async () => {
    const outline = ['## Chapter 1: One', 'A', '', '## Chapter 2: Two', 'B'].join('\n')
    await fs.writeFile(path.join(tmp, 'book', 'outline.md'), outline, 'utf-8')
    const result = await splitOutline(tmp, { track: 'fiction', dryRun: true })
    expect(result.chapters).toBe(2)
    expect(await fs.pathExists(path.join(tmp, 'book', 'outline', '_index.json'))).toBe(false)
  })
})
