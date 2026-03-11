import { statSync } from "node:fs";
import path from "node:path";
import { cache_lookup } from "../core/cache.js";
import { resolve_output_path, relative_path } from "../core/output.js";
import { docker_exec, check_tool } from "../core/docker.js";
import { validate_graphviz, validation_error } from "../core/validate.js";
import type { MediaToolResult } from "../core/types.js";

const ENGINES = ["dot", "neato", "fdp", "sfdp", "twopi", "circo"] as const;
type Engine = (typeof ENGINES)[number];

export async function render_graphviz(
  dot_source: string,
  engine: Engine = "dot",
  format: "svg" | "png" = "svg"
): Promise<MediaToolResult> {
  // Pre-validate: catch missing graph wrapper, arrow mismatches, unbalanced braces
  const validation = validate_graphviz(dot_source);
  const error = validation_error(
    validation,
    "https://graphviz.org/doc/info/lang.html"
  );
  if (error) return error;

  const params = { dot_source, engine, format };
  const cached = cache_lookup("graphviz", params, format);
  if (cached) return cached;

  if (!(await check_tool(engine))) {
    return {
      status: "error",
      error_type: "dependency_missing",
      error_message: `${engine} (Graphviz) not found in container`,
      suggestion:
        "Start the media-forge-renderer container: docker compose up -d",
    };
  }

  const output_path = resolve_output_path("graphviz", params, format);
  const container_output = `/output/${path.basename(output_path)}`;

  const result = await docker_exec(
    [engine, `-T${format}`, "-o", container_output],
    { stdin: dot_source, timeout: 10_000 }
  );

  if (!result.success) {
    const line_match = result.stderr.match(/line (\d+)/i);
    return {
      status: "error",
      error_type: "syntax_error",
      error_message: result.stderr.trim() || "Graphviz rendering failed",
      line: line_match ? parseInt(line_match[1]!) : undefined,
      suggestion:
        "Check DOT syntax at https://graphviz.org/doc/info/lang.html",
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
    warning:
      validation.warnings.length > 0
        ? validation.warnings.join("; ")
        : undefined,
  };
}
