/** @jsxImportSource @opentui/solid */
/**
 * Buchbinder Sidebar — TUI Plugin (OpenCode v2 spec)
 *
 * Registers:
 *   - `/buchbinder` slash command (via keymap layer) → dialog select menu
 *   - sidebar.content / sidebar.footer slots
 *
 * OpenCode v2 TUI plugin API:
 *   - `Plugin.define` from `@opencode/plugin/tui`
 *   - `setup(context)` with `context.keymap`, `context.ui.slot/dialog/toast`,
 *     `context.client`, `context.location`, `context.ui.router`
 */

import { Plugin } from '@opencode/plugin/tui'
import { onMount } from 'solid-js'
import { SidebarTitle } from './components/sidebar-title'
import { SidebarContent } from './components/sidebar-content'
import { SidebarFooter } from './components/sidebar-footer'
import { useProjectState, setInjector, setMenuOpener, setPhaseDispatcher } from './hooks/use-project-state'

type PhaseEntry = { label: string; description: string }
type MenuCategory = { key: string; title: string; description: string; phases: PhaseEntry[] }

/**
 * Grouped /buchbinder phases. Must stay in sync with tools/hubs/buchbinder/index.ts.
 */
const BUCHBINDER_MENU: MenuCategory[] = [
  {
    key: 'start',
    title: 'Start & Plan',
    description: 'Bring work in, then premise, principles, research, structure',
    phases: [
      { label: 'guided',       description: 'Assess project state and run the full workflow pipeline' },
      { label: 'import',       description: 'Import an existing manuscript, draft, outline, research, or project at any stage' },
      { label: 'ideation',     description: 'Iteratively refine premise, theme, setting, characters, conflict before constitution' },
      { label: 'manifest',     description: 'Establish creative or intellectual principles' },
      { label: 'specify',      description: 'Build story specification with premise stress-test' },
      { label: 'clarify',      description: 'Resolve specification ambiguities' },
      { label: 'research',     description: 'Active research — sources, annotation, literature review' },
      { label: 'outline',      description: 'Chapter structure, pacing, arc design' },
      { label: 'task-manager', description: 'Break outline into tracked tasks' },
    ],
  },
  {
    key: 'draft',
    title: 'Draft & Refine',
    description: 'Write, then critique, revise, and edit',
    phases: [
      { label: 'draft',    description: 'Batch draft (default) — all planned chapters or up to 6' },
      { label: 'drafter',  description: 'Loose draft jumpstart from raw ideas' },
      { label: 'cycle',    description: 'Batch editorial cycle — draft→critique→revise→edit→done' },
      { label: 'critique', description: 'Batch critique — modes: alpha, beta, peer, sensitivity, cold-read' },
      { label: 'revise',   description: 'Batch revise with revision-verify gate — --depth full for 3-pass' },
      { label: 'edit',     description: 'Three-pass editing: line-edit, copy-edit, proofread' },
    ],
  },
  {
    key: 'review',
    title: 'Review & Ship',
    description: 'Quality gates, momentum audits, and export',
    phases: [
      { label: 'review',       description: 'Broad project QA — continuity scan, structural analyses' },
      { label: 'verify',       description: 'Run quality gates on demand — voice, continuity, style' },
      { label: 'read-through', description: 'Full read-through — immersion audit, trust accounting' },
      { label: 'pacing-audit', description: 'Analyze pacing distribution, find saggy sections' },
      { label: 'hook-review',  description: 'Check each chapter opening and closing hooks' },
      { label: 'timeline',     description: 'Chronological consistency verification' },
      { label: 'publish',      description: 'Export via pandoc — EPUB, DOCX, LaTeX, PDF, web' },
    ],
  },
  {
    key: 'manage',
    title: 'Manage & Track',
    description: 'Tracking, citations, metadata, and series infrastructure',
    phases: [
      { label: 'track',  description: 'Unified tracking — characters, plots, timelines, sources' },
      { label: 'cite',   description: 'Citation management — add, format, validate, bibliography' },
      { label: 'meta',   description: 'Bibliographic metadata management' },
      { label: 'series', description: 'Series infrastructure — init, sync, audit, register, status, import' },
    ],
  },
  {
    key: 'utility',
    title: 'Utilities',
    description: 'Resume, sync the plugin, rebuild the lore index',
    phases: [
      { label: 'resume',        description: 'Resume interrupted session from checkpoint' },
      { label: 'refresh',       description: 'Idempotent plugin sync — refresh skills, tools, commands, index' },
      { label: 'refresh-index', description: 'Rebuild the semantic lore index only' },
    ],
  },
]

