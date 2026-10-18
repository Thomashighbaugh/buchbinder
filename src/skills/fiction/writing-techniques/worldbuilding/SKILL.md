---
name: worldbuilding
description: "Create and manage the story's world: locations, systems (magic, politics, technology, religion, economy, military, social, education), factions, artifacts, calendars, routes and travel, naming languages, and glossary terms. Use when building or revising any aspect of a story's setting — a place, a power, a culture, a map, a calendar, an invented word. Pairs with theme-craft (the world embodies the counter-premise) and namecraft (naming collisions). FICTION ONLY."
---

# Worldbuilding

Create and manage world elements for a story. Locations, systems (magic, politics, technology, religion, economy, military, social, education), factions, artifacts, calendars, and glossary terms live as markdown sections in `./book/knowledge/`, each cross-referencing characters and other elements. For a series, propagate canon to `./series/lorebook/`.

This skill is **fiction only.** Non-fiction carries scope, context, and terminology in the manifest and `./book/research/terminology.md` instead.

## Where it runs

- **Generation:** `/buchbinder ideation` (the Setting dimension) and `/buchbinder specify` (Level 4 Knowledge Map, which initialises the knowledge files). `/buchbinder manifest` sets the worldbuilding binding under Content Principles.
- **Improvement:** `/buchbinder revise` and `/buchbinder review` — the continuity scan checks routes, travel times, dates, and progressions.

## Storage

| Element | File | Section |
|---------|------|---------|
| Locations, routes, travel | `./book/knowledge/locations.md` | one `## [Location]` section each |
| Systems (magic, politics, tech, religion, economy, military, social, education) | `./book/knowledge/world-setting.md` | one `## [System]` section each |
| Factions | `./book/knowledge/factions.md` | one `## [Faction]` section each |
| Artifacts | `./book/knowledge/artifacts.md` | one `## [Artifact]` section each |
| Invented words, titles, ranks, concepts | `./book/knowledge/glossary.md` | one `## [Term]` entry each |
| Calendar, seasons, moons, eras | `./book/metadata/timeline.md` (+ a `## [Calendar]` section in `world-setting.md`) | date decisions of record |

Cross-references go in prose and, where a field is needed, as a short `- **Related:**` line. Series canon mirrors into `./series/lorebook/` (`world.md`, `glossary.md`, `characters.md`, `timeline.json`, `threads.md`).

## Creating a Location

1. Read `./book/manifest.md` (genre, tone, era) and `./book/specification.md` for context.
2. Read `./book/knowledge/locations.md` for existing locations.
3. Ask for the location's name and type (city, fortress, wilderness, …).
4. Build it through conversation, covering: physical description and atmosphere; history relevant to the story; culture and customs; notable features characters interact with; current state at the story's opening; routes to other locations with travel time in hours and mode (`references/maps-and-routes.md`); a pronunciation when the name is invented or easily misread.
5. Before settling an invented name, check it for clashes and look-alikes with the `namecraft` skill (`references/naming-languages.md`).
6. Append a `## [Location]` section to `./book/knowledge/locations.md` using `references/location-template.md`.
7. If notable characters are named, add the location to each character's entry in `./book/knowledge/character-profiles.md`.

## Maps, Routes, and Travel

Record travel between locations as a `Routes` block on the location section, not in prose notes, so the continuity scan can check it:

```markdown
- **Routes:**
  - to: harbor-district — 1.5 hours on foot
  - to: saltmarsh-fort — 9 hours coach
```

- A route is two-way unless the other location declares its own route back (uphill slower than down).
- The continuity scan (`/buchbinder review`, `/buchbinder timeline`) errors when a character appears in two dated scenes at locations joined by a route and the story time between them is shorter than the route's hours.
- Use the travel speeds table in `references/economy-logistics.md` to set plausible hours.

## Creating a System

1. Read `./book/manifest.md` for genre and themes; read `./book/knowledge/world-setting.md` for existing systems.
2. Identify the system type and consult `references/world-element-types.md` for the relevant prompts. For calendars, naming, economies, and magic/technology costs, also use `references/calendars.md`, `references/naming-languages.md`, and `references/economy-logistics.md`.
3. Build the system through conversation, addressing the key questions for that type — and always the cost/limit/recovery triad for any power.
4. Append a `## [System]` section to `./book/knowledge/world-setting.md` using `references/system-template.md`.
5. Cross-reference characters who interact with the system (magic-users for a magic system).

