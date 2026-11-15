---
name: workflow-guide
description: "Reference for the full /buchbinder phase methodology — track-specific phase order, subcommand reference, and conventions. Use when the user asks about the process or which step to take next."
---

# Workflow Guide

Reference for the Buchbinder phase methodology. The process varies by track type; consult this guide to determine the correct phase order and available subcommands.

## Phase Order by Track

| Track Type | Phase Sequence |
|------------|----------------|
| **Fiction** | Context Setup → Outline (gate) → Draft → Critique (all required readers) → Revise → Edit (3-pass) → **Post-edit cycles (proofread verification, continuity, pacing, hooks, read-through)** → Review (structural) → Publish |
| **Non-Fiction** | Research → Source Notes → Outline → Draft → Fact Check → Cite → Revise → Edit (3-pass) → **Post-edit cycles** → Review → Publish |
| **Hybrid** | Context Setup → Research → Outline → Draft → Fact Check → Cite → Critique → Revise → Edit → **Post-edit cycles** → Review → Publish |
| **Rewrite** | Load Original → Gap Analysis → Rewrite Spec → Draft → Compare → Critique → Revise → Edit → **Post-edit cycles** → Review → Publish |
| **Series** | (1) Series-level metadata → (2) Individual book metadata → (3) Series-wide knowledge/lorebook/tracking → (4) Series outline → (5) Break into individual book pipelines → [per-book: manifest/specify/outline/tasks/draft cycle, inheriting series context] → Series Audit/Sync |

**Post-edit cycles are mandatory.** A manuscript is not "ready for review" or "ready to publish" while any of them is outstanding. There is no optional leftover proofread step — proofreading happens inside the edit phase, and its verification is one of the post-edit cycles. Never report a pipeline as complete while a mandatory pass is outstanding; name it and route to the command that runs it.

## Mandatory Pipeline Contract

| Stage | Command | Completion evidence |
|-------|---------|---------------------|
| Draft | `/buchbinder draft` | Chapter prose saved; post-draft gates pass |
| Critique | `/buchbinder critique` | Every reader/pass the mode requires has a report under `book/critique/round-N/readers/` and a coverage checklist in `summary.md` |
| Revise | `/buchbinder revise` | Every Critical/Major item addressed; revision-verify passes (score ≥ 95) |
| Edit | `/buchbinder edit` | All three passes applied: line-edit, copy-edit, proofread |
| Post-edit cycles | `/buchbinder cycle` (resumes at post-edit step) | Proofread verification, continuity, pacing, hooks, read-through each returned Pass (≤3 cycles each) |
| Review | `/buchbinder review` | Review cycle passed |

Multi-reader stages run **either** as parallel subagents (swarm) **or** as sequential subagents with collected reports. Both produce the same per-reader files and the same coverage checklist; a missing or empty reader report means the stage did not run.

## Subcommand Reference

