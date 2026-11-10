import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "refresh-index",
  description: "Rebuild the semantic lore index and warm/verify the ONNX reranker (onnxruntime) used for retrieval. Use after lore changes, model issues, or to ensure rerank-ready semantic search.",
  reminder: "Utility: Rebuild lore index and verify ONNX reranker",
  phases: "utility",
  detailedDescription: `# User Input: {userInput}

## Objective

Refresh the full semantic retrieval stack for Buchbinder lore queries:

1. **Rebuild the on-disk semantic lore index** used by \`lore-query.mjs\` during outline, draft, critique, revise, and review phases.
2. **Include reranker functionality** by ensuring the included in-process ONNX cross-encoder reranker (via \`onnxruntime\` / \`@huggingface/transformers\`, default \`Xenova/bge-reranker-base\`) is cached/warmed and functionally verified for \`--rerank\` retrieval.

Index location:

  \`./.opencode/cache/lore-index/index.json\`

The index build is incremental: re-running on an up-to-date index is a no-op (no embeddings fetched). When lore files change, only changed files are re-chunked and re-embedded.

## When to Use

- After importing a new lorebook (SillyTavern/JanitorAI/CharacterAI JSON via \`/buchbinder manifest\`)
- After substantial edits to \`./series/lorebook/*\` or \`./book/knowledge/*\`
- After adding new chapters to \`./book/drafts/\` (so the new chapter is available for semantic retrieval)
- After upgrading or changing the embed or rerank model
- To recover from a corrupted or accidentally-deleted index
- To warm/verify the ONNX reranker so \`--rerank\` queries work locally (no server/API rerank)
- After running \`/buchbinder refresh\` if it reported an index-build or model issue

You do NOT need to run this on every \`/buchbinder\` invocation — \`lore-query.mjs\` falls back to on-the-fly embedding when no index exists and degrades gracefully if reranking is unavailable. This command makes retrieval fast and rerank-ready.

## Execution Steps

### 1. Rebuild the lore index

From the project root (installed Buchbinder project), build/update the index:

\`\`\`bash
bun .opencode/lib/scripts/lore-query.mjs --build
\`\`\`

In a Buchbinder source checkout (or if the installed script is unavailable), run:

\`\`\`bash
node bin/build-lore-index.mjs [project-root]
\`\`\`

Both paths rebuild incrementally. Use \`--force\` only when you need to discard and rebuild the index from scratch (e.g. embed model change).

### 2. Verify the index

Confirm the index is fresh:

\`\`\`bash
bun .opencode/lib/scripts/lore-query.mjs --status
\`\`\`

(or \`node bin/build-lore-index.mjs --status [project-root]\` in a checkout)

Expected: source files and chunk counts, embed model version, and build recency.

### 3. Warm and verify the ONNX reranker (REQUIRED)

The reranker is a local in-process ONNX cross-encoder loaded via \`onnxruntime\` through \`@huggingface/transformers\`. Ensure it is cached, loadable, and functional:

**Preferred (prefetch + load reranker only):**

\`\`\`bash
node bin/fetch-models.mjs --only reranker
\`\`\`

**Smoke-test rerank functionality (run after prefetch/warmup):**

In a checkout:

\`\`\`bash
node src/lib/reranker.mjs "creative values and quality baseline" "Core values and quality baseline for the manuscript." "Chapter 7: the protagonist buys bread at the market."
\`\`\`

In an installed project (if \`.opencode/lib/reranker.mjs\` is present):

\`\`\`bash
node .opencode/lib/reranker.mjs "creative values and quality baseline" "Core values and quality baseline for the manuscript." "Chapter 7: the protagonist buys bread at the market."
\`\`\`

**Expected:** a \`[reranker]\` line showing the model and a score-sorted ranking (the baseline-relevant passage should rank above the unrelated one). This confirms reranker functionality is available.

If \`RERANK_DISABLED=1\` is set, reranking is intentionally skipped — report that state explicitly. If the reranker model cannot be loaded (missing cache/offline without cache), report the error; retrieval can still proceed without reranking, but re-fetch models when network/cache access is available.

### 4. Report outcome

Report:
- index build result (chunks/sources added/updated/reused or rebuilt, index path)
- index status/recency
- reranker model, cache/readiness, and smoke-test result (or why unavailable/disabled)

## What Gets Indexed

The index scans:

- \`./series/lorebook/*\` — characters, world, glossary, timeline, threads
- \`./series/outline.md\` — Cross-book condensed outline
- \`./book/knowledge/*\` — character-profiles, voice-profiles, locations, world-rules, character-voices
- \`./book/manifest.md\` — Project canon (highest priority)
- \`./book/specification.md\` — Book specification
- \`./book/outline.md\` and \`./book/outline/chapter_*.md\` — Whole-book + per-chapter outline
- \`./book/drafts/chapter_*.xml\` — Drafted chapters (chunked by scene + awareness-map + metadata)

Each \`book/drafts/chapter_*.xml\` file is chunked by the XML chunker, which understands the chapter's \`<metadata>\`, \`<awareness-map>\`, and per-\`<scene>\` structure. Lore, outline, and canon files are chunked by markdown heading.

## Models Used

- **Embedding:** \`Xenova/bge-base-en-v1.5\` (set \`ONNX_EMBED_MODEL\` env var to override)
- **Reranking (ONNX cross-encoder, onnxruntime):** \`Xenova/bge-reranker-base\` (set \`RERANK_MODEL\` env var to override; \`RERANK_DISABLED=1\` to skip; \`RERANK_OFFLINE=1\` to require cache)

Both run locally in-process — no network calls, no telemetry. \`refresh-index\` rebuilds embeddings/index state and warms/verifies reranker functionality.

## Related Commands

- \`/buchbinder outline\`, \`/buchbinder draft\`, \`/buchbinder critique\`, \`/buchbinder revise\`, \`/buchbinder review\` — All use the index for semantic lore retrieval (with \`--rerank\` for cross-encoder reranking)
- \`/buchbinder refresh\` — Idempotent plugin sync; rebuilds the index and prefetches models when needed
- \`/buchbinder manifest\` — Import a lorebook; should be followed by \`/buchbinder refresh-index\`
`,
}

export default spec
