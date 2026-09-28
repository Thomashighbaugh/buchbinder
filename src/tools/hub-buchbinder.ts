/**
 * Buchbinder — Hub Manifest
 *
 * Defines the /buchbinder hub command's subcommand registry for the TUI menu system.
 */

import { HubDefinition } from "./hub-data.js"
import { subcommands } from "./hubs/buchbinder/index.js"

const hub: HubDefinition = {
  name: "buchbinder",
  description: "Professional book writing workflow — fiction, non-fiction, and mixed projects. Select a phase to begin or continue.",
  subcommands
}

export default hub
