#!/usr/bin/env node
/**
 * Buchbinder — Per-Project Installer (OpenCode only)
 *
 * Installs the buchbinder workflow into a book project's .opencode/ directory.
 * Copies skills, tools, lib, templates, slash commands, and the built TUI sidebar plugin.
 * Writes opencode.jsonc to register the plugin so the /buchbinder instant menu loads.
 *
 * Usage:
 *   npx buchbinder                  # interactive (default)
 *   npx buchbinder --non-interactive # for postinstall / CI; uses defaults
 *   npx buchbinder --reset          # if a prior install exists, ask to start over
 *   npx buchbinder --force-reset    # same as --reset but skip the modified-locally check
 *
 * For idempotent in-place updates of an existing install, prefer:
 *   npx buchbinder-refresh
 */
import { confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import {
    copySkills as syncCopySkills,
    copyToolsAndLib as syncCopyToolsAndLib,
    copySlashCommands as syncCopySlashCommands,
    copyTemplates as syncCopyTemplates,
    copySidebarPlugin as syncCopySidebarPlugin,
    copyHooksPlugin as syncCopyHooksPlugin,
    ensureProjectConfig as syncEnsureProjectConfig,
    initProjectStructure as syncInitProjectStructure,
    PACKAGE_ROOT as PKG_ROOT,
    REQUIRED_DEPS,
} from './sync.mjs';
import {
    loadManifest,
    writeManifest,
    buildManifest,
} from './manifest.mjs';
import { isPluginOwned } from './plugin-tree.mjs';

// ─── Paths ──────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.join(PACKAGE_ROOT, 'src');
const DEST_DIR = path.join(process.cwd(), '.opencode');

// ─── Logging ────────────────────────────────────────────────────────────────
function log(msg) { console.log(chalk.white(msg)); }
function success(msg) { console.log(chalk.green(`  \u2713 ${msg}`)); }
function warn(msg) { console.log(chalk.yellow(`  \u26A0 ${msg}`)); }
function error(msg) { console.log(chalk.red(`  \u2717 ${msg}`)); }
function header(msg) {
    console.log(chalk.cyan.bold(`\n${msg}`));
    console.log(chalk.cyan('\u2500'.repeat(Math.min(msg.length, 60))));
}

// ─── Per-project acknowledgement blurb ─────────────────────────────────────
/**
 * Print the per-project install acknowledgement. The user is asked to confirm
 * they understand the plugin will be installed into THIS directory only and
 * will not modify global state.
 */
async function printPerProjectAck() {
    console.log(chalk.white('\nBuchbinder — per-project install'));
    console.log(chalk.white('─'.repeat(60)));
    console.log(chalk.white('This installer will copy the buchbinder plugin into THIS'));
    console.log(chalk.white("directory's .opencode/ folder. It will:"));
    console.log('');
    console.log(chalk.white('  • Copy skills, tools, templates, slash commands, and the TUI plugin'));
    console.log(chalk.white('  • Create .opencode/opencode.jsonc, tui.json, and package.json'));
    console.log(chalk.white('    (registering buchbinder-sidebar as a project-local plugin)'));
    console.log(chalk.white('  • Install the npm deps buchbinder needs to run'));
    console.log(chalk.white('  • Create ./book, ./memory, ./output/manuscript if they don\'t exist'));
    console.log('');
    console.log(chalk.white('It will NOT:'));
    console.log('');
    console.log(chalk.white('  • Touch any files outside this directory'));
    console.log(chalk.white('  • Modify your global opencode.json, ~/.config/opencode, or'));
    console.log(chalk.white('    your global node_modules'));
    console.log(chalk.white('  • Touch existing book/, memory/, or output/ contents'));
    console.log('');
    console.log(chalk.white('Lore retrieval uses LOCAL, in-process ONNX models'));
    console.log(chalk.white('(embedder + reranker + classifier) — no network calls at query'));
    console.log(chalk.white('time, no telemetry. The models are fetched once, during install,'));
    console.log(chalk.white('into a shared cache (~/.cache/buchbinder/models).'));
    console.log('');
    console.log(chalk.white('Ollama is optional — set EMBED_BACKEND=ollama to use local Ollama'));
    console.log(chalk.white('embeddings instead (ollama pull pedrohml/mxbai-embed-large:latest).'));
    console.log('');
    console.log(chalk.white('After install, use buchbinder-refresh to sync updates without'));
    console.log(chalk.white('overwriting your project work.'));
    console.log('');
    const ok = await confirm({ message: 'Acknowledge and continue?', default: true });
    if (!ok) {
        console.log(chalk.yellow('Aborted.'));
        process.exit(0);
    }
}

// ─── Rules ──────────────────────────────────────────────────────────────────
function copyRules() {
    const srcDir = path.join(SRC_DIR, 'rules');
    const destDir = path.join(DEST_DIR, 'rules');
    if (!fs.existsSync(srcDir)) return;
    fs.ensureDirSync(destDir);
    let copied = 0;
    for (const file of fs.readdirSync(srcDir).filter(f => f.endsWith('.md'))) {
        fs.copySync(path.join(srcDir, file), path.join(destDir, file), { overwrite: true });
        copied++;
    }
    success(`${copied} rules synchronized`);
}

// ─── Project Init ───────────────────────────────────────────────────────────
async function instantiateTemplates(targetDir, track) {
    const destTemplates = path.join(DEST_DIR, 'templates');
    
    // Fallback to SRC_DIR if DEST_DIR/templates isn't populated yet
    const sourceBase = fs.existsSync(destTemplates) ? destTemplates : path.join(SRC_DIR, 'templates');
    
    const dirsToCopy = [
        path.join(sourceBase, 'base'),
        path.join(sourceBase, track)
    ];

    for (const src of dirsToCopy) {
        if (!fs.existsSync(src)) continue;
        
        function copyRecursive(currentSrc, currentTarget) {
            fs.ensureDirSync(currentTarget);
            const entries = fs.readdirSync(currentSrc, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = path.join(currentSrc, entry.name);
                const destPath = path.join(currentTarget, entry.name);
                if (entry.isDirectory()) {
                    copyRecursive(srcPath, destPath);
                } else {
                    if (!fs.existsSync(destPath)) {
                        fs.ensureDirSync(path.dirname(destPath));
                        fs.copySync(srcPath, destPath);
                    }
                }
            }
        }
        copyRecursive(src, targetDir);
    }
}

async function initProjectStructure(track, nonInteractive = false, targetDir = path.join(process.cwd(), 'book')) {
    const projectRoot = process.cwd();
    if (fs.existsSync(targetDir)) {
        // book/ already exists — just ensure track.json is there, no noise
        if (!fs.existsSync(path.join(targetDir, 'track.json'))) {
            fs.writeJsonSync(path.join(targetDir, 'track.json'), { track, initialized: new Date().toISOString(), version: '0.1.0' }, { spaces: 2 });
        }
        return;
    }
    fs.ensureDirSync(targetDir);
    fs.ensureDirSync(path.join(targetDir, 'content'));
    fs.ensureDirSync(path.join(targetDir, 'research', 'sources'));
    fs.ensureDirSync(path.join(targetDir, 'research', 'bibliography'));
    fs.ensureDirSync(path.join(targetDir, 'research', 'interviews'));
    fs.ensureDirSync(path.join(targetDir, 'knowledge'));
    fs.ensureDirSync(path.join(targetDir, 'tracking'));
    fs.ensureDirSync(path.join(targetDir, 'drafts'));
    fs.ensureDirSync(path.join(targetDir, 'critique'));
    fs.ensureDirSync(path.join(targetDir, 'revisions'));
    fs.ensureDirSync(path.join(targetDir, 'metadata'));
    fs.ensureDirSync(path.join(targetDir, 'checkpoints'));
    fs.ensureDirSync(path.join(projectRoot, 'memory'));
    fs.ensureDirSync(path.join(projectRoot, 'output', 'manuscript'));
    fs.writeJsonSync(path.join(targetDir, 'track.json'), { track, initialized: new Date().toISOString(), version: '0.1.0' }, { spaces: 2 });
    await instantiateTemplates(targetDir, track);
    const manifestPath = path.join(targetDir, 'manifest.md');
    if (!fs.existsSync(manifestPath)) {
        fs.writeFileSync(manifestPath, `# ${track === 'fiction' ? 'Creative' : 'Intellectual'} Manifest\n\n*Generated by Buchbinder — replace with your principles.*\n\n## Core Values\n[Your central thesis, theme, or purpose]\n\n## Quality Baseline\n[Your non-negotiable standards]\n\n## Style Principles\n[Register, tone, conventions]\n\n## Content Principles\n[Structure, evidence, narrative norms]\n\n## Reader Contract\n[Audience expectations, content notes]\n\n## Revision Procedures\n[How revision decisions are made]\n`, 'utf-8');
    }
    success(`Project structure initialized at ${targetDir}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────
function parseInstallArgs(argv) {
    const args = {
        nonInteractive: false,
        reset: false,
        forceReset: false,
        postinstall: false,
        help: false,
    }
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i]
        if (a === '--non-interactive') args.nonInteractive = true
        else if (a === '--reset') args.reset = true
        else if (a === '--force-reset') args.forceReset = true
        else if (a === '--postinstall') { args.nonInteractive = true; args.postinstall = true }
        else if (a === '--help' || a === '-h') args.help = true
    }
    return args
}

async function main() {
    const args = parseInstallArgs(process.argv)
    if (args.help) {
        console.log(chalk.white('buchbinder — per-project installer'))
        console.log('')
        console.log('Usage:')
        console.log('  npx buchbinder [options]')
        console.log('')
        console.log('Options:')
        console.log('  --non-interactive    Use defaults; skip prompts (for postinstall/CI)')
        console.log('  --reset              Force a fresh install (overwrite everything)')
        console.log('  --force-reset        --reset + skip the modified-locally check')
        console.log('  --postinstall        Alias for --non-interactive (used by npm postinstall)')
        console.log('  --help, -h           Show this help')
        console.log('')
        console.log('For idempotent in-place updates, prefer: npx buchbinder-refresh')
        process.exit(0)
    }

    // ── Redirect to refresh if a prior install exists ──
    const existingManifest = loadManifest(DEST_DIR)
    if (existingManifest && !args.reset && !args.forceReset) {
        if (args.nonInteractive || args.postinstall) {
            // postinstall on an already-installed project → just exit (refresh will be run separately)
            console.log(chalk.yellow('⚠ A prior buchbinder install is recorded in this project.'))
            console.log(chalk.yellow(`  Manifest: ${path.join(DEST_DIR, '.buchbinder-install-manifest.json')}`))
            console.log(chalk.yellow('  Nothing to do. Use `npx buchbinder-refresh` to sync updates.'))
            process.exit(0)
        }
        console.log(chalk.yellow('\n⚠ A prior buchbinder install is recorded in this project'))
        console.log(chalk.yellow(`  (commit ${existingManifest.packageCommit || 'unknown'}, last installed ${existingManifest.installedAt}).`))
        console.log(chalk.yellow(''))
        console.log(chalk.white('  For an idempotent refresh that preserves your work:'))
        console.log(chalk.cyan('      npx buchbinder-refresh'))
        console.log(chalk.yellow(''))
        console.log(chalk.white('  To start over from scratch (DESTRUCTIVE — overwrites every'))
        console.log(chalk.white('  plugin-owned file; you will lose any local edits to phase'))
        console.log(chalk.white('  specs and slash commands):'))
        console.log(chalk.cyan('      npx buchbinder --reset'))
        console.log(chalk.cyan('      npx buchbinder --force-reset   # skips the modified-locally check'))
        console.log(chalk.yellow(''))
        console.log(chalk.yellow('  Refresh recommended. Exiting.'))
        process.exit(0)
    }

    // ── --reset / --force-reset: confirm before destructive overwrite ──
    if (existingManifest && (args.reset || args.forceReset)) {
        // Check for locally-modified files
        const newManifest = buildManifest(DEST_DIR, { packageVersion: 'unknown', packageCommit: 'unknown', packageRoot: PKG_ROOT, pluginOwnedSubtrees: [] })
        const { diffManifest } = await import('./manifest.mjs')
        const diff = diffManifest(existingManifest, DEST_DIR)
        const locallyModified = diff.modified
        if (locallyModified.length > 0 && !args.forceReset) {
            if (args.nonInteractive) {
                console.log(chalk.red(`✗ Refusing to reset: ${locallyModified.length} files are modified locally.`))
                console.log(chalk.red('  Use --force-reset to override (destructive).'))
                process.exit(2)
            }
            console.log(chalk.yellow(`⚠ ${locallyModified.length} files are modified locally.`))
            const ok = await confirm({ message: 'Proceed with --reset and lose your local edits?', default: false })
            if (!ok) { console.log(chalk.yellow('Aborted.')); process.exit(0) }
        }
        console.log(chalk.yellow('Resetting plugin assets to current source state...'))
    }

    console.log(chalk.white('\nBuchbinder — Professional Book Writing Workflow'));
    console.log(chalk.gray('Installs the /buchbinder writing workflow into .opencode/\n'));

    // ── Per-project acknowledgement (interactive only) ──
    if (!args.nonInteractive) {
        await printPerProjectAck()
    }

    let track = 'fiction'
    let importChoice = 'none'
    let importedFiles = []
    let isSeries = false
    let seriesTitle = null
    let seriesAuthor = null
    let bookNumber = null
    let seriesId = null

    let bookCount = 1;
    let targetBooks = [];

    if (args.nonInteractive) {
        // Defaults: track=fiction, no import, no series
        // (For postinstall / CI, we keep things simple.)
        targetBooks = [path.join(process.cwd(), 'book')];
    } else {
        track = await select({
            message: 'Which track do you want to use for this project?',
            choices: [
                { name: 'Fiction', value: 'fiction', description: 'Novels, short stories, serials, creative non-fiction' },
                { name: 'Non-Fiction', value: 'non-fiction', description: 'Academic works, journalism, biography, technical books' },
                { name: 'Mixed', value: 'mixed', description: 'Creative non-fiction, memoir with research, narrative journalism' },
            ],
        });

        // ── Lorebook / Premise import option ──
        importChoice = await select({
            message: 'Do you have a lorebook, premise, or world-building document to import?',
            choices: [
                { name: 'No', value: 'none', description: 'Start from scratch' },
                { name: 'Yes — Lorebook (SillyTavern/JanitorAI/CharacterAI JSON)', value: 'lorebook', description: 'Import a world info / character card export' },
                { name: 'Yes — Premise document (Markdown, text, outline)', value: 'premise', description: 'Import a written premise, synopsis, or idea file' },
            ],
        });

        if (importChoice !== 'none') {
            const { input } = await import('@inquirer/prompts');
            const rawInput = await input({
                message: importChoice === 'lorebook'
                    ? 'Path to your lorebook JSON file(s):'
                    : 'Path to your premise/idea document(s):',
                default: '',
            });

            // (Path parsing logic — unchanged from original)
            let paths;
            if (rawInput.includes('"') || rawInput.includes("'")) {
                const quoted = [];
                const quoteRegex = /["']([^"']+)["']/g;
                let match;
                let lastIdx = 0;
                while ((match = quoteRegex.exec(rawInput)) !== null) {
                    const before = rawInput.slice(lastIdx, match.index).trim();
                    if (before) quoted.push(...before.split(/\s+/).filter(Boolean));
                    quoted.push(match[1]);
                    lastIdx = quoteRegex.lastIndex;
                }
                const after = rawInput.slice(lastIdx).trim();
                if (after) quoted.push(...after.split(/\s+/).filter(Boolean));
                paths = quoted;
            } else {
                const PLACEHOLDER = '\x00SPACE\x00';
                paths = rawInput
                    .replace(/\\ /g, PLACEHOLDER)
                    .split(/\s+/)
                    .map(p => p.replace(new RegExp(PLACEHOLDER, 'g'), ' '))
                    .filter(p => p.length > 0);
            }

            paths = paths
                .map(p => p.trim())
                .filter(p => p.length > 0)
                .map(p => {
                    if (p.startsWith('~/')) return path.join(process.env.HOME, p.slice(2));
                    if (!path.isAbsolute(p)) return path.resolve(p);
                    return p;
                });

            for (const p of paths) {
                if (!fs.existsSync(p)) {
                    warn(`File not found: "${p}" — skipping`);
                    continue;
                }
                const srcAbs = path.resolve(p);
                const srcBase = path.basename(srcAbs);
                const subdir = importChoice === 'lorebook' ? 'lorebook' : 'premise';
                const destDir = path.join(process.cwd(), 'book', subdir);
                // If the source is already inside the destination directory, don't copy.
                const isAlreadyInPlace = path.dirname(srcAbs) === destDir;
                let destPath;
                if (isAlreadyInPlace) {
                    destPath = srcAbs;
                    success(`Found ${srcBase} already in ./book/${subdir}/ — using as-is`);
                } else {
                    fs.ensureDirSync(destDir);
                    const destName = srcBase;
                    destPath = path.join(destDir, destName);
                    if (fs.existsSync(destPath)) {
                        warn(`Destination already exists: ./book/${subdir}/${destName} — skipping`);
                        continue;
                    }
                    fs.copySync(srcAbs, destPath);
                    success(`Imported ${srcBase} → ./book/${subdir}/${destName}`);
                }
                importedFiles.push(destPath);
            }
            if (importedFiles.length === 0 && rawInput.trim()) {
                warn('No files could be imported — you can add them later via /buchbinder manifest');
            }
        }

        // ── Series init option ──
        isSeries = await select({
            message: 'Is this project part of a series?',
            choices: [
                { name: 'No — standalone book', value: false, description: 'Single-book project' },
                { name: 'Yes — new series', value: 'new', description: 'Initialize a new series and plan the books' },
                { name: 'Yes — add a book to existing series', value: 'existing', description: 'Link to an existing ./series/ directory' },
            ],
        });

        if (isSeries === 'new') {
            const { input, number } = await import('@inquirer/prompts');
            seriesTitle = await input({ message: 'Series title:', default: '' });
            seriesAuthor = await input({ message: 'Author name:', default: '' });
            seriesId = seriesTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'series';
            bookCount = await number({ message: 'How many books are planned for the series?', default: 3, min: 1 });
            
            for (let i = 1; i <= bookCount; i++) {
                targetBooks.push(path.join(process.cwd(), 'series', `book${i}`));
            }
        } else if (isSeries === 'existing') {
            const { input, number } = await import('@inquirer/prompts');
            bookNumber = await number({ message: 'Book number in series:', default: 2 });
            targetBooks.push(path.join(process.cwd(), 'series', `book${bookNumber}`));
            if (fs.existsSync(path.join(process.cwd(), 'series', 'meta.json'))) {
                const meta = fs.readJsonSync(path.join(process.cwd(), 'series', 'meta.json'));
                seriesId = meta.id || meta.seriesId;
                seriesTitle = meta.title;
                seriesAuthor = meta.author;
            } else {
                seriesId = await input({ message: 'Series ID (folder-safe, e.g. my-series):', default: 'series' });
            }
        } else {
            targetBooks = [path.join(process.cwd(), 'book')];
        }
    }

    header('Project Structure');
    for (const bookPath of targetBooks) {
        await initProjectStructure(track, args.nonInteractive, bookPath);
    }

    // Create series infrastructure if requested
    if (isSeries) {
        const seriesDir = path.join(process.cwd(), 'series');
        const lorebookDir = path.join(seriesDir, 'lorebook');
        fs.ensureDirSync(lorebookDir);
        if (!fs.existsSync(path.join(lorebookDir, 'characters.md'))) {
            fs.writeFileSync(path.join(lorebookDir, 'characters.md'), '# Series Characters\n\n*Cross-book character profiles.*\n', 'utf-8');
        }
        if (!fs.existsSync(path.join(lorebookDir, 'world.md'))) {
            fs.writeFileSync(path.join(lorebookDir, 'world.md'), '# Series World\n\n*World-setting, geography, history, cosmology.*\n', 'utf-8');
        }
        if (!fs.existsSync(path.join(lorebookDir, 'glossary.md'))) {
            fs.writeFileSync(path.join(lorebookDir, 'glossary.md'), '# Series Glossary\n\n*Terms, names, places, and concepts.*\n', 'utf-8');
        }
        if (!fs.existsSync(path.join(lorebookDir, 'timeline.json'))) {
            fs.writeJsonSync(path.join(lorebookDir, 'timeline.json'), { entries: [] }, { spaces: 2 });
        }
        if (!fs.existsSync(path.join(lorebookDir, 'threads.md'))) {
            fs.writeFileSync(path.join(lorebookDir, 'threads.md'), '# Series Plot Threads\n\n*Cross-book story threads.*\n', 'utf-8');
        }

        // Series metadata
        let meta = { id: seriesId, title: seriesTitle, author: seriesAuthor, bookCount: 1, books: [] };
        const metaPath = path.join(seriesDir, 'meta.json');
        if (fs.existsSync(metaPath)) {
            try { meta = { ...meta, ...fs.readJsonSync(metaPath) }; } catch {}
        }
        meta.bookCount = Math.max(meta.bookCount || 1, bookNumber);
        const bookTitle = path.basename(process.cwd());
        const existingIdx = meta.books.findIndex(b => b.number === bookNumber);
        const bookEntry = { number: bookNumber, title: bookTitle, path: '.' };
        if (existingIdx >= 0) meta.books[existingIdx] = bookEntry;
        else meta.books.push(bookEntry);
        meta.books.sort((a, b) => a.number - b.number);
        fs.writeJsonSync(metaPath, meta, { spaces: 2 });

        // Link current book
        const trackPath = path.join(process.cwd(), 'book', 'track.json');
        if (fs.existsSync(trackPath)) {
            const track = fs.readJsonSync(trackPath);
            track.seriesId = seriesId;
            track.bookNumber = bookNumber;
            fs.writeJsonSync(trackPath, track, { spaces: 2 });
        }

        success(`Series infrastructure initialized: seriesId=${seriesId}, bookNumber=${bookNumber}`);
    }

    header('Installing Workflow');

    // ── Overwrite or not. That is the only real decision here. ──
    // There is ONE copy path (sync.mjs). Whether Buchbinder already put files
    // here changes nothing about *how* they are copied — only whether existing
    // files are replaced. If there is anything to replace and we were allowed
    // to ask, ask once, plainly, before touching it.
    const CLOBBER_TARGETS = ['skills', 'tools', 'commands', 'plugins', 'templates', 'lib', 'rules'];
    const alreadyInstalled = CLOBBER_TARGETS.some(d => fs.existsSync(path.join(DEST_DIR, d)));
    let overwrite;
    if (args.reset || args.forceReset) {
        overwrite = true;
    } else if (args.nonInteractive) {
        overwrite = true; // postinstall/CI: never prompt
    } else if (!alreadyInstalled) {
        overwrite = true; // nothing to clobber
    } else {
        overwrite = await confirm({
            message: chalk.yellow('Buchbinder files already exist in .opencode/. Overwrite them with the current versions?'),
            default: true,
        });
    }
    const syncMode = overwrite ? 'overwrite' : 'preserve';

    const skillsR = syncCopySkills(DEST_DIR, track, syncMode);
    const toolsR = syncCopyToolsAndLib(DEST_DIR, syncMode);
    const cmdsR = syncCopySlashCommands(DEST_DIR, syncMode);
    syncCopyTemplates(DEST_DIR, track);
    copyRules();
    const pluginR = syncCopySidebarPlugin(DEST_DIR, syncMode);
    const hooksR = syncCopyHooksPlugin(DEST_DIR, syncMode);
    syncEnsureProjectConfig(DEST_DIR);

    // Install the project's .opencode/ dependencies so the plugin and tools
    // resolve (bun preferred, npm fallback).
    try {
        execSync('bun install', { cwd: DEST_DIR, stdio: 'pipe' });
        success('Dependencies installed');
    } catch {
        try {
            execSync('npm install --ignore-scripts --prefer-offline', { cwd: DEST_DIR, stdio: 'pipe' });
            success('Dependencies installed via npm fallback');
        } catch {
            warn('Dependency install failed — run "bun install" in .opencode/ manually');
        }
    }

    log(`  Skills:    ${skillsR.copied} copied, ${skillsR.skipped} skipped`)
    log(`  Tools:     ${toolsR.copied} copied, ${toolsR.skipped} skipped`)
    log(`  Commands:  ${cmdsR.copied} copied, ${cmdsR.skipped} skipped`)
    log(`  Plugin:    ${pluginR.copied} copied (${pluginR.source})`)
    log(`  Hooks:     ${hooksR.copied} copied`)

    // ── Prefetch the local ONNX models (embedder, reranker, classifier) ──
    // Downloads into the shared model cache so first query is offline + instant.
    // Tolerant: a fetch failure warns and retrieval degrades gracefully.
    if (process.env.BUCHBINDER_SKIP_MODELS !== '1') {
        try {
            log('');
            log('  Fetching local ONNX models (embedder, reranker, classifier)...');
            execSync(`node ${path.join(PKG_ROOT, 'bin', 'fetch-models.mjs')}`, { stdio: 'inherit' });
        } catch (err) {
            warn(`Model prefetch skipped: ${err.message}`);
        }
    }

    header('Installation Complete');

    // ── Write the install manifest ──
    // Records what was installed, with per-file SHA256, so refresh.mjs can
    // diff against it on subsequent runs.
    try {
        const packageVersion = (() => {
            try { return JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf-8')).version }
            catch { return 'unknown' }
        })()
        const packageCommit = (() => {
            try { return execSync('git rev-parse --short HEAD', { cwd: PKG_ROOT, encoding: 'utf-8' }).trim() }
            catch { return 'unknown' }
        })()
        const manifest = buildManifest(DEST_DIR, {
            packageVersion,
            packageCommit,
            packageRoot: PKG_ROOT,
            pluginOwnedSubtrees: [], // informational; refresh.mjs uses plugin-tree.mjs
            loreIndex: { lastBuildAt: null, needsRebuild: true },
        })
        writeManifest(DEST_DIR, manifest)
        success(`Wrote install manifest (${manifest.files.length} files tracked)`)
    } catch (err) {
        warn(`Could not write install manifest: ${err.message}`)
    }

    log('');
    log('  Installed to .opencode/:');
    log(`    ${chalk.green('\u2713')} skills/`);
    log(`    ${chalk.green('\u2713')} tools/ (incl. hubs/buchbinder/) + lib/ + plugins/lib/`);
    log(`    ${chalk.green('\u2713')} templates/`);
    log(`    ${chalk.green('\u2713')} plugins/buchbinder-sidebar/ (TSX source — registers /buchbinder menu)`);
    log('');
    log(`  ${chalk.green('\u2713')} tui.json — TUI keybinds + plugin path`);
    log(`  ${chalk.green('\u2713')} opencode.jsonc — plugin registered (loads the sidebar)`);
    log(`  ${chalk.green('\u2713')} package.json — runtime deps (solid-js, @opentui/solid, fs-extra, @huggingface/transformers)`);
    log('');
    log('  Next steps:');
    log('    1. Open your project in OpenCode (restart if already open)');
    log('    2. Verify plugin loaded: opencode debug info should list buchbinder-sidebar');
    log('    3. Type /buchbinder to open the instant phase menu');
    if (isSeries) {
        log(`    ✓ Series linked: ${seriesId}, book ${bookNumber}`);
    }
    if (importedFiles.length > 0) {
        log(`    ${isSeries ? '3' : '3'}. Run /buchbinder constitute — it will detect your imported ${importChoice === 'lorebook' ? 'lorebook' : 'premise'} file${importedFiles.length > 1 ? 's' : ''} and use it`);
    } else {
        log('    3. Or invoke a specific phase directly (e.g. /buchbinder outline)');
    }
    log('');
    log('  Phases: guided, constitute, specify, clarify, research, outline,');
    log('          task-manager, draft, critique, revise, edit, review,');
    log('          cite, publish, track, timeline, meta, drafter,');
    log('          verify, resume, cycle, pacing-audit, hook-review,');
    log('          read-through, series, refresh-index, refresh');
    log('');
}

main().catch(err => { error(err.message); process.exit(1); });