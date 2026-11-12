import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "hook-review",
  description: "Analyze chapter/book openings and closings as an independent critique-revise cycle: identify weak hooks, apply revisions, and re-review until pass (or max cycles). Post-edit, pre-publish phase.",
  reminder: "Independent critique-revise cycle: hook analysis and correction",
  phases: "7-11",
  detailedDescription: `# User Input: {userInput}

## Objective

Analyze opening and closing hooks as an **independent critique-revise cycle**. This phase runs after edit and before publish as its own loop: evaluate hooks (critique), revise weak/missing hooks, and re-evaluate until Pass (or 3 cycles are exhausted).

## Prerequisites

- At least 1 chapter must exist in \`./book/content/\`
- XML versions in \`./book/drafts/\` are useful but not required

## Independent Critique-Revise Cycle (HARD REQUIREMENT)

1. **Critique (Hook review pass):** evaluate openings/closings and produce findings with IDs, severity, evidence (quoted lines/paragraphs), and concrete revision recommendations.
2. **Revise:** rewrite weak/missing openings and closings (and book-level opening/closing when applicable) to address findings.
3. **Re-review:** re-run hook evaluation on the same scope.
4. **Repeat** until **Pass** (no Weak/Missing hooks blocking the verdict) or **3 cycles**.

Do not stop after reporting; complete the cycle by revising and re-checking unless the user explicitly halts.

## Execution Steps

### 1. Parse Scope

- \`/buchbinder hook-review\` → all chapters
- \`/buchbinder hook-review 5\` → chapter 5 only
- \`/buchbinder hook-review 3-7\` → chapters 3 through 7

### 2. Load Hooks (Per Cycle)

For each chapter read first 3 paragraphs (opening) and last 3 paragraphs (closing), plus \`<hooks>\` from \`./book/drafts/chapter_NNNNN.xml\` when available.

### 3. Evaluate Openings and Closings (Critique Pass)

**Openings:** intrigue, specificity, action vs exposition, voice, grounding. **Closings:** cliffhanger tension, emotional resonance, turn, resolution vs openness, last-line quality.

Scores: **Strong** (no change), **Adequate** (consider revision), **Weak** (revise), **Missing** (must revise). Treat Weak/Missing as blocking for a passing verdict.

### 4. Book-Level Opening/Closing Strength Audit

Run \`src/lib/opening-closing.ts\`: book opening (first 500 words of chapter 1), book closing (last 500 words of final chapter), and per-chapter scores. Book opening/closing score < 5 is a warning/blocking issue as appropriate to scope; fix within the cycle when in scope.

### 5. Hook Review Report (Per Cycle)

\`\`\`markdown
## Hook Review Report — Cycle [N]

**Scope**: Chapters [start]–[end] ([N] chapters)
**Verdict**: [Pass / Conditional / Fail]

### Opening Hooks
| ID | Chapter | Score | First Line | Issue | Evidence | Recommendation |

### Closing Hooks
| ID | Chapter | Score | Last Line | Issue | Evidence | Recommendation |

### Book-Level Audit
[Opening/closing scores and findings]

### Cycle Decision
[Hooks to revise now]
\`\`\`

### 6. Revise

Apply targeted rewrites to flagged openings/closings (and book-level opening/closing in scope). Record changes against finding IDs.

### 7. Re-Review and Loop

Re-run steps 2-5 until Pass or 3 cycles.

### 8. Final Report and Handoff

Report cycles, fixes, and final verdict. Use \`question\`:
- **Pass**: offer \`/buchbinder read-through\`, \`/buchbinder pacing-audit\`, or \`/buchbinder review\`.
- **Not passing after 3 cycles**: report remaining weak/missing hooks; offer \`/buchbinder revise\` or stop.

If selected, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute immediately.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`scene-structure\` | \`skills/fiction/writing-techniques/scene-structure/SKILL.md\` | Scene structure for hook placement |
| \`dialogue-techniques\` | \`skills/fiction/writing-techniques/dialogue-techniques/SKILL.md\` | Dialogue as hook |
| \`opening-closing\` | \`src/lib/opening-closing.ts\` | Book-level opening/closing strength audit |`,
  tools: ["bash", "question"],
  relatedSkills: ["scene-structure", "dialogue-techniques", "opening-closing"],
  examples: [
    { input: "/buchbinder hook-review", approach: "Runs hook analysis as an independent critique-revise cycle for all chapters until pass or max cycles" },
    { input: "/buchbinder hook-review 5", approach: "Runs the hook critique-revise cycle for chapter 5 only" }
  ],
  warnings: [
    "Independent critique-revise cycle: do not stop at a single hook report if weak/missing hooks remain (up to 3 cycles)",
    "Hook review is primarily for fiction — non-fiction chapters use different hook patterns (claim-driven openings, synthesis closings)",
    "Strong hooks do not require melodrama; subtle turns can be compelling"
  ]
}

export default spec
