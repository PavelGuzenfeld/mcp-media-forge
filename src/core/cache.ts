import { existsSync, statSync } from "node:fs";
import { resolve_output_path, relative_path } from "./output.js";
import type { MediaToolResult } from "./types.js";

export function cache_lookup(
  tool_name: string,
  params: Record<string, unknown>,
  format: string
): MediaToolResult | null {
  const output_path = resolve_output_path(tool_name, params, format);
  if (!existsSync(output_path)) return null;

  const stats = statSync(output_path);
  const rel = relative_path(output_path);
  return {
    status: "completed",
    output_path: rel,
    format,
    size_bytes: stats.size,
    embed_markdown: `![${tool_name}](./${rel})`,
  };
}
