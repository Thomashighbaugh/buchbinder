import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "guided",
  description: "Assess project state and guide you to the next appropriate phase",
  reminder: "Detects current phase and recommends next step",
  phases: "utility",
  detailedDescription: `# User Input: {userInput}

## Objective

Determine the user's current project state and route them to the correct phase in the Buchbinder workflow. If a subcommand was provided as the first argument, dispatch directly. If not, run state detection and present a contextualised roadmap.

**First-step invariant (guided pipeline):** author identity is established before any other guided workflow step proceeds. Do not route, recommend, or hand off to another phase while the author name is missing or dubious.

**Series-first invariant:** when composing or working in a series project, complete the ordered pre-book series stages before entering per-book pipelines: (1) series-level metadata, (2) individual book metadata, (3) series-wide knowledge/lorebook/tracking, (4) series outline, (5) break into individual book pipelines. Only after Stage 5 is complete should the active book proceed through its own manifest/specify/outline/tasks/draft cycle.

## Subcommand Dispatch

If \`{userInput}\` begins with a recognised subcommand or alias, dispatch immediately **only after Step 0 (author determination) is satisfied**. Exception: dispatching to \`meta\` is always allowed so the user can set the author.

| Subcommand | Aliases | Route to |
|-----------|---------|----------|
| \`ideation\` | \`idea\`, \`brainstorm\`, \`explore\` | \`/buchbinder ideation\` |
| \`series\` | \`lorebook\` | \`/buchbinder series\` |
| \`manifest\` | \`const\` | \`/buchbinder manifest\` |
| \`specify\` | \`spec\` | \`/buchbinder specify\` |
| \`clarify\` | \`clar\` | \`/buchbinder clarify\` |
| \`research\` | \`rsrc\`, \`ingest\` | \`/buchbinder research\` |
| \`outline\` | \`plan\`, \`structure\` | \`/buchbinder outline\` |
| \`task-manager\` | \`tasks\`, \`task\` | \`/buchbinder task-manager\` |
| \`draft\` | \`write\`, \`chapter\` | \`/buchbinder draft\` |
| \`critique\` | \`developmental\`, \`audience\` | \`/buchbinder critique\` |
| \`revise\` | \`revision\` | \`/buchbinder revise\` |
| \`edit\` | \`editor\`, \`line\` | \`/buchbinder edit\` |
| \`review\` | \`qa\`, \`audit\` | \`/buchbinder review\` |
| \`cite\` | \`citation\`, \`bibliography\` | \`/buchbinder cite\` |
| \`publish\` | \`pub\`, \`export\`, \`submit\` | \`/buchbinder publish\` |
| \`track\` | — | \`/buchbinder track\` |
| \`timeline\` | — | \`/buchbinder timeline\` |
| \`meta\` | — | \`/buchbinder meta\` |
| \`drafter\` | — | \`/buchbinder drafter\` |

If the subcommand is not recognised, proceed to Step 0 and then state detection, treating the full \`{userInput}\` as context.

## Execution Steps

### 0. Determine Author Name (FIRST — MANDATORY)

Author identity must be determined explicitly and non-dubiously before any other guided step.

1. Read \`./book/meta.json\` (create it if missing, preserving the standard schema; do **not** invent an author). Read \`./book/track.json\` for \`seriesId\` / \`bookNumber\`.
2. If this is a series project (\`seriesId\` present or \`./series/meta.json\` exists, or the user explicitly states this is a series), also read \`./series/meta.json\`.
3. Determine the applicable author field(s):
   - **Series project:** \`series/meta.json.author\` is the series/primary author and must be determined. \`book/meta.json.author\` must also be determined for the current book (default to the confirmed series author only after explicit confirmation, never silently).
   - **Standalone book:** \`book/meta.json.author\` must be determined.
4. Treat an author as **undetermined/dubious** if it is missing, null, empty/whitespace-only, or a placeholder/default such as: \`Unknown\`, \`Unknown Author\`, \`Author\`, \`Author Name\`, \`TBD\`, \`TBA\`, \`N/A\`, \`NA\`, \`None\`, \`Anonymous\`, \`[Author]\`, \`<author>\`, or similar non-specific placeholders.
5. If any required author is undetermined/dubious, **stop the guided pipeline here** (do not detect track/phase or recommend other phases yet). Ask the user for the real author name using the \`question\` tool. Be explicit: "Author name must be determined before continuing (not left blank or guessed)."
6. Write the confirmed author value(s) to the appropriate metadata file(s) immediately. If the user confirms the book author is the same as the series author, record that explicitly. If multiple authors/pen name apply, record the exact credited author string the user provides.
7. Only after all required author field(s) are explicitly determined may you continue to Step 1 (or dispatch the requested subcommand, except \`meta\` which may run at any time to correct/set author).

### 1. Detect Track and Series Context

Check \`./book/track.json\`:
- If it exists, read the \`track\` field: \`fiction\`, \`non-fiction\`, or \`mixed\`.
- If it does not exist, ask the user (using the \`question\` tool): "Which track is this project? (fiction / non-fiction / mixed)"
- If uncertain, ask diagnostic questions about the nature of the work using the \`question\` tool.

**Series context:** treat as a series project if \`./series/meta.json\` exists, or \`book/track.json\` has \`seriesId\`, or the user explicitly requests a series/multi-book workflow. For series projects, detect the **pre-book series stage** (Step 2a) before normal per-book phase detection.

### 2. Detect Phase

#### 2a. Series pre-book stages (series projects, required before per-book pipelines)

When in series context, evaluate stages in order and identify the first incomplete stage:

1. **Series-level metadata** — \`./series/meta.json\` exists with explicit non-dubious \`author\`, series identity (\`title\`/\`id\`), and scope/plan fields (\`books\`/\`plannedBookCount\`/intent) established.
2. **Individual book metadata** — planned books are registered in \`./series/meta.json.books\` with explicit per-book titles/numbers/paths/status/credits as needed; the active book has \`./book/meta.json\` (determined author/title) and \`./book/track.json\` linked with \`seriesId\`/\`bookNumber\`.
3. **Series-wide knowledge, lorebook, and tracking** — \`./series/lorebook/\` present and populated (\`characters.md\`, \`world.md\`, \`glossary.md\`, \`timeline.json\`, \`threads.md\`); series-level tracking/canon anchors established as required (including imported lore where applicable).
4. **Series outline** — \`./series/outline.md\` (and/or \`./series/outline/\`) exists and maps the cross-book arc, per-book responsibilities, and thread/timeline handoffs consistent with Stages 1–3.
5. **Break into individual book pipelines** — series outline has been broken down into per-book briefs/handoffs and each planned/active book is ready to enter (or has entered) its own pipeline with series inheritance recorded.

If any pre-book stage is incomplete, recommend \`/buchbinder series pipeline\` (or the specific stage subcommand) as **[NEXT]** and do **not** recommend per-book drafting/pipeline advancement beyond series handoff.

#### 2b. Per-book phase detection (standalone, or series after Stage 5)

Check for the presence and status of phase output documents. The detection follows the track-specific phase order.

**Fiction track detection order:**
0. \`./book/ideation/\` has artifacts? → Past Phase 0 (ideation)
1. \`./book/manifest.md\` exists **and is populated with real content**? → Past Phase 1
   - Read \`./book/manifest.md\`. If any section still contains placeholder brackets (e.g. `[Your central thesis, theme, or purpose]`, `[Your non-negotiable standards]`, `[Register, tone, conventions]`, `[Structure, evidence, narrative norms]`, `[Audience expectations, content notes]`, `[How revision decisions are made]`) or is empty/whitespace-only, treat Phase 1 as **NOT complete** — the manifest was created but never filled out. Route to \`/buchbinder manifest\`.
   - Only count as past Phase 1 if every section has substantive, non-placeholder content.
2. \`./book/specification.md\` or \`./book/specification/\` exists? → Past Phase 2
3. \`./book/specification/\` has \`[Needs Clarification]\` markers? → Phase 3 needed
4. \`./book/research/\` has source files or \`research-plan.md\`? → Past Phase 4 (or skipped)
5. \`./book/outline.md\` or \`./book/outline/\` exists? → Past Phase 5
6. \`./book/tasks.md\` or \`./book/tasks/\` exists? → Past Phase 6
7. Any files in \`./book/content/\`? → Phase 7 in progress
8. Any files in \`./book/critique/\`? → Phase 8 in progress
9. Any files in \`./book/revisions/\`? → Phase 9 in progress
10. Any chapters with \`[Done]\` in task tracking? → Phases 10-11 reached

**Non-fiction track detection order:**
0. \`./book/ideation/\` has artifacts? → Past Phase 0 (ideation)
1. \`./book/manifest.md\` exists **and is populated with real content**? → Past Phase 1
   - Read \`./book/manifest.md\`. If any section still contains placeholder brackets (e.g. `[Your central thesis, theme, or purpose]`, `[Your non-negotiable standards]`, `[Register, tone, conventions]`, `[Structure, evidence, narrative norms]`, `[Audience expectations, content notes]`, `[How revision decisions are made]`) or is empty/whitespace-only, treat Phase 1 as **NOT complete** — the manifest was created but never filled out. Route to \`/buchbinder manifest\`.
   - Only count as past Phase 1 if every section has substantive, non-placeholder content.
2. \`./book/research/\` has sources or research plan? → Past Phase 2
3. Sources annotated and bibliography started? → Past Phase 3
4. \`./book/outline.md\` exists? → Past Phase 4
5. Chapters in \`./book/content/\`? → Phase 5 in progress
6. Citations present in chapters? → Phase 5+6 handled
7. Any files in \`./book/critique/\`? → Phase 7+8 in progress

**Mixed track:** Check fiction order first, then non-fiction detection for citation support.

#### 2c. Mandatory-Pass Completeness Check (before recommending any phase)

Before recommending a phase, verify that no **mandatory pass** is outstanding. Call \`pipeline-ledger({ action: "status" })\` and read the result — do not rely on memory of what "should" have run. A project is not "ready for review" or "ready for publish" while a mandatory pass is missing or failing.

| Mandatory pass | Ledger id | If missing or not \`Pass\` |
|----------------|-----------|---------------------------|
| Pre-edit critique coverage | (no ledger id — check \`./book/critique/round-N/readers/\` + coverage checklist in \`summary.md\`) | Recommend \`/buchbinder critique\` (run the missing readers — never ask whether to) |
| Revision | (no ledger id — check \`./book/revisions/\` + revision-verify result) | Recommend \`/buchbinder revise\` |
| Edit (all three passes) | \`edit\` | Recommend \`/buchbinder edit\` |
| Post-edit: proofread verification | \`proofread-verification\` | Recommend \`/buchbinder cycle\` (resumes at the post-edit step) |
| Post-edit: continuity | \`continuity\` | Recommend \`/buchbinder cycle\` |
| Post-edit: pacing | \`pacing\` | Recommend \`/buchbinder cycle\` |
| Post-edit: hooks | \`hooks\` | Recommend \`/buchbinder cycle\` |
| Post-edit: read-through | \`read-through\` | Recommend \`/buchbinder cycle\` |
| Review | \`review\` | Recommend \`/buchbinder review\` |

**Never present "proofread pass", "compile/export", "review", or "publish" as the next step while a mandatory pass above is outstanding.** If any pass is outstanding, name it explicitly and route to the command that runs it. A ledger file that does not exist means the pass did not run — treat it as outstanding, not as a pass.

### 3. Determine State Category

| State | Meaning | Recommended Next |
|-------|---------|-----------------|
| \`series-prebook\` | Series project with incomplete pre-book stages (1–5) | \`/buchbinder series pipeline\` (or specific \`series\` stage subcommand) |
| \`not-started\` | No phase documents exist | Phase 0: \`/buchbinder ideation\` or Phase 1: \`/buchbinder manifest\` (standalone/series after Stage 5) |
| \`ideation\` | Ideation artifacts exist but no manifest | Phase 1: \`/buchbinder manifest\` (or return to \`/buchbinder ideation\`) |
| \`in-progress\` | Some phases complete, current phase identified | Current phase subcommand |
| \`active-writing\` | Drafting phase, chapters exist | Phase 7: \`/buchbinder draft\` or \`/buchbinder critique\` |
| \`revision-cycle\` | Critique or revision artifacts exist | Phase 8-9: \`/buchbinder critique\` or \`/buchbinder revise\` |
| \`editing\` | Chapters have been revised, ready for line edit | Phase 10: \`/buchbinder edit\` |
| \`post-edit-pending\` | Edit done, but one or more mandatory post-edit critique–revise cycles have not run (or did not pass) | Phase 10b: \`/buchbinder cycle\` (resumes at the post-edit step) — **not** review/publish |
| \`review\` | Editing complete **and** all mandatory post-edit cycles passed | Phase 11: \`/buchbinder review\` |
| \`publishing\` | All content approved, ready to export | Phase 12: \`/buchbinder publish\` |
| \`complete\` | Everything finalised | Celebrate the achievement |

**IMPORTANT — Do not belabor the obvious.** When the state is \`not-started\`, simply state "New project — author confirmed; start with /buchbinder ideation to develop your premise, or /buchbinder manifest if you already have a solid idea." For series projects in \`series-prebook\`, state the current series stage and recommend \`/buchbinder series pipeline\` (or the specific next series subcommand). Be concise.

**Also check for imported files.** Before reporting state, check for:
- \`./imported-lorebook.json\` — if present, mention "Lorebook import detected — run \`/buchbinder manifest\` or \`/buchbinder series import\` (Stage 3) to convert it into series lorebook and pre-fill series/book context."
- \`./premise.md\` — if present, mention "Premise document detected — run \`/buchbinder manifest\` to use it as a starting point."

### 4. Build Contextualised Roadmap

Present a roadmap that:

- For **series pre-book work**, shows the 5 ordered stages (series metadata → individual book metadata → series knowledge/lorebook/tracking → series outline → break into individual book pipelines) with \`[DONE]\`/\`[NEXT]\`/\`[PENDING]\`, then notes the per-book pipeline follows for each book after Stage 5.
- For **per-book work**, shows the overall phase sequence for the detected track with \`[DONE]\`/\`[NEXT]\`/\`[PENDING]\`.
- Shows the **mandatory-pass checklist** (pre-edit critique coverage → revision → line/copy/proofread → post-edit cycles → review) so the user can see which mandatory passes have run.
- Provides a one-line summary of what the recommended phase/stage produces.

**Example output structure (series, pre-book Stage 3 next):**

\`\`\`
Track: Fiction  |  State: Series pre-book (Stage 3 next)

Series pre-book pipeline (before individual book pipelines):
  [DONE]    1. Series-level metadata        — ./series/meta.json (identity, author, scope)
  [DONE]    2. Individual book metadata     — registered books, book/meta.json, book/track.json
  [NEXT]    3. Series knowledge/lorebook/tracking — ./series/lorebook/*, series timeline/threads/tracking
  [PENDING] 4. Series outline               — ./series/outline.md (cross-book arc, per-book beats/handoffs)
  [PENDING] 5. Break into book pipelines    — per-book briefs; hand off each book to its own pipeline

After Stage 5: run per-book phases (manifest → specify → outline → tasks → draft → …) for each book, inheriting series context.
\`\`\`

### 4b. Hand Off to the Recommended Phase (MANDATORY)

After presenting the roadmap, do NOT end with "type /buchbinder X". Hand off using the \`question\` tool:

- **If exactly one phase is recommended** (Rule B — confirm): 
  Question: "Proceed to <phase>?"
  Options: **Yes** → run it · **Stop** → end turn
- **If multiple phases are plausible** (Rule A — select):
  Question: "Which phase next?"
  Options: the recommended phase(s) + **Stop**

When the user selects/confirms, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute that phase immediately. Do NOT tell them to type it — run it.

### 5. Manual Drafting Guidance

If the user asks how to write drafts manually:

Draft files go in \`./book/drafts/\` (relative to project root). The \`/buchbinder draft\` command scans this folder before writing and uses drafts as structural guidance. Accepted naming: \`chapter_00001.md\`, \`0001.md\`, \`chapter-1.md\`.

**Draft tags** that \`/buchbinder draft\` processes:
- \`@#@ FILL @#@ [description] @#@ END FILL @#@\` — Replaced with fully written prose
- \`@#@ DESCRIBE @#@ [description] @#@ END DESCRIBE @#@\` — Sensory expansion
- \`@#@ FLASHBACK @#@ [description] @#@ END FLASHBACK @#@\` — Full flashback sequence

### 6. Track-Specific Guidance

**Series (pre-book):** complete series metadata → individual book metadata → series knowledge/lorebook/tracking → series outline → break into individual book pipelines, then run each book's own pipeline.

**Fiction**: Emphasise the manifest → specification → outline → draft pipeline. The critical path is consistent character and plot tracking.

**Non-fiction**: Emphasise the research → outline → draft-with-citations pipeline. The critical path is source integrity and citation accuracy.

**Mixed**: Support both tracks simultaneously. Characters may need research backing; non-fiction sections may need narrative structure.`,
  tools: ["loadSkill", "bash", "question"],
  relatedSkills: ["workflow-guide", "getting-started"],
  examples: [
    { input: "/buchbinder guided", approach: "Runs state detection, detects current phase (and series pre-book stage if applicable), and presents a contextualised roadmap." },
    { input: "/buchbinder guided series", approach: "Detects series pre-book stage and routes to /buchbinder series pipeline (or the specific series stage)." },
    { input: "/buchbinder guided specify", approach: "Dispatches directly to the specify phase without state detection." }
  ],
  warnings: []
}

export default spec;
