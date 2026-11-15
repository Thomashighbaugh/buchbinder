import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(__dirname, '../..')

function runNode(args: string[]) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf-8',
    timeout: 30000,
  })
}

describe('CLI and tool smoke tests', () => {
  it('runs bin/tools/split-outline.js --help-style invocation without crashing on missing args', () => {
    // script expects args; ensure it executes as a module and exits predictably
    const r = runNode(['bin/tools/split-outline.js'])
    expect(r.status === 0 || r.status === 1).toBe(true)
    const out = `${r.stdout}\n${r.stderr}`
    expect(out.length).toBeGreaterThan(0)
  })

  it('loads hub-data compiled tool module', () => {
    const r = runNode(['-e', "import('./bin/tools/hub-data.js').then(m=>{if(!m.loadHub) process.exit(2); const h=m.loadHub('buchbinder'); if(!h) process.exit(3); console.log(h.subcommands.length)})"]) 
    expect(r.status).toBe(0)
    expect(Number((r.stdout || '').trim())).toBeGreaterThan(0)
  })

  it('loads buchbinder hub registry compiled module', () => {
    const r = runNode(['-e', "import('./bin/tools/hubs/buchbinder/index.js').then(m=>{if(!Array.isArray(m.specs)||m.specs.length===0) process.exit(2); console.log(m.specs[0].label)})"]) 
    expect(r.status).toBe(0)
    expect((r.stdout || '').trim().length).toBeGreaterThan(0)
  })
})
