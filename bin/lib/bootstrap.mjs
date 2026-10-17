#!/usr/bin/env node
/**
 * bootstrap.mjs — make the buchbinder CLI self-contained.
 *
 * The bin entries (install, refresh, models, index) import a handful of
 * third-party packages (`fs-extra`, `chalk`, `@inquirer/prompts`,
 * `@huggingface/transformers`). ESM resolves — and therefore *fails on* —
 * every static import before any code in the file runs, so in a bare git
 * clone (or any tree where `npm install` has not been run) the installer
 * dies with `ERR_MODULE_NOT_FOUND` before it can install anything.
 *
 * That is nonsense for a tool whose entire job is to install things. So the
 * bin files load their third-party imports only *after* this module has made
 * sure the package's own runtime deps are present. See `bin/install.mjs` and
 * friends: they are three-line launchers that call `ensureDeps()` and then
 * `await import()` the real CLI body.
 *
 * `ensureDeps()` is a no-op — one `require.resolve` per dep — whenever the
 * deps are already installed (global install, npx cache, normal clone). It
 * only shells out to a package manager when something is genuinely missing,
 * and it uses `--ignore-scripts` so this can never re-enter itself through the
 * package's own `postinstall` hook.
 *
 * Escape hatch: set BUCHBINDER_SKIP_BOOTSTRAP=1 to skip the check entirely.
 */
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Absolute path to the installed/cloned buchbinder package root. */
export const PACKAGE_ROOT = path.resolve(__dirname, '..', '..')

/**
 * Runtime deps the bin scripts import directly. Mirrors package.json
 * "dependencies" for the subset this CLI actually touches — keep in sync.
 * `@huggingface/transformers` is pulled in lazily by the models/index commands
 * but they cannot do anything without it, so it is part of the bootstrap set.
 */
const REQUIRED = [
    'fs-extra',
    'chalk',
    '@inquirer/prompts',
    '@huggingface/transformers',
]

function missingDeps() {
    const require = createRequire(path.join(PACKAGE_ROOT, 'package.json'))
    const missing = []
    for (const dep of REQUIRED) {
        try { require.resolve(dep) } catch { missing.push(dep) }
    }
    return missing
}

function commandExists(cmd) {
    try { execSync(`command -v ${cmd}`, { stdio: 'ignore' }); return true } catch { return false }
}

/**
 * Ensure the package's runtime dependencies resolve, installing them
 * (npm, falling back to bun) into the package root if any are missing.
 * Resolves to void; throws only if it cannot fix the situation.
 */
export async function ensureDeps() {
    if (process.env.BUCHBINDER_SKIP_BOOTSTRAP === '1') return

    const missing = missingDeps()
    if (missing.length === 0) return

    const pkgJson = path.join(PACKAGE_ROOT, 'package.json')
    if (!fs.existsSync(pkgJson)) {
        throw new Error(
            `buchbinder: cannot self-bootstrap — no package.json at ${pkgJson}.\n` +
            `  Run the installer from an installed/cloned buchbinder, or install the deps manually.`
        )
    }

    process.stderr.write(
        `\n  buchbinder: ${missing.length} runtime dep(s) not installed ` +
        `(${missing.join(', ')}).\n` +
        `  Bootstrapping package dependencies into ${PACKAGE_ROOT} ...\n`
    )

    const attempts = []
    if (commandExists('npm')) attempts.push('npm install --omit=dev --ignore-scripts --no-audit --no-fund')
    if (commandExists('bun')) attempts.push('bun install --production --ignore-scripts')
    if (commandExists('npm')) attempts.push('npm install --production --ignore-scripts --no-audit --no-fund')

    if (attempts.length === 0) {
        throw new Error(
            `buchbinder: no package manager found (tried npm, bun).\n` +
            `  Install one, or run: (cd ${PACKAGE_ROOT} && npm install)`
        )
    }

    const errors = []
    for (const cmd of attempts) {
        try {
            execSync(cmd, { cwd: PACKAGE_ROOT, stdio: 'inherit' })
        } catch (err) {
            errors.push(`${cmd} → ${String(err.message).split('\n')[0]}`)
            continue
        }
        const stillMissing = missingDeps()
        if (stillMissing.length === 0) {
            process.stderr.write(`  buchbinder: dependencies ready.\n\n`)
            return
        }
        errors.push(`${cmd} → deps still unresolved (${stillMissing.join(', ')})`)
    }

    throw new Error(
        `buchbinder: could not bootstrap dependencies automatically.\n` +
        `  Run this once, then retry:\n\n    (cd ${PACKAGE_ROOT} && npm install)\n\n` +
        errors.map(e => `  - ${e}`).join('\n')
    )
}
