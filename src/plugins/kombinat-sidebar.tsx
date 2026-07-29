/** @jsxImportSource @opentui/solid */
/**
 * Kombinat Writer Sidebar — TUI Plugin Entry Point
 *
 * Registers:
 *   - `/kombinat` slash command → instant DialogSelect menu
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

/** All subcommands for the instant menu */
const KOMBINAT_SUBCOMMANDS = [
  { label: 'guided',          description: 'Assess project state and run the full workflow pipeline' },
  { label: 'ideation',        description: 'Iteratively refine premise, theme, setting, characters, conflict before constitution' },
  { label: 'manifest',        description: 'Establish creative or intellectual principles' },
  { label: 'specify',         description: 'Build story specification with premise stress-test' },
  { label: 'clarify',         description: 'Resolve specification ambiguities' },
  { label: 'research',        description: 'Active research — sources, annotation, literature review' },
  { label: 'outline',         description: 'Chapter structure, pacing, arc design' },
  { label: 'task-manager',    description: 'Break outline into tracked tasks' },
  { label: 'draft',           description: 'Batch draft (default) — all planned chapters or up to 6' },
  { label: 'critique',        description: 'Batch critique — modes: alpha, beta, peer, sensitivity, cold-read' },
  { label: 'revise',          description: 'Batch revise with revision-verify gate — --depth full for 3-pass' },
  { label: 'edit',            description: 'Three-pass editing: line-edit, copy-edit, proofread' },
  { label: 'review',          description: 'Broad project QA — continuity scan, structural analyses' },
  { label: 'cite',            description: 'Citation management — add, format, validate, bibliography' },
  { label: 'publish',         description: 'Export via pandoc — EPUB, DOCX, LaTeX, PDF, web' },
  { label: 'track',           description: 'Unified tracking — characters, plots, timelines, sources' },
  { label: 'timeline',        description: 'Chronological consistency verification' },
  { label: 'meta',            description: 'Bibliographic metadata management' },
  { label: 'drafter',         description: 'Loose draft jumpstart from raw ideas' },
  { label: 'verify',          description: 'Run quality gates on demand — voice, continuity, style' },
  { label: 'resume',          description: 'Resume interrupted session from checkpoint' },
  { label: 'cycle',           description: 'Batch editorial cycle — draft→critique→revise→edit→done' },
  { label: 'pacing-audit',   description: 'Analyze pacing distribution, find saggy sections' },
  { label: 'hook-review',    description: 'Check each chapter opening and closing hooks' },
  { label: 'read-through',   description: 'Full read-through — immersion audit, trust accounting' },
  { label: 'series',          description: 'Series infrastructure — init, sync, audit, register, status' },
] as const

const tui: TuiPlugin = async (api: TuiPluginApi, _o, _meta: TuiPluginMeta) => {
  const projectRoot = api.state.path.directory

  // Wire command injector so sidebar can inject /kombinat commands into the prompt.
  setInjector((cmd: string) => {
    api.client.tui.appendPrompt({ text: cmd + ' ' }).catch(() => {})
  })

  // Single sidebar state — no tab switching.
  const noopSet = () => {}
  const sidebarState = useProjectState(projectRoot, () => 'dashboard', noopSet)

  onMount(() => {
    api.ui.toast({
      title: 'Kombinat Writer',
      message: 'Scroll sidebar for all sections · /kombinat for the menu',
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

  // Register the /kombinat slash command — uses the same api.command.register()
  // API that the working hubs-tui plugin uses. The deprecated keymap API
  // silently fails in current OpenCode.
  if (api.command) {
    api.command.register(() => {
      const options: TuiDialogSelectOption<string>[] = KOMBINAT_SUBCOMMANDS.map(s => ({
        title: s.label,
        value: s.label,
        description: s.description,
      }))

      return [{
        title: 'Kombinat: Phase Menu',
        value: 'kombinat',
        description: 'Open the instant Kombinat phase selection menu',
        category: 'Kombinat Writer',
        slash: { name: 'kombinat', aliases: ['kom', 'k'] },
        onSelect: () => {
          const DS = api.ui.DialogSelect
          api.ui.dialog.setSize('large')
          api.ui.dialog.replace(() =>
            DS({
              title: 'Kombinat Writer — Select Phase',
              placeholder: 'Choose a phase...',
              options,
              onSelect: (sel: TuiDialogSelectOption<string>) => {
                api.ui.dialog.clear()
                const cmd = `/kombinat ${sel.value}`
                api.ui.toast({ title: 'Kombinat', message: `Routing to ${sel.value}` })
                // Append the command text but do NOT auto-submit.
                // The user presses Enter to run it through the kombinat.md
                // command router, which calls hubMenu to execute the phase.
                api.client.tui.appendPrompt({ text: cmd }).catch(() => {})
              },
            })
          )
        },
      }]
    })
  }
}

const plugin = { id: 'kombinat-sidebar', tui }
export default plugin