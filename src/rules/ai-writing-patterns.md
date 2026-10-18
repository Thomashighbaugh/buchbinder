# Buchbinder — AI-Writing Pattern Rule

## MANDATORY RULE

Every prose phase — **draft, critique, revise, edit, review, verify** — must apply the AI-writing pattern catalog. The method is `skills/quality-assurance/ai-writing-audit/SKILL.md`; the catalog is `skills/quality-assurance/ai-writing-audit/references/patterns.md`. Load the skill before any prose pass that writes, judges, or repairs prose.

This rule is the standing constraint. Where a phase's gate is stricter, the gate wins; this rule is the floor.

## Signals, not proof

The patterns are statistically more common in LLM output, but humans on autopilot — under deadline pressure, in unfamiliar genres, or in a second language — produce the same shapes. Independent audits put detector false-positive rates above 60% on non-native English writers.

Treat a flag as **signal, not verdict**. Never use pattern density as the sole basis for a consequential decision (publication, attribution, a verdict on who wrote a passage). Report the flag and the reason; let the author decide.

## The three tiers

Full lists in the catalog. In short:

- **Tier 1 — review every match.** 1A = AI frequency markers (`delve`, `leverage`, `tapestry`, `testament to`, `robust`, …) — evidence about how a passage was produced. 1B = clarity edits (`utilize`, `in order to`, `serves as`, …) — good writing regardless of who wrote it, **not** authorship evidence.
- **Tier 2 — flag when 2+ appear in the same paragraph.** (`harness`, `navigate`, `foster`, `crucial`, `nuanced`, `ecosystem`, …). One isolated occurrence is never a finding.
- **Tier 3 — flag by density.** A common word (`significant`, `innovative`, `effective`, …) only when that one word alone hits `max(3, floor(wordCount × 0.03))` uses.
- **Tier 3 phrases** — a boilerplate phrase repeated 2+ times, or 3+ distinct phrases in one piece.

## Severity

- **P0 — credibility killers.** Cutoff disclaimers, chatbot artifacts ("I hope this helps"), vague attributions ("experts believe"), significance inflation on routine events.
- **P1 — obvious AI smell.** Word-list violations, template phrases, "Let's" openers, synonym cycling, formulaic openings, hedge-stacked predictions, invented contrast pairs, bullet lists of bare noun phrases.
- **P2 — stylistic polish.** Em-dash frequency, generic conclusions, copula avoidance, transition phrases, uniform paragraph length, repeated punchlines.

Map to the Buchbinder severity tiers: P0 → Critical, P1 → Major, P2 → Minor.

## Never inject (rewrite-side failures)

A rewrite fails even when it scores clean if it **adds** any of these:

- **Fabricated speaker perspective** — "I've seen this a hundred times" with no source support.
- **Manufactured stakes** — "now more than ever," "the stakes have never been higher."
- **Forced contrarianism** — "everyone says X, but they're wrong."
- **Performed candor** — "let's be honest," "real talk."
- **Em-dash theatrics** — dashes added for drama the content has not earned.
- **Staccato conversion** — chopping ordinary sentences into fragments to manufacture rhythm.
- **Invented specifics** — an unsupported number, name, date, or mechanism. A fabricated specific is worse than the vague phrasing it replaced.

Subtract and sharpen. Never invent.

## Fiction carve-outs

The catalog is calibrated for English prose broadly. Fiction is explicitly exempt where the device is the point: manufactured punchlines, staccato drama, fragments, anaphora, and deliberate repetition pass when they carry voice, comedy, or tension. Judge the *function*, not the shape — an earned fragment is craft; a run of same-shape fragments posing as reveals is a tell.

## Where it binds

| Phase | Application |
|-------|-------------|
| **draft** | Prevention — write in the style key and the good-prose qualities; do not inject the never-inject list. Post-draft gate scans for the worst patterns. |
| **critique** | Detection — the Anti-AI-Slop mandate runs in every mode; word tiers and structural tells are reported as findings. |
| **revise** | Repair — fix flagged patterns while preserving meaning, attribution, and the author's voice. |
| **edit** | Line-edit pass runs the full catalog as a hard-block gate; never-inject guardrails bound every suggestion. |
| **review** | Project-wide gate — AI-tell density is a publication-readiness check. |
| **verify** | On-demand audit — report the tier findings without rewriting. |
