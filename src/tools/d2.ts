import { statSync } from "node:fs";
import path from "node:path";
import { cache_lookup } from "../core/cache.js";
import { resolve_output_path, relative_path } from "../core/output.js";
import { docker_exec, check_tool } from "../core/docker.js";
import type { MediaToolResult } from "../core/types.js";

const LAYOUTS = ["dagre", "elk", "tala"] as const;
type Layout = (typeof LAYOUTS)[number];

export async function render_d2(
  code: string,
  format: "svg" | "png" = "svg",
  theme?: number,
  layout: Layout = "dagre"
): Promise<MediaToolResult> {
  const params = { code, format, theme, layout };
  const cached = cache_lookup("d2", params, format);
  if (cached) return cached;

  if (!(await check_tool("d2"))) {
    return {
      status: "error",
      error_type: "dependency_missing",
      error_message: "d2 not found in container",
      suggestion:
        "Start the media-forge-renderer container: docker compose up -d",
    };
  }

  const output_path = resolve_output_path("d2", params, format);
  const container_output = `/output/${path.basename(output_path)}`;

  const args = ["d2", "--layout", layout, "-", container_output];
  if (theme !== undefined) args.splice(2, 0, "--theme", String(theme));

  const result = await docker_exec(args, { stdin: code, timeout: 10_000 });

  if (!result.success) {
    const line_match = result.stderr.match(/line (\d+)/i);
    return {
      status: "error",
      error_type: "syntax_error",
      error_message: result.stderr.trim() || "D2 rendering failed",
      line: line_match ? parseInt(line_match[1]!) : undefined,
      suggestion: "Check D2 syntax at https://d2lang.com/tour/intro",
    };
  }

  const rel = relative_path(output_path);
  const stats = statSync(output_path);
  return {
    status: "completed",
    output_path: rel,
    format,
    size_bytes: stats.size,
    embed_markdown: `![Diagram](./${rel})`,
  };
}
