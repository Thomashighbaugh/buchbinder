/**
 * Minimal v1-compatible tool helper for Buchbinder's project-local tools.
 *
 * OpenCode v2's `@opencode/plugin` package does not export the legacy
 * `tool()` factory/schema builder used by older tool modules. Buchbinder
 * tools in this repo still use that ergonomic shape, so this helper provides
 * a small compatible surface (`tool({...})` + `tool.schema.*`) that preserves
 * behavior and keeps typechecking working without depending on removed APIs.
 */

type Chain = {
  optional: () => Chain
  describe: (_text: string) => Chain
}

function makeChain(): Chain {
  const chain: Chain = {
    optional: () => chain,
    describe: () => chain,
  }
  return chain
}

export const schema = {
  string: () => makeChain(),
  boolean: () => makeChain(),
  number: () => makeChain(),
  enum: (_values: readonly string[]) => makeChain(),
  array: (_inner?: unknown) => makeChain(),
  object: (_shape?: unknown) => makeChain(),
}

type ToolFn = {
  <T extends { description: string; args?: any; execute: any }>(definition: T): T
  schema: typeof schema
}

export const tool: ToolFn = Object.assign(
  <T extends { description: string; args?: any; execute: any }>(definition: T): T => definition,
  { schema }
)

export default tool
