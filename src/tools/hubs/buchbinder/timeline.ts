import { HubSubcommandSpec } from "../../hub-data.js"

const spec: HubSubcommandSpec = {
  label: "timeline",
  description: "Manage story or project timeline: view, add events, verify chronological consistency, detect gaps and contradictions",
  reminder: "Utility: Chronological consistency verification",
  phases: "utility",
  detailedDescription: `# User Input: {userInput}

## Objective

Maintain an accurate chronology of events. For fiction, this means the in-world story timeline. For non-fiction, this means the composition and source-gathering timeline.

## Execution Steps

### 1. Load Timeline Data

Read \`./book/tracking/timeline.json\`. If it does not exist, suggest \`/buchbinder track\` to initialise.

### 2. Actions

| Action | Description |
|--------|-------------|
| \`view\` | Display the full timeline sorted chronologically |
| \`add\` | Add a new event to the timeline |
| \`verify\` | Check for gaps, overlaps, contradictions across written chapters |
| \`gap\` | Identify missing time periods or unresolved date ranges |

### 3. Timeline Entry Format (Fiction)

\`\`\`json
{
  "id": "evt-001",
  "date": "Year 1247, Spring",
  "chapter": 3,
  "event": "Protagonist arrives at the capital",
  "characters": ["Eira", "Torvin"],
  "verified": true
}
\`\`\`

### 4. Verification

Cross-reference timeline entries against all written chapters. Flag:
- Events referenced in chapters but missing from timeline
- Timeline events not yet written
- Chronological contradictions (event B occurs before event A despite timeline showing A before B)
- Impossible elapsed times between events

### 5. Next Steps (Auto-Handoff)

"Timeline verified. No contradictions found." or "Timeline has [N] gaps. Recommended: \`/buchbinder specify\` to clarify dates, or add missing events with \`/buchbinder timeline add\`."

After verifying the timeline, hand off using the \`question\` tool (Rule A — multiple candidates):

Question: "Timeline verified. What next?"
Options:
- **Specify** (if gaps found) → Run \`/buchbinder specify\` (call hubMenu route for \`specify\`)
- **Track** → Run \`/buchbinder track\` (call hubMenu route for \`track\`)
- **Stop** → End turn

If the user selects a phase, call \`hubMenu\` with \`action: "route"\`, \`subcommand: <chosen>\` and execute it immediately. Do NOT just tell them to type it — run it.`,
  tools: ["bash", "question"],
  relatedSkills: ["consistency-checker"],
  examples: [
    { input: "/buchbinder timeline view", approach: "Displays the full project timeline sorted chronologically" },
    { input: "/buchbinder timeline add date=\"Year 1247, Spring\" event=\"Arrival\"", approach: "Adds a new event to the timeline" },
    { input: "/buchbinder timeline verify", approach: "Checks for gaps, overlaps, and contradictions across chapters" }
  ],
  warnings: []
}

export default spec