## Creating a Faction

Append a `## [Faction]` section to `./book/knowledge/factions.md` using `references/faction-template.md`. Cover: purpose and ideology; power base, resources, and territory; important members; conflicts and pressure points. Verify named members exist in `character-profiles.md` and cross-reference back.

## Creating an Artifact

Append a `## [Artifact]` section to `./book/knowledge/artifacts.md` using `references/artifact-template.md`. Cover: description and recognition details; function, constraints, and costs; history and prior owners; current owner/location state. Cross-reference the owner and location.

## Adding a Glossary Term

Record an invented word, title, rank, or concept the prose must spell and use the same way every time.

1. Read `./book/knowledge/glossary.md` for existing terms; check the candidate with the `namecraft` skill for clashes.
2. Append a `## [Term]` entry with **Definition** (what it means in the story) and **Usage Notes** (spelling, capitalisation, who uses it, what it never means). Add a pronunciation when the term is invented or easily misread.
3. When the term's capitalisation or hyphenation is a house-style decision, record it in `./book/metadata/terminology.md` too.

## Updating World Elements

1. Read the existing section.
2. Make the requested changes. If a location or faction changes partway through the story (a city falls, a guild disbands), add a **progression** instead of editing the opening value (see Changes Over the Story).
3. If cross-references changed, update the linked files.
4. Rename an element with the `namecraft` skill; change its type or status in its own section only.

## Changes Over the Story

Location and faction sections describe the world as the story opens. Record a later change as a progression, so drafting an early chapter does not see what happens in a late one:

```markdown
- **Progressions:**
  - from chapter 10: status → occupied
  - from chapter 10: controlled-by → lord-maren
```

- `from` is the first chapter where the new value holds (a planned chapter with no file yet is fine).
- `field` is a single-value field; list fields (notable characters, routes, members) cannot change this way.
- Keep entries in story order, and read the progressions up to the chapter being drafted before describing the place or faction in it.
- Artifacts and systems do not take progressions; track an artifact's changes through the `continuity-auditor` state checks.

## Calendars, Seasons, and Moons

A secondary world with its own calendar needs one written record, or dates drift. See `references/calendars.md`. Keep the calendar and date decisions in `./book/metadata/timeline.md`; keep seasons, moons, holidays, and how people tell time in a `## [Calendar]` section of `world-setting.md`. Date scenes in the calendar; `/buchbinder timeline` and the continuity scan turn dates into a day count so elapsed time across months, years, and eras is right.

## Naming

Invented names carry a culture's sound. Record a short phonology sketch per culture in `world-setting.md` (sounds used, syllable shape, stress, common endings, spelling conventions) so names feel related and cultures stay distinct — see `references/naming-languages.md`. Check every candidate with the `namecraft` skill before committing: an exact clash with an existing name is an error, and look-alikes (same first four letters, or the same initial one letter apart) confuse readers. Give invented names a pronunciation (plain respelling with the stressed syllable in capitals, not IPA unless asked).

## Cross-Referencing

- Locations name their notable characters; characters name their locations.
- Factions name their members and locations.
- Artifacts name an owner and a current location.
- Systems name their practitioners.
- Location routes name other locations.
- Glossary terms and all invented names may carry a pronunciation.

## Reference Files

- **`references/location-template.md`** — section template for locations
- **`references/system-template.md`** — section template for systems
- **`references/faction-template.md`** — section template for factions
- **`references/artifact-template.md`** — section template for artifacts
- **`references/world-element-types.md`** — prompts for each system type (magic, political, technology, religion, economic, military, social, education)
- **`references/maps-and-routes.md`** — recording routes and the travel/continuity check
- **`references/calendars.md`** — a custom calendar, dating scenes, seasons and moons
- **`references/naming-languages.md`** — phonology sketches, naming rules per culture, pronunciation, collision checks
- **`references/economy-logistics.md`** — prices and wages, supply lines, power costs, and a travel speeds table by mode
