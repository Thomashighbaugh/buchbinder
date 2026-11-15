/**
 * Mandatory Pass Ledger
 *
 * The pipeline has passes that cannot be skipped or hand-waved:
 * critique coverage → revision → edit (line/copy/proofread)
 * → post-edit critique-revise cycles → review.
 *
 * Prose instructions alone did not hold — a run could report "pipeline
 * complete" while the post-edit cycles had never run. Every mandatory pass
 * therefore writes a ledger file, and completion is read back from disk
 * instead of being asserted in a chat message.
 *
 * Layout (relative to project root):
 *   book/pipeline/edit.md
 *   book/pipeline/proofread-verification.md
 *   book/pipeline/continuity.md
 *   book/pipeline/pacing.md
 *   book/pipeline/hooks.md
 *   book/pipeline/read-through.md
 *   book/pipeline/review.md
 *
 * Each ledger file carries at minimum:
 *   **Verdict**: Pass
 *   **Cycles**: 2
 *
 * A pass with a missing file, an empty file, or a verdict other than Pass
 * counts as OUTSTANDING.
 */

import fs from 'fs-extra';
import path from 'path';

/** Directory (relative to project root) holding the mandatory-pass ledger. */
export const PIPELINE_LEDGER_DIR = path.join('book', 'pipeline');

/** Directory (relative to project root) holding critique rounds. */
export const CRITIQUE_DIR = path.join('book', 'critique');

/** Identifiers for the ledger-backed mandatory passes. */
export type MandatoryPassId =
  | 'edit'
  | 'proofread-verification'
  | 'continuity'
  | 'pacing'
  | 'hooks'
  | 'read-through'
  | 'review';

/** Definition of one ledger-backed mandatory pass. */
export interface MandatoryPassDef {
  id: MandatoryPassId;
  label: string;
  /** Ledger file name inside `book/pipeline/`. */
  ledgerFile: string;
  /** Command that produces the pass. */
  command: string;
  /** What the pass checks. */
  checks: string;
}

/** Every mandatory pass that writes a ledger file, in pipeline order. */
export const MANDATORY_PASSES: MandatoryPassDef[] = [
  {
    id: 'edit',
    label: 'Edit — line, copy, and proofread passes',
    ledgerFile: 'edit.md',
    command: '/buchbinder edit',
    checks: 'Line edit, copy edit, and proofread applied to the revised text',
  },
  {
    id: 'proofread-verification',
    label: 'Proofread verification',
    ledgerFile: 'proofread-verification.md',
    command: '/buchbinder edit',
    checks: 'Typos, orphan/widow lines, spacing, scene-break and numbering consistency',
  },
  {
    id: 'continuity',
    label: 'Continuity',
    ledgerFile: 'continuity.md',
    command: '/buchbinder verify continuity',
    checks: 'Character state, timeline, plot threads, location, relationships, props, voice',
  },
  {
    id: 'pacing',
    label: 'Pacing',
    ledgerFile: 'pacing.md',
    command: '/buchbinder pacing-audit',
    checks: 'Pace curve, plateau detection, beat rhythm',
  },
  {
    id: 'hooks',
    label: 'Hooks and transitions',
    ledgerFile: 'hooks.md',
    command: '/buchbinder hook-review',
    checks: 'Weak or missing hooks between chapters and scenes, momentum drops',
  },
  {
    id: 'read-through',
    label: 'Read-through',
    ledgerFile: 'read-through.md',
    command: '/buchbinder read-through',
    checks: 'Belief breaks, immersion breaks, trust failures, deus ex machina, plot armour',
  },
  {
    id: 'review',
    label: 'Review',
    ledgerFile: 'review.md',
    command: '/buchbinder review',
    checks: 'Broad project QA against the manifest and quality gates',
  },
];

/** Result of reading one ledger file. */
export interface LedgerEntry {
  present: boolean;
  verdict: string | null;
  cycles: number | null;
  path: string;
}

/** Normalize an identifier for fuzzy matching (case, spacing, punctuation). */
function normalizeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Parse `**Verdict**: Pass` and `**Cycles**: 2` out of a ledger file. */
function parseLedger(text: string): { verdict: string | null; cycles: number | null } {
  const verdictMatch = text.match(/\*{0,2}verdict\*{0,2}\s*[:\-]\s*\*{0,2}([A-Za-z]+)/i);
  const cyclesMatch = text.match(/\*{0,2}cycles?\*{0,2}\s*[:\-]\s*\*{0,2}(\d+)/i);
  return {
    verdict: verdictMatch ? verdictMatch[1] : null,
    cycles: cyclesMatch ? Number(cyclesMatch[1]) : null,
  };
}

/** Read one ledger file from disk. Missing/empty files read as not present. */
export function readLedgerEntry(projectRoot: string, def: MandatoryPassDef): LedgerEntry {
  const filePath = path.join(projectRoot, PIPELINE_LEDGER_DIR, def.ledgerFile);
  if (!fs.existsSync(filePath)) {
    return { present: false, verdict: null, cycles: null, path: filePath };
  }
  const text = fs.readFileSync(filePath, 'utf-8');
  if (!text.trim()) {
    return { present: false, verdict: null, cycles: null, path: filePath };
  }
  const { verdict, cycles } = parseLedger(text);
  return { present: true, verdict, cycles, path: filePath };
}

