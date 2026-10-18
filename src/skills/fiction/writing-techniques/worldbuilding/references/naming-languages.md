# Naming Languages

Names carry a culture's sound. A few rules per culture make names feel related, keep cultures distinct from each other, and prevent accidental look-alikes that confuse readers.

## Phonology sketch

For each culture or language, write a short sketch in the `## [Social System]` section of `./book/knowledge/world-setting.md`, or in the culture section of a location or faction:

- **Sounds used:** consonants and vowels the language favours (`k, t, r, s, v, l; a, e, o`), and sounds it never uses (`no th, no w`)
- **Syllable shape:** `CV`, `CVC`, clusters allowed or not (`str-` yes, final `-ng` no)
- **Stress:** first syllable, penultimate, or last
- **Common endings:** `-ar`, `-ek`, `-issa` and what they mark (place, person, gender, rank)
- **Spelling conventions:** how sounds are written (`k` never `c`), apostrophes and accents (use sparingly; each one slows the reader)

Keep two cultures apart by changing at least two of: sound set, syllable shape, and endings.

## Naming rules

Record how people and places are named in each culture:

- Order of given name, family name, patronymic, clan, or title
- Names that change at life events (adulthood, marriage, office)
- Place names built from features (`-ford`, `-holm`, `Kel-` for hill)
- Words that are taboo or reserved (the dead, gods, royalty)

Build a short list of roots (hill, river, iron, grey, old) and make place names from them, so a reader who notices `Kelmar` and `Kelvoss` feels the pattern.

## Pronunciation

Give invented names a pronunciation note on the character, location, system, faction, artifact, or glossary entry:

```markdown
- **Pronunciation:** "SEER-sha"
```

Use plain respelling with the stressed syllable in capitals, not IPA, unless the user asks for IPA.

## Collision check before naming

Check every new name with the `namecraft` skill before committing to it. `namecraft` compares candidates with character names and aliases, locations, factions, artifacts, systems, and glossary terms.

- **Exact clash** (error): the candidate already belongs to an existing name, or its given name (the first word that is not a title or article such as `The`, `Lord`, or `Captain`) equals a character's given name, so *Lady Sera* clashes with *Sera Voss*. Pick another, or confirm the reuse is deliberate and rename the existing entity.
- **Look-alike warning:** the same first four letters (`Mara` / `Mira`), or the same initial within an edit distance of 1 (or 2 when both words have five letters or more), so `Kelvar` / `Kelvoss` blur together. Change the initial or the length unless the resemblance is deliberate (siblings, a namesake) — and say so in the section.
- **Shared initial with a major character:** fine in moderation; a cast where three leads start with M is hard to follow.

Multi-word names such as `Ashen Citadel` are only checked for exact clashes, so check a distinctive word on its own (`Ashen`) to catch look-alikes.

When renaming an existing entity, preview the replacements, show the user, and update the chapter text as well as the references only once they approve.
