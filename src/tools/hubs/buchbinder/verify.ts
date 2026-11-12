import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "verify",
  description: "Run quality gates independently as critique-revise cycles where applicable: voice-init (generate profiles), voice-check/continuity/style/gates (check → fix → re-check until pass or max cycles).",
  reminder: "On-demand quality gate runner with independent critique-revise cycles for fixable findings",
  phases: "7-11",
  detailedDescription: `# User Input: {userInput}

## Objective

Run quality gates independently of the drafting pipeline. After edit and before publish, verification checks that produce actionable findings must operate as **independent critique-revise cycles**: run the check (critique), apply fixes/revisions, and re-run the same check until it passes or 3 cycles are exhausted.

Use this to:
- Initialize voice profiles from existing chapters
- Check and correct voice drift
- Run and resolve continuity issues
- Enforce and fix style sheet violations
- Run specific gates and close fixable failures

## Step 0 (REQUIRED) — Generate Visualizations First

Before running ANY verify subcommand (and before each re-check cycle for analysis/gate runs), regenerate visualization data.

1. Import \`buildVizDataset\` from \`./lib/viz-aggregator.ts\`
2. Call \`buildVizDataset(projectRoot)\`
3. Save to \`./book/visualizations/dataset.json\`
4. Verify dataset is fresh (within 5 minutes) and \`chapters > 0\` when chapters exist
5. Report: "Visualization dataset regenerated: [N] chapters, [M] threads, [K] cognitive load points."

**Do not run gates/checks until the viz dataset is current** (except when no chapters exist and the requested subcommand is not chapter-dependent).

## Independent Critique-Revise Cycle (HARD REQUIREMENT for Fixable Checks)

For subcommands that evaluate quality and can produce fixable findings (\`voice-check\`, \`continuity\`, \`style\`, and \`gates\` runs with actionable failures/warnings that must be resolved):

1. **Critique (Check pass):** run the check and produce a structured report with IDs, severity, evidence, and required fixes.
2. **Revise/Fix:** apply corrections to affected chapters/files (voice alignment, continuity fixes, style-sheet corrections, gate-driven revisions).
3. **Re-check:** regenerate visualizations as needed and re-run the exact same check on the same scope.
4. **Repeat** until **Pass** (no blocking findings remain for that check) or **3 cycles**.

**Rules:**
- Each verify invocation is an **independent** cycle — do not assume another phase satisfied this check.
- \`voice-init\` is a generation/setup action, not a critique-revise cycle; after init you may run \`voice-check\` (which follows the cycle if drift is found).
- If issues are found, do not stop at the first report — fix and re-check (up to 3 cycles) unless the user explicitly halts.
- Continuity **contradictions** and other hard-block failures must be resolved before reporting pass. Report remaining blockers if not passing after 3 cycles.

## Sub-Commands

### \`/buchbinder verify voice-init\`

Generate voice profiles from existing chapters (setup action).

**Prerequisites:** at least 3 chapters in \`./book/content/\`; XML in \`./book/drafts/\` preferred; current viz dataset.

**Process:** read chapters/XML, extract dialogue per speaker and narration registers, generate fingerprints, save to \`./book/knowledge/voice-profiles.json\`, and report counts. No critique-revise loop required for generation itself.

### \`/buchbinder verify voice-check [chapter]\`

Check and correct voice drift as an independent critique-revise cycle.

**Prerequisites:** voice profiles exist; target chapter/XML exists.

**Cycle:** compare dialogue and narration against profiles (sentence length, contraction rate, register, emotional range, verbal tics, missing/added tics, sensory/dialogue metrics). If drift indicators found, revise the chapter to align with established profiles (or update profiles only if the change is intentional and explicitly requested), then re-check until pass or 3 cycles.

**Output (per cycle):** structured drift report with metrics, evidence, fixes applied, and pass/fail.

### \`/buchbinder verify continuity [range]\`

Run continuity scan as an independent critique-revise cycle.

**Process:** check character state, timeline, plot threads, location, relationships, objects/props, knowledge, and voice continuity across the range (or all chapters).

**Cycle:** contradictions are hard blocks — fix them and re-scan until clean (or 3 cycles). Forgotten threads and voice drift are warnings unless they create contradictions; address or explicitly document remaining warnings.

**Output:** continuity report per cycle with contradictions, forgotten threads, voice drift, fixes applied, and gate result.

### \`/buchbinder verify style [chapter]\`

Run style sheet enforcement as an independent critique-revise cycle.

**Process:** check terminology, character-voices, formatting, timeline, and emotional-register modules against the chapter.

**Cycle:** violations must be corrected (auto-fix where safe, otherwise targeted revision) and re-checked until no violations remain (or 3 cycles).

**Output:** style violation report per cycle with module, decision, violation, location, fix, and result.

### \`/buchbinder verify gates [gate-name] [chapter|round|scope]\`

Run a specific quality gate as an independent critique-revise cycle when findings require fixes.

| Gate Name | What It Checks |
|-----------|----------------|
| \`outline\` | Fine-grained scene beats, setup/payoff chains, continuity anchors |
| \`pre-draft\` | All 13 context items loaded with evidence |
| \`post-draft\` | XML structure, metadata, scenes, tracking, voice, awareness map |
| \`prose-quality\` | Filter words, adverbs, passive voice, info-dumps, tense/POV drift |
| \`echo-detection\` | Word echo, structural echo, beat echo, crutch word frequency |
| \`beat-arc\` | Emotional beat trajectory from <beatchange> tags |
| \`revision-verify\` | Critique items cross-referenced against revision log |
| \`continuity\` | Cross-chapter contradictions |
| \`style\` | Style sheet violations |
| \`subtext\` | On-the-nose dialogue detection |
| \`purple-prose\` | Overwriting, excessive modifiers, metaphor overload |
| \`cliche\` | Clichéd phrases and genre-trope overuse |
| \`ai-slop\` | AI-writing catalog (word tiers, structural tells, signature slop); signals, not proof |
| \`rhythm\` | Sentence length variety, monotony detection |
| \`immersion\` | Anachronisms, authorial intrusion, meta-references, logic breaks |
| \`trust\` | Coincidences, deus ex machina, plot armor, stupid-for-plot |
| \`reverse-outline\` | Draft vs planned outline comparison |
| \`thread-matrix\` | Plot thread tracking matrix |
| \`dependency-graph\` | Chapter dependency graph |
| \`character-arc\` | Per-character arc completeness |
| \`qa-accounting\` | Narrative question tracking |
| \`promise-audit\` | Genre/tone/thematic promises kept |
| \`escalation-curve\` | Stakes escalation and plateau detection |
| \`cognitive-load\` | Per-chapter character/thread/question count |
| \`knowledge-state\` | Who knows what when; knowledge violations |
| \`opening-closing\` | Book-level first/last 500 words strength |
| \`non-negotiables\` | Creative constraints (author's red lines) |

**Cycle behavior by gate:** if a gate reports fixable/blocking failures, apply required revisions/fixes and re-run the gate until pass or 3 cycles. Gates that are purely diagnostic/visualization outputs (e.g. matrix/graph generation) should still be regenerated after fixes and reported, but do not force a revision loop when no actionable failure exists.

**NLI evidence step (inside \`post-draft\`, \`revision-verify\`):** run the local NLI evidence script alongside the gate as specified, append evidence to inform (never hard-block on NLI score alone), and persist full findings under \`.opencode/cache/nli-evidence/\`.

## Execution

1. Parse sub-command and scope.
2. Run Step 0 visualization pre-generation (and refresh before re-checks as needed).
3. Load relevant libraries/skills (\`voice-profile\`, \`quality-gates\`, \`metadata\`, \`checkpoints\`, etc.).
4. **Critique pass:** run the requested check/gate.
5. **If actionable findings exist:** revise/fix, then re-check (repeat up to 3 cycles). \`voice-init\` is exempt as a setup action.
6. Report all cycles, fixes applied, remaining blockers, and final result in structured format.

## Next Steps (Auto-Handoff)

After the verify cycle completes, hand off via \`question\`:
- **Pass:** offer \`/buchbinder review\`, next relevant phase, or stop.
- **Not passing after 3 cycles / blockers remain:** offer \`/buchbinder revise\`, \`/buchbinder edit\`, targeted re-run, or stop. Do not claim the gate passed.

If selected, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute immediately.

## Supplement Skills

| Skill | File | Purpose |
|-------|------|---------|
| \`pre-draft-checklist\` | \`skills/quality-assurance/pre-draft-checklist/SKILL.md\` | Pre-draft context verification |
| \`continuity-auditor\` | \`skills/quality-assurance/continuity-auditor/SKILL.md\` | Cross-chapter consistency |
| \`forgotten-elements\` | \`skills/quality-assurance/forgotten-elements/SKILL.md\` | Dropped thread/element detection |
| \`style-enforcer\` | \`skills/quality-assurance/style-enforcer/SKILL.md\` | Style sheet enforcement |
| \`fact-checker\` | \`skills/quality-assurance/fact-checker/SKILL.md\` | Factual accuracy (non-fiction) |
| \`citation-validator\` | \`skills/quality-assurance/citation-validator/SKILL.md\` | Citation verification (non-fiction) |
| \`voice-profile\` | \`src/lib/voice-profile.ts\` | Voice fingerprinting engine |
| \`quality-gates\` | \`src/lib/quality-gates.ts\` | Gate runner |
| \`nli-gates\` | \`src/lib/nli-gates.mjs\` | Local NLI gate evidence |
| \`metadata\` | \`src/lib/metadata.ts\` | Style sheet enforcement |
| \`checkpoints\` | \`src/lib/checkpoints.ts\` | Checkpoint system |`,
  tools: ["bash", "question"],
  relatedSkills: ["pre-draft-checklist", "continuity-auditor", "forgotten-elements", "style-enforcer", "fact-checker", "citation-validator"],
  examples: [
    { input: "/buchbinder verify voice-init", approach: "Generates voice profiles from existing chapters (setup action)" },
    { input: "/buchbinder verify voice-check Chapter 5", approach: "Runs voice-drift check as an independent critique-revise cycle: detect drift, fix, re-check until pass or max cycles" },
    { input: "/buchbinder verify continuity all", approach: "Runs continuity scan as an independent critique-revise cycle: fix contradictions/issues, re-scan until pass or max cycles" },
    { input: "/buchbinder verify style Chapter 3", approach: "Runs style enforcement as an independent critique-revise cycle: fix violations, re-check until clean or max cycles" },
    { input: "/buchbinder verify gates prose-quality Chapter 3", approach: "Runs the gate as an independent critique-revise cycle when actionable findings exist" }
  ],
  warnings: [
    "For fixable checks/gates, run as an independent critique-revise cycle (check → fix → re-check, up to 3 cycles); do not stop at the first failing report",
    "voice-init is a setup/generation action, not a critique-revise cycle",
    "Continuity contradictions and hard-block gate failures must be resolved before reporting pass",
    "Voice-init requires at least 3 chapters for meaningful profiles; voice-check requires XML in ./book/drafts/ for accurate extraction"
  ]
}

export default spec
