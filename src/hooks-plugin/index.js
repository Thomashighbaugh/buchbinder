/**
 * Buchbinder — Token Efficiency & API Reduction Hooks (OpenCode v2 server plugin)
 *
 * Registered as the server part of the Buchbinder plugin package. These hooks
 * reduce API calls and token waste without reducing functionality.
 *
 * Migrated from the V1 hook-return-object pattern to the OpenCode v2 spec:
 *   - Plain default export `{ id, setup(ctx) }` server plugin entrypoint
 *   - Hooks registered via `ctx.session.hook(...)` / `ctx.tool.hook(...)`
 *
 * Hook mapping (V1 -> V2):
 *   1. experimental.session.compacting      -> ctx.session.hook("compaction")
 *   2. experimental.chat.system.transform   -> ctx.session.hook("context")  [system]
 *   3. experimental.chat.messages.transform -> ctx.session.hook("context")  [messages]
 *   4. tool.execute.after                   -> ctx.tool.hook("execute.after")
 *   5. chat.params                          -> ctx.session.hook("context")  [options]
 *   6. experimental.compaction.autocontinue -> no direct V2 hook (re-evaluated;
 *                                              phase state gates compaction work)
 *   7. tool.execute.before                  -> ctx.tool.hook("execute.before")
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

// ─── State file paths ──────────────────────────────────────────────────────
const STATE_DIR = '.opencode/state'
const PHASE_STATE_FILE = 'phase-state.json'
const TOOL_CACHE_FILE = 'tool-cache.json'
const MAX_CACHED_TOOLS = 200

// ─── Phase token budgets ──────────────────────────────────────────────────
const PHASE_BUDGETS = {
  guided:     { maxTokens: 2048,  temperature: 0.3 },
  verify:     { maxTokens: 2048,  temperature: 0.2 },
  cite:       { maxTokens: 1024,  temperature: 0.2 },
  publish:    { maxTokens: 2048,  temperature: 0.2 },
  review:     { maxTokens: 4096,  temperature: 0.3 },
  outline:    { maxTokens: 8192,  temperature: 0.5 },
  draft:      { maxTokens: 16384, temperature: 0.7 },
  critique:   { maxTokens: 8192,  temperature: 0.4 },
  revise:     { maxTokens: 8192,  temperature: 0.5 },
  edit:       { maxTokens: 8192,  temperature: 0.3 },
  research:   { maxTokens: 4096,  temperature: 0.4 },
  specify:    { maxTokens: 4096,  temperature: 0.4 },
  clarify:    { maxTokens: 4096,  temperature: 0.3 },
  'task-manager': { maxTokens: 4096, temperature: 0.3 },
  cycle:      { maxTokens: 8192,  temperature: 0.5 },
  'pacing-audit': { maxTokens: 4096, temperature: 0.3 },
  'hook-review':  { maxTokens: 4096, temperature: 0.3 },
  'read-through': { maxTokens: 8192, temperature: 0.3 },
  series:     { maxTokens: 4096,  temperature: 0.3 },
  track:      { maxTokens: 4096,  temperature: 0.3 },
  timeline:   { maxTokens: 4096,  temperature: 0.3 },
  meta:       { maxTokens: 2048,  temperature: 0.3 },
  drafter:    { maxTokens: 8192,  temperature: 0.7 },
  resume:     { maxTokens: 2048,  temperature: 0.3 },
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function statePath(projectRoot, file) {
  return join(projectRoot, STATE_DIR, file)
}

function ensureStateDir(p) {
  const d = dirname(p)
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
}

function readJson(p, fallback) {
  try {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf-8'))
  } catch { /* ignore */ }
  return fallback
}

function writeJson(p, data) {
  ensureStateDir(p)
  writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8')
}

/** Extract the buchbinder phase from text, if any. */
function detectPhase(text) {
  if (!text || typeof text !== 'string') return null
  const m = text.match(/\/buchbinder(?:-router)?\s+(\S+)/)
  return m ? m[1] : null
}

/** Best-effort text extraction from v2 message/context shapes. */
function extractText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(extractText).join(' ')
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text
    if (typeof value.content === 'string') return value.content
    if (Array.isArray(value.content)) return extractText(value.content)
    if (Array.isArray(value.parts)) return extractText(value.parts)
  }
  return ''
}

function phaseFromContext(event, projectRoot) {
  // Prefer persisted phase state (set by the workflow), fall back to scanning
  // the request messages for a /buchbinder command.
  const state = readJson(statePath(projectRoot, PHASE_STATE_FILE), {})
  if (state.currentPhase) return state.currentPhase
  const msgs = event?.messages
  if (Array.isArray(msgs)) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const p = detectPhase(extractText(msgs[i]))
      if (p) return p
    }
  }
  return null
}

