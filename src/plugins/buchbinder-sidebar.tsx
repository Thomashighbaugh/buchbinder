/** @jsxImportSource @opentui/solid */
/**
 * Buchbinder Sidebar — TUI Plugin Entry Point
 *
 * Registers:
 *   - `/buchbinder` slash command → instant DialogSelect menu
 *   - 3 sidebar slots (title, content, footer)
 *
 * Uses api.command.register() (same API as the working hubs-tui plugin).
 */

import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'
import { onMount } from 'solid-js'
import { SidebarTitle } from './components/sidebar-title.js'
import { SidebarContent } from './components/sidebar-content.js'
import { SidebarFooter } from './components/sidebar-footer.js'
import { useProjectState, setInjector } from './hooks/use-project-state.js'

/** A single /buchbinder phase (label must match the hub subcommand). */
type PhaseEntry = { label: string; description: string }

/**
 * A grouped menu category. The TUI's DialogSelect renders at most
 * `floor(terminalHeight / 2) - 6` rows with a hidden scrollbar and no
 * overflow indicator, so a flat 29-phase menu silently cuts off around
 * item 19 on a typical terminal. Keeping every level well under that
 * cap means no phase is ever hidden off-screen.
 *
 * Must stay in sync with tools/hubs/buchbinder/index.ts.
 */
type MenuCategory = { key: string; title: string; description: string; phases: PhaseEntry[] }

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

/** Flat view of every phase, for the "All phases" filter entry. */
const ALL_PHASES: PhaseEntry[] = BUCHBINDER_MENU.flatMap((c) => c.phases)

const tui: TuiPlugin = async (api: TuiPluginApi, _o, _meta: TuiPluginMeta) => {
  const projectRoot = api.state.path.directory

  // Wire command injector so sidebar can inject /buchbinder commands into the prompt.
  setInjector((cmd: string) => {
    api.client.tui.appendPrompt({ text: cmd + ' ' }).catch(() => {})
  })

  // Single sidebar state — no tab switching.
  const noopSet = () => {}
  const sidebarState = useProjectState(projectRoot, () => 'dashboard', noopSet)

  onMount(() => {
    api.ui.toast({
      title: 'Buchbinder',
      message: 'Scroll sidebar for all sections · /buchbinder for the menu',
      duration: 6000,
      variant: 'info',
    })
  })

  // Register sidebar slots
  api.slots.register({
    slots: {
      'sidebar_title': (_ctx, props: { session_id: string; title: string }) =>
        <SidebarTitle {...props} state={sidebarState} />,

      'sidebar_content': (_ctx, props: { session_id: string }) =>
        <SidebarContent {...props} state={sidebarState} />,

      'sidebar_footer': (_ctx, props: { session_id: string }) =>
        <SidebarFooter {...props} state={sidebarState} />,
    },
  })

  // Register the /buchbinder slash command — uses the same api.command.register()
  // API that the working hubs-tui plugin uses. The deprecated keymap API
  // silently fails in current OpenCode.
  if (api.command) {
    api.command.register(() => {
      const DS = api.ui.DialogSelect

      // Level 3 — dispatch a chosen phase into the prompt. The user presses
      // Enter to run it through the buchbinder.md router, which calls hubMenu.
      const choosePhase = (phase: PhaseEntry) => {
        api.ui.dialog.clear()
        const cmd = `/buchbinder ${phase.label}`
        api.ui.toast({ title: 'Buchbinder', message: `Routing to ${phase.label}` })
        api.client.tui.appendPrompt({ text: cmd }).catch(() => {})
      }

      // Level 2 — the phases within a category (or every phase, for the
      // "All phases" entry). Always small enough to render in full.
      const openPhases = (title: string, phases: PhaseEntry[]) => {
        api.ui.dialog.clear()
        api.ui.dialog.setSize('large')
        api.ui.dialog.replace(() =>
          DS({
            title,
            placeholder: 'Type to filter…',
            options: phases.map((p) => ({ title: p.label, value: p.label, description: p.description })),
            onSelect: (sel: TuiDialogSelectOption<string>) => {
              const phase = phases.find((p) => p.label === sel.value)
              if (phase) choosePhase(phase)
            },
          }),
        )
      }

      // Level 1 — categories. Five entries plus "All phases", so it fits on
      // any terminal.
      const openMenu = () => {
        api.ui.dialog.setSize('large')
        api.ui.dialog.replace(() =>
          DS({
            title: 'Buchbinder — Select Category',
            placeholder: 'Choose a category…',
            options: [
              {
                title: 'All phases',
                value: '__all__',
                description: `Type to filter all ${ALL_PHASES.length} phases`,
              },
              ...BUCHBINDER_MENU.map((c) => ({
                title: c.title,
                value: c.key,
                description: `${c.description} · ${c.phases.length} phases`,
              })),
            ],
            onSelect: (sel: TuiDialogSelectOption<string>) => {
              if (sel.value === '__all__') {
                openPhases('Buchbinder — All Phases', ALL_PHASES)
                return
              }
              const cat = BUCHBINDER_MENU.find((c) => c.key === sel.value)
              if (cat) openPhases(`Buchbinder — ${cat.title}`, cat.phases)
            },
          }),
        )
      }

      return [{
        title: 'Buchbinder: Phase Menu',
        value: 'buchbinder',
        description: 'Open the Buchbinder phase menu — grouped by stage, every phase visible',
        category: 'Buchbinder',
        slash: { name: 'buchbinder', aliases: ['kom', 'k'] },
        onSelect: openMenu,
      }]
    })
  }
}

const plugin = { id: 'buchbinder-sidebar', tui }
export default plugin