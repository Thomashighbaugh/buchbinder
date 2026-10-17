#!/usr/bin/env node
/**
 * buchbinder — per-project installer (entrypoint)
 *
 * Deliberately tiny: it makes sure the package's own runtime dependencies are
 * present (so the installer runs from a bare git clone, an npx cache, or any
 * tree without `node_modules`), then hands off to the real CLI body in
 * ./lib/install.mjs. See ./lib/bootstrap.mjs for why this indirection
 * exists.
 *
 * Usage:
 *   npx buchbinder                  # just run it — every decision is a prompt
 *   node bin/install.mjs            # from a clone
 *   node bin/install.mjs --help
 *
 * Flags are automation-only (they skip prompts):
 *   --reset / --force-reset, --non-interactive
 */
import { ensureDeps } from './lib/bootstrap.mjs'

await ensureDeps()
await import('./lib/install.mjs')