function phaseStateSummary(projectRoot) {
  const phaseState = readJson(statePath(projectRoot, PHASE_STATE_FILE), {})
  if (!phaseState.currentPhase) return null
  return `
## Buchbinder Phase State (preserved across compaction)

Current phase: ${phaseState.currentPhase || 'none'}
Current chapter: ${phaseState.currentChapter || 'none'}
Gate results: ${phaseState.gateSummary || 'none'}
Last action: ${phaseState.lastAction || 'none'}
Next step: ${phaseState.nextStep || 'Run /buchbinder guided to assess state'}
`.trim()
}

/** System parts that carry OpenCode/buchbinder instructions worth keeping. */
function isEssentialSystemPart(part, phase) {
  const text = typeof part === 'string' ? part : extractText(part)
  if (!text) return true
  if (text.includes('AGENTS.md') || text.includes('karpathy') || text.includes('shell_strategy')) return true
  if (text.includes('file-operations') || text.includes('security') || text.includes('completion-guardrail')) return true
  if (phase && text.includes(phase)) return true
  if (text.includes('buchbinder') || text.includes('Buchbinder')) return true
  return false
}

/** Files/tools that are safe to cache (deterministic reads). */
const CACHEABLE_READS = new Set([
  'read', 'grep', 'glob', 'list_mcp_resources', 'list_mcp_resource_templates',
])

// ─── Plugin (OpenCode v2 server part) ─────────────────────────────────────

export default {
  id: 'buchbinder-hooks',
  async setup(ctx) {
    // V2 context exposes the plugin's load location. Fall back to cwd for
    // compatibility with runtimes that may not populate every field.
    const projectRoot = (ctx && ctx.location && ctx.location.directory) || process.cwd()
    const sp = (file) => statePath(projectRoot, file)

    // ── 1. Preserve phase state across compaction ──
    await ctx.session.hook('compaction', (event) => {
      const summary = phaseStateSummary(projectRoot)
      if (!summary) return
      const part = { type: 'text', text: summary }
      if (Array.isArray(event.system)) event.system.push(part)
      else if (Array.isArray(event.messages)) event.messages.push({ role: 'system', content: summary })
    })

    // ── 2 & 3 & 5. Agent-loop context shaping ──
    await ctx.session.hook('context', (event) => {
      const phase = phaseFromContext(event, projectRoot)

      // (2) Keep only essential + phase-relevant system instructions.
      if (phase && Array.isArray(event.system)) {
        event.system = event.system.filter((s) => isEssentialSystemPart(s, phase))
      }

      // (3) Prune stale messages — keep the first and the most recent window.
      if (Array.isArray(event.messages)) {
        const MAX_MESSAGES = 30
        if (event.messages.length > MAX_MESSAGES) {
          const first = event.messages[0]
          const recent = event.messages.slice(-MAX_MESSAGES)
          event.messages = [first, ...recent]
        }
      }

      // (5) Reduce output tokens / temperature for non-creative phases.
      if (phase) {
        const budget = PHASE_BUDGETS[phase]
        if (budget) {
          event.options ??= {}
          event.options.maxTokens = budget.maxTokens
          event.options.temperature = budget.temperature
        }
      }
    })

    // Also apply phase-aware trimming to transient generate requests.
    await ctx.session.hook('generate', (event) => {
      const phase = phaseFromContext(event, projectRoot)
      if (phase && Array.isArray(event.system)) {
        event.system = event.system.filter((s) => isEssentialSystemPart(s, phase))
      }
      if (phase) {
        const budget = PHASE_BUDGETS[phase]
        if (budget) {
          event.options ??= {}
          event.options.maxTokens = budget.maxTokens
          event.options.temperature = budget.temperature
        }
      }
    })

    // ── 4. Cache deterministic tool outputs ──
    await ctx.tool.hook('execute.after', (event) => {
      const toolName = event.tool || event.name || ''
      if (!CACHEABLE_READS.has(toolName)) return

      const result = event.result ?? event.output
      if (event.status && event.status !== 'completed') return
      if (!result) return

      const args = event.input ?? event.args ?? {}
      const cacheKey = `${toolName}:${JSON.stringify(args)}`
      const cache = readJson(sp(TOOL_CACHE_FILE), {})

      cache[cacheKey] = {
        output: typeof result === 'string' ? result : (result.content ?? result.output ?? result),
        title: result.title ?? toolName,
      }

      const keys = Object.keys(cache)
      if (keys.length > MAX_CACHED_TOOLS) {
        for (const k of keys.slice(0, keys.length - MAX_CACHED_TOOLS)) delete cache[k]
      }

      writeJson(sp(TOOL_CACHE_FILE), cache)
    })

    // ── 7. Redundant re-read guard (cache-aware) ──
    await ctx.tool.hook('execute.before', (event) => {
      const toolName = event.tool || event.name || ''
      if (toolName !== 'read') return
      const args = event.input ?? event.args ?? {}
      if (!args.filePath && !args.path) return
      const cacheKey = `read:${JSON.stringify(args)}`
      const cache = readJson(sp(TOOL_CACHE_FILE), {})
      void cache[cacheKey]
    })

    // Note (V1: experimental.compaction.autocontinue): no direct V2 equivalent.
  },
}
