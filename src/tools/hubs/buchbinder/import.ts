import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "import",
  description: "Import existing work — a finished or partial manuscript, outline, specification, research corpus, or a whole project — into the Buchbinder structure at the stage it actually belongs to, then hand off to the matching phase.",
  reminder: "Utility: Bring existing work in at any pipeline stage",
  phases: "utility",
  detailedDescription: `# User Input: {userInput}

## Objective

Bring work that already exists outside Buchbinder into the project's canonical \`./book/\` structure, file it at the pipeline stage it actually belongs to, and hand off to the matching phase. Import converts, splits, files, and indexes the author's existing material — it never rewrites the prose. Everything it infers is recorded so the author can correct it.

Use this when a project starts from something other than a blank page: a finished novel being brought in for editing, half a draft, an outline written elsewhere, a story bible, a pile of research, or an entire existing Buchbinder project.

## Arguments

\`/buchbinder import [source] [flags]\`

| Argument | Meaning |
|----------|---------|
| \`source\` | Path to a file, directory, or archive to import. Required unless \`--from\` is supplied. |
| \`--kind <kind>\` | Force the source kind: \`manuscript\`, \`draft\`, \`outline\`, \`specification\`, \`manifest\`, \`research\`, \`project\`, \`lorebook\`. |
| \`--stage <stage>\` | Force the target stage instead of detecting it: \`manifest\`, \`specify\`, \`research\`, \`outline\`, \`draft\`, \`critique\`, \`revise\`, \`edit\`, \`review\`, \`publish\`. |
| \`--track <track>\` | Track to write to \`book/track.json\` when it is missing: \`fiction\`, \`non-fiction\`, \`mixed\`. |
| \`--split <mode>\` | Chapter splitting for prose: \`auto\` (default), \`headings\`, \`rules\`, \`pages\`, \`none\`. |
| \`--as <name>\` | Filename stem override for a single-document import. |
| \`--dry-run\` | Print the full plan (detected kind, stage, destinations, chapter map) without writing anything. |

## Execution Steps

### 1. Resolve the source

If \`source\` is empty, ask with the \`question\` tool for the path and whether it is a single file or a directory. Verify it exists. If it does not, report the path and stop — do not guess.

### 2. Ensure the track

Read \`./book/track.json\`.
- If it exists, respect its \`track\` value and note any conflict with \`--track\`.
- If it is missing, use \`--track\` or ask with \`question\` (fiction / non-fiction / mixed), then write \`./book/track.json\` preserving \`initialized\` and \`version\` if a stub already exists.

### 3. Detect the source kind

When \`--kind\` is not given, detect from the source. When the signal is ambiguous, ask with \`question\`.

| Signal | Kind |
|--------|------|
| \`.docx\` / \`.epub\` / \`.pdf\` / \`.rtf\` / \`.odt\`, or \`.md\`/\`.txt\` that reads as continuous prose | \`manuscript\` |
| A directory of per-chapter prose files, or prose clearly short of a full book | \`draft\` |
| Headings or beats with summaries but no prose ("Chapter 3 — Mira confronts Theron") | \`outline\` |
| Synopsis / story bible / premise — logline, protagonist, cast, setting | \`specification\` |
| Principles, style guide, tone, audience, non-negotiables | \`manifest\` |
| Notes, source excerpts, bibliography, \`[Source: key]\` markers, \`.bib\` / \`.ris\` | \`research\` |
| A directory containing a \`book/\` tree (or \`track.json\`, \`content/\`, \`outline.md\`) | \`project\` |
| SillyTavern / JanitorAI / CharacterAI JSON (\`name\`+\`description\`+\`personality\`, or \`char_name\`) | \`lorebook\` |

### 4. Convert to Markdown

Buchbinder stores prose as Markdown. Convert non-Markdown sources with pandoc, writing converted artifacts to \`/tmp/buchbinder-import/\`:

\`\`\`bash
mkdir -p /tmp/buchbinder-import
pandoc "<source>" -t gfm --wrap=none -o "/tmp/buchbinder-import/<stem>.md"
\`\`\`

| Source | Method |
|--------|--------|
| \`.docx\`, \`.odt\`, \`.epub\`, \`.html\`, \`.rtf\` | pandoc (above) |
| \`.pdf\` with a text layer | \`pdftotext -layout\` then light heading repair, or pandoc |
| \`.pdf\` scanned (no text layer) | No extractable text — report and ask for a text/OCR source |
| \`.md\`, \`.txt\` | Copy as-is; normalise line endings |

Record the exact conversion command(s) in the import report.

### 5. Route to a stage and destination

| Kind | Destination | Stage after import |
|------|-------------|--------------------|
| \`manuscript\` | \`./book/content/chapter_NNNNN.md\` (split) | \`review\` → \`edit\` → \`publish\` |
| \`draft\` | \`./book/content/chapter_NNNNN.md\` (split, continue numbering) | \`draft\` (continue) → \`critique\` |
| \`outline\` | \`./book/outline.md\` (shard if > 500 lines) | \`task-manager\` → \`draft\` |
| \`specification\` | \`./book/specification.md\` | \`clarify\` → \`outline\` |
| \`manifest\` | \`./book/manifest.md\` | \`specify\` |
| \`research\` | \`./book/research/sources/\`, \`./book/research/bibliography/\` | \`cite\` → \`outline\` |
| \`project\` | merge the source \`book/\` tree into \`./book/\` | \`guided\` (recompute state) |
| \`lorebook\` | \`./series/lorebook/*\` via \`importLorebook()\` | \`manifest\` |

Write only into the destination the kind maps to. Do not scatter imported material across the tree.

### 6. Derive structure from imported items

**For \`manuscript\` and \`draft\` (prose):**
- Split by \`--split\` (default \`auto\`), trying in order: headings (\`^#{1,3}\\s+\`, \`^(Chapter|CHAPTER|Part|PART|Ch\\.)\\b\`), rules (\`***\`, \`---\`, \`* * *\`), page breaks (\`\\f\` / \`\\newpage\`). Fall back to a word-budget split only when nothing else is found, and warn that boundaries are inferred.
- Write one file per chapter at \`./book/content/chapter_NNNNN.md\` (zero-padded to five digits), matching the project's naming convention.
- If \`./book/outline.md\` does not exist, generate one from the detected headings and scene breaks so downstream phases have structure. Mark it clearly in the report as derived-from-import, not authored.
- Mine front matter (title page, byline, copyright) into \`./book/meta.json\` via \`initializeMetadata(projectRoot)\` plus manual entry.
- Do NOT fabricate \`./book/manifest.md\`, \`./book/specification.md\`, or \`./book/knowledge/*\` from prose. Flag them as missing so the matching phase builds them.

**For \`outline\`:** normalise to the outline schema (\`_main.md\` + shards) with the outline splitter when the document is long.

**For \`research\`:** create one source note per source with \`createSourceNote()\` / \`annotateSource()\`; hand \`.bib\` / \`.ris\` files to \`/buchbinder cite\`.

**For \`project\`:** run \`--dry-run\` first. Merge only \`book/\` paths that do not already exist and list every conflict for the author to resolve. Never overwrite existing \`./book/\` content.

### 7. Record provenance and state

- Write \`./book/import-report.md\`: source path(s), detected kind, conversion commands, the chapter map (detected heading → \`chapter_NNNNN.md\`), the inferred track and stage, and an explicit list of what was **not** imported or **not** inferred.
- Save a checkpoint via \`saveCheckpoint()\` so \`/buchbinder resume\` and \`/buchbinder guided\` see the imported state.
- Rebuild the semantic lore index so later phases retrieve the imported material:

\`\`\`bash
bun .opencode/lib/scripts/lore-query.mjs --build
\`\`\`

### 8. Report

Print one summary: files written, chapters created, words imported, metadata extracted, gaps flagged, and the recommended next phase.

### 9. Hand off (MANDATORY)

Use the \`question\` tool to offer the recommended phase(s) for the detected stage — a select when several are plausible (Rule A), a confirm when exactly one is (Rule B). On selection, call \`hubMenu\` with \`action: "route"\`, \`subcommand: <chosen>\`, and execute it immediately. Do not tell the user to type it.

## Kind-Specific Notes

- **manuscript / draft** — never alter the prose during import. Preserve scene breaks, POV shifts, and section dividers verbatim; XML structuring happens later in \`draft\`, not here.
- **non-fiction** — after import, route to \`cite\` before \`outline\` so \`[Source: key]\` markers resolve.
- **lorebook** — delegate to \`importLorebook(projectRoot, 'auto', path)\`; see \`/buchbinder series import\`.
- **project** — merge conservatively; the source may be an older Buchbinder version.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`workflow-guide\` | \`skills/quality-assurance/workflow-guide/SKILL.md\` | Phase order and file conventions |
| \`getting-started\` | \`skills/quality-assurance/getting-started/SKILL.md\` | Onboarding a project that already has content |`,
  tools: ["bash", "question"],
  relatedSkills: ["workflow-guide", "getting-started"],
  examples: [
    { input: "/buchbinder import ~/manuscripts/novel.docx", approach: "Converts with pandoc, splits into ./book/content/chapter_NNNNN.md, derives an outline, then hands off to review/edit" },
    { input: "/buchbinder import ./chapters/ --kind draft --track fiction", approach: "Imports a partial draft, numbers chapters, then hands off to draft to continue" },
    { input: "/buchbinder import ./outline.md --stage outline", approach: "Files an externally-written outline and hands off to task-manager" },
    { input: "/buchbinder import ./sources/ --kind research", approach: "Creates source notes and bibliography entries, then hands off to cite/outline" },
    { input: "/buchbinder import ./old-project --kind project --dry-run", approach: "Previews the merge plan without writing anything" }
  ],
  warnings: [
    "Import writes into ./book/ — run --dry-run first for a project import or when ./book/content/ is non-empty",
    "Scanned PDFs carry no extractable text; a text or OCR source is required",
    "Chapter boundaries are inferred, not authoritative — the import report lists the detected map so filenames can be corrected",
    "Import never fabricates manifest, specification, or knowledge files; missing upstream documents are flagged for the matching phase to build"
  ]
}

export default spec
