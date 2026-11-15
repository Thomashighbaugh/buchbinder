import { describe, it, expect } from 'vitest'
import { getDelegation } from '../../src/tools/hub-data.js'

describe('hub-data (compiled runtime)', () => {
  it('loads the buchbinder hub definition', async () => {
    const mod = await import('../../bin/tools/hub-data.js')
    const hub = mod.loadHub('buchbinder')
    expect(hub).not.toBeNull()
    expect(hub?.name).toBe('buchbinder')
    expect((hub?.subcommands.length ?? 0)).toBeGreaterThan(0)
  })

  it('lists all subcommand labels and resolves a known spec fully', async () => {
    const mod = await import('../../bin/tools/hub-data.js')
    const labels = mod.loadAllSubcommandLabels('buchbinder')
    expect(labels).toContain('outline')
    expect(labels).toContain('draft')

    const full = mod.loadSubcommandSpecFull('buchbinder', 'outline')
    expect(full.spec).not.toBeNull()
    expect(full.spec?.label).toBe('outline')
    expect(typeof full.spec?.detailedDescription).toBe('string')
  })

  it('returns null/empty for unknown hub or subcommand', async () => {
    const mod = await import('../../bin/tools/hub-data.js')
    expect(mod.loadHub('nope')).toBeNull()
    const full = mod.loadSubcommandSpecFull('buchbinder', 'not-a-real-phase')
    expect(full.spec).toBeNull()
    expect(full.rulesContent).toEqual([])
  })

  it('computes delegation for plain identity items', () => {
    expect(getDelegation({ label: 'x', description: 'd', reminder: 'r', inline: true } as any).type).toBe('inline')
    expect(getDelegation({ label: 'x', description: 'd', reminder: 'r', skill: 's' } as any)).toEqual({ type: 'skill', target: 's' })
  })
})
