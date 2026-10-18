---
name: premise-workshop
description: "Turn a spark (an image, a character, a setting, a what-if, a feeling) into a tested premise before /buchbinder specify builds the project. Use when brainstorming a story idea, developing or stress-testing a premise, choosing a form, or naming a book. Generates what-ifs, workshops the logline, drafts premise and counter-premise, names the stakes, and sanity-checks comps. FICTION ONLY."
---

# Premise Workshop

Turn a spark into a premise that can carry a book, before `/buchbinder specify` builds the project. The workshop generates what-ifs from the spark, tests them as loglines, drafts the controlling idea and its counter-argument, names the stakes on three levels, chooses a form, brainstorms titles, sanity-checks against comparable books, and hands a filled-in brief to `/buchbinder specify`. The author owns the idea: offer options and tests, never decide for them.

This skill is **fiction only.** Non-fiction and mixed projects build a thesis and argument structure instead (`/buchbinder ideation` non-fiction dimensions).

## When to use

- The user has a spark but no premise, or several ideas and cannot choose
- The user has a premise and wants to know whether it holds up
- Choosing between short story, novella, novel, serial, or a children's form
- Brainstorming a title, or checking a working title against the cast
- **Not** for the project's governing principles (use `/buchbinder manifest`)
- **Not** for outlining once the premise is settled (use `/buchbinder outline`)
- **Not** for comp titles, pitch, or blurb for submission (a later phase)

## Where it runs

Inside `/buchbinder ideation` (the Premise dimension) and feeding `/buchbinder specify` (Level 2 Core Premise). Workshop output is cached to `./book/ideation/premise.md` — exploratory and mutable, not canon. Thematic material feeds the manifest's thematic statement.

## Workflow

### 1. Capture the spark

Ask what the user has, in their words, and do not improve it yet. Sort it: an **image** (a drowned bell tower), a **what-if** (what if grief could be sold), a **character** (a lighthouse keeper who has never left the rock), a **setting** (a city that moves every winter), or a **feeling** they want a reader to have. Ask what drew them to it. That answer is often the book's real subject and should survive every later change. Keep the spark's original wording in the notes — the spark is the check that any drift was chosen.

### 2. Generate what-ifs

Following `references/what-if-generation.md`, produce 8–12 short what-ifs from the spark across angles (invert it, raise the cost, give it to the wrong person, put a clock on it). Present them as a numbered list and ask the user to pick one to three, or to combine. Do not rank them unless asked; do say which already imply conflict.

### 3. Workshop the logline

For each chosen what-if, draft a logline: **protagonist + want + obstacle + stakes**. Then run every stress test in `references/premise-tests.md`. Report each test as pass, weak, or fail with one sentence of why, and offer one revision per weak or failed test.

### 4. Draft premise and counter-premise

The `premise` is the controlling idea (**value + cause**), not the logline. Draft it and the **counter-premise** (the antagonist's or world's opposing argument, in the same form) as working hypotheses. Test: could a reasonable person believe the counter-premise? If not, the antagonist is a straw man and the ending proves nothing. If the user wants to discover theme in the draft, record `theme: tbd-discovery` and move on. Keep the logline for the specification's Level 1.

### 5. Name the stakes

Write the stakes on three levels (see `references/premise-tests.md`): **external** (what is lost in the world), **relational** (who is lost or betrayed), **internal** (what the protagonist becomes if they fail). At least two must be concrete and personal. Stakes must be able to worsen by the midpoint, or the premise will stall in the middle.

### 6. Choose the form

Use `references/form-choice.md` to match the idea's scope to a form: `novel`, `novella`, `novelette`, `short-story`, `flash`, `serial`, `picture-book`, or `chapter-book`. Count the idea's moving parts (POV characters, threads, locations, time span, named cast, changes dramatized) and recommend the form they fit, with the trade-offs. Record the form and target word count in `premise.md`; `/buchbinder specify` and the manifest carry the scope forward. The user decides.

### 7. Brainstorm titles

Follow `references/title-and-comps.md`: generate titles across the families listed there, cut to a shortlist of five, and test each against the logline and the genre shelf. Check title words and new names against the project's entities using the `namecraft` skill — an exact clash with an existing character, place, or term must be resolved; look-alike warnings are the user's call.

### 8. Sanity-check against comparable books

Ask the user for two or three recent books the idea sits beside. Use `references/title-and-comps.md` to check whether the premise is distinct from them and whether it fits the shelf they imply. Never invent titles, authors, or sales claims; if web search is available, verify each named book exists and note what you checked. If not, mark the list unverified.

### 9. Hand off to specify

Present a one-screen brief: working title, logline, premise, counter-premise, stakes, form, genre and sub-genre, POV and tense if known, themes, and the comps. On approval, hand off to `/buchbinder specify` with the brief, and cache the workshop output to `./book/ideation/premise.md`.

## Conventions

- Present options, not verdicts. The user chooses the what-if, form, and title; record why when they reject a recommendation.
- `premise` is always the controlling idea (value + cause). The logline is a separate, lower-resolution artifact.
- Never present a comparable title, author, prize, or market fact as verified without a source.
- A premise that resembles an existing book is not a failure; most do. It needs one clear difference a reader would notice on the jacket.

## Reference Files

- **`references/what-if-generation.md`** — angles for turning an image, character, setting, or question into conflict-bearing what-ifs, with a worked example
- **`references/premise-tests.md`** — logline stress tests, the three levels of stakes, premise/counter-premise, and common premise failures with fixes
- **`references/form-choice.md`** — matching an idea's scope to a form: moving-parts count, what each form does well
- **`references/title-and-comps.md`** — title brainstorming families, shortlist tests, name collision checks, and the comparable-title sanity check
