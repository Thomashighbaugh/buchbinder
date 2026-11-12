import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "review",
  description: "Broad project QA as an independent critique-revise cycle (framework, content, final, factual). Runs review analysis, applies revisions, and re-reviews until pass (or max cycles) before publish.",
  reminder: "Phase 11: Independent critique-revise quality gate before publication",
  phases: "11",
  detailedDescription: `# User Input: {userInput}

## Objective

Assess project health before publication as an **independent critique-revise cycle**. Review is not a one-shot report: for each review run, produce findings (critique), apply required revisions, and re-run review until the gate passes (or the cycle is exhausted). Only a passing review may hand off to publish.

This phase runs **after edit and before publish** and must complete its own critique-revise loop independently of other phases.

## Step 0 (REQUIRED) — Generate Visualizations First

Before running any review mode (and before each re-review cycle), regenerate visualization data.

1. Import \`buildVizDataset\` from \`./lib/viz-aggregator.ts\`
2. Call \`buildVizDataset(projectRoot)\`
3. Save to \`./book/visualizations/dataset.json\`
4. Verify dataset is fresh (within 5 minutes) and non-empty
5. Report: "Visualization dataset regenerated: [N] chapters, [M] threads, [K] cognitive load points."

**Do not proceed until the viz dataset is current.**

## Review Modes

| Mode | When to Use | Scope |
|------|-------------|-------|
| Framework | Before writing begins | Manifest, specification, outline, tracking structure |
| Content | During/after drafting/editing | Chapters against all reference documents |
| Final | Before publish | Full project audit: content, tracking, citations, metadata, continuity |
| Factual (non-fiction) | Before publish | Factual claims against sources |

## Independent Critique-Revise Cycle (HARD REQUIREMENT)

Treat each review invocation as its own cycle:

1. **Critique (Review pass):** run the selected mode checks and produce a structured findings report with IDs, severities, evidence, and required fixes.
2. **Revise:** for every Critical/Major/blocking finding (and any continuity contradiction), apply targeted revisions/fixes to the affected chapters or project files.
3. **Re-review:** regenerate visualizations and re-run the same review mode on the same scope.
4. **Repeat** until verdict is **Pass** (and continuity hard blocks clear), up to **3 cycles**.

**Rules:**
- Cycles are **independent** per review run/mode — do not assume a previous phase's cycle satisfies this phase.
- Do not report "done" or hand off to publish while blocking issues remain.
- If still not passing after 3 cycles, stop and report remaining blockers with specific evidence; do not mark ready for publish.
- Minor/observation items may be deferred only with rationale, but never if they constitute a hard-block condition for the mode (e.g. continuity contradictions).

## Execution Steps

### 0. Visualization Pre-Generation (HARD BLOCK)

Run step 0. Abort with clear error if \`buildVizDataset\` throws or dataset is stale/empty.

### 0a. Load Relevant Lore Context

Retrieve lore most relevant to the review:

\`\`\`bash
bun .opencode/lib/scripts/lore-query.mjs \
  --query "Review context for [book title] — continuity, character profiles, world rules, timeline, glossary, and plot threads for consistency" \
  --top 5 --rerank
\`\`\`

If unavailable, read \`./series/lorebook/\` and \`./book/knowledge/*\` manually.

### Lore as Canonical Truth (Doctrine)

\`series/lorebook/*\`, \`book/knowledge/*\`, \`book/manifest.md\`, \`book/specification.md\`, and outlines are the absolute source of truth. Flag draft contradictions as chapter-level issues — never change lore.

### 1. Framework Analysis (Critique Pass)

If no chapters are written yet (or mode is Framework), validate: manifest completeness/consistency, specification clarity (no unresolved \`[Needs Clarification]\`), outline coherence, knowledge quality, tracking initialization, voice profiles (if chapter > 3), and style sheet modules.

### 2. Content Analysis (Critique Pass)

If chapters exist, check each chapter against manifest, specification, outline, knowledge, tracking, style sheet, and (non-fiction) sourcing/citations/argument progression.

### 3. Automated Continuity Scan (HARD BLOCK)

Run cross-chapter continuity checks: character state, timeline, plot threads (including forgotten/dormant 5+ chapters), location, relationships, objects/props, knowledge state, and voice continuity/drift.

- **Contradictions:** HARD BLOCK — must be resolved within the critique-revise cycle.
- **Forgotten threads / voice drift:** warnings unless they create contradictions or mode requires resolution.

Produce a continuity scan report with evidence for every finding.

### 3b. Structural Analyses (HARD BLOCK where applicable)

Run: reverse outline comparison, character arc verification, question/answer accounting, promise keeping audit, escalation curve verification, cognitive load analysis, knowledge state matrix, and AI-writing tell density (project-wide; P0 blocks). Hard-block findings must be fixed in the revise step and cleared on re-review.

### 3c. Structural Visualization Outputs

Generate/save: \`./book/review/thread-matrix.md\` and \`./book/review/dependency-graph.md\` (refresh each cycle as needed).

### 4. Factual Verification (Non-Fiction Only)

Identify factual claims, cross-reference sources, flag \`[CitationNeeded]\` / \`[Disputed]\`. Unresolved critical factual issues block Final/Factual pass.

### 5. Critique Report (Per Cycle)

Produce a structured report for the current cycle:

\`\`\`markdown
# Review Report — Cycle [N]

**Mode**: [Framework / Content / Final / Factual]
**Date**: [date]
**Verdict**: [Pass / Conditional / Fail]

## Continuity Scan
- Contradictions: [N] (HARD BLOCK if > 0)
- Forgotten threads: [M] (warning)
- Voice drift: [K] (warning)

## Issues Found
| ID | Severity | Chapter/Area | Issue | Evidence | Required fix |
|----|----------|--------------|-------|----------|--------------|

## Cycle Decision
[What must be revised now; what remains; pass/fail rationale]
\`\`\`

### 6. Revise (Within This Phase's Cycle)

Apply fixes for all blocking/required findings:
- Continuity contradictions, hard-block structural failures, and mode-critical issues: **must fix**.
- For each fix, record what changed and which issue ID it addresses.
- Re-run affected checks locally as needed, then proceed to re-review.

**Do not defer fixes that keep the verdict non-passing.**

### 7. Re-Review and Loop

After revisions, regenerate visualizations and re-run the same review mode. Repeat critique→revise→re-review until **Pass** or **3 cycles** reached.

### 8. Final Readiness Assessment (Final mode, must pass)

Checklist (all required for Final pass): tasks \`[X]/[ED]\`, resolved \`[CitationNeeded]\`, tracking up to date, no unresolved \`[Needs Clarification]\`, manifest followed, knowledge consistent, critique/revision feedback addressed, metadata recorded, chapters present/sequential, word count in range, continuity scan clean of contradictions, voice profiles checked, style sheet enforced, AI-writing tell scan passed (no P0; within threshold), and (fiction) theme audit passed (\`theme-holds\`).

### 9. Final Report (Cycle Summary)

Report all cycles run, issues found/fixed per cycle, remaining items (if any), and final verdict. Include continuity scan summary and evidence of pass.

### 10. Next Steps (Auto-Handoff)

Only after a **passing** independent review cycle (or explicit user decision when non-final modes allow continuation), offer handoff via \`question\`:
- **Pass (Final)**: "Review cycle complete and passing. Continue to publishing?" → \`/buchbinder publish\` or stop.
- **Pass (non-final)**: offer appropriate next phase or stop.
- **Not passing after 3 cycles**: report blockers; offer targeted \`/buchbinder revise\` / \`/buchbinder edit\` or stop for manual intervention. **Do not offer publish.**

If selected, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute immediately.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`continuity-auditor\` | \`skills/quality-assurance/continuity-auditor/SKILL.md\` | Cross-chapter consistency |
| \`forgotten-elements\` | \`skills/quality-assurance/forgotten-elements/SKILL.md\` | Dropped threads detection |
| \`fact-checker\` | \`skills/quality-assurance/fact-checker/SKILL.md\` | Factual verification (non-fiction) |
| \`citation-validator\` | \`skills/quality-assurance/citation-validator/SKILL.md\` | Citation correctness (non-fiction) |
| \`style-enforcer\` | \`skills/quality-assurance/style-enforcer/SKILL.md\` | Style consistency |
| \`ai-writing-audit\` | \`skills/quality-assurance/ai-writing-audit/SKILL.md\` | Project-wide AI-writing tell density scan |
| \`theme-craft\` | \`skills/fiction/writing-techniques/theme-craft/SKILL.md\` | Theme audit (fiction) |
| \`reverse-outline\` | \`src/lib/reverse-outline.ts\` | Draft vs planned outline comparison |
| \`character-arc\` | \`src/lib/character-arc.ts\` | Character arc completeness |
| \`qa-accounting\` | \`src/lib/qa-accounting.ts\` | Question/answer tracking |
| \`promise-audit\` | \`src/lib/promise-audit.ts\` | Promise keeping audit |
| \`escalation-curve\` | \`src/lib/escalation-curve.ts\` | Escalation curve verification |
| \`cognitive-load\` | \`src/lib/cognitive-load.ts\` | Cognitive load management |
| \`knowledge-state\` | \`src/lib/knowledge-state.ts\` | Knowledge state matrix |
| \`thread-matrix\` | \`src/lib/thread-matrix.ts\` | Thread tracking matrix |
| \`dependency-graph\` | \`src/lib/dependency-graph.ts\` | Chapter dependency graph |`,
  tools: ["loadSkill", "bash", "question"],
  relatedSkills: ["continuity-auditor", "forgotten-elements", "fact-checker", "citation-validator", "style-enforcer", "ai-writing-audit", "theme-craft"],
  examples: [
    { input: "/buchbinder review final", approach: "Runs final review as an independent critique-revise cycle (critique → revise → re-review) until pass or max cycles before publish" },
    { input: "/buchbinder review content", approach: "Runs content review as an independent critique-revise cycle and fixes blocking findings before completion" }
  ],
  warnings: [
    "Review is an INDEPENDENT critique-revise cycle — run critique, apply revisions, and re-review until pass (up to 3 cycles); do not one-shot report and stop",
    "Continuity scan contradictions are HARD BLOCKS and must be resolved before pass/publish",
    "Do not hand off to publish unless the review cycle passes",
    "AI-writing tell density scan runs project-wide — any P0 pattern blocks; report pattern, location, and tier (signals, not proof)",
    "Forgotten threads (dormant 5+ chapters) and voice drift are warnings unless they create contradictions or block the selected mode"
  ]
}

export default spec
