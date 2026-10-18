---
name: theme-craft
description: "Plan and audit the thematic layer of a story as a working mechanism, not decoration. Use when establishing or revising the controlling idea (value + cause), the counter-premise, the lie/truth/ghost-wound machinery and arc types, antagonist design as the embodied counter-argument, motif planting and payoff, or a revision-time theme audit. FICTION ONLY."
---

# Theme Craft

Plan and audit theme as a working mechanism, not decoration. Covers the controlling idea (value + cause, in McKee's sense), the lie/truth machinery and the three canonical arc types, antagonist design as the embodied counter-argument, motif tracking, and a revision-time theme audit. Use at story start (thematic statement), during character design (lie/truth/arc-type), and after a complete draft (theme audit).

This skill is **fiction only.** Non-fiction and mixed projects carry a thesis and argument structure instead (`academic-writing`, `argument-structure`).

## Where it runs

- **Generation:** `/buchbinder manifest` (the Thematic Statement, HARD BLOCK) and `/buchbinder ideation` (the Theme dimension) and `/buchbinder specify` (Level 3 Story Promise).
- **Character design:** alongside `character-depth`, which owns the wound/lie; theme-craft adds the arc type and concreteness.
- **Improvement:** `/buchbinder revise` and `/buchbinder review` run the theme audit.

## Workflow

### 1. Draft the working premise

Read `./book/manifest.md` (thematic statement) and `./book/specification.md` (premise) for genre and themes. Consult `references/controlling-idea.md` and write a one-sentence premise (value + cause) and counter-premise:

- `Thematic statement:` `{Value} {triumphs|fails} because {cause}.`
- `Counter-premise:` `{Opposing value} {triumphs|fails} because {opposing cause}.`

If the author prefers discovering theme in the draft, record `theme: tbd-discovery` and skip to step 3. The working premise is revisable — if the draft argues something truer, rewrite the premise to match the draft, then revise the ending to deliver the verdict cleanly.

### 2. Build the lie/truth machinery

For the protagonist and antagonist (and any significant supporting character whose arc touches the theme), consult `references/lie-truth.md` and add to their entry in `./book/knowledge/character-profiles.md`:

- `arc-type` — `change-positive`, `change-negative`, or `flat`.
- `lie` — the false belief.
- `truth` — the belief that resolves it.
- `ghost-wound` — the specific backstory event that planted the lie.

Check the character's turning points against the arc type: `change-positive` needs growth beats; `change-negative` needs the truth visibly refused at each turning point; `flat` needs escalating tests of steadfastness, not growth. A flat arc without escalating tests reads as static.

### 3. Design the antagonist as the counter-argument

Consult `references/antagonist-design.md`: give the antagonist an edge, a defensible belief in the counter-premise, a want/wound/plan that adapts, and scenes they win. When the opposition is institutional, personify it with one true believer. If you cannot write a paragraph defending the antagonist's position, they are a plot device — deepen or replace them.

### 4. Plant motifs

Consult `references/motif-symbolism.md`; choose two or three concrete motifs, plant them literally, and track plantings, variations, and ending resonance in `./book/tracking/motifs.md` (`planned` / `planted` / `paid-off`). Vary the motif's state to rhyme with the protagonist's relationship to the lie/truth. Never have a character explain what a motif means.

### 5. Use the premise while drafting

When a scene decision is unclear, ask which choice engages the value continuum and costs the protagonist something. Feed the lie into scene sequels (`scene-structure`): the sequel is where the lie gets examined. A scene that never touches the value continuum is structurally decorative.

### 6. Run the theme audit in revision

After a complete draft, consult `references/theme-audit.md`: trace the value through the draft, check the ending against the opening's value-question, verify theme is dramatized through consequence not commentary, confirm motifs are paid off, and check each arc's turning points against its arc type. Record findings in `./book/revisions/theme-audit.md` with a `theme-holds` / `theme-broken` verdict. Hand structural findings to `/buchbinder revise` as a developmental revision plan.

## Conventions

- The thematic statement in `./book/manifest.md` and the premise in `./book/specification.md` are the single source of truth for the story's theme.
- Character `arc-type` values are kebab-case from the fixed set (`change-positive`, `change-negative`, `flat`); `lie`, `truth`, and `ghost-wound` are one-line strings.
- Motif ids are kebab-case and tracked in the motif ledger with `planned` / `planted` / `paid-off` status.
- **Theme is dramatized through choices and consequences.** Never add a character speech, narration summary, or mentor lecture *explaining* the theme to satisfy an audit finding — rework the choices instead.

## Reference Files

- **`references/controlling-idea.md`** — the controlling idea as value + cause, the counter-premise, the working-premise workflow, premise quality check
- **`references/lie-truth.md`** — lie, truth, ghost wound, and the three arc types
- **`references/antagonist-design.md`** — worthy opponent, antagonist as counter-argument, plan-the-antagonist-as-protagonist, personified institutions
- **`references/motif-symbolism.md`** — plant-and-vary, object-symbol resonance with the ending, the motif ledger
- **`references/theme-audit.md`** — revision audit: ending vs. opening value-question, consequence vs. commentary, motif payoff
