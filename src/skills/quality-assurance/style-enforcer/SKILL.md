---
name: style-enforcer
description: "Enforces the chosen prose style — checks the writing style key (fiction), register, sentence patterns, atmosphere, and voice consistency across chapters. Fiction prose must also hold to good-prose.md."
---

# Style Enforcer

Compares draft prose against the project's declared style. It distinguishes **authorial style drift** from **legitimate character voice variation** — not every deviation is a fault.

## The style specification

**Fiction:** the specification is `./book/metadata/style-key.md` — the writing style key generated at constitution (`/buchbinder manifest`). It is a weighted blend of three author voices:

| Role | Supplies |
|------|----------|
| **Narrative voice** (lead) | Who is telling it, from where, with what attitude |
| **Thematic focus** | What the book is really about |
| **Writing style** | Sentence shape, diction, surface texture |

Enforce against the key's own operational lines — **Sentences / Diction / Dialogue / Interiority / What it refuses** — not against an impression of the lead author. The key also names its own **failure mode**: enforce that too.

**Fiction prose must conform to the key AND to the key's reference `references/good-prose.md`.** The key selects a voice; good prose decides whether the writing is any good. A chapter that matches the key but violates the good-prose qualities (concreteness over abstraction, subtext, restraint, compression) is still a failure.

**Non-fiction / mixed:** there is no author key. The specification is the register and conventions recorded in the manifest and the metadata style sheet modules below.

## Style Dimensions

### Register
The formal-to-informal axis as declared by the key (fiction) or the manifest. **Check**: vocabulary tier (technical vs everyday), contraction usage, sentence-initial conjunctions, colloquialism density. **Drift signal**: register shifts without in-world justification.

### Sentence Shape
The key's "Sentences" line (fiction) or the manifest's declared rhythm. **Check**: mean sentence length, length standard deviation, proportion of sentences exceeding the declared maximum, clause habit and punctuation signature. **Drift signal**: sustained deviation across 3+ consecutive paragraphs.

### Diction
The key's "Diction" line. **Check**: latinate vs plain register, concreteness of nouns and verbs, whether modifiers are carried or cut, adverb load. **Drift signal**: the prose's word-choice centre of gravity moving to a different writer's.

### Figurative Language Density
Target frequency of metaphor, simile, analogy, personification. **Check**: instances per 500 words. **Drift signal**: density exceeds or falls below the declared range for an entire chapter section.

### Sensory Emphasis
The declared sensory priorities (e.g. "emphasise tactile and auditory over visual"). **Check**: sensory verb/adjective ratios by modality. **Drift signal**: a non-priority sense dominates a scene without narrative justification.

### Good-Prose Qualities
The reference list, checked as direction rather than a 30-point rubric. Practically, score against a small relevant subset per chapter — typically: control of voice, varied cadence, precision of word choice, concreteness over abstraction, subtext, restrained emotion, compression. **Drift signal**: mechanically clean prose that is nonetheless abstract, over-explained, or tonally flat.

### AI-Writing Tells
A style can be violated not only by drifting toward a *different writer* but by drifting toward *no writer* — the metronomic register of machine prose. Run the AI-writing catalog (`skills/quality-assurance/ai-writing-audit/SKILL.md` + `references/patterns.md`) alongside the key check: word-tier violations (Tier 1A markers, Tier 2 clusters, Tier 3 density), uniform sentence and paragraph length, hedge stacks, generic closers, and the structural tells. **Drift signal**: a chapter that clears the key but reads as machine-produced — uniform cadence, abstract nouns, no earned emphasis. This is the same failure the key's own failure mode names when the imitation runs flat. Fiction carve-outs apply: fragments, anaphora, and deliberate repetition pass when they carry voice. Never-inject guardrails bound any correction — do not add a fragment run or an invented specific to "fix" uniformity.

### Metadata Style Sheet (all tracks)
The modular style sheet also applies: terminology (e.g. "grey" not "gray"), formatting (em-dash vs en-dash, numerals), character-voice decisions, timeline decisions, emotional register. These are decisions of record, not preferences.

## Detection of Style Drift

Run analysis per chapter section (500–1000 word windows). Flag when:
- A window deviates on 2+ dimensions simultaneously
- A single dimension deviates across 3+ consecutive windows
- A window would fit a different project's key better than this one

**Pastiche check (fiction).** A chapter can also fail by matching the key *too well* — reading as imitation of the lead author rather than as this book. Flag it. The remedy is to pull the key's weights back toward the book, not to keep writing.

## Correction Methodology

1. Identify the exact passage where drift begins (first window exceeding threshold)
2. Determine cause: fatigue (late-chapter), confusion (POV change), or contamination (recent reading of different-style material)
3. Rewrite from the flagged passage forward, not backward — drift accumulates forward
4. Verify the corrected passage against every dimension before continuing

## Respecting Character Voice

Not every deviation is drift. Character voice variation is legitimate when:
- The passage is from a character POV whose established voice differs from the narrator's
- The deviation is confined to dialogue or direct interior monologue
- The narrative justifies the shift (intoxication, trauma, heightened emotion)

**Narration never gets this exemption.** Only dialogue and direct interior monologue may carry a voice distinct from the key.

Flag character voice variations as **pass-through** rather than errors, but log them if they appear in 3+ consecutive chapters without character-intrinsic justification.
