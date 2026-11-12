/** @jsxImportSource @opentui/solid */
import { Show } from 'solid-js'
import type { SidebarState } from '../hooks/use-project-state.js'
import { statusIcon, BOLD } from '../utils/format.js'
import { c } from '../utils/colors.js'

/** Renders the sidebar footer with tab navigation hints and gate status counts. */
export function SidebarFooter(props: { session_id: string; state: SidebarState }) {
  const summary = props.state.gateSummary

  return (
    <box flexDirection="column">
      <box flexDirection="row" justifyContent="space-between">
        <text style={{ fg: c.textMuted }}>
          {`${String(summary().total)} gates`}
        </text>
        <Show when={summary().total > 0}>
          <box flexDirection="row">
            <text style={{ fg: c.pass }}>{`${statusIcon('pass')} ${String(summary().passed)}`}</text>
            <text>{'  '}</text>
            <text style={{ fg: c.block }}>{`${statusIcon('block')} ${String(summary().blocked)}`}</text>
            <text>{'  '}</text>
            <text style={{ fg: c.warn }}>{`${statusIcon('warn')} ${String(summary().warnings)}`}</text>
          </box>
        </Show>
      </box>
      <box flexDirection="row" on:select={() => props.state.openMenu?.() ?? props.state.injectCommand('/buchbinder')}>
        <text style={{ fg: c.cyan, attributes: BOLD }}>{'☰ '}</text>
        <text style={{ fg: c.blue }}>{'/buchbinder menu'}</text>
        <text style={{ fg: c.textMuted }}>{' · open phase popup'}</text>
      </box>
      <text style={{ fg: c.textMuted }}>
        {'Scroll for all sections · click menu/shortcuts for popup entry'}
      </text>
    </box>
  )
}
