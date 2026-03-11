import { statSync } from "node:fs";
import path from "node:path";
import { cache_lookup } from "../core/cache.js";
import { resolve_output_path, relative_path } from "../core/output.js";
import { docker_exec, check_tool } from "../core/docker.js";
import { validate_vegalite, validation_error } from "../core/validate.js";
import type { MediaToolResult } from "../core/types.js";

export async function render_chart(
  spec_json: string,
  format: "svg" | "png" = "svg",
  scale?: number
): Promise<MediaToolResult> {
  // Pre-validate: JSON parse, required fields, data size, schema presence
  const validation = validate_vegalite(spec_json);
  const error = validation_error(
    validation,
    "https://vega.github.io/vega-lite/"
  );
  if (error) return error;

  const params = { spec_json, format, scale };
  const cached = cache_lookup("vegalite", params, format);
  if (cached) return cached;

  if (!(await check_tool("vl2svg")) && !(await check_tool("vl-convert"))) {
    return {
      status: "error",
      error_type: "dependency_missing",
      error_message: "vl-convert not found in container",
      suggestion:
        "Start the media-forge-renderer container: docker compose up -d",
    };
  }

  const output_path = resolve_output_path("vegalite", params, format);
  const container_output = `/output/${path.basename(output_path)}`;

  const args =
    format === "svg"
      ? ["vl2svg", container_output]
      : [
          "vl2png",
          container_output,
          ...(scale ? [String(scale)] : []),
        ];

  const result = await docker_exec(args, { stdin: spec_json, timeout: 15_000 });

  if (!result.success) {
    return {
      status: "error",
      error_type: "rendering_error",
      error_message:
        result.stderr.trim() || "Vega-Lite rendering failed",
      suggestion:
        "Check your Vega-Lite spec at https://vega.github.io/editor/",
    };
  }

  const rel = relative_path(output_path);
  const stats = statSync(output_path);
  return {
    status: "completed",
    output_path: rel,
    format,
    size_bytes: stats.size,
    embed_markdown: `![Chart](./${rel})`,
    warning:
      validation.warnings.length > 0
        ? validation.warnings.join("; ")
        : undefined,
  };
}
