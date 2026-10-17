#!/usr/bin/env node
/**
 * buchbinder — per-project installer (entrypoint)
 *
 * Deliberately tiny: it makes sure the package's own runtime dependencies are
 * present (so the installer runs from a bare git clone, an npx cache, or any
 * tree without `node_modules`), then hands off to the real CLI body in
 * ./lib/install-cli.mjs. See ./lib/bootstrap.mjs for why this indirection
 * exists.
 *
 * Usage:
 *   npx buchbinder                    # one-liner — nothing to clone or pre-install
 *   npx github:Thomashighbaugh/buchbinder
 *   node bin/install.mjs              # from a clone
 *   node bin/install.mjs --help
 *   node bin/install.mjs --non-interactive
 *   node bin/install.mjs --reset | --force-reset
 *
 * For idempotent in-place updates of an existing install, prefer:
 *   npx buchbinder-refresh
 */
import { ensureDeps } from './lib/bootstrap.mjs'

await ensureDeps()
await import('./lib/install-cli.mjs')
