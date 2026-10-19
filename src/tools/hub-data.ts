/**
 * Buchbinder — Hub Data Types & Loader
 *
 * Ported from the global OpenCode hub system. Provides the type system
 * and spec loader for the buchbinder hub's TUI command menu.
 *
 * Self-contained: no dependencies on global config or project state.
 */

import * as fs from "fs"
import * as path from "path"
import { createRequire } from "module"
import { fileURLToPath } from "url"

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Types ───────────────────────────────────────────────────────────────

export interface HubSubcommand {
  label: string
  description: string
  reminder: string
  skill?: string
  agent?: string
  command?: string
  inline?: boolean
  phases?: string
}

export interface HubSubcommandSpec extends HubSubcommand {
  detailedDescription: string
  tools?: string[]
  rules?: string[]
  relatedSkills?: string[]
  examples?: Array<{ input: string; approach: string }>
  warnings?: string[]
}

export interface HubDefinition {
  name: string
  description: string
  subcommands: HubSubcommand[]
}

export interface DelegationInfo {
  type: 'skill' | 'agent' | 'command' | 'inline'
  target: string | undefined
}

// ─── Delegation ──────────────────────────────────────────────────────────

export function getDelegation(sub: HubSubcommand): DelegationInfo {
  const types = ['skill', 'agent', 'command', 'inline'] as const
  const set = types.filter(t => !!sub[t as keyof HubSubcommand])
  if (set.length === 0) return { type: 'inline', target: undefined }
  const type = set[0] as 'skill' | 'agent' | 'command' | 'inline'
  return { type, target: sub[type as keyof HubSubcommand] as string | undefined }
}

// ─── Hub File Registry ───────────────────────────────────────────────────
// Buchbinder writer is self-contained. All hub files live in tools/hubs/buchbinder/.

const HUBS_DIR = path.join(__dirname, "hubs")

export const HUB_FILE_MAP: Record<string, string> = {
  "buchbinder": path.join(HUBS_DIR, "buchbinder"),
}

export function loadHub(name: string): HubDefinition | null {
  const hubDir = HUB_FILE_MAP[name]
  if (!hubDir) return null
  try {
    const mod = require(hubDir)
    // The index.ts exports { subcommands: HubSubcommand[], specs: HubSubcommandSpec[] }
    // We need the hub definition. For buchbinder, we'll construct it.
    const specs = mod.specs || []
    const subcommands: HubSubcommand[] = specs.map((s: HubSubcommandSpec) => ({
      label: s.label, description: s.description, reminder: s.reminder,
      skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
    }))
    return {
      name,
      description: "Professional book writing workflow — fiction, non-fiction, and mixed projects",
      subcommands
    }
  } catch (e) {
    return null
  }
}

// ─── Subcommand Spec Loader ──────────────────────────────────────────────

const SUBCOMMAND_DIR_MAP: Record<string, string> = {
  "buchbinder": "buchbinder",
}

export function loadSubcommandSpec(hubName: string, subLabel: string): HubSubcommandSpec | null {
  const dir = SUBCOMMAND_DIR_MAP[hubName]
  if (!dir) return null

  const file = path.join(HUBS_DIR, dir, subLabel)
  try {
    const mod = require(file)
    return (mod.default || mod.spec) as HubSubcommandSpec
  } catch {
    return null
  }
}

// ─── Skill Resolution ─────────────────────────────────────────────────────
// Skills live in nested category directories (e.g. quality-assurance/
// workflow-guide/, fiction/writing-techniques/scene-structure/). Specs
// reference them by bare name, so build a one-time index of every SKILL.md
// and resolve by suffix match: "category/name" first, bare "name" second.

const skillIndexCache = new Map<string, string>()

function findSkillPath(skillsDir: string, name: string): string | null {
  if (skillIndexCache.size === 0) buildSkillIndex(skillsDir)
  return skillIndexCache.get(name) ?? null
}

function buildSkillIndex(skillsDir: string): void {
  try {
    if (!fs.existsSync(skillsDir)) return
    walkForSkillFiles(skillsDir, skillsDir)
  } catch {}
}

