import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "read-through",
  description: "Reader-experience simulation as an independent critique-revise cycle: identify confusion/engagement/belief issues, apply revisions, and re-read until pass (or max cycles). Post-edit, pre-publish phase.",
  reminder: "Independent critique-revise cycle: reader experience simulation and correction",
  phases: "7-11",
  detailedDescription: `# User Input: {userInput}

## Objective

Simulate the reader experience as an **independent critique-revise cycle**. This phase runs after edit and before publish as its own loop: read and log reader-experience issues (critique), revise to address them, and re-read the affected/same scope until the experience verdict is Pass (or 3 cycles are exhausted).

## Prerequisites

- At least 3 chapters must exist in \`./book/content/\`
- Ideally past first draft (tasks \`[FR]\` or beyond)

## Independent Critique-Revise Cycle (HARD REQUIREMENT)

1. **Critique (Read-through pass):** sequential reader-mode pass producing experience logs and findings with IDs, severity, evidence, and concrete recommendations.
2. **Revise:** apply targeted revisions for confusion, engagement drops, belief breaks, immersion breaks, and trust failures.
3. **Re-read:** re-run the read-through on the same scope (or re-check affected chapters and adjacent flow) to verify fixes.
4. **Repeat** until **Pass** or **3 cycles**.

Do not stop at a diagnostic report when fixable reader-experience blockers remain.

## Execution Steps

### 1. Parse Scope

- \`/buchbinder read-through\` → all chapters
- \`/buchbinder read-through 1-5\` → chapters 1 through 5
- \`/buchbinder read-through all\` → all chapters

### 2. Enter Reader Mode (Critique Pass)

You are a reader, not a line editor. Look for confusion, engagement drops, emotional impact, page-turner pull, and belief breaks — not grammar/style polish. Read sequentially, in order, without skipping.

### 3. Per-Chapter Reader Experience Log

For each chapter record engagement (1-5), confusion points, engagement drops, emotional highlights, page-turner pull (1-5), belief breaks, and carried understanding (plot, characters, stakes, questions) with specific evidence.

### 4. Cross-Chapter Experience Analysis

Analyze engagement curve (valleys/peaks/sustained drops), confusion clusters, page-turner rhythm, belief breaks, and carried questions.

### 4b. Immersion Break Audit (HARD BLOCK)

Run \`src/lib/immersion-audit.ts\` (anachronisms, authorial intrusion, meta-references, logic breaks). **Blocking immersion breaks must be fixed in the revise step.**

### 4c. Trust Accounting (HARD BLOCK)

Run \`src/lib/trust-audit.ts\` (coincidences, deus ex machina, stupid-for-plot, plot armor). **Deus ex machina and blocking trust failures must be fixed in the revise step.**

### 5. Read-Through Report (Per Cycle)

\`\`\`markdown
## Reader Experience Report — Cycle [N]

**Scope**: Chapters [start]–[end] ([N] chapters)
**Verdict**: [Pass / Conditional / Fail]

### Engagement Curve
| Chapter | Engagement | Page-Turner | Confusion | Belief | Emotional Highlights |

### Findings
| ID | Severity | Chapter/Range | Issue | Evidence | Recommendation |

### Cycle Decision
[Issues to revise now; what to re-read]
\`\`\`

### 6. Revise

Apply targeted revisions for reported issues (grounding, motivation, pacing/scene fixes, setup for solutions, removal of immersion/trust breaks). Record changes against finding IDs.

### 7. Re-Read and Loop

Re-run the read-through/audits on the same scope until Pass or 3 cycles.

### 8. Final Report and Handoff

Report cycles, fixes, and final verdict. Use \`question\`:
- **Pass**: offer \`/buchbinder review\` and/or \`/buchbinder publish\` as appropriate.
- **Not passing after 3 cycles**: report remaining blockers (especially belief/immersion/trust); offer \`/buchbinder revise\` or stop. **Do not offer publish if blocking reader-experience failures remain.**

If selected, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute immediately.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`developmental-editor\` | \`skills/critique/developmental-editor/SKILL.md\` | Structural reader perspective |
| \`audience-surrogate\` | \`skills/critique/audience-surrogate/SKILL.md\` | Experience reader perspective |`,
  tools: ["bash", "question"],
  relatedSkills: ["developmental-editor", "audience-surrogate"],
  examples: [
    { input: "/buchbinder read-through", approach: "Runs reader-experience simulation as an independent critique-revise cycle across all chapters until pass or max cycles" },
    { input: "/buchbinder read-through 1-5", approach: "Runs the reader-experience critique-revise cycle for chapters 1 through 5" }
  ],
  warnings: [
    "Independent critique-revise cycle: do not stop at a single read-through report if fixable experience issues remain (up to 3 cycles)",
    "Read sequentially — do not skip chapters; this is reader mode, not editor mode",
    "Belief breaks, immersion breaks, and trust failures (especially deus ex machina) are critical and must be resolved before a passing verdict"
  ]
}

export default spec
