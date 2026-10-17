#!/usr/bin/env node
/**
 * refresh.mjs — refresh an installed Buchbinder project, from inside the project.
 *
 * The refresh logic ships in the Buchbinder package (bin/refresh.mjs). The
 * installer downloads that package, uses it, and deletes it, so an installed
 * project does NOT keep the package around. This script closes that gap: it
 * re-fetches the package's main branch into a temp directory, runs
 * bin/refresh.mjs from it in the current project, and removes the download.
 *
 * It is installed to .opencode/lib/scripts/refresh.mjs and is what
 * `/buchbinder refresh` shells out to, so the command works in a book project
 * with no checkout and no published package.
 *
 * Usage (from a project root):
 *   node .opencode/lib/scripts/refresh.mjs [refresh flags...]
 *
 * Requires curl or wget, and unzip — the same three tools the install one-liner
 * requires. Node builtins only; no dependencies.
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const REPO = process.env.BUCHBINDER_REPO || 'Thomashighbaugh/buchbinder'
const BRANCH = process.env.BUCHBINDER_BRANCH || 'main'
const ARCHIVE = `https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip`
const PKG_DIRNAME = `${REPO.split('/')[1]}-${BRANCH}`

function run(cmd, args, opts = {}) {
    return spawnSync(cmd, args, { stdio: 'inherit', ...opts })
}

function have(cmd) {
    return spawnSync('command', ['-v', cmd], { stdio: 'ignore', shell: true }).status === 0
}

function fetch(url, dest) {
    if (have('curl')) {
        if (run('curl', ['-fsSL', url, '-o', dest]).status === 0 && fs.existsSync(dest)) return
    }
    if (have('wget')) {
        if (run('wget', ['-qO', dest, url]).status === 0 && fs.existsSync(dest)) return
    }
    throw new Error(`could not download ${url} (need curl or wget)`)
}

function main() {
    if (!have('unzip')) {
        throw new Error('unzip is required to unpack the Buchbinder package (install it, e.g. `apt install unzip`)')
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'buchbinder-refresh-'))
    try {
        const zip = path.join(tmp, 'bb.zip')
        process.stderr.write(`  Fetching Buchbinder (${REPO}@${BRANCH}) ...\n`)
        fetch(ARCHIVE, zip)

        const unzip = run('unzip', ['-q', zip, '-d', tmp])
        if (unzip.status !== 0) throw new Error('failed to unpack the Buchbinder archive')

        const entry = path.join(tmp, PKG_DIRNAME, 'bin', 'refresh.mjs')
        if (!fs.existsSync(entry)) {
            throw new Error(`refresh entry not found in the archive (${entry})`)
        }

        // Run refresh in the current project, passing through any flags.
        const res = run('node', [entry, ...process.argv.slice(2)], { cwd: process.cwd() })
        process.exitCode = res.status === null ? 2 : res.status
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true })
    }
}

try {
    main()
} catch (err) {
    process.stderr.write(`  refresh failed: ${err.message}\n`)
    process.exit(2)
}
