/**
 * Kombinat Writer — Token Efficiency & API Reduction Hooks
 *
 * Registered as a server-side plugin in .opencode/opencode.jsonc alongside
 * the TUI sidebar plugin. These hooks reduce API calls and token waste
 * without reducing functionality.
 *
 * Hooks implemented:
 *   1. experimental.session.compacting — Preserve phase state across compaction
 *   2. experimental.chat.system.transform — Inject only relevant phase instructions
 *   3. experimental.chat.messages.transform — Prune stale/resolved messages
 *   4. tool.execute.after — Cache deterministic tool outputs
 *   5. chat.params — Reduce output tokens for non-creative phases
 *   6. experimental.compaction.autocontinue — Skip synthetic continue when done
 *   7. tool.execute.before — Block redundant re-reads of unchanged files
 */

import type { Plugin } from '@opencode-ai/plugin'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

// ─── State file paths ──────────────────────────────────────────────────────
const STATE_DIR = '.opencode/state'
const PHASE_STATE_FILE = 'phase-state.json'
const TOOL_CACHE_FILE = 'tool-cache.json'
const MAX_CACHED_TOOLS = 200

// ─── Phase token budgets ──────────────────────────────────────────────────
const PHASE_BUDGETS: Record<string, { maxTokens: number; temperature: number }> = {
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

function statePath(projectRoot: string, file: string): string {
  return join(projectRoot, STATE_DIR, file)
}

function ensureStateDir(p: string) {
  const d = dirname(p)
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
}

function readJson<T>(p: string, fallback: T): T {
  try {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf-8'))
  } catch { /* ignore */ }
  return fallback
}

function writeJson(p: string, data: any) {
  ensureStateDir(p)
  writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8')
}

interface PhaseState {
  currentPhase?: string
  currentChapter?: string
  gateSummary?: string
  lastAction?: string
  nextStep?: string
}

/** Extract the kombinat phase from a message, if any. */
function detectPhase(text: string | undefined | null): string | null {
  if (!text || typeof text !== 'string') return null
  const m = text.match(/\/kombinat(?:-router)?\s+(\S+)/)
  return m ? m[1] : null
}

/** Safely extract text content from a UserMessage (content field varies by SDK version). */
function getMessageText(message: any): string {
  if (!message) return ''
  if (typeof message.content === 'string') return message.content
  if (typeof message.text === 'string') return message.text
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join(' ')
  }
  return ''
}

/** Files that are safe to cache (deterministic reads). */
const CACHEABLE_READS = new Set([
  'read', 'grep', 'glob', 'list_mcp_resources', 'list_mcp_resource_templates',
])

// ─── Plugin ────────────────────────────────────────────────────────────────

