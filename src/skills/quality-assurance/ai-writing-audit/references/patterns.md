# AI-Writing Pattern Catalog

Adapted from `conorbronsdon/avoid-ai-writing` (MIT). Use with the editing contract in `../SKILL.md` and the standing rule `rules/ai-writing-patterns.md`. Entries describe candidate matches, not automatic edits — check context, pass conditions, and protected status before flagging or changing anything.

In `| Replace | With |` tables, only the **Replace** column is a catalog pattern; **With** is a suggested human alternative, never itself a pattern. Match inflected forms unless a variant has a distinct honest sense.

## Word tiers

- **Tier 1 — review every match.** 1A = AI frequency markers (produced-ness evidence). 1B = clarity edits (wordiness/formality; **not** authorship evidence).
- **Tier 2 — flag when 2+ appear in the same paragraph.** One isolated occurrence is never a standalone finding.
- **Tier 3 — flag by density.** One word only when it alone hits `max(3, floor(wordCount × 0.03))` uses. Listed forms counted separately.
- **Tier 3 phrases — 2+ of the same phrase, or 3+ distinct phrases in one piece.**

### Tier 1A — AI frequency markers

| Replace | With |
|---|---|
| delve / delve into | explore, dig into, look at |
| landscape (metaphor) | field, space, industry, world |
| tapestry | complex structure, rich history |
| realm | area, field, domain |
| paradigm | model, approach, framework |
| embark | start, begin |
| beacon (metaphor) | example, guide |
| testament to | shows, proves, demonstrates |
| robust | strong, reliable, solid |
| comprehensive | thorough, complete, full |
| cutting-edge | latest, newest, advanced |
| leverage (verb) | use |
| pivotal | important, key, critical |
| underscores | highlights, shows |
| meticulous / meticulously | careful, detailed, precise |
| seamless / seamlessly | smooth, easy, without friction |
| game-changer / game-changing | describe what specifically changed |
| hit differently / hits different | feels different (or cut) |
| watershed moment | turning point, shift |
| marking a pivotal moment | state what happened |
| the future looks bright | cut |
| only time will tell | cut |
| nestled | is located, sits, is in |
| vibrant | lively, active |
| thriving | growing, active (or cite a number) |
| showcasing | showing, demonstrating |
| deep dive / dive into | look at, examine, explore |
| unpack / unpacking | explain, break down, walk through |
| bustling | busy, active |
| intricate / intricacies | complex, detailed |
| complexities | problems, details |
| ever-evolving | changing, growing |
| enduring | lasting, long-running |
| daunting | hard, difficult, challenging |
| holistic / holistically | complete, full, whole |
| actionable | practical, useful, concrete |
| impactful | effective, significant |
| learnings | lessons, findings, takeaways |
| thought leader / thought leadership | expert, authority |
| best practices | what works, proven methods |
| at its core | cut |
| synergy / synergies | combined effect |
| interplay | relationship, connection, interaction |
| keen (intensifier) | interested, eager (or cut) |
| genuinely / genuine (intensifier) | cut |
| symphony (metaphor) | coordination, balance |
| embrace (metaphor) | adopt, accept, use, switch to |
| load-bearing *(hyphen required)* | essential, critical — say what breaks without it |

**`load-bearing` boundary:** flag only when the hyphenated compound immediately modifies `assumption`, `claim`, `invariant`, `premise`, `constraint`, `dependency`, `argument`, or `abstraction` (incl. plurals). Preserve literal building use and predicative uses ("the wall is load-bearing").

### Tier 1B — Clarity edits (not authorship evidence)

| Replace | With |
|---|---|
| utilize | use |
| in order to | to |
| due to the fact that | because |
| serves as | is |
| features (verb) | has, includes |
| boasts | has |
| presents (inflated) | is, shows, gives |
| commence | start, begin |
| ascertain | find out, determine, learn |
| endeavor | effort, attempt, try |

### Tier 2 — Flag when 2+ in the same paragraph

