#!/usr/bin/env node
/**
 * refresh.mjs — refresh an installed Buchbinder project, from inside the project.
 *
 * The refresh logic ships in the Buchbinder package (bin/refresh.mjs). The
 * installer downloads that package, uses it, and deletes it, so an installed
 * project does NOT keep the package around. This script closes that gap: it
 * re-fetches the package into a temp directory, runs bin/refresh.mjs from it in
 * the current project, and removes the download.
 *
 * It is installed to .opencode/lib/scripts/refresh.mjs and is what
 * `/buchbinder refresh` shells out to, so the command works in a book project
 * with no checkout and no published package.
 *
 * Usage (from a project root):
 *   node .opencode/lib/scripts/refresh.mjs [refresh flags...]
 *
 * Requires curl or wget, and unzip — the same tools the install one-liner
 * requires. Node builtins only; no dependencies.
 *
 * Overridable via env: BUCHBINDER_REPO, BUCHBINDER_BRANCH, or
 * BUCHBINDER_ARCHIVE_URL (a full URL to a .zip of the package tree).
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const REPO = process.env.BUCHBINDER_REPO || 'Thomashighbaugh/buchbinder'
const BRANCH = process.env.BUCHBINDER_BRANCH || 'main'
const ARCHIVE =
    process.env.BUCHBINDER_ARCHIVE_URL ||
    `https://github.com/${REPO}/archive/refs/heads/${BRANCH}.zip`

function run(cmd, args, opts = {}) {
    return spawnSync(cmd, args, { stdio: 'inherit', ...opts })
}

// `--version` exits 0 for curl, wget, and unzip — avoids any shell.
function have(cmd) {
    return spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0
}

function fetchTo(url, dest) {
    if (have('curl') && run('curl', ['-fsSL', url, '-o', dest]).status === 0 && fs.existsSync(dest)) return
    if (have('wget') && run('wget', ['-qO', dest, url]).status === 0 && fs.existsSync(dest)) return
    throw new Error(`could not download ${url} (need curl or wget)`)
}

// The archive's top-level directory is named after the repo/branch by GitHub,
// but not for an arbitrary BUCHBINDER_ARCHIVE_URL — so find it by content.
function findPackageRoot(dir) {
    const dirs = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name !== '__MACOSX')
    const candidates = dirs.filter((e) => fs.existsSync(path.join(dir, e.name, 'bin', 'refresh.mjs')))
    if (candidates.length === 1) return path.join(dir, candidates[0].name)
    if (dirs.length === 1) return path.join(dir, dirs[0].name)
    throw new Error(
        `could not locate the package in the archive (found: ${dirs.map((e) => e.name).join(', ') || 'nothing'})`
    )
}

function main() {
    if (!have('unzip')) {
        throw new Error('unzip is required to unpack the Buchbinder package')
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'buchbinder-refresh-'))
    try {
        const zip = path.join(tmp, 'buchbinder.zip')
        process.stderr.write(`  Fetching Buchbinder (${REPO}@${BRANCH}) ...\n`)
        fetchTo(ARCHIVE, zip)

        const unzip = run('unzip', ['-q', zip, '-d', tmp])
        if (unzip.status !== 0) throw new Error('failed to unpack the Buchbinder archive')

        // Run refresh in the current project, passing through any arguments.
        const entry = path.join(findPackageRoot(tmp), 'bin', 'refresh.mjs')
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
