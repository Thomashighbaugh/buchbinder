import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "series",
  description: "Series orchestration and infrastructure: ordered pre-book stages (series metadata → book metadata → series knowledge/lorebook/tracking → series outline → break into individual book pipelines) plus sync/audit/register/import/status operations.",
  reminder: "Series-first pipeline — establish series context before per-book work",
  phases: "all",
  detailedDescription: `# User Input: {userInput}

## Objective

Manage multi-book series work with a **series-first, pre-book pipeline**. Before drafting or running per-book phases, the series must establish shared context in this order:

1. **Series-level metadata** (\`./series/meta.json\`, series identity/author/scope/books plan)
2. **Individual book metadata** (per-book entries in \`./series/meta.json\` and each book's \`./book/meta.json\`, \`./book/track.json\` with \`seriesId\`/\`bookNumber\`)
3. **Series-wide knowledge, lorebook, and tracking** (\`./series/lorebook/*\`, \`./series/lorebook/timeline.json\`, \`./series/lorebook/threads.md\`, \`./series/tracking/*\` as needed, imported/extracted canon)
4. **Series outline** (\`./series/outline.md\`, cross-book arc/beat map, per-book responsibilities and handoff points)
5. **Break into individual book pipelines** (derive per-book briefs/outlines/tasks from the series outline, register/link books, then hand off each book into its own manifest/specify/outline/task-manager/draft cycle)

The series lorebook and series outline are the cross-book source of truth. Per-book artifacts may specialize them, but must not contradict them without an explicit, recorded series-level decision.

## Sub-Commands

### \`/buchbinder series pipeline\` (default when composing/planning a series)

Run or resume the ordered pre-book series workflow. Detect current series state and execute the next incomplete stage (do not skip ahead).

**Stage 1 — Series-level metadata (FIRST):**
- Ensure \`./series/\` exists. Create/update \`./series/meta.json\` with: \`id\`, \`title\`, \`author\` (explicit, non-dubious — required), \`description/premise\`, \`genre\`, \`plannedBookCount\`/\`bookCount\`, \`books[]\`, \`createdAt\`/\`updatedAt\`.
- Author must be determined explicitly (never blank/guessed/placeholder). If missing or dubious, ask via \`question\` and persist before continuing.
- Capture series-level promises/constraints (throughline, world rules that cannot break, timeline bounds) in \`./series/meta.json\` or \`./series/notes.md\` as appropriate.

**Stage 2 — Individual book metadata (after series metadata):**
- Define the planned book list (number, working title, slug/path, status \`planned|active|complete\`, book-level premise/goal). Register/update each in \`./series/meta.json.books\`.
- For the current/active project book: ensure \`./book/meta.json\` exists with determined \`author\`, \`title\`, \`series\`/\`seriesId\` context as applicable; ensure \`./book/track.json\` has \`seriesId\` and \`bookNumber\`.
- If preparing book 2+, run \`series register\` semantics for that book context/path. Book metadata must be explicit per book (titles/numbers/paths/authorship credits) — never inferred silently.

**Stage 3 — Series-wide knowledge, lorebook, and tracking:**
- Ensure \`./series/lorebook/\` exists: \`characters.md\`, \`world.md\`, \`glossary.md\`, \`timeline.json\`, \`threads.md\`.
- Populate from interviews and/or imports (\`series import\`, \`manifest\` lorebook import) — characters, world rules/geography/history, factions/artifacts, glossary/terminology, series timeline, unresolved/cross-book threads.
- Establish series-wide tracking as needed (e.g. \`./series/tracking/\` or canonical tracking in \`series/lorebook/timeline.json\` + \`threads.md\`): continuity constraints, canon decisions, thread ownership by book, timeline anchors.
- Rebuild/refresh retrieval index if available (\`/buchbinder refresh-index\`) after substantial lore updates.

**Stage 4 — Series outline (cross-book, before per-book drafting pipelines):**
- Produce \`./series/outline.md\` (and optionally \`./series/outline/\` shards if large): series arc, per-book synopsis, major beats/turns, character/world progression, thread handoffs, timeline milestones, and what each book must set up/pay off.
- The series outline must be internally consistent with series metadata and the series lorebook/tracking. Record unresolved cross-book questions explicitly.

**Stage 5 — Break into individual book pipelines:**
- For each planned book (starting with book 1 or the next active book), derive a per-book brief from the series outline: book premise, required setups/payoffs, inherited canon/threads, and starting state.
- Write/update per-book planning anchors as appropriate (e.g. \`./books/<slug>/...\` if multi-book workspace layout is used, or update the current book's \`./book/\` artifacts for the active book) and register/link each book in \`./series/meta.json\`.
- Hand off the active/selected book into its **individual book pipeline** (manifest/specify/clarify/outline/tasks/draft per track), explicitly inheriting series lorebook + series outline constraints. Do **not** start per-book drafting until Stages 1–4 for the series scope are complete.

Report progress as a checklist with the current stage marked \`[NEXT]\` and completed stages \`[DONE]\`. Persist stage status notes in \`./series/meta.json\` (e.g. \`pipeline\`/stage fields) when helpful.

### \`/buchbinder series init\`

Initialize series infrastructure (Stage 1 bootstrap + minimal scaffolding). Equivalent to starting \`series pipeline\` at Stage 1.

**Process:**
1. Determine series title and author (required, explicit, non-dubious; ask via \`question\` if missing).
2. Generate/confirm \`seriesId\` and create/update \`./series/meta.json\` (Stage 1).
3. Create \`./series/lorebook/\` with \`characters.md\`, \`world.md\`, \`glossary.md\`, \`timeline.json\`, \`threads.md\` (empty scaffolds if absent).
4. Link/register the current book in \`./series/meta.json\` and \`./book/track.json\` (\`seriesId\`, \`bookNumber\`) — Stage 2 seed for the active book.
5. Report next required stage (complete book metadata, then knowledge/lorebook/tracking, then series outline, then break into book pipelines).

### \`/buchbinder series books\` (alias: \`book-metadata\`, \`register-plan\`)

Stage 2 — define/register individual book metadata (planned and active books).

**Process:**
1. Ensure Stage 1 complete (series metadata/author present). If not, stop and run Stage 1.
2. Collect/confirm per-book entries: number, title, slug/path, status, credited author (explicit; may match series author only after confirmation), premise/goal.
3. Update \`./series/meta.json.books\` and \`bookCount/plannedBookCount\`.
4. For the active/current book, ensure \`./book/meta.json\` and \`./book/track.json\` (\`seriesId\`, \`bookNumber\`) are set consistently.

### \`/buchbinder series lorebook\` (alias: \`knowledge\`, \`canon\`)

Stage 3 — build/review series-wide knowledge, lorebook, and tracking (or import via \`series import\`). Ensures lorebook files/timeline/threads and series tracking anchors are populated before outlining.

### \`/buchbinder series outline\`

Stage 4 — create/revise \`./series/outline.md\` (cross-book outline). Requires Stages 1–3 complete. The outline must map series arc to books, declare setups/payoffs and thread handoffs across books, and define per-book responsibilities before any per-book outline is finalized.

### \`/buchbinder series split\` (alias: \`breakdown\`, \`handoff\`)

Stage 5 — break the series outline into individual book pipelines. Produces per-book briefs/handoff notes from \`./series/outline.md\`, confirms book registrations/paths, and recommends the next per-book command for the selected active book (typically \`/buchbinder manifest\` or \`/buchbinder specify\` with series inheritance). Does not replace per-book outlining; it initializes each book's pipeline from the series plan.

### \`/buchbinder series sync\`

Sync knowledge from the **current book** to the series lorebook (use after per-book milestones; keeps cross-book canon current).

**Process:**
1. Require series + lorebook initialized.
2. Sync \`./book/knowledge/character-profiles.md\` → \`./series/lorebook/characters.md\` (new appended/tagged by book; existing flagged for review).
3. \`./book/knowledge/voice-profiles.json\` is per-book (note/reference only, not copied as canon).
4. Sync \`./book/tracking/timeline.json\` → \`./series/lorebook/timeline.json\` (merge, dedupe, tag book number).
5. Sync \`./book/metadata/terminology.md\` (and relevant glossary sources) → \`./series/lorebook/glossary.md\`.
6. Report counts synced from book [bookNumber].

### \`/buchbinder series audit\`

Cross-book continuity scan across all registered books against series lorebook/outline/tracking. Writes \`./series/continuity-log.md\` and reports critical/major/minor/observations (critical issues block series-level publication).

### \`/buchbinder series register\`

Register/add a specific book (Stage 2 operation for book 2+). Updates \`./series/meta.json\` and links \`./book/track.json\` (\`seriesId\`, \`bookNumber\`). Use \`series books\`/\`series pipeline\` when planning multiple books at once.

### \`/buchbinder series import <format> <path>\`

Import external lorebook into \`./series/lorebook/\` (Stage 3 accelerator). Formats: \`sillytavern\`, \`janitorai\`, \`characterai\`, \`auto\`.

**Process:**
1. Require series initialized (run Stage 1/init first). Read input, detect/validate format.
2. Parse and classify entries (characters/world/glossary/timeline/threads) per format.
3. Append/merge into \`./series/lorebook/*\` (default append, tag source \`[Imported from <format>]\`; skip SillyTavern disabled entries; dedupe with warnings). Options: \`--overwrite\`, \`--no-tag\`, \`--characters-only\`, \`--world-only\`.
4. Report import counts/warnings and recommend review (classification heuristic) and \`/buchbinder refresh-index\`.

### \`/buchbinder series status\`

Show series status and pre-book pipeline progress.

**Output:**
\`\`\`markdown
## Series Status: [title]

**Author**: [name]  |  **Series ID**: [id]
**Books**: [N planned/registered]

### Pre-book pipeline
- [DONE|NEXT|PENDING] 1. Series-level metadata (./series/meta.json)
- [DONE|NEXT|PENDING] 2. Individual book metadata (series books + book/meta.json, book/track.json)
- [DONE|NEXT|PENDING] 3. Series-wide knowledge/lorebook/tracking (./series/lorebook/*, series tracking)
- [DONE|NEXT|PENDING] 4. Series outline (./series/outline.md)
- [DONE|NEXT|PENDING] 5. Break into individual book pipelines (per-book briefs/handoff; active book ready)

| # | Title | Path | Status | Words | Chapters |
|---|-------|------|--------|-------|----------|

**Series Lorebook**: characters/world/glossary/timeline/threads counts
**Series Outline**: present/missing, books covered
\`\`\`

## Execution

1. Parse the sub-command (default: \`pipeline\` when input indicates series planning/setup; otherwise \`status\` if ambiguous). 
2. Enforce stage order for pre-book work: do not advance to a later stage until required artifacts/fields for earlier stages exist and are non-dubious (especially author and registered book identities).
3. Execute the workflow and report concrete file/state changes.

## Next Steps (Auto-Handoff)

After the series operation, hand off using the \`question\` tool. Offer the **next required pre-book stage** first when pipeline is incomplete; only after Stage 5 offer per-book pipeline phases for the active book.

Typical options (choose contextually):
- **Continue series pipeline** → \`/buchbinder series pipeline\`
- **Book metadata** → \`/buchbinder series books\`
- **Lorebook/knowledge/tracking** → \`/buchbinder series lorebook\` or \`/buchbinder series import\`
- **Series outline** → \`/buchbinder series outline\`
- **Break into book pipelines** → \`/buchbinder series split\`
- **Active book pipeline (post Stage 5)** → \`/buchbinder manifest\` / \`specify\` / \`outline\` (inherit series context)
- **Series status** → \`/buchbinder series status\`
- **Stop** → End turn

If the user selects a phase, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute it immediately.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`series-lorebook\` | \`src/lib/series-lorebook.ts\` | Series lorebook engine |
| \`lorebook-import\` | \`src/lib/lorebook-import.ts\` | External format converter |`,
  tools: ["bash", "question"],
  relatedSkills: ["consistency-checker", "forgotten-elements"],
  examples: [
    { input: "/buchbinder series pipeline", approach: "Detects series state and runs the next pre-book stage in order: series metadata → book metadata → series knowledge/lorebook/tracking → series outline → break into individual book pipelines" },
    { input: "/buchbinder series init", approach: "Bootstraps series metadata/lorebook scaffolding and links the current book (Stage 1 seed)" },
    { input: "/buchbinder series books", approach: "Defines/registers individual book metadata and links active book records (Stage 2)" },
    { input: "/buchbinder series lorebook", approach: "Builds series-wide knowledge, lorebook, and tracking before outlining (Stage 3)" },
    { input: "/buchbinder series outline", approach: "Creates ./series/outline.md mapping cross-book arc/beats and per-book responsibilities (Stage 4)" },
    { input: "/buchbinder series split", approach: "Breaks series outline into per-book briefs and hands off to individual book pipelines (Stage 5)" },
    { input: "/buchbinder series import auto ./export.json", approach: "Imports external lorebook into series knowledge during Stage 3" },
    { input: "/buchbinder series status", approach: "Shows pre-book pipeline progress, registered books, lorebook, and series outline status" }
  ],
  warnings: [
    "Series pre-book stages are ordered and required before per-book drafting: series metadata → individual book metadata → series knowledge/lorebook/tracking → series outline → break into individual book pipelines",
    "Do not invent or leave dubious author/identity metadata; series and book authors must be explicitly determined",
    "Series lorebook and series outline are cross-book source of truth; per-book artifacts must not contradict them without an explicit recorded series decision",
    "Sync is one-directional (book -> lorebook) for per-book milestones; review merged canon for conflicts",
    "Imported lorebook entries are appended/tagged by default and should be reviewed (classification is heuristic)"
  ]
}

export default spec