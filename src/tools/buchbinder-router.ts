/**
 * Buchbinder — Phase Router Tool
 *
 * Project-local router for the Buchbinder workflow: menu/route/list actions
 * for the /buchbinder command system. The TUI plugin handles interactive
 * menu selection; this tool handles spec resolution and retrieval for the
 * agent.
 *
 * Self-contained: resolves specs, rules, and skill metadata from inside this
 * project's installed .opencode/ tree only. It never reads the user-scope
 * OpenCode config, and it is the ONLY router an agent should use for
 * Buchbinder phases — never the user-scope `hubMenu` tool.
 */

import tool from "./opencode-tool.js"
import {
  loadHub,
  loadSubcommandSpecFull,
  loadAllSubcommandLabels,
} from "./hub-data.js"

const VALID_ACTIONS = ['menu', 'route', 'list'] as const

export default tool({
  description: "Buchbinder phase router — the project-local router for the Buchbinder workflow. Use 'route' to resolve a phase subcommand ('workflow-start', 'specify', 'outline', 'draft', 'critique', etc.) to its full spec, 'menu' for the phase menu, 'list' to list all phase labels. Do NOT use the user-scope hubMenu tool or any global hub routing for Buchbinder phases; this project-local buchbinder-router is the correct choice.",
  args: {
    action: tool.schema.string().describe(
      `Action: 'menu' returns menu JSON, 'route' returns full subcommand spec, 'list' lists all labels. Valid: ${VALID_ACTIONS.join(', ')}`
    ),
    subcommand: tool.schema.string().optional().describe("Subcommand label to route to (for 'route' action)"),
  },
  async execute(args: any, _context: any) {
    if (!VALID_ACTIONS.includes(args.action as typeof VALID_ACTIONS[number])) {
      return JSON.stringify({ error: `Invalid action '${args.action}'. Valid: ${VALID_ACTIONS.join(', ')}` })
    }

    const hubName = "buchbinder"

    switch (args.action) {
      case 'list': {
        const labels = loadAllSubcommandLabels(hubName)
        return JSON.stringify({ hub: hubName, subcommands: labels })
      }

      case 'menu': {
        const hub = loadHub(hubName)
        if (!hub) return JSON.stringify({ error: `Hub '${hubName}' not found` })
        return JSON.stringify({
          hub: hub.name,
          description: hub.description,
          options: hub.subcommands.map(s => ({
            label: s.label,
            description: s.description,
            command: s.command || null,
            inline: s.inline || false
          }))
        })
      }

      case 'route': {
        if (!args.subcommand) {
          return JSON.stringify({ error: "subcommand argument required for route action" })
        }
        const { spec, rulesContent, relatedSkillMeta } = loadSubcommandSpecFull(hubName, args.subcommand)
        if (!spec) {
          return JSON.stringify({
            error: `Unknown subcommand '${args.subcommand}' for ${hubName}`,
            available: loadAllSubcommandLabels(hubName)
          })
        }
        return JSON.stringify({
          hub: hubName,
          subcommand: spec.label,
          subDescription: spec.description,
          reminder: spec.reminder,
          command: spec.command || null,
          detailedDescription: spec.detailedDescription,
          tools: spec.tools || null,
          rules: spec.rules || null,
          rulesContent: rulesContent.length > 0 ? rulesContent : null,
          relatedSkills: spec.relatedSkills || null,
          relatedSkillMeta: relatedSkillMeta.length > 0 ? relatedSkillMeta : null,
          examples: spec.examples || null,
          warnings: spec.warnings || null
        })
      }

      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}` })
    }
  }
})