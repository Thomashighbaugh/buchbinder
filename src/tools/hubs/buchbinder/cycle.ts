import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "cycle",
  description: "Batch editorial cycle by default: run the full mandatory pipeline for all pending chapters or up to 6 at a time — draft → critique (every required reader) → revise → edit (line/copy/proofread) → post-edit critique-revise cycles → continuity → done. Never reports complete while a mandatory pass is outstanding.",
  reminder: "Batch per-chapter editorial cycle — full mandatory pipeline for multiple chapters",
  phases: "7-11",
  detailedDescription: `# User Input: {userInput}

## Objective

Run complete editorial cycles. **Batch mode is the default** — cycle all pending chapters through the **full mandatory pipeline** (draft → critique → revise → edit → post-edit critique–revise cycles → continuity → done), or up to 6 at a time. This automates the entire editorial pipeline for maximum efficiency.

**Completion contract (HARD):** a chapter reaches \`[X]\` Done — and the batch is only reported as complete — when **every** mandatory stage has run and passed:

1. **Draft**
2. **Critique — every required reader/pass for the mode** (no single-reader shortcut, no asking whether to run the remaining readers)
3. **Revise** — every Critical/Major item addressed
4. **Edit** — all three passes: line-edit, copy-edit, **and proofread**
5. **Post-edit critique–revise cycles** — proofread verification, continuity, pacing, hooks, read-through
6. **Continuity confirmation**

There is **no optional "proofread pass" left over after the pipeline.** Proofreading happens inside the edit phase, and its verification is a mandatory post-edit cycle. Never report a pipeline as complete while a mandatory pass is outstanding — name the outstanding pass and run it.

## Batch vs Single Mode

| Mode | Trigger | Behaviour |
|------|---------|-----------|
| Batch (DEFAULT) | \`/buchbinder cycle\` | Cycle all pending chapters (up to 6) through full pipeline |
| Range | \`/buchbinder cycle 3-8\` | Cycle chapters 3-8 through full pipeline |
| Single | \`/buchbinder cycle Chapter 5\` | Cycle one chapter only (explicit override) |
| All | \`/buchbinder cycle all\` | All pending chapters regardless of batch limit |

**Batch sizing:** When no range specified, read \`./book/tasks.md\` and collect all tasks with status \`[ ]\` (Pending). Up to 6 per batch.

## Prerequisites

- \`./book/outline.md\` must exist (chapters must be in the outline)
- \`./book/tasks.md\` must exist (chapters must have task entries)
- For chapters > 3: voice profiles should exist

## Execution Model (Subagents — Swarm or Sequential)

Every multi-reader stage (critique, post-edit passes) may be executed **either** way. Both produce the same artifacts; pick whichever the environment supports and stay consistent within the run.

| Model | Dispatch | Contract |
|-------|----------|----------|
| **Swarm (parallel)** | Dispatch one subagent per reader/pass with the \`task\` tool, in parallel | Each subagent returns that reader's findings; the orchestrator writes \`readers/<reader>.md\` from the returned report and verifies the report is non-empty and scoped to the batch |
| **Sequential** | Run the readers one after another with the \`task\` tool, waiting for each report before starting the next | Same per-reader reports, same coverage checklist; no reader is skipped because an earlier reader's findings looked "good enough" |

**Both models must produce:**
- one file per required reader/pass under \`./book/critique/round-N/readers/\`
- a **coverage checklist** in \`./book/critique/round-N/summary.md\` listing every required reader/pass with its item count
- the consolidated report only **after** every required reader's report is in hand

**A reader whose report is missing, empty, or truncated counts as NOT RUN.** The round is incomplete, the coverage gate fails, and the cycle stops at the critique stage. Never consolidate a partial round and never skip a reader because the user was not asked.

## Ledger-Backed Completion (HARD — read from disk, not asserted)

Completion is **verified from disk**, never asserted in a chat message. Each mandatory pass writes a ledger file, and the cycle reads them back before reporting anything as done.

| Pass | Ledger file | Written by |
|------|-------------|-----------|
| Edit (line/copy/proofread) | \`./book/pipeline/edit.md\` | edit phase |
| Proofread verification | \`./book/pipeline/proofread-verification.md\` | edit phase (post-edit cycle) |
| Continuity | \`./book/pipeline/continuity.md\` | verify continuity |
| Pacing | \`./book/pipeline/pacing.md\` | pacing-audit |
| Hooks and transitions | \`./book/pipeline/hooks.md\` | hook-review |
| Read-through | \`./book/pipeline/read-through.md\` | read-through |
| Review | \`./book/pipeline/review.md\` | review |

**Record each pass** with the \`pipeline-ledger\` tool:

\`\`\`
pipeline-ledger({ action: "write", pass: "<pass-id>", verdict: "Pass", cycles: <N>, scope: "Chapters 1-6 (6 chapters)", summary: "<findings table>" })
\`\`\`

**Check state** with \`pipeline-ledger({ action: "status" })\` and \`pipeline-ledger({ action: "coverage" })\`.

A pass whose ledger file is **missing, empty, or carries a verdict other than \`Pass\`** is **OUTSTANDING**. The cycle must not mark chapters \`[X]\` Done and must not report completion while any pass is outstanding — name the outstanding pass and run it.

## Execution Steps

### 1. Resolve Scope

Parse \`{userInput}\` and collect target chapters. Sort by chapter number. Take up to 6.

### 2. Check Current Sub-Status

For each chapter, read \`./book/tasks.md\` and determine current sub-status:

| Status | Cycle Resumes At |
|--------|------------------|
| \`[ ]\` Pending | Step 3 (Draft) |
| \`[/]\` In Progress | Step 3 (Draft — continue) |
| \`[FR]\` For Review | Step 4 (Critique) |
| \`[CR]\` In Critique | Step 4 (Critique — continue) |
| \`[RV]\` Revision Planned | Step 5 (Revise) |
| \`[R]\` Revised | Step 6 (Edit) |
| \`[ED]\` Edited | Step 7 (Post-edit critique–revise cycles) |
| \`[PE]\` Post-Edit Checks | Step 7 (Post-edit critique–revise cycles — continue) |
| \`[X]\` Done | Skip — nothing to do |

### 3. Batch Draft Phase

Run the \`/buchbinder draft\` batch workflow for all chapters needing drafting:
- Pre-draft gate (shared context loaded ONCE)
- XML-structured drafting (per chapter)
- Post-draft gate (per chapter)
- Style sheet check (per chapter)
- Save clean prose + XML version (per chapter)
- Update tracking between chapters for continuity

**Gates stop the entire batch.** If any chapter fails a gate, fix it before continuing.

Update task status to \`[FR]\` for all drafted chapters.

### 4. Batch Critique Phase

Run the \`/buchbinder critique\` batch workflow for all chapters that just completed drafting:
- Auto-select mode based on chapter position; **pre-edit defaults to \`comprehensive\`** (all applicable readers)
- **Run every reader/pass required by the mode** — alpha, beta, peer (if applicable), sensitivity (if applicable) for \`comprehensive\`/\`all-readers\`; all 5 personas for \`personas\`; defender/challenger/synthesis for \`adversarial\`; all 4 analysts for \`swarm\`
- Execute via the swarm or sequential subagent model above (same artifacts either way)
- Specificity gate (reject vague items)
- Save per-reader reports + coverage checklist + consolidated report

**Gate (HARD): the coverage checklist must show every required reader as \`complete\` with an item count, and \`readers/<reader>.md\` must exist for each.** Verify with \`pipeline-ledger({ action: "coverage" })\` — read the result from disk, not from memory. If any required reader is missing, the cycle **stops here** and reports which readers are outstanding. Do not proceed to revise, do not treat a single reader's report as the round, and do not ask the user whether to run the remaining readers — the mode already decided that.

**Gate: If no specific items generated across all readers, report: "Critique produced no actionable items. Chapters may be ready for edit." Proceed to Step 6.**

Update task status to \`[CR]\` then \`[RV]\`.

### 5. Batch Revise Phase

Run the \`/buchbinder revise\` batch workflow for all chapters with critique feedback:
- Load critique items (ONCE for batch) — all readers' items, cross-referenced by ID
- Categorise and plan revisions
- Apply revisions (per chapter)
- Revision-verify gate (batch-wide — every Critical item across all chapters must be addressed)

**Gate: If revision-verify gate fails, STOP. Report unaddressed items.**

Update task status to \`[R]\`.

### 6. Batch Edit Phase

Run the \`/buchbinder edit\` batch workflow for all revised chapters:
- Style sheet enforcement (hard block, loaded ONCE)
- Generate line-level edit suggestions (per chapter)
- Auto-approve Clarity and Error suggestions (objective improvements)
- Hold Polish, Voice, Style suggestions for user review
- **Run all three passes — line-edit, copy-edit, and proofread.** Proofread is part of this phase, not a follow-up task.

**Gate: Style sheet violations auto-fixed, then re-checked. If still violations, STOP.**

**Note:** Unlike interactive edit, the cycle auto-applies Clarity and Error fixes but does NOT auto-apply subjective suggestions. These are flagged for later review.

Update task status to \`[ED]\`.

### 7. Post-Edit Critique–Revise Cycles (MANDATORY — before Done)

After editing, run **each** of the following as its own **independent critique–revise cycle** (critique → revise → re-check) over the batch, up to 3 cycles each, exactly as specified in the corresponding phase. **Run them in this canonical order** so handoffs and ledgers stay wired to the same sequence.

| Order | Pass | Source phase / command | Ledger id | What it checks |
|------:|------|------------------------|-----------|----------------|
| 1 | **Proofread verification** | Edit Pass 3 criteria (performed by this cycle) | \`proofread-verification\` | Re-scan the *edited* text: typos, orphan/widow lines, spacing, scene-break and numbering consistency, name/place/term spelling |
| 2 | **Continuity** | \`/buchbinder verify continuity\` | \`continuity\` | Character state, timeline, plot threads, location, relationships, props, knowledge state, voice continuity across the batch and adjacent chapters |
| 3 | **Pacing** | \`/buchbinder pacing-audit\` | \`pacing\` | Pace curve, plateau detection, beat rhythm |
| 4 | **Hooks and transitions** | \`/buchbinder hook-review\` | \`hooks\` | Weak or missing hooks between chapters/scenes, momentum drops |
| 5 | **Read-through** | \`/buchbinder read-through\` | \`read-through\` | Belief breaks, immersion breaks, trust failures, deus ex machina, plot armour |

**Rules for this step:**
- **Resume-aware:** before running, call \`pipeline-ledger({ action: "status" })\` and read which post-edit ledgers already record verdict \`Pass\` for the relevant scope. Skip any pass whose ledger already passes; run only the outstanding passes (in order). Do not mark a skipped pass complete without a passing ledger on disk.
- **Proofread verification** is the post-edit re-scan of the edited text (Edit Pass 3 criteria). It is performed and recorded by this cycle — the edit phase does **not** write \`./book/pipeline/proofread-verification.md\`.
- Each pass runs to its own verdict (**Pass**) before the cycle continues to the next pass. A failing pass is fixed and re-checked — never skipped because another pass "covered" it.
- Contradictions and hard-block failures are **hard blocks**: fix them before proceeding.
- Subagents may run these passes in parallel (swarm) or one after another (sequential); each pass must still return its own verdict and its own ledger write. If run in parallel, treat the batch as passing only when every pass's ledger shows \`Pass\`.
- **Record every passing pass in the ledger** with \`pipeline-ledger({ action: "write", pass: "<pass-id>", ... })\` — proofread verification → \`proofread-verification\`, continuity → \`continuity\`, pacing → \`pacing\`, hooks → \`hooks\`, read-through → \`read-through\`.
- If a pass is still failing after 3 cycles, **stop** and report the remaining blockers with evidence. Do not mark chapters Done.

\`\`\`markdown
# Proofread Verification — Pipeline Ledger

**Pass**: proofread-verification
**Verdict**: [Pass / Conditional / Fail]
**Cycles**: [N]
**Scope**: Chapters [start]–[end] ([N] chapters)

## Findings Summary
| ID | Severity | Chapter | Issue | Resolution |
|---|---|---|---|---|

## Remaining Blockers
[none, or the unresolved findings after the final cycle]
\`\`\`

Update task status to \`[PE]\` while these runs are in flight, then \`[X]\` when all pass.

### 8. Continuity Confirmation (batch-wide)

Re-run the batch-wide continuity scan across the batch AND adjacent chapters after the post-edit revisions:
- Check character state continuity between all chapters in batch
- Check timeline continuity
- Check plot thread tracking
- Check voice drift

**Gate: If contradictions found, STOP. Report contradictions.**

### 9. Mark Done

Only when every stage above has passed for every chapter in the batch **and** the ledger confirms it:

1. Call \`pipeline-ledger({ action: "status" })\` and read the result from disk.
2. Every mandatory pass must read \`complete\` (ledger file present, verdict \`Pass\`).
3. Only then:
   - Update task status to \`[X]\` (Done) for all chapters in batch
   - Save checkpoint
   - Report batch cycle completion

**If any mandatory stage is outstanding, do not mark Done and do not report completion.** Report the outstanding stage explicitly (e.g. "Post-edit proofread verification has not run — chapters remain \`[PE]\`"). A pass that ran but left no ledger file counts as outstanding; write the ledger file rather than assuming the pass happened.

### 10. Batch Cycle Report

\`\`\`markdown
## Batch Editorial Cycle Report

**Scope**: Chapters [start]–[end] ([N] chapters)
**Pipeline**: Draft → Critique (all required readers) → Revise → Edit (line/copy/proofread) → Post-edit cycles → Continuity → Done

**Critique reader coverage** (mode: [mode]):
| Reader/Pass | Status | Items |
|-------------|--------|-------|
| alpha | complete | [N] |
| beta | complete | [N] |
| peer | complete / n/a | [N] |
| sensitivity | complete / n/a | [N] |

| Chapter | Draft | Critique | Revise | Edit | Post-edit cycles | Continuity | Status |
|---------|-------|----------|--------|------|------------------|------------|--------|
| 3 | ✓ | ✓ 3 items (4 readers) | ✓ 2 fixed | ✓ 8 applied | ✓ proofread, continuity, pacing, hooks, read-through | ✓ | [X] Done |
| 4 | ✓ | ✓ 5 items (4 readers) | ✓ 4 fixed | ✓ 6 applied | ✓ proofread, continuity, pacing, hooks, read-through | ✓ | [X] Done |
| 5 | ✓ | ✓ 2 items (4 readers) | ✓ 2 fixed | ✓ 10 applied | ✗ hooks failed after 3 cycles | — | [PE] Blocked |

**Gates**: All passed (or: Chapter 5 hook-review failed after 3 cycles — [N] blockers remain)
**Word counts**: [total before] → [total after]
**Critique items**: [N] generated across [K] readers, [M] specific, [L] applied
**Edit suggestions**: [N] auto-applied, [M] flagged for review
**Post-edit cycles**: [pass] proofread, [pass] continuity, [pass] pacing, [pass] hooks, [pass] read-through

**Remaining**: [K] pending chapters. Run \`/buchbinder cycle\` for the next batch.
\`\`\`

### 11. Next Steps (Auto-Handoff)

After the batch cycle completes, offer to automatically continue. Use the \`question\` tool:

Question varies by result:
- **All passed** (every mandatory stage and ledger for this batch is \`Pass\`): "Batch cycle complete. [N] chapters done. Continue?"
  - **Yes — Cycle next batch** → Run \`/buchbinder cycle\` again (call buchbinder-router route) when pending chapters remain
  - **Yes — Review** → Run \`/buchbinder review\` (call buchbinder-router route) — only when all mandatory post-edit ledgers are \`Pass\` and no pending batch work remains in scope
  - **No — I'll continue later** → Stop
- **Partial**: "Batch stopped at chapter [N] due to [gate failure/outstanding pass]. Continue?"
  - **Yes — Re-run cycle** → Run \`/buchbinder cycle\` / \`/buchbinder cycle [N]\` (call buchbinder-router route) to resume at the outstanding pass
  - **No — I'll fix manually** → Stop

If the user selects, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute it immediately.

**Sequence awareness:** do not offer \`/buchbinder review\` or \`/buchbinder publish\` while any mandatory pass is outstanding; do not offer \`/buchbinder publish\` directly after cycle (publish follows a passing review). **Do not offer "proofread pass", "compile/export", or other cleanup steps as free-floating next steps** — proofread and the post-edit passes are part of this pipeline and have already run (or the cycle is blocked on them). The only legitimate next steps are the next batch, the review phase (when eligible), or stopping.

## Supplement Skills

Uses skills from draft, critique, revise, edit, verify, pacing-audit, hook-review, and read-through phases.`,
  tools: ["loadSkill", "bash", "task", "question"],
  relatedSkills: ["developmental-editor", "audience-surrogate", "domain-expert", "cultural-consultant", "pre-draft-checklist", "continuity-auditor", "forgotten-elements", "style-enforcer", "swarm-orchestrator"],
  examples: [
    { input: "/buchbinder cycle", approach: "Runs the full mandatory pipeline for all pending chapters (up to 6): draft→critique (every required reader)→revise→edit (line/copy/proofread)→post-edit critique-revise cycles→continuity→done" },
    { input: "/buchbinder cycle 3-8", approach: "Cycles chapters 3 through 8 through the full mandatory pipeline" },
    { input: "/buchbinder cycle Chapter 5", approach: "Single-chapter override — cycles only chapter 5" },
    { input: "/buchbinder cycle all", approach: "Cycles ALL pending chapters regardless of batch limit" }
  ],
  warnings: [
    "The pipeline is complete only when every mandatory stage passed: all required critique readers, revision, all three edit passes (including proofread), and the post-edit critique-revise cycles (proofread verification, continuity, pacing, hooks, read-through)",
    "Critique runs EVERY reader/pass required by the mode — no single-reader shortcut, and never ask whether to run the remaining readers",
    "Multi-reader passes may run as parallel subagents (swarm) or sequential subagents with collected reports — both must produce per-reader files and a coverage checklist",
    "A missing or empty reader report means the round is incomplete — the cycle stops at the critique stage",
    "Proofread is part of the edit phase; there is no optional leftover proofread step after the pipeline",
    "Batch mode is the DEFAULT — single-chapter requires explicit chapter number",
    "Gates between each step are HARD BLOCKS — failures stop the entire batch",
    "Cycle auto-applies Clarity and Error edit suggestions but NOT subjective suggestions",
    "Shared context (manifest, style sheet, tracking) is loaded ONCE per phase, not per chapter",
    "Batch stops on first gate failure — fix the failed chapter before continuing the batch"
  ]
}

export default spec