/** Read every ledger-backed pass. */
export function readPipelineLedger(projectRoot: string): Record<MandatoryPassId, LedgerEntry> {
  const out = {} as Record<MandatoryPassId, LedgerEntry>;
  for (const def of MANDATORY_PASSES) {
    out[def.id] = readLedgerEntry(projectRoot, def);
  }
  return out;
}

/** True when the ledger entry exists and its verdict is `Pass`. */
export function ledgerPasses(entry: LedgerEntry): boolean {
  if (!entry.present) return false;
  const verdict = (entry.verdict ?? '').trim().toLowerCase();
  return verdict === 'pass' || verdict === 'passed' || verdict === '✓';
}

/** Reader/pass coverage for the newest critique round. */
export interface CritiqueCoverage {
  /** Round number, or null when no critique round exists. */
  round: number | null;
  /** Mode declared in the round summary, when present. */
  mode: string | null;
  /** Readers the mode requires. */
  required: string[];
  /** Required readers with a non-empty findings file. */
  present: string[];
  /** Required readers still missing a findings file. */
  missing: string[];
  /** True when every required reader has findings. */
  complete: boolean;
  /** Human-readable evidence string. */
  evidence: string;
}

/** Statuses that mean "this reader is not part of the required set". */
const NOT_APPLICABLE = /\b(?:n\.?a\.?|n\s?\/?\s?a|not applicable|skipped|none)\b|^\s*—\s*$/i;

/**
 * The reader/pass set each critique mode requires.
 *
 * The mode decides the reader set, so the required set is derived from the
 * mode rather than trusting the checklist to be complete — a checklist that
 * lists one reader out of four must not certify coverage.
 */
const READER_SETS: Record<string, string[]> = {
  alpha: ['alpha'],
  beta: ['beta'],
  peer: ['peer'],
  sensitivity: ['sensitivity'],
  comprehensive: ['alpha', 'beta', 'peer', 'sensitivity'],
  'all-readers': ['alpha', 'beta', 'peer', 'sensitivity'],
  personas: [
    'genre-fan',
    'casual-reader',
    'literary-critic',
    'subject-expert',
    'skeptical-reviewer',
  ],
  'cold-read': ['cold-read'],
  adversarial: ['defender', 'challenger', 'synthesis'],
  swarm: ['structural', 'prose', 'continuity', 'momentum'],
};

/** Alternative names a reader's findings file may use. */
const READER_ALIASES: Record<string, string[]> = {
  momentum: ['momentum', 'hook'],
  'genre-fan': ['genre-fan', 'fan'],
  'casual-reader': ['casual-reader', 'casual'],
  'literary-critic': ['literary-critic', 'literary'],
  'subject-expert': ['subject-expert', 'expert'],
  'skeptical-reviewer': ['skeptical-reviewer', 'skeptical'],
  'cold-read': ['cold-read', 'cold'],
};

/** Table headers that are not readers. */
const NOT_READER_IDS = new Set([
  'reader',
  'readerpass',
  'reader-pass',
  'pass',
  'id',
  'persona',
  'analyst',
  'status',
  'items',
  'mode',
  'chapter',
  'all-personas',
  'all-persona',
  'swarm-analysts',
  'defender-challenger-synthesis',
]);

/** True when a checklist status means the reader was not part of the run. */
function isNotApplicable(status: string): boolean {
  return NOT_APPLICABLE.test(status.trim());
}

/** One checklist row: the reader id and the status recorded for it. */
interface ChecklistEntry {
  id: string;
  status: string;
}

/**
 * Read the reader/pass coverage checklist from a round summary.
 *
 * Two shapes are accepted, both used by the critique spec:
 *   - a markdown table: `| alpha | complete | 12 |`
 *   - an inline list: `**Reader coverage**: [alpha ✓, beta ✓, peer ✓/n/a]`
 */
function parseChecklist(summary: string): ChecklistEntry[] {
  const entries: ChecklistEntry[] = [];

  for (const line of summary.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell, index, all) => !(index === 0 && cell === '') && !(index === all.length - 1 && cell === ''));
    if (cells.length < 2) continue;
    if (/^[-: ]+$/.test(cells[1])) continue;

    let id = normalizeId(cells[0]);
    let status = cells[1];
    // Tolerate a table ordered as `| reader | items | status |`.
    if (/^\d+$/.test(status) && cells[2] && !/^\d+$/.test(cells[2])) {
      status = cells[2];
    }
    if (!id || NOT_READER_IDS.has(id)) continue;
    entries.push({ id, status });
  }

  const inline = summary.match(/reader\s*\/?\s*coverage[^\n\[]*\[([^\]]*)\]/i);
  if (inline) {
    for (const raw of inline[1].split(',')) {
      const entry = raw.trim();
      if (!entry) continue;
      const [idPart, ...statusParts] = entry.split('/');
      const id = normalizeId(idPart);
      if (!id || NOT_READER_IDS.has(id)) continue;
      entries.push({ id, status: statusParts.join('/') || 'complete' });
    }
  }

  return entries;
}

