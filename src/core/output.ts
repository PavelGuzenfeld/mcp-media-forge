import path from "node:path";
import { mkdirSync } from "node:fs";
import { content_hash } from "../utils/hash.js";

const PROJECT_ROOT =
  process.env.PROJECT_ROOT || process.env.MCP_PROJECT_ROOT || process.cwd();
const OUTPUT_DIR = process.env.OUTPUT_DIR || "docs/generated";

export function get_project_root(): string {
  return PROJECT_ROOT;
}

export function get_output_dir(): string {
  return path.resolve(PROJECT_ROOT, OUTPUT_DIR);
}

export function resolve_output_path(
  tool_name: string,
  params: Record<string, unknown>,
  format: string
): string {
  const hash = content_hash(tool_name, params);
  const filename = `${tool_name}-${hash}.${format}`;
  const output_dir = get_output_dir();
  mkdirSync(output_dir, { recursive: true });

  const resolved = path.resolve(output_dir, filename);
  if (!resolved.startsWith(path.resolve(PROJECT_ROOT))) {
    throw new Error("Path traversal blocked");
  }
  return resolved;
}

export function relative_path(absolute_path: string): string {
  return path.relative(PROJECT_ROOT, absolute_path);
}
