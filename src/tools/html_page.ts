import { writeFileSync, statSync } from "node:fs";
import { cache_lookup } from "../core/cache.js";
import { resolve_output_path, relative_path } from "../core/output.js";
import { build_page } from "../templates/page.js";
import type { Theme } from "../templates/styles.js";
import type { MediaToolResult } from "../core/types.js";

export function render_html_page(
  title: string,
  body_html: string,
  theme: Theme = "swiss",
  description?: string,
  nav_sections?: string[]
): MediaToolResult {
  if (!title.trim()) {
    return {
      status: "error",
      error_type: "syntax_error",
      error_message: "Title is required",
      suggestion: "Provide a non-empty title for the HTML page",
    };
  }

  if (!body_html.trim()) {
    return {
      status: "error",
      error_type: "syntax_error",
      error_message: "Body HTML content is required",
      suggestion: "Provide the HTML content for the page body",
    };
  }

  const params = { title, body_html, theme, description, nav_sections };
  const cached = cache_lookup("html_page", params, "html");
  if (cached) return cached;

  const html = build_page({
    title,
    body_html,
    theme,
    description,
    nav_sections,
  });

  const output_path = resolve_output_path("html_page", params, "html");
  writeFileSync(output_path, html, "utf-8");

  const rel = relative_path(output_path);
  const stats = statSync(output_path);

  return {
    status: "completed",
    output_path: rel,
    format: "html",
    size_bytes: stats.size,
    embed_markdown: `[${title}](./${rel})`,
  };
}
