---
name: line-editor
description: "Sentence-level craft audit: evaluates rhythm, euphony, word choice, and aggressive mitigation of AI-generated stylistic 'slop'."
---

# Line Editor (formerly Prose Polishing Check)

## Core Directive

This is a final-pass audit focused strictly on the sentence level. Do not critique plot, structure, or character arcs. Your sole objective is to elevate the prose—the rhythm, texture, precision, and voice of the words on the page.

## Evaluation Categories

### 1. The AI-Slop Eradication Sweep (CRITICAL)

This pass runs the project's AI-writing catalog. Load `skills/quality-assurance/ai-writing-audit/SKILL.md` and its catalog `references/patterns.md`; the standing rule is `rules/ai-writing-patterns.md`. The catalog is tiered (word tiers 1A/1B/2/3, pattern groups) and carries never-inject guardrails — a fix that adds a manufactured stake, a fragment run, or an invented specific is a failure even when it clears the flag.

**Signals, not proof.** Fiction is exempt where the device is the point: manufactured punchlines, staccato drama, fragments, anaphora, and deliberate repetition pass when they carry voice, comedy, or tension. Judge the function, not the shape.

Flag and eradicate residual AI stylistic markers that survived earlier revisions:

*   **Word-tier violations** — Tier 1A markers (`delve`, `leverage`, `tapestry`, `testament to`, `robust`, `seamless`, `pivotal`, …), Tier 2 clusters (2+ in a paragraph: `harness`, `navigate`, `crucial`, `nuanced`, `ecosystem`, …), Tier 3 by density (`significant`, `innovative`, `effective`, …). Full lists in the catalog.
*   **Sensory Overload**: "The scent of ozone and tang of copper," "crackling energy."
*   **Binary Escalation**: "It wasn't just X. It was Y."
*   **The Hollow Closer**: "They didn't have to." / "And that made all the difference."
*   **Micro-expression fixation**: "Something shifted in their eyes," "A shadow crossed their face."
*   **Over-reliance on adverbs**: "She said angrily," "he looked dangerously."
*   **Structural tells**: negation chains, same-opener sentence runs, stranded auxiliary contrasts, aphorism formulas, colon-into-a-triple, generic conclusions, hedge-stacked predictions.

Flag P0 and P1 on every pass; P2 when time allows. Map to Buchbinder severity: P0 → Critical, P1 → Major, P2 → Minor.

### 2. Sentence Architecture & Rhythm
*   **Cadence Variation**: Ensure a mix of long, flowing sentences and short, punchy ones. Flag paragraphs where 3+ consecutive sentences share the exact same length or structure.
*   **Opening Variety**: Flag consecutive sentences starting with the same pronoun, article, or grammatical structure (unless deployed specifically for rhetorical effect).

### 3. Sonic Texture (Euphony vs. Cacophony)
*   Read the prose for sound. Flag accidental tongue-twisters, excessive alliteration, or clunky consonant clusters ("str-", "scr-") that slow the reader down unintentionally.
*   Ensure the sonic texture matches the mood (e.g., hard, percussive consonants in an action scene; flowing vowels in a reflective moment).

### 4. Precision and Concreteness
*   **Telling vs. Showing**: Flag emotional assertions ("she felt a deep sadness") that lack physical manifestation or interiority.
*   **Concrete over Abstract**: Push for specific nouns and strong verbs over abstract concepts and weak modifiers.

### 5. Punctuation Abuse
*   Flag over-reliance on em-dashes (signals a rhythm crutch), ellipses (signals melodramatic hesitation), and exclamation points (which should be exceedingly rare in narrative prose).

## Output Format

Generate a highly specific, actionable line-edit report. Do not offer vague praise.
Provide before-and-after examples for the most egregious sentences.
