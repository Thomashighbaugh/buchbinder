/**
 * pipeline-ledger — read and write the mandatory-pass ledger.
 *
 * The pipeline has passes that cannot be skipped or hand-waved: critique
 * coverage → revision → edit (line/copy/proofread) → post-edit
 * critique-revise cycles → review. Prose instructions alone did not hold —
 * a run reported "pipeline complete" while the post-edit cycles had never
 * run. Each mandatory pass therefore writes a ledger file, and completion is
 * read back from disk instead of being asserted in a chat message.
 *
 * Actions:
 *   status   — list every mandatory pass with its on-disk status
 *   write    — record a pass result (creates/overwrites its ledger file)
 *   coverage — read the critique round's reader/pass coverage checklist
 */

import fs from "fs-extra"
import path from "path"
import tool from "./opencode-tool.js"
import {
  MANDATORY_PASSES,
  PIPELINE_LEDGER_DIR,
  detectMandatoryPasses,
  readCritiqueCoverage,
  type MandatoryPassId,
} from "../lib/mandatory-passes.js"

function renderStatus(projectRoot: string): string {
  const passes = detectMandatoryPasses(projectRoot)
  const outstanding = passes.filter((pass) => pass.status === "outstanding")

  const lines: string[] = []
  lines.push(`Mandatory passes — ${projectRoot}`)
  lines.push("")
  for (const pass of passes) {
    const mark = pass.status === "complete" ? "✓" : "✗"
    lines.push(`  ${mark} ${pass.id}: ${pass.label}`)
    lines.push(`      ${pass.evidence}`)
    if (pass.status === "outstanding") lines.push(`      run: ${pass.command}`)
  }
  lines.push("")
  lines.push(
    outstanding.length === 0
      ? "All mandatory passes recorded. The pipeline may report complete."
      : `${outstanding.length} outstanding pass(es): ${outstanding.map((pass) => pass.id).join(", ")}`,
  )
  lines.push("")
  lines.push(`Ledger directory: ${PIPELINE_LEDGER_DIR}/`)
  return lines.join("\n")
}

function renderCoverage(projectRoot: string): string {
  const coverage = readCritiqueCoverage(projectRoot)
  const lines: string[] = []
  lines.push(`Critique coverage — ${projectRoot}`)
  lines.push(`  Round: ${coverage.round === null ? "none" : `round-${coverage.round}`}`)
  lines.push(`  Mode: ${coverage.mode ?? "unknown"}`)
  lines.push(`  Required readers: ${coverage.required.length ? coverage.required.join(", ") : "none declared"}`)
  lines.push(`  Present: ${coverage.present.length ? coverage.present.join(", ") : "none"}`)
  lines.push(`  Missing: ${coverage.missing.length ? coverage.missing.join(", ") : "none"}`)
  lines.push(`  Complete: ${coverage.complete ? "yes" : "no"}`)
  lines.push(`  Evidence: ${coverage.evidence}`)
  return lines.join("\n")
}

export default tool({
  description:
    "Read and write the mandatory-pass ledger in book/pipeline/. Use action 'status' before reporting any pipeline as complete (never assert completion from a chat message alone), action 'write' to record a mandatory pass result, and action 'coverage' to check that every critique reader required by the mode has a findings file.",
  args: {
    action: tool.schema
      .enum(["status", "write", "coverage"])
      .describe("status = list mandatory passes and their on-disk status; write = record a pass result; coverage = read the critique reader/pass coverage checklist"),
    pass: tool.schema
      .enum(MANDATORY_PASSES.map((def) => def.id) as MandatoryPassId[])
      .optional()
      .describe("Which mandatory pass to record. Required for action 'write'."),
    verdict: tool.schema
      .enum(["Pass", "Conditional", "Fail"])
      .optional()
      .describe("Verdict for the recorded pass. Default: Pass"),
    cycles: tool.schema.number().optional().describe("How many critique-revise cycles the pass ran. Default: 1"),
    scope: tool.schema
      .string()
      .optional()
      .describe("Scope the pass covered, e.g. 'Chapters 1-6 (6 chapters)'"),
    summary: tool.schema
      .string()
      .optional()
      .describe("Markdown table body of findings, or a short summary when there are none."),
    projectRoot: tool.schema.string().optional().describe("Absolute path to the project root. Default: process.cwd()"),
  },
  async execute(args: any) {
    const projectRoot = args.projectRoot ?? process.cwd()

    if (args.action === "status") return renderStatus(projectRoot)
    if (args.action === "coverage") return renderCoverage(projectRoot)

    // action === "write"
    const passId = args.pass as MandatoryPassId | undefined
    if (!passId) return "Error: action 'write' requires a 'pass' argument."
    const def = MANDATORY_PASSES.find((candidate) => candidate.id === passId)
    if (!def) return `Error: unknown pass '${passId}'.`

    const verdict = args.verdict ?? "Pass"
    const cycles = Number.isFinite(args.cycles) ? Number(args.cycles) : 1
    const scope = args.scope ?? "unspecified"
    const summary = args.summary?.trim() ?? ""

    const ledgerDir = path.join(projectRoot, PIPELINE_LEDGER_DIR)
    const filePath = path.join(ledgerDir, def.ledgerFile)

    const body = [
      `# ${def.label} — Pipeline Ledger`,
      "",
      `**Pass**: ${def.id}`,
      `**Verdict**: ${verdict}`,
      `**Cycles**: ${cycles}`,
      `**Scope**: ${scope}`,
      `**Command**: ${def.command}`,
      `**Checks**: ${def.checks}`,
      "",
      "## Findings Summary",
      summary || "_No findings recorded._",
      "",
      "## Remaining Blockers",
      verdict === "Pass" ? "_None._" : "_See findings above._",
      "",
    ].join("\n")

    await fs.ensureDir(ledgerDir)
    await fs.writeFile(filePath, body, "utf-8")

    return [
      `✓ Recorded pass '${def.id}' → ${filePath}`,
      `  Verdict: ${verdict}`,
      `  Cycles: ${cycles}`,
      `  Scope: ${scope}`,
      "",
      renderStatus(projectRoot),
    ].join("\n")
  },
})