| Subcommand | Phase | Purpose |
|------------|-------|---------|
| `guided` | Utility | Automatic state detection — recommends next phase |
| `manifest` | 1 | Establish creative or intellectual principles + thematic statement (hard block) + series lorebook inheritance |
| `specify` | 2 | Build story specification + premise stress-test (6 criteria, hard block) |
| `clarify` | 3 | Resolve specification ambiguities |
| `research` | 2/4 | Active research: sources, annotation, literature review |
| `outline` | 4/5 | Fine-grained chapter structure with scene beats, setup/payoff chains, continuity anchors + structural gate and continuity/fidelity review loop (≤3 cycles each) |
| `task-manager` | 5/6 | Break outline into tracked tasks with per-chapter sub-status lifecycle |
| `draft` | 6/7 | Batch XML drafting with awareness map, prose quality, echo detection, beat arc check |
| \`critique\` | 7/8 | 8 modes: developmental, audience, domain, cultural, cold-read, comprehensive, adversarial, personas |
| `revise` | 8/9 | Batch revision with verify gate + `--depth full` (structural→language→pacing) |
| `edit` | 9/10 | Three-pass: line-edit (craft) → copy-edit (mechanics) → proofread (typos) + linguistic gates |
| `review` | 10/11 | Continuity scan + Phase 2 structural analyses (7 analyses + 2 visualization outputs) |
| `cite` | 3 | Citation management (non-fiction) |
| `publish` | 11/12 | Format export via pandoc + post-export verification |
| `track` | Utility | Unified character/plot/source tracking |
| `timeline` | Utility | Chronological consistency verification |
| `meta` | Utility | Bibliographic metadata management |
| `drafter` | Utility | Loose draft jumpstart from raw ideas |
| `verify` | Utility | On-demand quality gate runner — 25 gates |
| `resume` | Utility | JSON checkpoint resume with file diff |
| `cycle` | Utility | Full mandatory pipeline: draft → critique (every required reader) → revise → edit (line/copy/proofread) → post-edit critique–revise cycles → continuity → done |
| `pacing-audit` | Utility | Cross-chapter pacing analysis |
| `hook-review` | Utility | Opening/closing hook audit + book-level opening/closing strength |
| `read-through` | Utility | Full reader experience audit + immersion + trust accounting |
| `series` | Utility | Series-first pipeline: series metadata → book metadata → series knowledge/lorebook/tracking → series outline → break into book pipelines, plus sync/audit/register/import/status |

## Conventions

### Split-Mode Convention
Draft and revise in separate sessions. Never revise during a draft session — mark issues with `[TODO: ...]` markers and address them during the designated revise phase.

### Task Marker Legend
- `[TODO: description]` — action item for the revise phase
- `[FIXME: description]` — error or broken continuity
- `[CHECK: description]` — verification needed (fact, citation, consistency)
- `[IDEA: description]` — creative option to consider later

### Citation Marker Legend
- `[Source: key]` — factual claim sourced from the named source note
- `[CitationNeeded]` — placeholder for a source not yet located
- `[Disputed: key-a vs key-b]` — conflicting sources on this claim

## File Structure Overview

```
project-root/
├── .opencode/             # Per-project OpenCode configuration
│   ├── commands/buchbinder-router.md  # Hub phase router (installed by buchbinder)
│   ├── skills/            # QA, critique, research, fiction, non-fiction skills
│   ├── tools/             # TypeScript tools (buchbinder-router, hub-data, project-state, etc.)
│   │   ├── hubs/buchbinder/ # 29 subcommand spec files
│   │   └── lib/           # 32 library files (gates, voice, checkpoints, etc.)
│   └── templates/        # Track templates (fiction/non-fiction/series)
├── book/                  # All book content
│   ├── track.json         # Track selection: fiction | non-fiction | mixed
│   ├── manifest.md    # Core narrative/style rules + thematic statement
│   ├── specification.md   # Story specification (with premise stress-test)
│   ├── research/          # Sources, bibliography, interviews
│   ├── outline/           # Fine-grained chapter structure (scene beats, setup/payoff)
│   ├── content/           # Draft chapters (clean prose)
│   ├── drafts/            # XML-structured drafts (with verification tags)
│   ├── critique/          # Critique artifacts (8 modes)
│   ├── revisions/         # Revision tracking + verify gate results
│   ├── knowledge/         # Character profiles, locations, glossary
│   ├── tracking/          # State tracking (character, plot, timeline JSON)
│   ├── metadata/       # Modular style sheets (5 modules)
│   ├── checkpoints/       # JSON checkpoint state for resume
│   ├── series/            # Series lorebook (if series project)
│   ├── creative-constraints.json  # Non-negotiables (author's red lines)
│   ├── feedback-memory.json       # Rejection reason preferences
│   ├── vetoes.json                # Veto log
│   ├── intents/                   # Authorial intent records per phase
│   └── revisions/approvals/       # Diff-based approval results
├── memory/                # Durable reference
└── output/                # Published exports
```

## Quality Gate System

Buchbinder uses **hard-block quality gates** — gates produce evidence-based pass/fail results that block progression on failure. There are 26 gates across 7 categories:

| Category | Gates | When |
|----------|-------|------|
| **Outline** | `outline` | Before drafting — checks scene beats, setup/payoff, continuity anchors |
| **Pre-draft** | `pre-draft` | Before each draft session — 13 context items must be loaded |
| **Post-draft** | `post-draft`, `prose-quality`, `echo-detection`, `beat-arc` | After drafting — XML structure, prose metrics, echo/repetition, beat arc |
| **Revision** | `revision-verify` | After revision — critique items must be addressed |
| **Structural** | `reverse-outline`, `character-arc`, `qa-accounting`, `promise-audit`, `escalation-curve`, `cognitive-load`, `knowledge-state`, `thread-matrix`, `dependency-graph` | During review — Phase 2 deep analyses |
| **Linguistic** | `subtext`, `purple-prose`, `cliche`, `rhythm` | During edit — on-the-nose dialogue, overwriting, clichés, monotony |
| **Experience** | `immersion`, `trust`, `opening-closing`, `continuity`, `style` | During read-through/review — immersion breaks, trust violations, hook strength |
| **Non-negotiables** | `non-negotiables` | During draft/revise/edit — checks content against author's declared creative constraints |

Run `/buchbinder verify` to run any gate on demand. Gates produce structured reports with evidence citations.

## Human-in-the-Loop Features

Buchbinder integrates 8 HITL features to keep the author in control:

| Feature | How It Works |
|---------|-------------|
| **Phase Preview** | Before any phase executes, shows scope (chapters, word count), estimated duration, context to load, gates to run. Author confirms before execution. |
| **Authorial Intent** | Author states intent in 1-2 sentences before each phase. Generic fallback ("best output consistent with outline and manifest") if author is unsure. Post-phase verification checks intent was honored. |
| **Diff-Based Approval** | After revise/edit, shows structured before/after diff. Author approves line-by-line, rejects specific hunks, or accepts all. Rejected hunks preserve original text. |
| **Suggestion Severity Tiers** | Suggestions classified: must-fix (blocks), should-consider (warning), your-call (preference), FYI (observation). Author controls filter level. |
| **Veto System** | Author types `|` to veto any suggestion. Silent veto (`|`) or with reason (`| keeping this rhythm for effect`). Vetoed items never re-suggested. |
| **Feedback Memory** | Rejection reasons logged as avoidance patterns. AI checks preferences before making future suggestions. |
| **Non-Negotiables** | Author declares creative constraints at manifest (plot, character, tone, content, structure, world). Non-negotiables gate checks all content against constraints. |
| **Provenance Tracking** | Every line tagged with origin: author, ai-drafted, ai-revised, ai-edited, ai-modified, author-revised. Manuscript-level statistics show author vs AI percentage. |
