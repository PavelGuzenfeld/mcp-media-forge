import { statSync } from "node:fs";
import path from "node:path";
import { cache_lookup } from "../core/cache.js";
import { resolve_output_path, relative_path } from "../core/output.js";
import { docker_exec, check_tool } from "../core/docker.js";
import { validate_d2, validation_error } from "../core/validate.js";
import type { MediaToolResult } from "../core/types.js";

const LAYOUTS = ["dagre", "elk", "tala"] as const;
type Layout = (typeof LAYOUTS)[number];

export async function render_d2(
  code: string,
  format: "svg" | "png" = "svg",
  theme?: number,
  layout: Layout = "dagre"
): Promise<MediaToolResult> {
  // Pre-validate: catch Mermaid-D2 confusion, unbalanced braces, etc.
  const validation = validate_d2(code);
  const error = validation_error(validation, "https://d2lang.com/tour/intro");
  if (error) return error;

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

  // D2 PNG requires Playwright (network download). Render SVG first, then convert.
  const is_png = format === "png";
  const svg_output = is_png
    ? container_output.replace(/\.png$/, ".svg")
    : container_output;

  const args = ["d2", "--layout", layout];
  if (theme !== undefined) args.push("--theme", String(theme));
  args.push("-", svg_output);

  const result = await docker_exec(args, { stdin: code, timeout: 10_000 });

  // D2 creates files with restrictive permissions — fix for host access
  if (result.success) {
    await docker_exec(["chmod", "644", svg_output], { timeout: 3_000 });
  }

  // Convert SVG → PNG using Chromium if needed
  if (result.success && is_png) {
    const png_filename = path.basename(container_output);
    const convert = await docker_exec(
      [
        "sh",
        "-c",
        `cd /output && chromium --headless --no-sandbox --disable-gpu --screenshot=${png_filename} --window-size=1200,900 file://${svg_output}`,
      ],
      { timeout: 15_000 }
    );
    if (!convert.success) {
      return {
        status: "error",
        error_type: "rendering_error",
        error_message: convert.stderr.replace(/.*ERROR:dbus.*\n?/g, "").trim() || "SVG to PNG conversion failed",
        suggestion: "Try rendering as SVG instead",
      };
    }
    await docker_exec(["chmod", "644", container_output], { timeout: 3_000 });
  }

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
    warning:
      validation.warnings.length > 0
        ? validation.warnings.join("; ")
        : undefined,
  };
}
