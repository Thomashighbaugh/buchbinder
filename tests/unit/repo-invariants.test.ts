import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')

function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

describe('v2 migration and self-contained dispatch invariants', () => {
  it('command manifests avoid legacy prompt-dispatcher that duplicates /buchbinder sidebar menu', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/commands/buchbinder.md'))).toBe(false)
    expect(fs.existsSync(path.join(ROOT, '.opencode/commands/buchbinder.md'))).toBe(false)
  })

  it('sidebar plugin dispatch is self-contained and never routes to hubMenu/global hubs', () => {
    const sidebar = read('src/plugins/buchbinder-sidebar.tsx')
    expect(sidebar).toContain("from '@opencode/plugin/tui'")
    expect(sidebar).toMatch(/keymap\??\.layer/)
    expect(sidebar).toMatch(/slash:\s*\{[\s\S]*?name:\s*'buchbinder'/)
    expect(sidebar).toContain("id: 'buchbinder.menu'")
    expect(sidebar).toContain('dispatchPhase')
    // must not invoke or route through hubMenu/global hubs (prohibitive mentions are allowed)
    expect(sidebar).not.toMatch(/tools\.hubMenu|client\.tool\.hubMenu/)
    expect(sidebar).not.toMatch(/(?<!\bdo not\s)(?<!\bdon't\s)(?<!\bnever\s)\b(route|invoke|call|use|load)\b[^\n]{0,40}\bhubMenu\b/i)
    expect(sidebar).not.toMatch(/(?<!\bdo not\s)(?<!\bdon't\s)(?<!\bnever\s)\broute\s+(?:via|to)\b[^\n]{0,40}\bglobal\b/i)
    expect(sidebar).toMatch(/Do NOT call .*hubMenu/i)
    expect(sidebar).toMatch(/Do NOT route to global\/user-scope(?:d)?\b/i)
    expect(sidebar).toMatch(/project-installed skills\/commands\/tools/i)
  })

  it('source tool specs avoid hubMenu routing and use buchbinder-router for subcommand specs', () => {
    const hubData = read('src/tools/hub-data.ts')
    expect(hubData).not.toMatch(/hubMenu\.ts/)
    expect(hubData).not.toContain('from ./hubs/')

    const buchbinderIndex = read('src/tools/hubs/buchbinder/index.ts')
    expect(buchbinderIndex).not.toMatch(/\bhubMenu\b/)

    const outline = read('src/tools/hubs/buchbinder/outline.ts')
    expect(outline).not.toMatch(/\bhubMenu\b/)
    expect(outline).toMatch(/buchbinder-router/)

    // a representative sample: no source hub spec should mention hubMenu
    const specs = [
      'src/tools/hubs/buchbinder/critique.ts',
      'src/tools/hubs/buchbinder/review.ts',
      'src/tools/hubs/buchbinder/draft.ts',
      'src/tools/hubs/buchbinder/revise.ts',
      'src/tools/hubs/buchbinder/edit.ts',
      'src/tools/hubs/buchbinder/publish.ts',
      'src/tools/hubs/buchbinder/verify.ts',
    ]
    for (const rel of specs) {
      const content = read(rel)
      expect(content, rel).not.toMatch(/\bhubMenu\b/)
    }
  })

  it('install/refresh config wiring is v2-consistent for project-local plugins', () => {
    const sync = read('bin/lib/sync.mjs')
    // project-local registration must target opencode.jsonc plugins, not tui.json plugins
    expect(sync).toMatch(/opencode\.jsonc[\s\S]{0,300}plugins/)
    expect(sync).toMatch(/PLUGIN_ENTRY\s*=\s*'\.\/plugins\/buchbinder-sidebar'/)
    expect(sync).toMatch(/HOOKS_ENTRY\s*=\s*'\.\/plugins\/hooks'/)
    // must not register/add buchbinder plugins into tui.json; tui.json may be cleaned of legacy entries
    expect(sync).not.toMatch(/fs\.writeJsonSync\(tuiJsonPath,\s*\{[\s\S]*?plugins:\s*\[\s*PLUGIN_ENTRY\s*\]/)
    expect(sync).not.toMatch(/normalizePluginList\([^)]*wantSidebar:\s*true,\s*wantHooks:\s*false\)/)
    expect(sync).toMatch(/do not add them here|Clean legacy\/misplaced buchbinder plugin entries/i)
  })

  it('v2 plugin manifests declare correct entrypoints/exports for sidebar and hooks', () => {
    const sidebarPkg = JSON.parse(read('src/plugins/package.json')) as any
    expect(sidebarPkg.main).toMatch(/buchbinder-sidebar\.tsx$/)
    expect(sidebarPkg.exports?.['.']).toMatch(/buchbinder-sidebar\.tsx$/)
    expect(sidebarPkg.exports?.['./tui']).toMatch(/buchbinder-sidebar\.tsx$/)

    const hooksPkg = JSON.parse(read('src/hooks-plugin/package.json')) as any
    expect(hooksPkg.main).toBe('./index.js')
    expect(hooksPkg.exports?.['.']).toBe('./index.js')
  })
})
