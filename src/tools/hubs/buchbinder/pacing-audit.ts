import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "pacing-audit",
  description: "Analyze pacing as an independent critique-revise cycle: identify pacing issues, apply revisions, and re-audit until pass (or max cycles). Post-edit, pre-publish phase.",
  reminder: "Independent critique-revise cycle: pacing analysis and correction",
  phases: "7-11",
  detailedDescription: `# User Input: {userInput}

## Objective

Analyze manuscript pacing as an **independent critique-revise cycle**. This phase runs after edit and before publish as its own loop: audit pacing (critique), revise to address pacing issues, and re-audit until the pacing verdict is Pass (or 3 cycles are exhausted).

## Prerequisites

- At least 3 chapters must exist in \`./book/content/\`
- \`./book/outline.md\` should exist (for pacing tag comparison)

## Independent Critique-Revise Cycle (HARD REQUIREMENT)

1. **Critique (Audit pass):** compute pacing metrics and produce findings with IDs, severity, evidence, and concrete recommendations.
2. **Revise:** apply targeted revisions for Conditional/Fail findings (scene restructuring, compression/expansion, rhythm adjustments, outline-tag alignment as appropriate).
3. **Re-audit:** re-run the same pacing analysis on the same scope.
4. **Repeat** until **Pass** or **3 cycles**.

Do not treat a single audit report as completion if issues remain fixable within scope. Report remaining blockers if not passing after 3 cycles.

## Execution Steps

### 1. Parse Scope

- \`/buchbinder pacing-audit\` → all chapters
- \`/buchbinder pacing-audit 5-10\` → chapters 5 through 10
- \`/buchbinder pacing-audit all\` → all chapters

### 2. Load Chapters and Context

For each chapter in scope read \`./book/content/chapter_NNNNN.md\`, \`./book/drafts/chapter_NNNNN.xml\` if available (for scene-level analysis), and outline pacing tags.

### 3. Compute Pacing Metrics (Critique Pass)

Per chapter: word count, scene count, average scene length, dialogue-to-prose ratio, action-to-reflection ratio, sentence length distribution/variation, scene type distribution (\`action/dialogue/transition/revelation/resolution\`), and pacing-tag match vs outline.

Cross-chapter: word-count distribution/outliers, pacing rhythm, saggy streaks (3+ slow), rushed streaks (3+ fast with no breathing room), plateaus (5+ identical), jarring transitions, and scene balance.

### 4. Pacing Report (Per Cycle)

\`\`\`markdown
## Pacing Audit Report — Cycle [N]

**Scope**: Chapters [start]–[end] ([N] chapters)
**Verdict**: [Pass / Conditional / Fail]

### Per-Chapter Pacing
| Chapter | Words | Scenes | Avg Scene | Dialogue% | Action% | Reflection% | Pacing Tag | Match |

### Findings
| ID | Severity | Chapter/Range | Issue | Evidence | Recommendation |

### Cycle Decision
[Issues to revise now; expected re-audit focus]
\`\`\`

### 5. Revise

Apply revisions addressing the findings (restructure/compress/expand scenes, adjust rhythm, add breathing beats, align pacing to intent). Record changes against finding IDs.

### 6. Re-Audit and Loop

Re-run steps 2-4 on the same scope until Pass or 3 cycles. Regenerate any derived pacing artifacts as needed.

### 7. Final Report and Handoff

Report all cycles, fixes applied, and final verdict. Use \`question\` for handoff:
- **Pass**: offer \`/buchbinder hook-review\`, \`/buchbinder read-through\`, or \`/buchbinder review\`/publish path as appropriate.
- **Not passing after 3 cycles**: report blockers; offer \`/buchbinder revise\`/\`/buchbinder outline\` or stop.

If selected, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute immediately.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`scene-structure\` | \`skills/fiction/writing-techniques/scene-structure/SKILL.md\` | Scene framework for pacing analysis and revision |`,
  tools: ["bash", "question"],
  relatedSkills: ["scene-structure"],
  examples: [
    { input: "/buchbinder pacing-audit", approach: "Runs pacing analysis as an independent critique-revise cycle across all chapters until pass or max cycles" },
    { input: "/buchbinder pacing-audit 5-10", approach: "Runs the pacing critique-revise cycle for chapters 5 through 10" }
  ],
  warnings: [
    "Independent critique-revise cycle: do not stop at a single audit if fixable pacing issues remain (up to 3 cycles)",
    "Requires at least 3 chapters for meaningful cross-chapter pacing patterns",
    "XML versions in ./book/drafts/ provide more accurate scene-level analysis — without them, scene counts are estimated from markdown"
  ]
}

export default spec