| Replace | With |
|---|---|
| harness | use, take advantage of |
| navigate / navigating | work through, handle, deal with |
| foster | encourage, support, build |
| elevate | improve, raise, strengthen |
| unleash | release, enable, unlock |
| streamline | simplify, speed up |
| empower | enable, let, allow |
| bolster | support, strengthen, back up |
| spearhead | lead, drive, run |
| resonate / resonates with | connect with, appeal to, matter to |
| revolutionize | change, transform (or describe what changed) |
| facilitate | enable, help, allow, run |
| underpin | support, form the basis of |
| nuanced | specific, subtle (or name the nuance) |
| crucial | important, key, necessary |
| multifaceted | having several parts |
| ecosystem (metaphor) | system, community, network, market |
| myriad | many, numerous (or give a number) |
| plethora | many, a lot of |
| encompass | include, cover, span |
| catalyze | start, trigger, accelerate |
| reimagine | rethink, redesign, rebuild |
| galvanize | motivate, rally, push |
| augment | add to, expand, supplement |
| cultivate | build, develop, grow |
| illuminate | clarify, explain, show |
| elucidate | explain, clarify, spell out |
| juxtapose | compare, contrast, set side by side |
| paradigm-shifting | describe what shifted |
| transformative / transformation | describe what changed and how |
| cornerstone | foundation, basis, key part |
| paramount | most important, top priority |
| poised (to) | ready, set, about to |
| burgeoning | growing, emerging |
| nascent | new, early-stage, emerging |
| quintessential | typical, classic, defining |
| overarching | main, central, broad |
| quietly | cut, or name the concrete contrast |
| deeply *(significance collocations only)* | cut, or name what runs deep |
| underpinning / underpinnings | basis, foundation |

### Tier 3 — Flag only at high density (per-word)

`significant/significantly`, `innovative/innovation`, `effective/effectively`, `dynamic/dynamics`, `scalable/scalability`, `compelling`, `unprecedented`, `exceptional/exceptionally`, `remarkable/remarkably`, `sophisticated`, `instrumental`, `world-class/state-of-the-art/best-in-class`, `verbatim`.
Fix: replace with specifics (numbers, comparisons, examples) or cut.

### Tier 3 phrases — 2+ of same phrase, or 3+ distinct in one piece

`emerging sector/space/category`, `the integration of (X with Y)`, `the intersection of (X and Y)`, `community-driven`, `long-term sustainability`, `user engagement`, `designed for long-term [X]`.
Fix: name the actual mechanism, architecture, or schedule; cut the empty framing.

## Pattern catalog

Grouped. Each entry names the tell and the fix.

### Sentence and structure

- **Negative parallelism** — "It's not X — it's Y." Flags only when a second frame starts within three sentences. Fix: state the positive claim directly.
- **Negation chains** — two or more "no …" items in a row ("No fluff, no filler, no jargon"). Fix: say what the thing *is*. One negation earns its place; a chain is a drumroll.
- **Same-opener sentence runs** — three or more consecutive sentences opening on the same word, unless the anaphora does persuasive work. Pronoun-opener runs are ordinary narration.
- **Stranded auxiliary contrast** — "The tool died; the data didn't." Ration to one; write the next contrast out in full.
- **Colon into a triple** — a colon opening onto exactly three comma-separated items. Audit the list; weigh by genre.
- **Manufactured punchlines / staccato drama** — three or more same-shape fragments in a row, each posing as a reveal. **Fiction carve-out:** keep fragments that carry voice or tension; fold the rest into ordinary sentences.
- **Aphorism formulas** — "X is the language of Y," "the architecture of trust," "X is not a tool but a mirror." Replace with the source-supported claim. Quotations and established idioms pass.
- **Excessive structure** — more than 3 headings in under 300 words; 8+ bullets in under 200; formulaic headers ("Overview," "Key Points"). Merge or rename only when structural editing is authorized.
- **Inline-header lists** — bullets where each item repeats its bold header ("**Performance:** Performance improved by…"). Strip the redundant label.
- **List-label periods** — a short bold noun-phrase label followed by a period then a gloss. Use a colon and lowercase the gloss.

### Inflation and significance