/** Find the highest-numbered critique round directory. */
export function latestCritiqueRound(projectRoot: string): number | null {
  const dir = path.join(projectRoot, CRITIQUE_DIR);
  if (!fs.existsSync(dir)) return null;
  const rounds = fs
    .readdirSync(dir)
    .map((entry) => {
      const match = entry.match(/^round-(\d+)$/);
      return match ? Number(match[1]) : null;
    })
    .filter((value): value is number => value !== null);
  if (rounds.length === 0) return null;
  return Math.max(...rounds);
}

/**
 * Read the reader/pass coverage checklist from a critique round summary.
 *
 * The mode decides the required reader set, so the set is derived from the
 * mode and the checklist only confirms which of those readers ran. A checklist
 * that lists one reader out of four must not certify coverage — the missing
 * three are still required. When the mode is unknown, the checklist is the
 * only available source.
 */
export function readCritiqueCoverage(projectRoot: string): CritiqueCoverage {
  const round = latestCritiqueRound(projectRoot);
  if (round === null) {
    return {
      round: null,
      mode: null,
      required: [],
      present: [],
      missing: [],
      complete: false,
      evidence: 'No critique round found in book/critique/',
    };
  }

  const roundDir = path.join(projectRoot, CRITIQUE_DIR, `round-${round}`);
  const summaryPath = path.join(roundDir, 'summary.md');
  const summary = fs.existsSync(summaryPath) ? fs.readFileSync(summaryPath, 'utf-8') : '';
  const modeMatch = summary.match(/\*{0,2}mode\*{0,2}\s*[:\-]\s*\*{0,2}([a-z][a-z\-_ ]*)/i);
  const mode = modeMatch ? modeMatch[1].trim().toLowerCase() : null;

  const checklist = parseChecklist(summary);
  const canonical = mode ? READER_SETS[mode] ?? [] : [];

  // A reader the checklist marked n/a is not required, but only when the mode
  // agrees that reader belongs to the set.
  const skipped = new Set<string>();
  for (const entry of checklist) {
    if (canonical.length && !canonical.includes(entry.id)) continue;
    if (isNotApplicable(entry.status)) skipped.add(entry.id);
  }

  let required: string[];
  if (canonical.length) {
    required = canonical.filter((id) => !skipped.has(id));
  } else {
    required = [];
    for (const entry of checklist) {
      if (isNotApplicable(entry.status)) continue;
      if (!required.includes(entry.id)) required.push(entry.id);
    }
  }

  const readersDir = path.join(roundDir, 'readers');
  const readerFiles = fs.existsSync(readersDir) ? fs.readdirSync(readersDir) : [];
  const normalizedFiles = readerFiles.map((file) => ({
    file,
    id: normalizeId(file.replace(/\.md$/i, '')),
  }));

  const present: string[] = [];
  const missing: string[] = [];
  for (const id of required) {
    const aliases = READER_ALIASES[id] ?? [id];
    const match = normalizedFiles.find((candidate) =>
      aliases.some((alias) => candidate.id.includes(alias)),
    );
    if (match) {
      const full = path.join(readersDir, match.file);
      const nonEmpty = fs.existsSync(full) && fs.readFileSync(full, 'utf-8').trim().length > 0;
      (nonEmpty ? present : missing).push(id);
    } else {
      missing.push(id);
    }
  }

  const complete = required.length > 0 && missing.length === 0;
  const evidence = complete
    ? `round-${round} coverage complete: ${present.join(', ')}`
    : required.length === 0
      ? `round-${round} has no reader coverage checklist`
      : `round-${round} missing readers: ${missing.join(', ')}`;

  return { round, mode, required, present, missing, complete, evidence };
}

/** One outstanding or satisfied mandatory pass. */
export interface MandatoryPassStatus {
  id: string;
  label: string;
  status: 'complete' | 'outstanding';
  evidence: string;
  command: string;
}

/**
 * Every mandatory pass, with its current status read from disk.
 *
 * The pre-edit critique coverage is included as `critique-coverage` because
 * editing from a partial critique is a hard-block failure.
 */
export function detectMandatoryPasses(projectRoot: string): MandatoryPassStatus[] {
  const ledger = readPipelineLedger(projectRoot);
  const coverage = readCritiqueCoverage(projectRoot);

  const results: MandatoryPassStatus[] = [
    {
      id: 'critique-coverage',
      label: 'Critique coverage (every reader/pass required by the mode)',
      status: coverage.complete ? 'complete' : 'outstanding',
      evidence: coverage.evidence,
      command: '/buchbinder critique',
    },
  ];

  for (const def of MANDATORY_PASSES) {
    const entry = ledger[def.id];
    results.push({
      id: def.id,
      label: def.label,
      status: ledgerPasses(entry) ? 'complete' : 'outstanding',
      evidence: entry.present
        ? `${def.ledgerFile} — verdict ${entry.verdict ?? 'unknown'}`
        : `${def.ledgerFile} — missing`,
      command: def.command,
    });
  }

  return results;
}