const ALL_PHASES: PhaseEntry[] = BUCHBINDER_MENU.flatMap((c) => c.phases)

// Phases backed by a dedicated slash command (if any). Extend when added.
const DIRECT_CMD: Record<string, string> = {}

export default Plugin.define({
  id: 'buchbinder-sidebar',
  setup(context) {
    const ctx: any = context as any
    const location: any = ctx.location ?? ctx.data?.location?.default?.()
    const projectRoot: string =
      (typeof location?.directory === 'string' && location.directory) ||
      (typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : '.')
    const client: any = ctx.client
    const router: any = ctx.ui?.router

    const toast = (message: string, variant: 'info' | 'warning' | 'error' = 'info') => {
      try { ctx.ui?.toast?.show?.({ title: 'Buchbinder', message, variant }) } catch {}
    }

    const isSessionID = (v: unknown): v is string => typeof v === 'string' && /^ses/.test(v)

    const pickSessionID = (v: any): string | undefined => {
      if (isSessionID(v)) return v
      if (!v || typeof v !== 'object') return undefined
      for (const k of ['id', 'sessionID', 'sessionId', 'session_id']) {
        if (isSessionID(v[k])) return v[k]
      }
      // Common client envelopes / nested shapes
      for (const nested of [v.data, v.session, v.info, v.result, v.value, v.body, v.item]) {
        const n = pickSessionID(nested)
        if (n) return n
      }
      return undefined
    }

    const resolveSessionID = (): string | undefined => {
      const dig = (o: any, depth = 0, seen = new Set<any>()): string | undefined => {
        if (!o || typeof o !== 'object' || depth > 5 || seen.has(o)) return undefined
        seen.add(o)
        const direct = pickSessionID(o)
        if (direct) return direct
        for (const k of ['params', 'route', 'session', 'data', 'value', 'info', 'state', 'location', 'current', 'active', 'view']) {
          if (k in o) {
            const r = dig((o as any)[k], depth + 1, seen)
            if (r) return r
          }
        }
        return undefined
      }
      try {
        const current = typeof router?.current === 'function' ? router.current() : router?.current ?? router?.route
        if (current) {
          // v2 Route: { type: 'session', sessionID }
          if ((current as any).type === 'session' && isSessionID((current as any).sessionID)) return (current as any).sessionID
          if ((current as any).name === 'session') {
            const id = pickSessionID((current as any).params) ?? pickSessionID(current)
            if (id) return id
          }
          const fromRoute = dig(current)
          if (fromRoute) return fromRoute
        }
      } catch {}
      try {
        const fromRouterState = dig(router)
        if (fromRouterState) return fromRouterState
      } catch {}
      try {
        const loc = ctx.location ?? location
        const fromLoc = dig(loc) ?? (isSessionID((loc as any)?.sessionID) ? (loc as any).sessionID : undefined)
        if (fromLoc) return fromLoc
      } catch {}
      try {
        const fromCtx = dig(ctx)
        if (fromCtx) return fromCtx
      } catch {}
      return undefined
    }

    const unwrap = (res: any) => {
      if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
        throw (res as any).error
      }
      return res && typeof res === 'object' && 'data' in res && (res as any).data !== undefined ? (res as any).data : res
    }

    const createSessionID = async (): Promise<string | undefined> => {
      const dir = projectRoot || process.cwd()
      const attempts: Array<() => Promise<any>> = []
      if (client?.session?.create) {
        attempts.push(() => client.session.create({ directory: dir, title: 'Buchbinder' }))
        attempts.push(() => client.session.create({ title: 'Buchbinder' }))
        attempts.push(() => client.session.create({}))
      }
      if (client?.session?.new) attempts.push(() => client.session.new({ title: 'Buchbinder', directory: dir }))
      if (client?.tui?.createSession) attempts.push(() => client.tui.createSession({ title: 'Buchbinder', directory: dir }))
      if (client?.tui?.createSession) attempts.push(() => client.tui.createSession({ title: 'Buchbinder' }))
      if (client?.tui?.newSession) attempts.push(() => client.tui.newSession({ title: 'Buchbinder' }))

      let lastErr: unknown
      for (const run of attempts) {
        try {
          const raw = await run()
          const id = pickSessionID(unwrap(raw))
          if (id) return id
        } catch (e) {
          lastErr = e
        }
      }
      if (lastErr) throw lastErr
      return undefined
    }

    const navigateToSession = async (sessionID: string) => {
      // Prefer v2 Route shape: { type: 'session', sessionID }
      try { router?.navigate?.({ type: 'session', sessionID }) } catch {}
      try { router?.navigate?.({ name: 'session', params: { sessionID } }) } catch {}
      try { await client?.tui?.openSession?.({ sessionID }) } catch {}
      try { await client?.tui?.selectSession?.({ sessionID }) } catch {}
      try { await client?.session?.navigate?.({ sessionID }) } catch {}
    }

    const submitPrompt = async (text: string) => {
      let sessionID = resolveSessionID()
      if (!sessionID) {
        try {
          sessionID = await createSessionID()
        } catch (e) {
          toast(`Could not create a session: ${e instanceof Error ? e.message : String(e)}`, 'error')
          return
        }
      }
      if (!sessionID) {
        toast('Could not find or create a session to send the prompt to', 'error')
        return
      }

      let lastErr: unknown
      const promptApis: Array<{ name: string; call: () => Promise<any> }> = []
      if (client?.session?.prompt) {
        promptApis.push({ name: 'session.prompt(text,steer,resume)', call: () => client.session.prompt({ sessionID, text, delivery: 'steer', resume: true }) })
        promptApis.push({ name: 'session.prompt(text)', call: () => client.session.prompt({ sessionID, text }) })
        promptApis.push({ name: 'session.prompt(parts)', call: () => client.session.prompt({ sessionID, parts: [{ type: 'text', text }] }) })
      }
      if (client?.session?.promptAsync) {
        promptApis.push({ name: 'session.promptAsync', call: () => client.session.promptAsync({ sessionID, text, delivery: 'steer', resume: true }) })
      }
      if (client?.tui?.submitPrompt) {
        promptApis.push({ name: 'tui.submitPrompt', call: () => client.tui.submitPrompt({ text }) })
      }

      for (const api of promptApis) {
        try {
          const res = await api.call()
          // Some clients return { error } envelopes instead of throwing.
          if (res && typeof res === 'object' && 'error' in res && (res as any).error) throw (res as any).error
          await navigateToSession(sessionID)
          return
        } catch (e) {
          lastErr = e
        }
      }

      // Last resort: stage in prompt input (may require user submit) instead of silent failure.
      if (client?.tui?.appendPrompt) {
        try {
          await client.tui.appendPrompt({ text: text + ' ' })
          toast('Prompt inserted — press Enter to send if it did not submit automatically', 'warning')
          await navigateToSession(sessionID)
          return
        } catch (e) { lastErr = e ?? lastErr }
      }

      const msg = lastErr instanceof Error ? lastErr.message : (typeof lastErr === 'string' ? lastErr : (lastErr ? JSON.stringify(lastErr) : 'no prompt API available'))
      toast(`Could not submit prompt: ${msg}`, 'error')
    }

    // Self-contained dispatch: no hubMenu and no global/user-scope hub routing.
    const dispatchPhase = async (label: string, args = '') => {
      const phase = ALL_PHASES.find((p) => p.label === label)
      if (!phase) return
      const suffix = typeof args === 'string' ? args.trim() : ''
      toast(`Routing to ${phase.label}`)
      if (DIRECT_CMD[phase.label]) {
        await submitPrompt(`${DIRECT_CMD[phase.label]}${suffix ? ` ${suffix}` : ''}`)
        return
      }
      const prompt =
        `Buchbinder (self-contained project workflow): execute phase \`${phase.label}\`${suffix ? ` with args: ${suffix}` : ''}.\n\n` +
        `IMPORTANT: This is a project-local Buchbinder pipeline. Do NOT call \`hubMenu\` and do NOT route to global/user-scope OpenCode hubs. ` +
        `Use project-installed skills/commands/tools and the bundled buchbinder-router specs under .opencode/ only. ` +
        `Use this project's installed Buchbinder skills, commands, and tools under .opencode/ (including the project-local buchbinder-router/tooling where appropriate) to perform the phase. ` +
        `Do not ask to open a session or require a global hub menu. Report results and suggest the next phase.`
      await submitPrompt(prompt)
    }

    // Ask for optional details (chapter, topic, mode, instructions) then run.
    // Esc/cancel aborts; Enter with empty input runs without extra details.
    const askAndDispatch = async (label: string) => {
      const promptDialog: any = ctx.ui?.dialog?.prompt
      if (promptDialog) {
        try {
          const details = await promptDialog({
            title: `Buchbinder — ${label}`,
            placeholder: 'Details / instructions (Enter to run, Esc to cancel)',
          })
          if (details === undefined || details === null) return
          await dispatchPhase(label, typeof details === 'string' ? details : String(details ?? ''))
          return
        } catch {
          // Fall through to direct dispatch on dialog errors/cancel quirks.
        }
      }
      await dispatchPhase(label)
    }

    // Single sidebar state — no tab switching.
    const noopSet = () => {}
    const sidebarState = useProjectState(projectRoot, () => 'dashboard', noopSet)

    onMount(() => {
      try { sidebarState.refreshProject?.() } catch {}
    })

    const openMenu = async () => {
      const select = ctx.ui?.dialog?.select
      if (!select) {
        toast('Dialog API unavailable — cannot open phase menu', 'warning')
        return
      }
      const options = BUCHBINDER_MENU.flatMap((c) =>
        c.phases.map((p) => ({
          title: p.label,
          value: p.label,
          description: p.description,
          category: c.title,
        })),
      )
      try {
        const choice = await select({
          title: 'Buchbinder — Phases',
          placeholder: 'Choose a phase or sub-command…',
          options,
        })
        const label =
          typeof choice === 'string'
            ? choice
            : choice && typeof choice === 'object' && typeof (choice as any).value === 'string'
              ? (choice as any).value
              : choice && typeof choice === 'object' && typeof (choice as any).label === 'string'
                ? (choice as any).label
                : undefined
        if (label) await askAndDispatch(label)
      } catch {
        // dialog closed/cancelled or unavailable
      }
    }

    // Wire UI callbacks so sidebar clicks open the same popup/menu/details flow.
    setInjector((cmd: string) => { void submitPrompt(cmd) })
    setMenuOpener(() => { void openMenu() })
    setPhaseDispatcher((phase: string, args?: string) => {
      const raw = (args ?? '').trim()
      if (raw) void dispatchPhase(phase, raw)
      else void askAndDispatch(phase)
    })

    // Sole /buchbinder handler (arg-aware): bare -> menu; `<phase> [args]` -> run.
    ctx.keymap?.layer?.(() => ({
      mode: 'global',
      priority: 10,
      commands: [
        {
          id: 'buchbinder.menu',
          title: 'Buchbinder: Phase Menu',
          description: 'Open the Buchbinder phase menu — grouped by stage, every phase visible',
          group: 'Buchbinder',
          palette: true,
          slash: { name: 'buchbinder', aliases: ['kom', 'k'], arguments: true },
          run: (input?: string) => {
            const raw = (typeof input === 'string' ? input : '').trim()
            if (!raw) { void openMenu(); return }
            const [head, ...rest] = raw.split(/\s+/)
            const phase = ALL_PHASES.find((p) => p.label.toLowerCase() === head.toLowerCase())
            if (phase) void dispatchPhase(phase.label, rest.join(' '))
            else void openMenu()
          },
        },
      ],
    }))

    // Register sidebar slots (v2: sidebar.content / sidebar.footer).
    ctx.ui?.slot?.({
      append: 'sidebar.content',
      render: (props: any) => (
        <box flexDirection="column">
          <SidebarTitle session_id={props?.sessionID} title={props?.title ?? 'Buchbinder'} state={sidebarState} />
          <SidebarContent session_id={props?.sessionID} state={sidebarState} />
        </box>
      ),
    })

    ctx.ui?.slot?.({
      append: 'sidebar.footer',
      render: (props: any) => <SidebarFooter session_id={props?.sessionID} state={sidebarState} />,
    })
  },
})