- **Significance inflation** — "marking a pivotal moment in the evolution of…", "a watershed moment for the industry." Delete the inflation clause if the sentence still works.
- **Novelty inflation** — "introduced a term," "coined the phrase," "a failure mode nobody talks about." Remove the unsupported novelty claim; describe the supported action.
- **"Real/actual" adjective inflation** — "real on-chain tokenomics," "genuine utility." Drop the adjective unless the sentence names the fake version.
- **Moral-adjective category errors** — "an honest shape," "flagged honestly." Cut the unsupported moral adjective; state a concrete property.
- **Generic future-narrative closers** — modal + "become" + "the most [adjective] (narrative/trend/chapter)." Use a falsifiable version only when the source supplies it.
- **Generic conclusions** — "The future looks bright," "Only time will tell," "As we move forward." Cut; add a closer only when the source supplies one.

### Hedging and confidence

- **Hedge-stacked predictions** — "could potentially," "may eventually unlock." Keep the one qualifier that retains the intended uncertainty.
- **Confidence calibration phrases** — "It's worth noting that," "Interestingly," "Notably," "Undeniably." Flag by density; let the fact speak.
- **Parenthetical hedging** — "(and, increasingly, Z)," "(or, more precisely, Y)." Give the aside its own sentence or cut it.
- **False concession structure** — "While X is impressive, Y remains a challenge." Make the concession specific or cut the frame.

### Voice and stance

- **Chatbot artifacts** — "I hope this helps!", "Certainly!", "Great question!" Remove entirely.
- **Sycophantic tone** — "Excellent point!", "You're absolutely right!" Remove.
- **"Let's" constructions** — "Let's explore," "Let's break this down." Start with the point.
- **Narrated candor** — "I want to be upfront:", "To be fully transparent:" Cut the frame; keep the disclosure. **Carve-out:** substantive admissions and conflict-of-interest disclosures stay.
- **Acknowledgment loops** — "You're asking about…", "To answer your question…" Just answer. **Carve-out:** a reply that orients the reader to which question is being answered.
- **Performed-insight phrases** — "sit with that for a moment," "that's not nothing," "the part nobody mentions," "X is dead; long live X," sentence-initial "Turns out." One is style; several is a tell.
- **Stock reaction framing** — "What surprised me most," "I was fascinated to discover." Keep authentic, specific reactions.
- **Lingering-attention claims** — "the line I keep coming back to," "I can't stop thinking about this." **Carve-out:** a reason attached.
- **Self-labeling significance** — "That last move is the contrarian one." Cut the label; let the description carry the weight.
- **Infomercial engagement hooks** — "The catch?", "Here's the thing.", "Plot twist:". Delete the hook and state the thing.
- **Dramatized contrast against the crowd** — "shipped it in 2022, while everyone else was still debating timelines." Cut the crowd clause; name a competitor only when the source does.

### Attribution and evidence

- **Vague attributions** — "Experts believe," "Studies show," "Research suggests." Cite the source or cut the claim.
- **Vague third-party validation** — "independent testing confirms," "analysts agree." Name the source, test, and result, or cut.
- **Notability name-dropping** — a stack of prestigious citations that borrows weight without showing why each matters. One supported reference beats four name-drops.
- **Superficial -ing analyses** — strings of participles as pseudo-analysis: "symbolizing the region's commitment, reflecting decades of investment." Replace with facts or cut.
- **Promotional language** — "nestled within the breathtaking foothills," "a vibrant hub of innovation." Use a plain description or cut.
- **Formulaic challenges** — "Despite challenges, [subject] continues to thrive." Name the challenge and response, or cut.
- **Speculative gap-filling** — "is believed to have," "likely began his career in." Cut the speculation; use a supplied fact.

### Specificity and concreteness

- **False ranges** — "from the Big Bang to dark matter." List the actual topics.
- **Transformation crutch** — repeated unexplained relabeling ("the concern turns into panic"). Ask what changed; use supplied facts. Literal transformations pass.
- **False agency** — "The decision emerged after the offsite." Name the actor only when the source identifies them.
- **Copula avoidance** — "serves as," "features," "boasts." Default to "is" or "has" unless a more specific verb adds meaning.
- **Synonym cycling** — "developers… engineers… practitioners… builders" for the same referent. Use the clearest term consistently.
- **Bullet lists of bare noun phrases** — 5+ consecutive ≤6-word adjective-plus-noun items with no verb. Convert to prose or full claims only when authorized. Genuine list content (changelogs, parameter docs) passes.
- **Unfilled placeholders** — `[Your Name]`, `[INSERT SOURCE]`, `2025-XX-XX`. Fill with supplied content or flag the gap.
- **Cutoff disclaimers** — "As of my last update," "While specific details are limited." Remove; never turn missing information into a confident claim.
- **AI-tool URL parameters / citation-markup leaks** — `utm_source=chatgpt.com`, `citeturn0search0`, `contentReference[oaicite:0]`. Strip the token; the presence is the signature.

