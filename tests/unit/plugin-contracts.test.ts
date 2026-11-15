import { describe, it, expect } from 'vitest'
import hooksDefault from '../../src/hooks-plugin/index.js'
import hooksTsDefault from '../../src/hooks-plugin/index.ts'

describe('plugin v2 contracts (source)', () => {
  it('hooks server plugin exports a default definition with id and setup', () => {
    expect(hooksDefault).toBeTruthy()
    expect(typeof hooksDefault.id).toBe('string')
    expect(hooksDefault.id.length).toBeGreaterThan(0)
    expect(typeof hooksDefault.setup).toBe('function')

    expect(hooksTsDefault).toBeTruthy()
    expect(hooksTsDefault.id).toBe(hooksDefault.id)
    expect(typeof hooksTsDefault.setup).toBe('function')
  })
})
