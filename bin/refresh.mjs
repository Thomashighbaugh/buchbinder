#!/usr/bin/env node
/**
 * buchbinder-refresh — idempotent plugin sync (entrypoint)
 *
 * Tiny launcher: bootstraps the package's own runtime dependencies, then
 * loads the real CLI body in ./lib/refresh.mjs. See ./lib/bootstrap.mjs.
 *
 * Usage:
 *   node bin/refresh.mjs
 *   node bin/refresh.mjs --track non-fiction
 *   node bin/refresh.mjs --prune | --force | --postinstall
 */
import { ensureDeps } from './lib/bootstrap.mjs'

await ensureDeps()
await import('./lib/refresh.mjs')
