---
name: author-voice-key
description: "Builds and applies the project's writing-style key — a weighted blend of author voices from the 76-author reference, expressed in the same three-role format as the author combinations (narrative voice / thematic focus / writing style). FICTION ONLY. Use when establishing the constitution's style principles, when generating or editing the style key, when drafting prose that must conform to it, and when rendering the scene-beat previews in the outline."
---

# Author Voice Key

The **style key** is the project's single, explicit answer to *"what does this book sound like?"* It is a small, human-editable document generated during the constitution (`/buchbinder manifest`) and then obeyed by every phase that writes prose.

**This skill applies to fiction only.** Non-fiction and mixed projects do not use an author key; they carry register and citation conventions instead.

## Files

| File | Role |
|------|------|
| `references/author-voices.md` | The reference: the same blurb retold in **76 author voices**. Use it to *hear* a voice before you commit to it. |
| `references/author-combinations.md` | The reference: **35 three-author blends**, each naming a lead voice, a thematic focus, and a surface style, with rough weights. Use it as the model for the key's format and as a catalogue of working combinations. |
| `references/good-prose.md` | The **30 qualities of good prose**. The key selects a voice; these qualities govern whether the prose is any good. Both apply. |
| `./book/metadata/style-key.md` | **The project's key** — generated in the constitution, edited by the author, obeyed by every downstream phase. |

## The key's format — three roles, three weights

A key is a blend of **three** authors, each with a distinct job. This is exactly the structure of `author-combinations.md`, and the weights are rough proportions of influence, not measurements.

| Role | What it supplies | Typical weight |
|------|------------------|----------------|
| **1. Narrative voice** (lead) | Who is telling it, from where, with what attitude. Carries the largest weight. | 45–60% |
| **2. Thematic focus** | What the book is really *about* — the pressure the voice is under. | 25–35% |
| **3. Writing style** | Sentence shape, diction, surface texture — the grain of the prose. | 15–25% |

Rules for a sound key:

- **Three roles, and the lead is a voice you would recognize blind.** If you cannot say what the lead author is *doing* to the sentence, it is a bad key.
- **The roles must pull in different directions.** A key whose three authors agree produces flat pastiche. The interesting blends (Austen/Dostoevsky/Wilde, McCarthy/Tolkien/Hemingway) work because the voice, the subject, and the surface disagree.
- **Match the key to the book, not to your reading list.** The thematic-focus author should be chosen for what the book is *about*; the style author for the sentence the book needs.
- **Do not blend more than three.** Past three, the blend stops being a direction and becomes a mood board.
- **Name the failure mode.** Every key has a way it goes wrong — where the imitation tips into pastiche, or the voice flattens the book's emotion. Write it down.

## Generating the key (constitution)

1. Read the premise, thematic statement, tone, and any register decisions already recorded in the manifest.
2. Read `references/author-voices.md` to select candidate voices that can carry *this* book, and `references/author-combinations.md` for blends that already work.
3. Propose **one** key — lead voice, thematic focus, style — with weights, a one-line rationale per role, and a **sample paragraph** rendered in the key (3–6 sentences, using the book's own premise, not the Snow White blurb).
4. **Show it to the author and ask whether they want to edit it.** Offer: accept / adjust a role / swap an author / re-weight / regenerate / pick authors themselves. Never write the key without that offer.
5. Save with the structure below.

## The key file

`./book/metadata/style-key.md` — human-editable, and the authoritative source for every downstream phase.

```markdown
# Writing Style Key

*Fiction only. Generated at constitution; edit freely — every prose phase reads this file.*

## Key

- **Narrative voice (55%):** [Author] — [what the voice does to the telling: distance, attitude, tense-pressure]
- **Thematic focus (30%):** [Author] — [what the book is about, in this author's register]
- **Writing style (15%):** [Author] — [sentence shape, diction, surface texture]

## Why these three

[2–4 sentences: why this voice can tell this book, and why the three roles disagree productively.]

## Sample

> [3–6 sentences of the book's own premise, rendered in the key.]

## The voice in practice

- **Sentences:** [length distribution, clause habits, punctuation signature]
- **Diction:** [latinate vs plain, concreteness, adjectives carried or cut]
- **Dialogue:** [attribution habits, subtext density, quotation-mark convention]
- **Interiority:** [how the inside of a head is reached, and how deep]
- **What it refuses:** [the move this key will not make]

## Conformity

- Every prose pass must be written in this key *and* must hold to `references/good-prose.md`.
- Character voice may vary from the key **inside dialogue and direct interior monologue only** — the narration does not drift.
- The key is a direction, not a costume. If the prose reads as pastiche of the lead author rather than as this book, the key is being over-applied: pull the weights back toward the book.

## Failure mode

[The specific way this key goes wrong — the pastiche trap it invites, the emotion it tends to flatten.]

## Provenance

- Generated: [date], at constitution
- Reference: `skills/fiction/writing-techniques/author-voice-key/references/author-voices.md`, `.../author-combinations.md`, `.../good-prose.md`
- Author-approved: [yes / edited by author]
```

## Applying the key

**During outlining (scene beats).** Each scene beat carries a `**Preview:**` line — one or two sentences of *actual book prose* rendered in the key, so the author reads the finished surface before a word of the chapter is drafted. A preview is not a summary of the scene; it is a sample of it. Outlining is where the key is cheapest to change: a preview that reads wrong means the key is wrong, and it is far cheaper to fix now than after forty thousand words.

**During drafting.** The key is loaded with the constitution and every other pre-draft context item. The drafted prose must conform to it; the style sheet and prose-quality gates check for drift. Conformity is measured by the key's own "Sentences / Diction / Dialogue / Interiority / What it refuses" lines — not by an impression.

**Never** let the key override the book: if the outline's emotion and the key's register collide, the book wins and the key is revised (say so, and record it in the key's Provenance section).
