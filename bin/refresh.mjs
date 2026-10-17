#!/usr/bin/env node
/**
 * buchbinder-refresh — idempotent plugin sync (entrypoint)
 *
 * Tiny launcher: bootstraps the package's own runtime dependencies, then
 * loads the real CLI body in ./lib/refresh-cli.mjs. See ./lib/bootstrap.mjs.
 *
 * Usage:
 *   npx buchbinder-refresh
 *   npx buchbinder-refresh --track non-fiction
 *   npx buchbinder-refresh --prune | --force | --postinstall
 *   node bin/refresh.mjs
 */
import { ensureDeps } from './lib/bootstrap.mjs'

await ensureDeps()
await import('./lib/refresh.mjs')
