import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "outline",
  description: "Build a fine-grained chapter outline with scene beats, setup/payoff chains, and continuity anchors. Structural gate plus a continuity and early-phase fidelity critique/revision loop block until the outline is coherent and draft-ready.",
  reminder: "Phase 5: Fine-grained chapter structure with structural gate and continuity/fidelity review cycle",
  phases: "5",
  detailedDescription: `# User Input: {userInput}

## Objective

Produce a **fine-grained** outline that gives the drafting phase enough scaffolding to maintain continuity without holding the entire book in active memory. Each chapter entry specifies scene-level beats, what it carries forward from earlier chapters, what it sets up for later chapters, and continuity anchors (characters present, timeline position, open threads).

A structural gate checks the outline is dense enough. If it fails, the outline is revised and re-gated, up to 3 cycles. After the structural gate passes, run a **continuity and fidelity-to-early-generative-phases critique and revision loop** (up to 3 cycles). The draft phase will not proceed until both the structural gate and the continuity/fidelity review pass.

## Why Fine-Grained?

A coarse outline ("Chapter 5: They argue and reconcile") forces the LLM to improvise details during drafting — and those improvisations contradict other chapters. A fine-grained outline pre-declares the moving parts so the drafting LLM only needs to load the relevant slice (this chapter's entry plus its setup/payoff references), not the whole book.

## Track Adaptations

| Aspect | Fiction | Non-fiction | Mixed |
|--------|---------|-------------|-------|
| Structural unit | Chapter, scene, saga, arc | Section, chapter, part | Both, with cross-reference markers |
| Core drivers | Plot, character arc, pacing | Argument, evidence, thesis progression | Narrative + argument |
| Pacing elements | Tension, foreshadowing, release | Complexity, scaffolding, synthesis | Both balanced |
| Scene beats | Scene goal + conflict per scene | Section claim + evidence per section | Both |
| Setup/payoff | Foreshadowing → payoff chains | Prerequisite → synthesis chains | Both |
| Tracking init | Character state, plot, timeline | Source index, argument status | Both |
| Output | \`outline.md\` with per-chapter scene beats and anchor map | \`outline.md\` with per-section claim/evidence beats | \`outline.md\` with dual hierarchy |
| Scene preview (fiction) | Each scene beat carries a rendered prose \`**Preview:**\` in the writing style key | — | — |

## Pre-Execution: Load Relevant Lore Context (CRITICAL)

Before loading source documents, retrieve the most relevant lore context for this outlining task. The full lorebook may be large (hundreds of KB), but only a small subset is relevant to the current work.

**Run the lore query script:**
\`\`\`bash
bun .opencode/lib/scripts/lore-query.mjs \
  --query "Outline for [book title] — characters, world, timeline, and terminology relevant to structuring a [N]-chapter [fiction/non-fiction] book" \
  --top 5 --rerank
\`\`\`

This uses local in-process ONNX models (Xenova/bge-base-en-v1.5 for embedding, Xenova/bge-reranker-base for reranking) to find the lore entries most relevant to this outlining task. Only the top 5 most relevant chunks are returned — this keeps the prompt lean while ensuring critical lore is present.

**What the script checks:**
- \`./series/lorebook/characters.md\` — Character profiles spanning all books
- \`./series/lorebook/world.md\` — World-building, geography, history, rules
- \`./series/lorebook/glossary.md\` — Terms, names, places, concepts
- \`./series/lorebook/timeline.json\` — Series-wide timeline events
- \`./series/lorebook/threads.md\` — Cross-book plot threads and arcs
- \`./book/knowledge/character-profiles.md\` — This book's character profiles
- \`./book/knowledge/voice-profiles.json\` — Character voice patterns
- \`./book/knowledge/locations.md\` — Location descriptions
- \`./book/knowledge/world-rules.md\` — This book's world rules

If the script outputs nothing (no lore files exist, or all models are unavailable), proceed without lore context. In that case, also check for the older manual lore files listed below as a fallback.

**Fallback (if script unavailable):** Read each lore file directly with \`bash\`/\`cat\`. The lorebook takes precedence over any conflicting outline details — if a character's lorebook profile says they're a trained soldier but the outline drafts them as a fumbling amateur, the lorebook wins.

## Prerequisites

- Fiction: \`./book/specification.md\` must exist
- Fiction: \`./book/metadata/style-key.md\` must exist and be author-approved (generated at constitution by \`/buchbinder manifest\`) — the scene previews are written in this key
- Non-fiction: \`./book/research/\` should have source notes
- \`./book/constitution.md\` must exist (for pacing strategy reference)

## Execution Steps

### 1. Load Source Documents (Fidelity Baselines)

Read and treat the following as **fidelity baselines** for the outline — every later continuity/fidelity review checks against them:

- \`./book/constitution.md\` — thematic statement, principles, pacing strategy, voice/tone commitments
- \`./book/specification.md\` (fiction) or \`./book/research/\` notes (non-fiction) — premise, stakes, conflict/thesis, character arcs, promised turns/end-state, scope, evidence commitments
- \`./book/metadata/style-key.md\` (fiction) — preview voice
- Clarification/decision artifacts if present (e.g. \`./book/clarifications.md\`, resolved notes in metadata/tracking)
- Ideation artifacts if present (e.g. \`./book/ideation.md\`, \`./book/metadata/ideation*\`) — intent, rejected directions, core spark
- Lore/knowledge context loaded above
- Any existing knowledge/tracking files

Note the constitution's pacing strategy — the outline's pacing distribution and substantive rhythm will be checked against it.

### 2. Determine Structure

Interview the user to establish the high-level structure. Use the \`question\` tool for all interview questions:

**Fiction:**
- Number of major arcs or sagas
- Estimated chapter count per arc
- Pacing strategy (from constitution)
- Key plot turns, midpoint, climax positioning
- Character arc milestones per act

**Non-fiction:**
- Number of parts or sections
- Estimated chapter count per section
- Thesis progression: what each chapter proves or establishes
- Evidence density per chapter
- Synthesis and conclusion placement

**Mixed:**
- Narrative arc with embedded expository chapters
- Where citations appear and at what density
- How narrative and argument support each other

### 3. Build Fine-Grained Chapter Map

For each chapter/section, produce an entry with ALL of the following fields. This is the required format — the quality gate checks for each field.

#### Required Per-Chapter Format

\`\`\`markdown
## Chapter N: [Working Title]

**Pacing:** [Action | Rising | Calm | Climax | Resolution]
**Timeline:** [Date/elapsed time in story]
**Characters Present:** [List of characters in this chapter]
**Open Threads:** [Plot threads carried into this chapter — e.g. "Treason investigation", "Elena's missing sister"]

### Scene Beats

- **Scene 1:** [One-line goal]. Conflict: [One-line conflict].
  **Preview:** [One to two sentences of *actual book prose* for this scene, written in the writing style key — a sample of the scene, not a summary of it.]
- **Scene 2:** [One-line goal]. Conflict: [One-line conflict].
  **Preview:** [Rendered prose sample, in the key.]
- **Scene 3:** [One-line goal]. Conflict: [One-line conflict].
  **Preview:** [Rendered prose sample, in the key.]

### Setup / Payoff

**Sets up:** [What this chapter sets up for later — e.g. "Ch7: reveal traitor", "Ch10: battle at the bridge"]
**Payoff from:** [What earlier setup this chapter pays off — e.g. "Ch2: planted dagger", "Ch4: overheard conversation"]

### Continuity Anchors

**Key objects:** [Objects that matter for continuity — e.g. "The sealed letter", "Vey's broken sword"]
**State changes:** [What changes in this chapter — e.g. "Kira discovers the map", "Jin is wounded"]
**Carry-forward:** [What must be remembered when drafting later chapters — e.g. "Kira now knows Jin is wounded — she will act protective in Ch6"]
\`\`\`

**Minimum 2 scenes per chapter.** Each scene must have a goal (what the scene accomplishes) and a conflict (what opposes it). Vague one-liners without goal/conflict fail the gate.

**Scene Preview (fiction only).** Each scene beat also carries a \`**Preview:**\` — one or two sentences of the book's *actual prose* in the writing style key (\`./book/metadata/style-key.md\`), rendering that scene rather than describing it.

This is the whole point of previewing at outline time: the author reads the finished surface while it is still free to change. The style key is cheapest to fix here — a preview that reads wrong means the key is wrong, and revising a key costs minutes while revising forty thousand drafted words costs days. A preview must be prose in the key; a summary ("they argue in the rain") is not a preview and fails the gate. Non-fiction sections do not carry previews.

**Setup/payoff chains:** Every chapter except the first must declare at least one \`payoff-from\` reference pointing back to a chapter that set it up. Every chapter except the last must declare at least one \`sets-up\` reference pointing forward to a chapter that pays it off. The first chapter may have an empty payoff-from; the last may have an empty sets-up.

**Bidirectional check:** If Chapter 3 says "sets-up: Ch7: reveal traitor", then Chapter 7 must say "payoff-from: Ch3: reveal traitor". Mismatched pairs are a hard block — they indicate a broken setup chain.

**Continuity anchors** are what the draft phase loads as the "awareness map" for each chapter. They let the LLM know what came before and what comes after without rereading the whole book.

### 4. Pacing Distribution

Verify the pacing tag distribution matches the constitution's pacing strategy. For example, a Balanced (2:1) pacing should have roughly twice as many Rising/Action chapters as Calm/Resolution chapters.

A lopsided distribution (all Rising, no Calm; or all Calm, no Rising) is a hard block for books with 4+ chapters.

### 5. Outline Quality Gate (HARD BLOCK — Structural)

Run the outline gate. The gate checks:

| Check | Requirement | Block Level |
|-------|-------------|-------------|
| Scene beats | Min 2 scenes per chapter, each with goal + conflict | Hard |
| Setup declarations | Every non-final chapter has ≥1 \`sets-up\` | Hard |
| Payoff declarations | Every non-first chapter has ≥1 \`payoff-from\` | Hard |
| Setup/payoff bidirectional | Every sets-up has a matching payoff-from | Hard |
| Characters present | Declared per chapter | Hard |
| Timeline position | Declared per chapter | Hard |
| Pacing tag | Declared per chapter | Hard |
| Pacing distribution | Not lopsided (4+ chapters) | Hard |
| Open threads | Declared for middle chapters | Warning |
| Scene previews (fiction) | Every scene beat carries a non-empty \`**Preview:**\` in the writing style key | Hard (fiction) |
| \`./book/outline.md\` exists | File present on disk, non-empty | Hard |
| \`./book/outline/chapter_NN.md\` per chapter | One file per chapter, non-empty | Hard |
| \`./book/outline/_index.json\` valid | Parseable JSON, lists every chapter | Hard |

**If the gate fails, STOP. Report each blocking issue with the specific chapter and field. Do not proceed to task-manager.**

### 5b. Outline File Recovery (CRITICAL)

If the outline files are missing or stale, the user must be informed explicitly. If the gate detects a missing \`outline.md\` but \`./book/outline/chapter_NN.md\` files exist, the agent can re-derive \`outline.md\` from the per-chapter files. Conversely, if \`outline.md\` exists but the per-chapter files are missing, re-derive them. Never silently treat a missing file as "fine, agent has it in memory" — the disk is the source of truth.

### 6. Structural Revision Cycle (if gate fails)

If the structural gate fails:

1. **Report all blocking issues** — list each failed check with the chapter number and field
2. **Revise the outline** — address every blocking issue:
   - Add missing scene beats with goals and conflicts
   - Add missing setup/payoff declarations
   - Fix broken setup/payoff chains (ensure bidirectional references)
   - Add missing continuity anchors (characters, timeline, open threads)
   - Add missing pacing tags
   - Fix pacing distribution if lopsided
3. **Re-run the gate**
4. **Repeat up to 3 cycles.** If the gate still fails after 3 revision cycles, stop and report: "Outline structural gate failed after 3 revision cycles. Manual review needed — the outline has persistent structural gaps."

Do not proceed until the structural gate passes.

### 7. Persist Structurally-Passing Outline Draft (REQUIRED)

Before substantive review, **write/update the outline on disk** so the review cycle operates on persisted truth:

- \`./book/outline.md\`
- \`./book/outline/chapter_NN.md\` for every chapter
- \`./book/outline/_index.json\`

Follow the dual-format and file-existence requirements in Step 9. Re-save these files after every revision in Step 8.

### 8. Continuity & Early-Phase Fidelity Review Cycle (HARD BLOCK)

After the structural gate passes, run a **critique and revision loop** focused on **continuity** and **fidelity to early generative phases**. This is a substantive review of whether the outline is internally coherent and faithful to what earlier phases established — not just mechanically complete.

#### 8a. Critique — Continuity

Evaluate the full outline for internal consistency and causal coherence:

| Continuity check | What to verify | Examples of failure |
|------------------|----------------|---------------------|
| Timeline & progression | Chapter timelines advance plausibly; elapsed time, ordering, and before/after states are consistent | Character appears in two places in incompatible windows; "three days later" contradicts stated events; climax occurs before required setup time |
| Character state & presence | Characters present match scenes; motivations, knowledge, injuries, relationships, and arcs progress coherently | Absent character acts in-scene; wound/secret forgotten; arc milestone skipped or reversed without cause |
| Open threads & resolution | Threads introduced are tracked, escalated, paid off, or intentionally carried forward | Thread dropped with no payoff/carry-forward; resolution appears without setup; final chapter leaves critical thread unaccounted for |
| Setup/payoff causality | Bidirectional links are not just labels — the setup actually enables the payoff | "Sets up reveal" but no planted information/condition; payoff contradicts planted facts |
| Knowledge & carry-forward | State changes and carry-forward anchors propagate into later chapter behavior/assumptions | Later chapter ignores a revealed secret or state change declared earlier |
| World/rules consistency | Locations, objects, rules, constraints, and lore remain consistent across chapters | Object/location state contradicts earlier anchor; rule established earlier is violated without acknowledged exception |

#### 8b. Critique — Fidelity to Early Generative Phases

Evaluate the outline against the baselines loaded in Step 1. Flag drift, contradictions, and dropped commitments:

| Baseline | Fidelity check |
|----------|----------------|
| **Ideation** (if present) | Core spark/premise intent, chosen direction, and key "must keep"/"must avoid" decisions are preserved (not silently replaced by a different story) |
| **Constitution / manifest** | Thematic statement, principles, pacing strategy, tone/voice commitments, and non-negotiables are honored; chapter structure advances the stated theme/argument |
| **Specification** (fiction) | Premise, central conflict, stakes, protagonist goal/arc, antagonist/force, promised turns, world rules, and intended end-state are all represented and causally reachable |
| **Clarifications** | Resolved ambiguities and explicit author decisions are reflected (not reopened or contradicted) |
| **Research** (non-fiction/mixed) | Thesis progression, evidence commitments, source-backed claims/sections, and scope boundaries are honored; no unsupported drift from researched plan |

**Severity:**
- **Critical** — contradicts a baseline/non-negotiable, breaks core continuity/causality, drops a required promise/arc/thread, or makes the outline undraftable without confusion
- **Major** — significant drift, weak/unclear fidelity, or continuity gap likely to cause drafting errors
- **Minor** — small clarity/alignment issue; note but does not block if Critical/Major are clear

#### 8c. Review Report (REQUIRED each cycle)

For each cycle, produce a structured report and save it to \`./book/outline/review-round-N.md\` (N increments from 1):

\`\`\`markdown
## Outline Review — Round [N] (Continuity & Fidelity)

| ID | Severity | Category | Location | Issue | Baseline/Evidence | Required revision |
|----|----------|----------|----------|-------|-------------------|-------------------|
| OF-001 | Critical | Fidelity: Specification | Ch3, Ch9 | Protagonist arc milestone "accepts leadership" never occurs | specification.md: character arc requires acceptance by midpoint | Add scene/state change in Ch5-6 and carry-forward into Ch9 |
| OF-002 | Major | Continuity: Timeline | Ch7 | "Next morning" conflicts with Ch6 ending "three days later" | Ch6 timeline/anchors vs Ch7 timeline | Reconcile timeline and dependent anchors |

**Summary:** Critical=[n], Major=[n], Minor=[n]
**Result:** PASS / REVISE / FAIL
\`\`\`

#### 8d. Revise and Re-Critique Loop

1. **Revise the outline** to address every **Critical** and **Major** finding. Update scene beats, anchors, setup/payoff, pacing, character/state progression, and chapter intent as needed to restore continuity and fidelity (while keeping the structural gate satisfied).
2. **Re-save** \`./book/outline.md\`, all \`./book/outline/chapter_NN.md\`, and \`./book/outline/_index.json\` after revisions.
3. **Re-run**: (a) structural gate sanity check (revisions must not break it), then (b) continuity/fidelity critique.
4. **Repeat up to 3 cycles.** A cycle passes when there are **0 Critical and 0 Major** continuity/fidelity findings and the structural gate still passes.

**Hard block:** If Critical or Major continuity/fidelity issues remain after 3 cycles, **STOP** and report: "Outline continuity/fidelity review failed after 3 cycles. Manual review needed — unresolved issues remain against early generative phases and/or internal continuity." Do not proceed to tracking/task-manager handoff.

Minor findings may be recorded in the final review report for author awareness but do not block progression.

### 9. Save Outline — Dual Format (CRITICAL for disaster recovery)

The outline is the **single source of truth** for the entire book. If anything in the generation process is lost (session crash, agent memory overflow, model change, restart from scratch), the outline on disk is what lets work resume without re-deriving the entire plot from scratch.

For that reason the outline is saved in **TWO complementary formats**, both required (and kept current through Step 8 revisions):

#### 9a. \`./book/outline.md\` — Human-editable single file

The full outline as one markdown document. This is the file the user opens to read the whole book at a glance, make sweeping edits, or print out. Keep it under ~500 lines if possible; if it grows beyond that, see 9c.

#### 9b. \`./book/outline/chapter_NN.md\` — Per-chapter files (REQUIRED)

One file per chapter in \`./book/outline/\`. Each file contains the full chapter entry from the spec (pacing, timeline, characters, open threads, scene beats, setup/payoff, continuity anchors). The user can open any one of these in their editor to focus on a single chapter without scrolling through 500+ lines.

Filenames are zero-padded: \`chapter_01.md\`, \`chapter_02.md\`, …, \`chapter_15.md\`. Each file is a complete, standalone chapter entry — never a fragment.

Non-fiction: \`section_01.md\`, \`section_02.md\`, … (or \`chapter_NN.md\` if you prefer that naming).

#### 9c. \`./book/outline/_index.json\` — Machine-readable index (REQUIRED)

A JSON index the agent loads to know which file maps to which chapter. Schema:

\`\`\`json
{
  "version": 1,
  "generated_at": "2026-07-11T00:00:00Z",
  "track": "fiction",
  "total_chapters": 15,
  "chapters": [
    {
      "number": 1,
      "title": "The Cave",
      "file": "chapter_01.md",
      "pacing": "Calm",
      "arc": "Survival",
      "characters": ["Fubiki", "Hika"]
    },
    { "...": "..." }
  ]
}
\`\`\`

The drafting phase reads this index to load just one chapter's outline without parsing the whole document. The gate verifies this file exists and lists every chapter.

#### 9d. File Existence Gate (HARD BLOCK)

Before proceeding to task-manager, **verify all required files exist** on disk:

| File | Existence | Content sanity |
|------|-----------|----------------|
| \`./book/outline.md\` | MUST exist | Non-empty, contains chapter headings |
| \`./book/outline/\` directory | MUST exist | Directory present |
| \`./book/outline/chapter_NN.md\` | MUST exist for every chapter (1..N) | Non-empty, contains scene beats |
| \`./book/outline/_index.json\` | MUST exist | Valid JSON, every chapter listed |
| \`./book/outline/review-round-*.md\` | MUST exist when review ran | At least the final continuity/fidelity review report present |

If any file is missing or malformed, do **not** proceed. Re-run the save step until every file is on disk. The outline is not "done" until the user can \`ls book/outline/\` and see one file per chapter plus the index.

#### 9e. Disaster Recovery Contract

The outline directory must be **regenerable from \`outline.md\` alone**. If the per-chapter files or index are ever lost, the user can run:

\`\`\`
# (Internal helper, see bin/scripts/split-outline.mjs)
\`\`\`

…or simply ask the agent: "Split book/outline.md into per-chapter files." The agent must re-derive \`./book/outline/chapter_NN.md\` and \`_index.json\` from the single source-of-truth file. This makes \`book/outline.md\` the canonical root, and the per-chapter files a derivable cache.

#### 9f. \`./book/tracking/plot-tracker.json\` Cross-Reference

The outline and the tracking system must agree. After saving the outline, write a cross-reference to \`./book/tracking/plot-tracker.json\` (or update the existing one) with:

\`\`\`json
{
  "outline_file": "./book/outline.md",
  "outline_index": "./book/outline/_index.json",
  "chapter_count": 15,
  "last_outline_update": "2026-07-11T00:00:00Z"
}
\`\`\`

This makes the plot tracker know where to find the canonical outline.

### 10. Initialise Tracking

After the outline is saved and both the structural gate and continuity/fidelity review pass, create \`./book/tracking/\` files from templates:

- Fiction: \`character-state.json\`, \`plot-tracker.json\`, \`timeline.json\`, \`relationships.json\`, \`validation-rules.json\`
- Non-fiction: \`source-tracker.json\`, \`argument-progression.json\`
- Mixed: Both sets

### 11. Next Steps (Auto-Handoff)

After the outline is saved and gates/review pass, offer to automatically continue. Use the \`question\` tool:

Question: "Outline saved and gates/review passed. Continue to task breakdown?"
Options:
- **Yes — Task Manager** → Run \`/buchbinder task-manager\` (call buchbinder-router route for \`task-manager\`)
- **No — I'll continue later** → Stop

If the user selects, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: "task-manager"\` and execute it immediately.

## Gate Evidence

The structural gate produces evidence, not just pass/fail. Each check reports what it found:

\`\`\`
✓ Chapter 1: 3 scenes with goals and conflicts
✓ Chapter 1: Sets up 2 future payoff(s)
✓ Chapter 1: Characters present declared
✗ Chapter 3: 1 scene beat(s) — minimum 2 required
✗ Chapter 5: No "sets-up" declarations — must set up at least one future payoff
✗ Chapter 5 ← Chapter 2: Payoff declared, but Chapter 2 does not declare "sets-up: Chapter 5". Broken payoff chain.
\`\`\`

The continuity/fidelity review produces a per-cycle report in \`./book/outline/review-round-N.md\` with severity, category (Continuity / Fidelity:<baseline>), location, baseline evidence, and required revision. A passing final cycle has 0 Critical and 0 Major findings.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`author-voice-key\` | \`skills/fiction/writing-techniques/author-voice-key/SKILL.md\` | Writing style key — renders the scene previews in the book's prose voice (fiction) |
| \`scene-architecture\` | \`skills/fiction/writing-techniques/scene-architecture/SKILL.md\` | Scene framework per chapter (fiction) |
| \`pacing-rhythm\` | \`skills/fiction/writing-techniques/pacing-rhythm/SKILL.md\` | Pacing archetype enforcement |
| \`argument-structure\` | \`skills/non-fiction/argument-structure/SKILL.md\` | Argument flow and evidence placement |
| \`strategic-reversal\` | \`skills/fiction/writing-techniques/strategic-reversal/SKILL.md\` | Reversal setup planning (fiction) |`,
  rules: [
    "Whenever the user makes a decision that alters narrative context, metanarrative, formatting, or tracking states, you MUST proactively update the relevant files in ./book/metadata/ and ./book/tracking/ before completing the turn."
  ],
  tools: ["loadSkill", "bash", "question"],
  relatedSkills: [
    "author-voice-key",
    "scene-architecture",
    "pacing-rhythm",
    "argument-structure",
    "strategic-reversal",
    "continuity-auditor",
    "consistency-checker"
  ],
  examples: [
    { input: "/buchbinder outline 3 acts, 12 chapters each", approach: "Builds a 36-chapter outline with scene beats, setup/payoff chains, and continuity anchors. Structural gate runs, then continuity/fidelity critique+revision loop checks alignment with constitution/spec and internal coherence before handoff." },
    { input: "/buchbinder outline", approach: "Interviews for structure, builds fine-grained chapter map, passes structural gate, then runs continuity and early-phase fidelity review (up to 3 cycles) against constitution/spec/clarify/research/ideation baselines." },
    { input: "/buchbinder outline 8 chapters", approach: "Builds 8-chapter outline with scene beats and anchors. Structural gate checks completeness/distribution; review cycle verifies timeline/character/thread continuity and fidelity to early generative decisions before task-manager." }
  ],
  warnings: [
    "Outline structural gate is a HARD BLOCK — task-manager phase will not proceed until the gate passes",
    "Continuity & early-phase fidelity review is a HARD BLOCK — 0 Critical/Major findings required (up to 3 critique/revision cycles) before proceeding",
    "Structural revision cycle runs up to 3 times — persistent failures require manual review",
    "Continuity/fidelity review runs up to 3 cycles — unresolved Critical/Major issues require manual review",
    "Each chapter must declare scene beats, setup/payoff chains, and continuity anchors — coarse summaries fail the gate",
    "Setup/payoff chains must be bidirectional — Chapter A 'sets-up: ChB' requires Chapter B 'payoff-from: ChA'",
    "Review must check fidelity to early generative phases (ideation/constitution/specification/clarify/research as present) and internal continuity (timeline, character state, threads, causality, carry-forward)",
    "The outline MUST be persisted to disk in BOTH formats: ./book/outline.md AND ./book/outline/chapter_NN.md per chapter — the agent's memory is NOT a substitute for the file on disk",
    "Per-chapter outline files are the user's primary editing surface — one file per chapter lets the user edit a single chapter without scrolling through the whole book",
    "./book/outline/_index.json is REQUIRED — it is the machine-readable manifest the drafting phase uses to load just one chapter's outline at a time",
    "Save review evidence to ./book/outline/review-round-N.md for each continuity/fidelity cycle",
    "The outline is the single source of truth for the entire book — if everything else is lost, ./book/outline.md is what lets work resume",
    "Fiction: every scene beat MUST carry a rendered **Preview:** in the writing style key — a summary is not a preview and fails the gate",
    "Fiction: if a preview reads wrong, revise the style key (./book/metadata/style-key.md), not just the preview — the key is what the whole book will be written in"
  ]
}

export default spec
