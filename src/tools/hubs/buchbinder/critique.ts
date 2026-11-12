import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "critique",
  description: "Batch critique by default: critique all chapters with status [FR] or up to 6 at a time. Runs every reader/pass required by the selected mode (no single-reader shortcuts). Specificity gate rejects vague feedback.",
  reminder: "Phase 8: Multi-reader structured external feedback with specificity verification",
  phases: "8",
  detailedDescription: `# User Input: {userInput}

## Objective

Simulate structured external feedback on chapters. **Batch mode is the default** — critique all chapters with status \`[FR]\` (For Review), or up to 6 at a time. Critique is distinct from self-editing — it evaluates the work as a reader or peer.

**Critical rule:** A critique run must move through **every reader/pass required by the selected mode** before producing the final consolidated report or handing off to revision/editing. Do **not** stop after the first reader, the first pass, or the first convenient perspective. Every required reader's findings must be present in the saved round.

Every critique item must pass a specificity gate: vague feedback is rejected.

## Batch vs Single Mode

| Mode | Trigger | Behaviour |
|------|---------|-----------|
| Batch (DEFAULT) | \`/buchbinder critique\` or \`/buchbinder critique <mode>\` | Critique all [FR] chapters (up to 6), running **all readers/passes** for the selected mode |
| Range | \`/buchbinder critique 3-8\` or \`/buchbinder critique <mode> 3-8\` | Critique chapters 3-8 with all required readers/passes |
| Single chapter | \`/buchbinder critique Chapter 3\` | Critique one chapter only (explicit override), still running all required readers/passes for the mode |
| All chapters | \`/buchbinder critique comprehensive all\` or \`/buchbinder critique all\` | Critique all in-scope chapters regardless of batch limit |

**Batch sizing:** When no range is specified, read \`./book/tasks.md\` and collect all tasks with status \`[FR]\` (For Review). Up to 6 per batch. If more than 6, critique the first 6 and report: "6 of [N] chapters critiqued. Run \`/buchbinder critique\` again for the next batch." Do not skip required readers to fit the batch — reduce chapter count, not reader coverage.

## Critique Modes and Reader Coverage

| Mode | Reader/pass set (all required unless noted) | Evaluates | Best for |
|------|----------------------------------------------|-----------|----------|
| \`alpha\` | Alpha reader | Structure, pacing, plot logic, character arcs, scene necessity, argument flow | Early drafts, structural issues |
| \`beta\` | Beta reader | Engagement, confusion, investment, emotional response, clarity, pacing experience | Near-complete drafts |
| \`peer\` | Peer reviewer | Domain accuracy, methodology, evidence/argument soundness, citation adequacy | Non-fiction, academic |
| \`sensitivity\` | Sensitivity reader | Representation, stereotype risk, authenticity, cultural accuracy, language | Works with marginalized perspectives |
| \`comprehensive\` | **Alpha + Beta + Peer (non-fiction or as applicable) + Sensitivity (as applicable)**, each as a separate pass | Combined structural, experience, domain, and authenticity critique | **Default pre-edit/pre-revise pass** |
| \`all-readers\` | Same as \`comprehensive\` (alias) | All standard reader perspectives | Explicit "run every reader" request |
| \`personas\` | **All 5 personas**: Genre Fan, Casual Reader, Literary Critic, Subject Expert, Skeptical Reviewer | Multi-perspective reader reception | Diverse audience reaction |
| \`cold-read\` | Cold-read pass (zero-context) | Confusion, missing context, unexplained references, assumed knowledge, lost threads | Author-knowledge blind spots |
| \`adversarial\` | **Defender + Challenger + Synthesis** (all three required) | Strengths, weaknesses, reconciled blind spots | Stress-testing before revision |
| \`swarm\` | **All 4 swarm analysts**: Structural, Prose, Continuity, Momentum/Hook (parallel dispatch, then consolidation + verification) | Deep multi-agent structural/prose/continuity/momentum analysis | High-value chapters, major revisions |

**Applicability notes:**
- For **fiction**, \`comprehensive\`/ \`all-readers\` runs **alpha, beta, and sensitivity** as separate reader passes (and include \`peer\` only when the work has domain/technical claims that require expert review).
- For **non-fiction/academic**, \`comprehensive\`/ \`all-readers\` runs **alpha, beta, peer, and sensitivity** as separate reader passes.
- If applicability is ambiguous, include the reader and note uncertainty rather than omitting it.
- **No single-reader shortcut:** even in batch mode, complete every required reader/pass for the selected mode across the batch before saving the final report.

**Auto-selection** (when mode not specified):
- Final pre-edit/pre-revise pass, late draft, or chapters > 7 → \`comprehensive\` (all applicable readers)
- All chapters in batch are early drafts (< 3 chapters exist) → \`alpha\`
- Mid-draft chapters (3-7), not explicitly pre-edit → \`beta\`
- Non-fiction track with domain/argument focus → \`peer\` (or \`comprehensive\` if pre-edit)
- If unspecified or ambiguous, ask via \`question\` tool with \`comprehensive\` as the recommended default before revision/editing

**Cold-read mode is special:** It deliberately does NOT load the constitution, specification, knowledge files, outline, or lore. Read each chapter as a reader would — with zero context. This catches passages that rely on author-only knowledge. (Other modes load shared context once per batch as specified below.)

## Prerequisites

- Drafted chapters must exist in \`./book/content/\`
- Tasks marked \`[FR]\` (For Review) or complete (or explicitly targeted chapters)

## Execution Steps

### 1. Resolve Scope and Mode

Parse \`{userInput}\`:
- \`/buchbinder critique\` → all [FR] chapters (up to 6), auto-select mode (prefer \`comprehensive\` before revise/edit)
- \`/buchbinder critique alpha\` → all [FR] chapters (up to 6), alpha reader only
- \`/buchbinder critique comprehensive 3-8\` → chapters 3-8, **all applicable readers**
- \`/buchbinder critique all-readers\` → alias for comprehensive, all applicable readers
- \`/buchbinder critique Chapter 3\` → single chapter, auto-selected mode but still all readers required by that mode
- \`/buchbinder critique comprehensive all\` → all in-scope chapters, all applicable readers

If mode is auto-selected as \`comprehensive\` for a pre-edit pass, state the reader set you will run before starting.

### 2. Load Context (once per batch)

Load shared context ONCE for the entire batch (except \`cold-read\`, which loads none of this):
- Constitution, specification/outline, knowledge, tracking
- All chapters in the batch (read all at once — context window can handle it)
- XML versions from \`./book/drafts/\` if available
- **Relevant lore context** (non-cold-read): run the lore query script to retrieve only the lore most relevant to the chapters being critiqued:
  \`\`\`bash
  bun .opencode/lib/scripts/lore-query.mjs --query "Critique context: characters, world rules, and terminology for chapters [range] of [book title]" --top 5 --rerank
  \`\`\`
  If unavailable, read \`./series/lorebook/\` and \`./book/knowledge/*\` manually.

### 3. Run Every Required Reader/Pass (HARD REQUIREMENT)

Build the reader/pass queue from the selected mode and iterate through it **in full**:

1. **For each reader/pass in order**, load the relevant supplement skill(s) and produce a complete critique for that reader across all chapters in scope.
2. **Do not merge away a reader's pass** and do not stop after the first reader. Each required reader must produce its own findings section (or an explicit "no issues found" section with brief evidence of coverage).
3. **Tag every item with reader/pass provenance** in its ID and category (e.g. \`C1-ALPHA-001\`, \`C1-BETA-003\`, \`C1-PEER-002\`, \`C1-SENS-001\`, \`C1-P1-...\` for personas, \`C1-DEF/CHA/SYN-...\` for adversarial).
4. **After all required readers/passes complete**, consolidate into a single per-chapter and batch-level report.

**Minimum reader execution by mode:**
- \`comprehensive\` / \`all-readers\`: run alpha pass, then beta pass, then peer pass (if applicable), then sensitivity pass (if applicable) — **all applicable passes completed before consolidation**.
- \`personas\`: run all 5 personas.
- \`adversarial\`: run defender, challenger, and synthesis.
- \`swarm\`: dispatch/run all 4 analysts and complete consolidation + verification.
- Single-reader modes (\`alpha\`, \`beta\`, \`peer\`, \`sensitivity\`, \`cold-read\`): run that reader fully (one pass is the full required set).

### 3a. Generate Critique Items (with Specificity Gate)

For each chapter and each reader/pass, produce structured feedback. **Every critique item must pass the specificity gate.**

\`\`\`markdown
## Chapter [N]: [Title] — Reader: [alpha|beta|peer|sensitivity|persona|...]

### [Category]: [Issue summary]
- **ID**: [Unique ID, e.g., C1-ALPHA-001, C1-BETA-002]
- **Reader/Pass**: [Which reader produced this]
- **Severity**: Critical / Major / Minor / Observation
- **Location**: [Specific paragraph number, scene number, or quoted text — NOT "early in the chapter"]
- **Effect**: [What this does to the reader experience — concrete, not abstract]
- **Recommendation**: [Specific suggested change — actionable, not "this needs work"]
- **Evidence**: [Quote the exact text that triggered this critique item]
\`\`\`

**Specificity Gate (HARD BLOCK on vague items):**

| Criterion | Pass | Fail (reject item) |
|-----------|------|--------------------|
| Location | Paragraph number, scene number, or exact quote | "somewhere in the chapter", "early on", "the opening" |
| Effect | Concrete reader experience: "reader loses tension because X" | "feels off", "doesn't work", "weak" |
| Recommendation | Specific change: "Cut paragraph 4 and merge key detail into paragraph 3" | "needs improvement", "could be stronger", "tighten this up" |
| Evidence | Exact quote from the text | No quote provided |

**If an item fails the specificity gate, reject it and do not include it in the output.**

### 3b. Anti-AI-Slop Mandate (ALL READERS, ALL MODES)

Every critique pass, regardless of reader or mode, must check for common AI-generated writing slop. These are recurring patterns that signal lazy or formulaic prose. The critic flags every instance found.

Load \`skills/quality-assurance/ai-writing-audit/SKILL.md\` and its catalog \`references/patterns.md\`; the standing rule is \`rules/ai-writing-patterns.md\`. Three sweeps run in every reader pass:

**Word-tier sweep (catalog).** Tier 1A markers (delve, leverage, tapestry, testament to, robust, seamless, pivotal, …) reviewed on every match; Tier 2 clusters (2+ in one paragraph: harness, navigate, crucial, nuanced, ecosystem, …); Tier 3 by density (significant, innovative, effective, … at \`max(3, floor(wordCount × 0.03))\`); Tier 3 phrases (boilerplate repeated 2+ times, or 3+ distinct in one piece). **Tier 1B (utilize, in order to, serves as) is a clarity fix, not authorship evidence — report it separately.**

**Structural tells.** Negation chains, same-opener sentence runs, stranded auxiliary contrasts, aphorism formulas, colon-into-a-triple, generic conclusions, hedge-stacked predictions, uniform sentence/paragraph length.

**Never-inject guardrail.** A recommended fix must subtract or sharpen. A recommendation that adds a manufactured stake, a fragment run, a forced contrarian foil, performed candor, or an invented specific is itself a defect — flag it as such. Never invent a fact to make a suggested replacement concrete.

**Signals, not proof.** AI-ism patterns are statistically more common in machine text but humans on autopilot produce the same shapes. Report the pattern, its tier, and the reason; do not assert machine authorship. **Fiction carve-outs apply** — manufactured punchlines, staccato drama, fragments, anaphora, and deliberate repetition pass when they carry voice, comedy, or tension. Judge the function, not the shape.

**Tier 1: Sensory clichés (HARD BLOCK — must-fix)**

| Pattern | Why it's slop | Fix |
|---------|--------------|-----|
| "smell/taste of ozone" | No electrical event present; LLM default for "tension" | Replace with a specific, earned sensory detail |
| "copper taste of blood" | Default blood-in-mouth descriptor; overused cliché | Use a fresh descriptor or cut if not needed |
| "the air crackled with tension" | Abstract tension made physical without earning it | Show tension through action, not atmospheric metaphor |
| "a shiver ran down [their] spine" | Stock physiological response; LLM default | Find a body-specific or situation-specific reaction |
| "eyes like [gemstone]" | Generic eye-description formula | Describe what the eyes *do*, not what they resemble |
| "lips curled into a [creature] smile" | Animal-metaphor smile; shorthand for "menacing" | Show the menace through action or dialogue |

**Tier 2: Structural tells (should-consider)**

| Pattern | Why it's slop | Fix |
|---------|--------------|-----|
| "Not [X]. Not [X] the way [Y] expected." | Fragment-emphasis overuse | Vary the emphasis technique; use sparingly if at all |
| Three consecutive sentences starting with the same word | Anaphora rhythm crutch | Vary sentence openings |
| "It wasn't just [X]. It was [Y]." | Binary-escalation default | Find a different emphasis structure |
| Every paragraph ends with a one-sentence punch line | Faux-dramatic closer habit | Let some paragraphs end quietly |
| Dialogue tag + adverb ("said angrily") | Overused tag pattern | Use action beats or subtext instead |

**Tier 3: Hollow emotional beats (your-call)**

| Pattern | Why it's slop | Fix |
|---------|--------------|-----|
| "Something shifted in [their] expression" | Vague emotional change | Name the specific micro-expression or cut the beat |
| "The weight of [abstract noun] hung in the air" | Default atmosphere phrasing | Show atmosphere through concrete detail |
| "[Character] didn't say anything. They didn't have to." | Overused mutual-understanding shorthand | Show understanding through action or cut the line |

**Reporting:** Prefix anti-slop items with \`AI-SLOP\` and include reader/pass provenance:

\`\`\`markdown
### AI-SLOP: Ozone smell without electrical event
- **ID**: C1-ALPHA-SLOP-001
- **Reader/Pass**: alpha
- **Severity**: Critical (must-fix)
- **Location**: Paragraph 7, "The ozone tang of impending violence..."
- **Effect**: Signals formulaic prose and breaks immersion
- **Recommendation**: Replace with a specific sensory detail earned by the scene context
- **Evidence**: "The ozone tang of impending violence hung between them."
\`\`\`

### 4. Categories by Reader/Mode

| Reader/Mode | Categories |
|-------------|------------|
| Alpha | Structure, Pacing, Plot Logic, Character Arc, Scene Necessity, Argument Flow (non-fiction) |
| Beta | Engagement, Confusion, Investment, Emotional Response, Clarity, Pacing Experience |
| Peer | Accuracy, Methodology, Evidence Adequacy, Argument Soundness, Citation Correctness |
| Sensitivity | Representation, Stereotype Risk, Authenticity, Cultural Accuracy, Language |
| Cold-read | Confusion, Missing Context, Unexplained References, Assuming Knowledge, Lost Threads |
| Adversarial | Strengths (defender), Weaknesses (challenger), Synthesis — reconciled agreements/disagreements |
| Personas | Genre Fan, Casual Reader, Literary Critic, Subject Expert, Skeptical Reviewer (per-persona findings) |
| Swarm | Structural, Prose/Line, Continuity, Momentum/Hook (per-analyst findings, then consolidated) |

### 4b. Adversarial Mode Execution

When mode is \`adversarial\`, run all three passes:
1. **Defender**: strengths and what must be preserved (no criticism).
2. **Challenger**: failures and what must change (no praise).
3. **Synthesis**: reconcile both, calling out agreements (high confidence) vs disagreements (author decision). All three must appear in the report.

### 4c. Personas Mode Execution

When mode is \`personas\`, run **all five** personas for each chapter in scope:
- **Genre Fan** — trope handling, pacing, satisfaction, genre promises.
- **Casual Reader** — engagement, confusion, boredom points, page-turner quality.
- **Literary Critic** — prose craft, theme, structure, subtext, language quality.
- **Subject Expert** — accuracy/authenticity/worldbuilding or factual correctness.
- **Skeptical Reviewer** — plot holes, convenience, logic, motivation, trust.

Consolidate where personas agree (likely real issues) vs disagree (taste/intent).

### 4d. Swarm Mode Execution

When mode is \`swarm\`, execute the full multi-agent pipeline:
1. **Parallel dispatch** (all four, concurrently via \`task\`): \`@deep-thinker\` + \`developmental-editor\` (Structural), \`@code-reviewer\` + \`line-editor\` and \`ai-writing-audit\` (Prose), \`@refactoring\` + \`continuity-auditor\` (Continuity), \`@deep-thinker\` + \`hook-and-transition-analyst\` (Momentum/Hook).
2. **Consolidation**: reconcile, deduplicate, and format into the master priority matrix tagged by domain.
3. **Verification**: confirm no hallucinated critiques and no violations of project metadata/manifest/constitution.

Do not finalize until all four analyst reports are received and consolidated.

### 5. Build Priority Matrix (per reader, per chapter, then consolidated)

After **all required reader passes** complete, produce:
- A per-reader/per-chapter findings section (or explicit no-issue coverage note)
- A consolidated priority matrix across all readers and chapters

| ID | Priority | Reader | Chapter | Category | Issue | Recommendation |
|----|----------|--------|---------|----------|-------|----------------|
| C1-ALPHA-001 | Critical | alpha | 3 | Structure | Scene 2 has no conflict | Add opposition force to scene 2 |
| C1-BETA-004 | Major | beta | 3 | Engagement | Tension drops after reveal | Delay explanation; hold suspense beat |

### 6. Save Critique

Save to \`./book/critique/round-N/\` where N increments. Include:
- \`summary.md\` — mode, reader/pass coverage checklist, consolidated priority matrix, and batch report
- \`readers/<reader>.md\` — per-reader consolidated findings (one file per required reader/pass; required for multi-reader modes)
- \`chapter-M.md\` — per-chapter critique consolidated across all readers
- \`rejected-items.md\` — items that failed the specificity gate (for transparency)

**Coverage checklist in summary (required):** list every reader/pass required by the mode and mark each \`complete\` with item count. A round is invalid if any required reader is missing.

### 7. Numeric Score (REQUIRED)

Every critique round produces a **numeric score** (0-100) per chapter and a batch-level score, computed from issues found across **all completed reader passes**.

Score formula per chapter: start at 100, subtract 8 per critical issue, 3 per major, 1 per minor, 0.2 per observation.

\`\`\`
batch_score = arithmetic_mean(chapter_scores)
\`\`\`

| Score | Tier | Meaning |
|-------|------|---------|
| 95-100 | Excellent | Ready to revise (or publish) |
| 85-94 | Good | Revisable with focused work |
| 70-84 | Needs work | Significant revision required |
| < 70 | Blocked | Structural problems — reconsider the chapter |

**The revise phase will refuse to mark a batch complete if batch_score < 95.**

### 7b. Score and Coverage in Batch Report

\`\`\`markdown
## Batch Critique Report

**Mode**: [mode]
**Reader coverage**: [alpha ✓, beta ✓, peer ✓/n/a, sensitivity ✓/n/a | all personas ✓ | defender/challenger/synthesis ✓ | swarm analysts ✓]
**Scope**: Chapters [start]–[end] ([N] of [M] requested)
**Specificity gate**: [N] items generated, [M] passed, [K] rejected for vagueness

| Chapter | Critical | Major | Minor | Score | Tier |
|---------|----------|-------|-------|-------|------|
| 3 | 1 | 3 | 2 | 78 | Needs work |

**Batch score**: 80.3 / 100
**Verdict**: Below 95 — revise phase must run before user is informed.
\`\`\`

### 8. Next Steps (Auto-Handoff)

After saving the critique round **with full reader coverage**, offer to continue. Use the \`question\` tool:

Question: "Critique round [N] saved. All required readers completed ([reader list]). [M] actionable items. Continue?"
Options:
- **Yes — Revise** → Run \`/buchbinder revise\` (call buchbinder-router route for \`revise\`)
- **Yes — Critique next batch** → Run \`/buchbinder critique\` again
- **No — I'll review the items first** → Stop

If the user selects, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute it immediately.

**Do not hand off to revise/edit claiming pre-edit critique is complete unless every required reader/pass for the mode has finished.**

### 9. Human-in-the-Loop Features

- **Phase Preview** (\`src/lib/phase-preview.ts\`): before critiquing, show chapters, mode, and the full reader/pass list that will run; author confirms.
- **Suggestion Severity Tiers** (\`src/lib/severity-tiers.ts\`): must-fix/should-consider/your-call/FYI (Critical/Major/Minor/Observation mapping).
- **Veto System** (\`src/lib/veto-system.ts\`): veto with \`|\` (optionally with reason); vetoed items are not re-suggested.
- **Feedback Memory** (\`src/lib/feedback-memory.ts\`): veto reasons logged as avoidance patterns for future rounds.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`alpha-reader\` | \`skills/critique/alpha-reader/SKILL.md\` | Structural critique methodology |
| \`beta-reader\` | \`skills/critique/beta-reader/SKILL.md\` | Experience critique methodology |
| \`peer-review\` | \`skills/critique/peer-review/SKILL.md\` | Peer review methodology (non-fiction) |
| \`sensitivity-reader\` | \`skills/critique/sensitivity-reader/SKILL.md\` | Sensitivity assessment methodology |
| \`audience-surrogate\` | \`skills/critique/audience-surrogate/SKILL.md\` | Reader reception/persona support |
| \`developmental-editor\` | \`skills/critique/developmental-editor/SKILL.md\` | Structural/developmental analysis (incl. swarm) |
| \`continuity-auditor\` | \`skills/critique/continuity-auditor/SKILL.md\` or QA continuity skill as applicable | Continuity analysis (incl. swarm) |
| \`hook-and-transition-analyst\` | \`skills/critique/hook-and-transition-analyst/SKILL.md\` | Momentum/hook analysis (incl. swarm) |
| \`swarm-orchestrator\` | \`skills/critique/swarm-orchestrator/SKILL.md\` | Swarm dispatch/consolidation methodology |
| \`ai-writing-audit\` | \`skills/quality-assurance/ai-writing-audit/SKILL.md\` | AI-writing pattern catalog — all passes |
| \`phase-preview\` | \`src/lib/phase-preview.ts\` | Pre-execution confirmation |
| \`severity-tiers\` | \`src/lib/severity-tiers.ts\` | Suggestion severity tiers |
| \`veto-system\` | \`src/lib/veto-system.ts\` | Veto with \`|\` key |
| \`feedback-memory\` | \`src/lib/feedback-memory.ts\` | Rejection reason memory |`,
  tools: ["loadSkill", "bash", "task", "question"],
  relatedSkills: ["alpha-reader", "beta-reader", "peer-review", "sensitivity-reader", "audience-surrogate", "developmental-editor", "swarm-orchestrator", "ai-writing-audit", "phase-preview", "severity-tiers", "veto-system", "feedback-memory"],
  examples: [
    { input: "/buchbinder critique", approach: "Critiques all [FR] chapters (up to 6) with auto-selected mode; pre-edit defaults to comprehensive (all applicable readers)" },
    { input: "/buchbinder critique comprehensive 3-8", approach: "Runs alpha, beta, peer/sensitivity as applicable for chapters 3-8, then consolidates" },
    { input: "/buchbinder critique all-readers", approach: "Alias for comprehensive — runs every applicable reader pass before completion" },
    { input: "/buchbinder critique personas Chapter 3", approach: "Runs all 5 reader personas for chapter 3, then consolidates" },
    { input: "/buchbinder critique adversarial Chapter 3", approach: "Runs defender, challenger, and synthesizer passes, then consolidates" }
  ],
  warnings: [
    'All required readers/passes must complete before consolidation or handoff to `/buchbinder revise`; no single-reader shortcut and no partial reader set is sufficient for comprehensive/final/pre-edit critique. Coverage checklist and per-reader outputs/consolidated report gate required for full/final/pre-edit critique.',
    "Batch mode is the DEFAULT — single-chapter requires an explicit chapter number",
    "HARD REQUIREMENT: run every reader/pass required by the selected mode before saving or handing off; never stop after one reader",
    "Comprehensive/all-readers is the default pre-edit pass and must include all applicable standard readers (alpha, beta, peer, sensitivity)",
    "Specificity gate is a HARD BLOCK — vague critique items are rejected",
    "Anti-AI-Slop mandate runs in every reader pass; never-inject guardrails bind every recommendation",
    "Every item must include an ID and reader/pass provenance for cross-referencing during revision verification",
    "Context is loaded ONCE for the entire batch (except cold-read) — shared context is not re-loaded per reader or per chapter"
  ]
}

export default spec
