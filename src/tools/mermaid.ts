import { statSync } from "node:fs";
import path from "node:path";
import { cache_lookup } from "../core/cache.js";
import { resolve_output_path, relative_path } from "../core/output.js";
import { docker_exec, check_tool } from "../core/docker.js";
import type { MediaToolResult } from "../core/types.js";

const THEMES = ["default", "dark", "forest", "neutral"] as const;
type Theme = (typeof THEMES)[number];

export async function render_mermaid(
  code: string,
  format: "svg" | "png" = "svg",
  theme: Theme = "default"
): Promise<MediaToolResult> {
  const params = { code, format, theme };
  const cached = cache_lookup("mermaid", params, format);
  if (cached) return cached;

  if (!(await check_tool("mmdc"))) {
    return {
      status: "error",
      error_type: "dependency_missing",
      error_message: "mmdc (Mermaid CLI) not found in container",
      suggestion:
        "Start the media-forge-renderer container: docker compose up -d",
    };
  }

  const output_path = resolve_output_path("mermaid", params, format);
  const container_output = `/output/${path.basename(output_path)}`;

  const result = await docker_exec(
    [
      "mmdc",
      "-i",
      "/dev/stdin",
      "-o",
      container_output,
      "-t",
      theme,
      "-b",
      "transparent",
      "-p",
      "/root/.mmdc-config.json",
    ],
    { stdin: code, timeout: 30_000 }
  );

  if (!result.success) {
    const line_match = result.stderr.match(/line (\d+)/i);
    return {
      status: "error",
      error_type: "syntax_error",
      error_message: result.stderr.trim() || "Mermaid rendering failed",
      line: line_match ? parseInt(line_match[1]!) : undefined,
      suggestion: "Check Mermaid syntax at https://mermaid.js.org/syntax/",
    };
  }

  const rel = relative_path(output_path);
  const stats = statSync(output_path);
  const media_result: MediaToolResult = {
    status: "completed",
    output_path: rel,
    format,
    size_bytes: stats.size,
    embed_markdown: `![Diagram](./${rel})`,
  };

  if (stats.size > 5_000_000) {
    media_result.warning = `File size ${(stats.size / 1_000_000).toFixed(1)}MB exceeds 5MB`;
  }

  return media_result;
}