### Rhythm and uniformity

- **Uniform sentence length** — a run of similarly shaped sentences. Vary by clarifying, not by imposing word-count bands.
- **Uniform paragraph length** — repeated same-size paragraphs whose boundaries do not follow the argument. Keep regular structure when the genre calls for it.
- **Em-dash frequency** — above 1 per 1,000 words. Writing-quality guidance, **not** evidence of machine authorship.
- **Suspiciously clean grammar** — don't sand away deliberate fragments, sentences starting with "And"/"But", or comma splices for effect.
- **Read-aloud test** — if the text could pass through TTS without sounding odd, it is probably too uniform.
- **Treadmill effect** — could you cut 40–60% and lose no information? Report during cleanup; condense only when authorized.
- **Paragraph-reshuffle immunity** — if you can swap two body paragraphs without breaking the piece, it is a list, not an argument.

## Context profiles

`linkedin` · `blog` (default, full strength) · `technical-blog` · `investor-email` (tightest) · `docs` · `casual` (worst offenders only).

Technical-context exceptions (not flagged): `robust`, `comprehensive`, `seamless`, `ecosystem`, `leverage` (actual platform leverage), `facilitate`, `underpin`, `streamline`, `harness` in "test harness". Ornamental uses and `delve`/`tapestry`/`beacon`/`embark`/`testament to`/`game-changer` still flag.

### Tolerance matrix (abridged)

Rules not listed apply at full strength everywhere. Values: strict | relaxed | skip | extra strict.

| Rule | linkedin | blog | technical-blog | investor-email | docs | casual |
|---|---|---|---|---|---|---|
| Em dashes | relaxed | strict | strict | strict | relaxed | skip |
| Excessive bullets | skip | strict | relaxed | strict | skip | skip |
| Hedging | strict | strict | relaxed | strict | relaxed | skip |
| Word table | strict | strict | partial | strict | relaxed | P0 only |
| Promotional language | relaxed | strict | strict | extra strict | strict | skip |
| Significance inflation | strict | strict | strict | extra strict | relaxed | skip |
| Uniform paragraph length | skip | strict | strict | strict | relaxed | skip |
| Transition phrases | skip | strict | strict | strict | relaxed | skip |
| Generic conclusions | skip | strict | strict | extra strict | skip | skip |
| Future-narrative closers | strict | strict | strict | extra strict | skip | skip |

**Auto-detection cues:** <300 words + hashtags → `linkedin`; code/API blocks → `technical-blog`; salutation + fundraising → `investor-email`; step-by-step/README → `docs`; no strong signals → `blog`.

## Voice profiles

Optional and independent of context. Infer from the source's existing register; never impose a persona on text that already has one. Bounded by the never-inject list.

- **`casual`** — contractions, direct conversational sentences; no forced fragments or length quota.
- **`professional`** — active voice where the actor matters; concrete claims when supplied; never invent a source behind "experts say."
- **`technical`** — plain copulatives ("X is Y") over "serves as"/"stands as a testament to"; preserve accurate technical terms.
- **`warm`** — address the reader where the source already does; cut empty intensifiers; avoid performative-empathy openers.
- **`blunt`** — lead with the claim; rare em-dashes; cut hedge stacks but preserve modals that carry uncertainty.

**Calibrate to a sample:** given a sample of the author's own prose, match its sentence-length pattern, contraction rate, paragraph openings, and recurring word choices instead of a named profile. Don't "upgrade" the vocabulary.

## Fiction note

The catalog is calibrated for English prose broadly. Fiction is exempt where the device is the point: manufactured punchlines, staccato drama, fragments, anaphora, and deliberate repetition pass when they carry voice, comedy, or tension. The never-inject list still applies — a rewrite must not add a fragment run, a manufactured stake, or an invented specific the author did not write.
