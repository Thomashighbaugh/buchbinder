import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "refresh",
  description: "Idempotent plugin sync — refresh skills, tools, commands, templates, and the lore index from the current Buchbinder package. Preserves your locally-modified files (HTML-comment override workflow).",
  reminder: "Utility: Sync the Buchbinder plugin in this project",
  phases: "utility",
  // Shell-delegated: the router runs this command in a shell instead of
  // interpreting detailedDescription as a subagent workflow.
  command: "node .opencode/lib/scripts/refresh.mjs",
  detailedDescription: `# /buchbinder refresh — Plugin Sync

This is a **plugin maintenance** command, not a writing phase. The router
detects the \`command\` field and shells out to it — you do not need to
interpret this \`detailedDescription\` as instructions to follow.

## What It Does

Runs \`node .opencode/lib/scripts/refresh.mjs\` in the project root. The
installer does not keep the Buchbinder package in the project, so that script
re-fetches it (a temp download, removed afterwards — the same mechanism as
installation) and runs refresh from it. Refresh then:

1. Reads the prior install manifest at \`.opencode/.buchbinder-install-manifest.json\`
2. Diffs the package source against what was last installed
3. Copies changed/new plugin-owned files (skills, tools, commands, templates, sidebar + hooks plugins)
4. Rebuilds the lore index (incrementally — only re-embeds chunks whose source files changed)
5. Re-registers the plugins in \`tui.json\` and \`opencode.jsonc\` (additive only)
6. Re-writes the manifest with the new commit SHA, timestamp, and per-file SHA256

The sidebar plugin is installed as TSX source and loaded natively by OpenCode —
there is no build step.

## What It Preserves

- Your locally-modified plugin files (HTML-comment overrides) — detected by per-file SHA256 diff against the manifest
- All project-owned paths: \`book/\`, \`memory/\`, \`output/\`, \`series/\`, \`.opencode/state/\`, \`.opencode/cache/\` (except \`cache/lore-index/\`)

## Arguments

Anything after \`refresh\` is passed straight through to refresh. All optional:

| Argument | Effect |
|----------|--------|
| (none) | Sync changed files, preserve local edits, rebuild the index |
| \`--prune\` | Also remove files that vanished from the source |
| \`--force\` | Overwrite locally-modified files (destructive) |
| \`--skip-index\` | Skip the lore index rebuild |
| \`--track <fiction\\|non-fiction\\|mixed>\` | Track for skills/templates (defaults to the project's \`book/track.json\`) |

## Exit Codes

- \`0\` — success, no drift detected
- \`1\` — success, but locally-modified files were preserved (drift detected; see the \`locallyModified[]\` list in the output)
- \`2\` — refresh failed
`,
}

export default spec
