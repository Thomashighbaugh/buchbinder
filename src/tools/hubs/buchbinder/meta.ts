import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "meta",
  description: "Record bibliographic metadata: title, author, genres, tags, status, word count, license, ISBN. Author is determined first and never left dubious. Used by publish pipeline.",
  reminder: "Utility: Record project metadata (author first)",
  phases: "utility",
  detailedDescription: `# User Input: {userInput}

## Objective

Maintain a single source of truth for the project's bibliographic metadata, used by the publish pipeline for format generation and by external tooling for distribution.

**First-step invariant (book/series metadata process):** author name is the very first metadata field determined — explicitly, and never dubiously. No other metadata work should proceed until the applicable author field(s) are confirmed.

## Execution Steps

### 1. Determine Author Name (FIRST — MANDATORY)

This is the first step of every metadata interaction.

1. Check \`./book/meta.json\`. If it does not exist, create it from the standard schema, but **do not invent or default the author** (leave author unset/blank only until this step completes in the same interaction).
2. Detect series context: read \`./book/track.json\` for \`seriesId\`/\`bookNumber\` and check \`./series/meta.json\`.
3. Determine the required author field(s):
   - **Series project:** \`./series/meta.json\` → \`author\` (series/primary author) must be determined. \`./book/meta.json\` → \`author\` (this book's credited author) must be determined. If the book uses the same credited author as the series, confirm that explicitly before copying the value; never copy silently.
   - **Standalone book:** \`./book/meta.json\` → \`author\` must be determined.
4. An author is **undetermined/dubious** if missing, null, empty/whitespace-only, or a placeholder/default such as: \`Unknown\`, \`Unknown Author\`, \`Author\`, \`Author Name\`, \`TBD\`, \`TBA\`, \`N/A\`, \`NA\`, \`None\`, \`Anonymous\`, \`[Author]\`, \`<author>\`, or similar non-specific placeholders.
5. If the requested action is anything other than setting/confirming author and any required author is undetermined/dubious, **stop and resolve author first**. Ask the user for the real credited author name using the \`question\` tool ("Author name must be determined before continuing — not blank, guessed, or a placeholder."). Do not proceed to view/export/other fields as a completed metadata process until author is set.
6. When setting author (\`set author=...\` or explicit confirmation), reject dubious values and ask again. Accept the exact credited name provided by the user (including pen names or multiple-author strings) once explicitly confirmed.
7. Persist confirmed author value(s) immediately to \`./book/meta.json\` and/or \`./series/meta.json\` as applicable before taking any further action.

### 2. Load or Create (after author is determined)

With author confirmed, ensure \`./book/meta.json\` exists and contains the confirmed author. For series projects, ensure \`./series/meta.json\` contains the confirmed series author.

### 3. Actions

| Action | Description |
|--------|-------------|
| \`view\` | Display current metadata (author must already be determined) |
| \`set\` | Set one or more metadata fields; if changing author, require explicit non-dubious value |
| \`export\` | Export metadata in specific format (JSON, YAML, TOML, EPUB OPF) only when author is determined |

If \`set\` includes \`author\`, treat it as Step 1 (determine/confirm author) before applying other fields.

### 4. Metadata Fields

\`\`\`json
{
  "title": "",
  "subtitle": "",
  "author": "",
  "authorUrl": "",
  "description": "",
  "language": "en",
  "workType": "novel",
  "status": "draft",
  "genres": [],
  "tags": [],
  "series": "",
  "seriesPosition": 1,
  "targetAudience": "",
  "contentWarnings": [],
  "wordCount": 0,
  "chapterCount": 0,
  "startedDate": "",
  "completedDate": "",
  "publishedDate": "",
  "license": "All Rights Reserved",
  "isbn": "",
  "publisher": "",
  "coverImage": "",
  "citationStyle": "apa7",
  "version": "1.0.0"
}
\`\`\`

\`author\` must never remain empty, guessed, or placeholder after Step 1 completes.

### 5. Next Steps (Auto-Handoff)

"Metadata saved (author confirmed). View with \`/buchbinder meta view\`. Used by \`/buchbinder publish\` for format generation."

After saving metadata, hand off using the \`question\` tool (Rule A — multiple candidates):

Question: "Metadata saved. What next?"
Options:
- **Publish** → Run \`/buchbinder publish\` (call buchbinder-router route for \`publish\`)
- **Review** → Run \`/buchbinder review\` (call buchbinder-router route for \`review\`)
- **Stop** → End turn

If the user selects a phase, call \`buchbinder-router\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute it immediately. Do NOT just tell them to type it — run it.`,
  tools: ["bash", "question"],
  relatedSkills: ["style-enforcer"],
  examples: [
    { input: "/buchbinder meta set author=\"Author Name\"", approach: "Determines/confirms the author first (required, non-dubious), then persists book/series author metadata" },
    { input: "/buchbinder meta set title=\"My Novel\" author=\"Author Name\"", approach: "Resolves author as the first metadata step, then sets remaining fields" },
    { input: "/buchbinder meta view", approach: "Displays metadata only after author is confirmed/determined; prompts to set author first if missing or dubious" },
    { input: "/buchbinder meta export json", approach: "Exports metadata only when author is determined" }
  ],
  warnings: [
    "Author name is mandatory and must be explicitly provided — never inferred, guessed, left blank, or set to a placeholder such as \"Unknown Author\"."
  ]
}

export default spec