function walkForSkillFiles(dir: string, skillsDir: string): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkForSkillFiles(full, skillsDir)
      continue
    }
    if (entry.name !== 'SKILL.md') continue
    const rel = path.relative(skillsDir, full).replace(/\\/g, '/')
    const parts = rel.split('/')
    if (parts[parts.length - 1] !== 'SKILL.md') continue
    // Full path without the SKILL.md segment, e.g. "quality-assurance/workflow-guide"
    const relDir = parts.slice(0, -1).join('/')
    // Preferred key: the full category path ("category/sub/name" or "category/name")
    if (!skillIndexCache.has(relDir)) skillIndexCache.set(relDir, full)
    // Bare-name fallback key, e.g. "workflow-guide"
    const bare = parts[parts.length - 2]
    if (bare && !skillIndexCache.has(bare)) skillIndexCache.set(bare, full)
  }
}

// ─── Library Module Resolution ────────────────────────────────────────────
// Some specs list library modules (lib/*.ts — phase-preview, provenance,
// diff-approval, …) alongside skills. They are not SKILL.md directories, so
// resolve them against the sibling lib/ tree as a fallback.

const libIndexCache = new Map<string, string>()

function findLibModulePath(name: string): string | null {
  if (libIndexCache.size === 0) {
    const libDir = path.join(__dirname, '..', 'lib')
    try {
      if (fs.existsSync(libDir)) {
        for (const file of fs.readdirSync(libDir)) {
          if (file.endsWith('.ts') && !libIndexCache.has(file.slice(0, -3))) {
            libIndexCache.set(file.slice(0, -3), path.join(libDir, file))
          }
        }
      }
    } catch {}
  }
  return libIndexCache.get(name) ?? null
}

export function loadSubcommandSpecFull(hubName: string, subLabel: string): {
  spec: HubSubcommandSpec | null
  rulesContent: Array<{ name: string; content: string }>
  relatedSkillMeta: Array<{ name: string; path: string; description: string }>
} {
  const spec = loadSubcommandSpec(hubName, subLabel)
  if (!spec) return { spec: null, rulesContent: [], relatedSkillMeta: [] }

  const rulesContent: Array<{ name: string; content: string }> = []
  const relatedSkillMeta: Array<{ name: string; path: string; description: string }> = []

  // Rules are in the buchbinder project's rules/ directory — one level up
  // from tools/ (i.e. .opencode/rules or src/rules, depending on the tree).
  // NOTE: this hub's specs carry rule TEXT in spec.rules, which hubMenu
  // returns verbatim; rulesContent only fills in when an entry happens to
  // name a rule file (e.g. "ai-writing-patterns").
  if (spec.rules && spec.rules.length > 0) {
    const rulesDir = path.join(__dirname, '..', 'rules')
    for (const ruleName of spec.rules) {
      const rulePath = path.join(rulesDir, `${ruleName}.md`)
      try {
        if (fs.existsSync(rulePath)) {
          rulesContent.push({ name: ruleName, content: fs.readFileSync(rulePath, 'utf-8') })
        }
      } catch {}
    }
  }

  // Related skills are in the buchbinder project's skills/ directory — one
  // level up from tools/ (i.e. .opencode/skills or src/skills). Skills are
  // nested by category (e.g. quality-assurance/workflow-guide/ or fiction/
  // writing-techniques/scene-structure/), so resolve each name against a
  // lazily-built index of every SKILL.md under skills/.
  if (spec.relatedSkills && spec.relatedSkills.length > 0) {
    const skillsDir = path.join(__dirname, '..', 'skills')
    for (const skillName of spec.relatedSkills) {
      // Skills first; some specs reference library modules (src/lib/*.ts)
      // by bare name, so fall back to the lib index for those.
      const skillPath = findSkillPath(skillsDir, skillName)
        ?? findLibModulePath(skillName)
      if (!skillPath) continue
      try {
        const content = fs.readFileSync(skillPath, 'utf-8')
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
        if (fmMatch) {
          const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m)
          relatedSkillMeta.push({
            name: skillName,
            path: skillPath,
            description: descMatch ? descMatch[1].trim() : ''
          })
        } else {
          // Library module — use its leading JSDoc line as the description.
          const jsdoc = content.match(/^\/\*\*\s*\n(?:\s*\*.*\n)*?\s*\*\s*(.+)\n/)
          relatedSkillMeta.push({
            name: skillName,
            path: skillPath,
            description: jsdoc ? jsdoc[1].trim() : `Library module — ${path.basename(skillPath)}`
          })
        }
      } catch {}
    }
  }

  return { spec, rulesContent, relatedSkillMeta }
}

export function loadAllSubcommandLabels(hubName: string): string[] {
  const hub = loadHub(hubName)
  return hub ? hub.subcommands.map(s => s.label) : []
}
