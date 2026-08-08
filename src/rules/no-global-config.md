# Kombinat Writer — No Global Config Pollution

## MANDATORY RULE

The Kombinat Writer system MUST be completely self-contained within each project's `.opencode/` directory. Under NO circumstances may any part of the system be installed to, registered in, or reference:

- `~/.config/opencode/tui.json`
- `~/.config/opencode/opencode.jsonc`
- `~/.config/opencode/plugins/`
- `~/.config/opencode/agents/`
- `~/.config/opencode/skills/`
- `~/.config/opencode/rules/`
- `~/.config/opencode/commands/`
- `~/.config/opencode/node_modules/`
- Any other global or user-level configuration directory

## What This Means in Practice

1. **Never add the kombinat-sidebar plugin to `~/.config/opencode/tui.json`**
2. **Never copy plugin files to `~/.config/opencode/plugins/`**
3. **Never suggest adding anything to global config as a "fix"**
4. **Never install dependencies in `~/.config/opencode/node_modules/`**
5. **Never register commands, skills, agents, or rules globally**

## Correct Installation Target

ALL files go to `<project>/.opencode/`:

| Asset | Destination |
|-------|-------------|
| Plugin (TUI) | `.opencode/plugins/kombinat-sidebar/` |
| Plugin (hooks) | `.opencode/plugins/hooks/` |
| Lib modules | `.opencode/plugins/lib/` |
| Tools | `.opencode/tools/` |
| Skills | `.opencode/skills/` |
| Commands | `.opencode/commands/` |
| Templates | `.opencode/templates/` |
| Config | `.opencode/opencode.jsonc` + `.opencode/tui.json` |
| Dependencies | `.opencode/node_modules/` (via `.opencode/package.json`) |

## Why

This system must work identically when installed via `npx kombinat-writer` on any machine, for any user, without requiring any changes to their global OpenCode configuration. The install script (`bin/install.mjs`) is the sole mechanism for provisioning — it copies everything into the project's `.opencode/` and registers plugins in `.opencode/opencode.jsonc` and `.opencode/tui.json` (both project-local).