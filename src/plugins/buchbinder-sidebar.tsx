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
import { SidebarTitle } from './components/sidebar-title.js'
import { SidebarContent } from './components/sidebar-content.js'
import { SidebarFooter } from './components/sidebar-footer.js'
import { useProjectState, setInjector } from './hooks/use-project-state.js'

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
    const location: any = (context as any).location ?? (context as any).data?.location?.default?.()
    const projectRoot: string = location?.directory || process.cwd()
    const client: any = (context as any).client
    const router: any = (context as any).ui?.router

    const toast = (message: string, variant: 'info' | 'warning' | 'error' = 'info') => {
      try { ;(context as any).ui?.toast?.show?.({ title: 'Buchbinder', message, variant }) } catch {}
    }

    const isSessionID = (v: unknown): v is string => typeof v === 'string' && /^ses/.test(v)

    const resolveSessionID = (): string | undefined => {
      const dig = (o: any, depth = 0): string | undefined => {
        if (!o || typeof o !== 'object' || depth > 4) return undefined
        for (const k of ['sessionID', 'sessionId', 'session_id', 'id']) {
          if (isSessionID(o[k])) return o[k]
        }
        for (const k of ['params', 'route', 'session', 'data', 'value', 'info', 'state', 'location']) {
          const r = dig(o[k], depth + 1)
          if (r) return r
        }
        return undefined
      }
      try {
        const current = router?.current?.() ?? router?.route
        if (current) {
          if ((current.type === 'session' || current.name === 'session') && isSessionID(current.sessionID)) return current.sessionID
          const fromParams = dig(current.params)
          if (fromParams) return fromParams
          const fromRoute = dig(current)
          if (fromRoute) return fromRoute
        }
      } catch {}
      try {
        const loc = (context as any).location ?? location
        const fromLoc = dig(loc) ?? (isSessionID(loc?.sessionID) ? loc.sessionID : undefined)
        if (fromLoc) return fromLoc
      } catch {}
      return undefined
    }

    const pickSessionID = (v: any): string | undefined => {
      if (isSessionID(v)) return v
      if (!v || typeof v !== 'object') return undefined
      for (const k of ['id', 'sessionID', 'sessionId', 'session_id']) {
        if (isSessionID(v[k])) return v[k]
      }
      for (const nested of [v.data, v.session, v.info, v.result, v.value, v.body]) {
        const n = pickSessionID(nested)
        if (n) return n
      }
      return undefined
    }

    const createSessionID = async (): Promise<string | undefined> => {
      const dir = projectRoot || process.cwd()
      const attempts: Array<() => Promise<any>> = []
      if (client?.session?.create) {
        attempts.push(() => client.session.create({ directory: dir, title: 'Buchbinder' }))
        attempts.push(() => client.session.create({ directory: dir }))
        attempts.push(() => client.session.create({}))
      }
      if (client?.session?.new) attempts.push(() => client.session.new({ title: 'Buchbinder', directory: dir }))
      if (client?.tui?.createSession) attempts.push(() => client.tui.createSession({ title: 'Buchbinder' }))

      let lastErr: unknown
      for (const run of attempts) {
        try {
          const res = await run()
          // Some clients return { data, error } envelopes.
          if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
            lastErr = (res as any).error
            continue
          }
          const id = pickSessionID(res)
          if (id) return id
        } catch (e) {
          lastErr = e
        }
      }
      if (lastErr) throw lastErr
      return undefined
    }

    const navigateToSession = (sessionID: string) => {
      try { router?.navigate?.({ name: 'session', params: { sessionID } }) } catch {}
      try { router?.navigate?.({ type: 'session', sessionID } as any) } catch {}
      try { router?.navigate?.({ name: 'session.view', params: { sessionID } }) } catch {}
      try { void client?.tui?.openSession?.({ sessionID }) } catch {}
      try { void client?.session?.navigate?.({ sessionID }) } catch {}
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
      const tryPrompt = async (payload: any) => {
        const res = await client.session.prompt(payload)
        if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
          throw (res as any).error
        }
        return res
      }

      if (client?.session?.prompt) {
        // v2-preferred prompt shape (OpenCode client): { sessionID, text, delivery?, resume? }
        try {
          await tryPrompt({ sessionID, text, delivery: 'steer', resume: true })
          navigateToSession(sessionID)
          return
        } catch (e) { lastErr = e }

        // Fallback: without delivery/resume flags
        try {
          await tryPrompt({ sessionID, text })
          navigateToSession(sessionID)
          return
        } catch (e) { lastErr = e ?? lastErr }

        // Legacy/alternate fallback
        try {
          await tryPrompt({ sessionID, parts: [{ type: 'text', text }] })
          navigateToSession(sessionID)
          return
        } catch (e) { lastErr = e ?? lastErr }
      }

      // Last resort: stage in prompt input (may require user submit) instead of silent failure.
      if (client?.tui?.appendPrompt) {
        try {
          await client.tui.appendPrompt({ text: text + ' ' })
          toast('Prompt inserted — press Enter to send if it did not submit automatically', 'warning')
          navigateToSession(sessionID)
          return
        } catch (e) { lastErr = e ?? lastErr }
      }

      toast(`Could not submit prompt: ${lastErr instanceof Error ? lastErr.message : String(lastErr ?? 'no prompt API available')}`, 'error')
    }

    // Self-contained dispatch: never routes via global hubMenu/user-scope hubs.
    const dispatchPhase = async (label: string, args = '') => {
      const phase = ALL_PHASES.find((p) => p.label === label)
      if (!phase) return
      const suffix = args.trim()
      toast(`Routing to ${phase.label}`)
      if (DIRECT_CMD[phase.label]) {
        await submitPrompt(`${DIRECT_CMD[phase.label]}${suffix ? ` ${suffix}` : ''}`)
        return
      }
      const prompt =
        `Buchbinder (self-contained project workflow): execute phase \`${phase.label}\`${suffix ? ` with args: ${suffix}` : ''}.\n\n` +
        `IMPORTANT: This is a project-local Buchbinder pipeline. Do NOT call \`hubMenu\` and do NOT route to global/user-scope OpenCode hubs. ` +
        `Use this project's installed Buchbinder skills, commands, and tools under .opencode/ to perform the phase. Report results and suggest the next phase.`
      await submitPrompt(prompt)
    }

    // Ask for optional details (chapter, topic, mode, instructions) then run.
    const askAndDispatch = async (label: string) => {
      const promptDialog: any = (context as any).ui?.dialog?.prompt
      if (promptDialog) {
        try {
          const details = await promptDialog({
            title: `Buchbinder — ${label}`,
            placeholder: 'Details / instructions (Enter to run, Esc for none)',
          })
          if (details === null || details === undefined) return // cancelled
          await dispatchPhase(label, typeof details === 'string' ? details : '')
          return
        } catch {
          // Fall through to direct dispatch on dialog errors/cancel quirks.
        }
      }
      await dispatchPhase(label)
    }

    // Wire command injector so sidebar buttons can dispatch.
    setInjector((cmd: string) => { void submitPrompt(cmd) })

    // Single sidebar state — no tab switching.
    const noopSet = () => {}
    const sidebarState = useProjectState(projectRoot, () => 'dashboard', noopSet)

    onMount(() => {
      toast('Scroll sidebar for sections · /buchbinder for the menu', 'info')
    })

    const openMenu = async () => {
      const select = (context as any).ui?.dialog?.select
      if (!select) return
      const options = BUCHBINDER_MENU.flatMap((c) =>
        c.phases.map((p) => ({
          title: p.label,
          value: p.label,
          description: p.description,
          category: c.title,
        })),
      )
      try {
        const value = await select({
          title: 'Buchbinder — Phases',
          placeholder: 'Choose a phase or sub-command…',
          options,
        })
        if (typeof value === 'string') await askAndDispatch(value)
      } catch {
        // dialog closed/cancelled or unavailable
      }
    }

    // Sole /buchbinder handler (arg-aware): bare -> menu; `<phase> [args]` -> run.
    ;(context as any).keymap?.layer?.(() => ({
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
            const phase = ALL_PHASES.find((p) => p.label === head)
            if (phase) void dispatchPhase(phase.label, rest.join(' '))
            else void openMenu()
          },
        },
      ],
    }))

    // Register sidebar slots (v2: sidebar.content / sidebar.footer).
    ;(context as any).ui?.slot?.({
      append: 'sidebar.content',
      render: (props: any) => (
        <box flexDirection="column">
          <SidebarTitle session_id={props?.sessionID} title={props?.title ?? 'Buchbinder'} state={sidebarState} />
          <SidebarContent session_id={props?.sessionID} state={sidebarState} />
        </box>
      ),
    })

    ;(context as any).ui?.slot?.({
      append: 'sidebar.footer',
      render: (props: any) => <SidebarFooter session_id={props?.sessionID} state={sidebarState} />,
    })
  },
})