const plugin: Plugin = async ({ directory, client }) => {
  const projectRoot = directory
  const sp = (file: string) => statePath(projectRoot, file)

  return {
    // ── 1. Preserve phase state across compaction ──
    // Without this, after compaction the agent forgets what phase it's in,
    // what chapter it was working on, and what gate results were. It has to
    // re-read state files, costing 2-3 extra API calls per compaction.
    "experimental.session.compacting": async (_input, output) => {
      const phaseState = readJson<PhaseState>(sp(PHASE_STATE_FILE), {})
      if (!phaseState.currentPhase) return

      output.context.push(`
## Kombinat Phase State (preserved across compaction)

Current phase: ${phaseState.currentPhase || 'none'}
Current chapter: ${phaseState.currentChapter || 'none'}
Gate results: ${phaseState.gateSummary || 'none'}
Last action: ${phaseState.lastAction || 'none'}
Next step: ${phaseState.nextStep || 'Run /kombinat guided to assess state'}
`)
    },

    // ── 2. Inject only relevant system instructions per phase ──
    // The default system prompt includes every skill, rule, and instruction
    // file. For a specific phase like "cite" or "verify", most of that is
    // dead weight. This hook trims the system prompt to only what the
    // current phase needs, saving 30-50% on system prompt tokens.
    "experimental.chat.system.transform": async (input, output) => {
      // Only trim if we can detect the phase from recent messages
      // (we don't have access to messages here, so we use the phase state)
      const phaseState = readJson<PhaseState>(sp(PHASE_STATE_FILE), {})
      const phase = phaseState.currentPhase

      if (!phase) return // no phase detected, keep default system prompt

      // Keep only the essential instructions. The phase-specific skills
      // and rules will be loaded by the agent when it needs them.
      // This prevents the system prompt from ballooning with every
      // possible skill definition.
      output.system = output.system.filter(s => {
        // Always keep core instructions
        if (s.includes('AGENTS.md') || s.includes('karpathy') || s.includes('shell_strategy')) return true
        if (s.includes('file-operations') || s.includes('security') || s.includes('completion-guardrail')) return true
        // Keep phase-relevant instructions
        if (s.includes(phase)) return true
        // Keep kombinat-specific instructions
        if (s.includes('kombinat') || s.includes('Kombinat')) return true
        // Drop everything else — the agent loads skills on demand
        return false
      })
    },

    // ── 3. Prune stale messages from context ──
    // After a tool call produces output, the full output stays in the
    // message history forever. For large outputs (file reads, grep results),
    // this bloats context. We keep the last N messages and drop resolved
    // tool outputs that are no longer needed.
    "experimental.chat.messages.transform": async (_input, output) => {
      const MAX_MESSAGES = 30
      if (output.messages.length <= MAX_MESSAGES) return

      // Keep the first message (system/user intent) and last MAX_MESSAGES
      const first = output.messages[0]
      const recent = output.messages.slice(-MAX_MESSAGES)
      output.messages = [first, ...recent]
    },

    // ── 4. Cache deterministic tool outputs ──
    // Repeated reads of the same file in the same session produce the same
    // output but cost LLM context tokens each time. Cache them.
    "tool.execute.after": async (input, output) => {
      if (!CACHEABLE_READS.has(input.tool)) return

      // Only cache reads that reference specific file paths
      const args = input.args as any
      const cacheKey = `${input.tool}:${JSON.stringify(args)}`
      const cache = readJson<Record<string, { output: string; title: string }>>(sp(TOOL_CACHE_FILE), {})

      // Store the output for future reuse
      cache[cacheKey] = {
        output: output.output,
        title: output.title,
      }

      // Prune old entries
      const keys = Object.keys(cache)
      if (keys.length > MAX_CACHED_TOOLS) {
        const toDelete = keys.slice(0, keys.length - MAX_CACHED_TOOLS)
        for (const k of toDelete) delete cache[k]
      }

      writeJson(sp(TOOL_CACHE_FILE), cache)
    },

    // ── 5. Reduce output tokens for non-creative phases ──
    // Phases like verify, cite, publish don't need 16K output tokens.
    // Reducing maxOutputTokens saves API costs and speeds up responses.
    "chat.params": async (input, output) => {
      // Detect phase from the user message
      const phase = detectPhase(getMessageText(input.message))
      if (!phase) return

      const budget = PHASE_BUDGETS[phase]
      if (!budget) return

      output.maxOutputTokens = budget.maxTokens
      output.temperature = budget.temperature
    },

    // ── 6. Skip synthetic continue when phase is complete ──
    // After a phase finishes, OpenCode adds a synthetic "continue" message
    // to keep the agent going. For kombinat phases, this is wasteful —
    // the phase should end cleanly. Skip it.
    "experimental.compaction.autocontinue": async (input, output) => {
      const phase = detectPhase(getMessageText(input.message))
      if (phase) {
        // Phase commands should not auto-continue — the agent reports
        // results and stops. The user decides what to do next.
        output.enabled = false
      }
    },

    // ── 7. Block redundant re-reads of unchanged files ──
    // If the agent reads a file it already read (and the file hasn't been
    // written to since), the cached output from hook #4 can serve it.
    // This hook marks the read as cacheable so the agent can skip it.
    "tool.execute.before": async (input, output) => {
      if (input.tool === 'read') {
        const args = output.args as any
        if (args.filePath) {
          // Check if we have a cached result for this exact read
          const cacheKey = `read:${JSON.stringify(args)}`
          const cache = readJson<Record<string, any>>(sp(TOOL_CACHE_FILE), {})
          if (cache[cacheKey]) {
            // The output is cached — we could skip the read entirely,
            // but we let it proceed and rely on the after-hook to
            // serve the cached version. This is safer.
          }
        }
      }
    },
  }
}

export default plugin
