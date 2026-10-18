# Location Template

Use this structure for a `## [Location Name]` section in `./book/knowledge/locations.md`.

```markdown
## {Location Name}

- **Type:** {city, district, wilderness, submerged-ruin, …}
- **Region:** {parent region}
- **Population:** {number or estimate}
- **Controlled by:** {character or faction}
- **Status:** {thriving, declining, strained, exposed, unknown}
- **Setting:** {interior | exterior | both}
- **Pronunciation:** {optional, e.g. KEL-ah-mar}
- **Notable characters:** {character names}
- **Routes:**
  - to: {location} — {hours} {mode}
- **Related:** {other locations, factions, systems}

### Description
What the location looks, sounds, smells, and feels like. First impressions for someone arriving. Key sensory details that make it distinct.

### History
How the location came to be and key events that happened here. Only history relevant to the story.

### Culture & Customs
The people who live here, their way of life, traditions, social norms. What makes this place culturally distinct.

### Notable Features
Specific landmarks, buildings, natural features, or points of interest within the location. Things characters would interact with.

### Current State
What the location is like at the time the story opens. Political situation, recent events, tensions, opportunities.
```

`Type` and `Status` are free-form descriptive strings. `Setting` (interior/exterior/both) is optional. A route is two-way unless the other location declares its own; the continuity scan checks dated scenes against its hours (see `maps-and-routes.md`). Record later changes to a location as **Progressions**, not by editing the opening values.
