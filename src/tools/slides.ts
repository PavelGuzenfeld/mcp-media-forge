import { writeFileSync, statSync } from "node:fs";
import { cache_lookup } from "../core/cache.js";
import { resolve_output_path, relative_path } from "../core/output.js";
import { build_slide_deck, type Slide, type SlideType } from "../templates/slides.js";
import type { Theme } from "../templates/styles.js";
import type { MediaToolResult } from "../core/types.js";

const VALID_SLIDE_TYPES: SlideType[] = [
  "title",
  "content",
  "split",
  "code",
  "quote",
  "kpi",
  "image",
  "section",
];

export function render_slides(
  title: string,
  slides_json: string,
  theme: Theme = "swiss",
  author?: string
): MediaToolResult {
  if (!title.trim()) {
    return {
      status: "error",
      error_type: "syntax_error",
      error_message: "Title is required",
      suggestion: "Provide a non-empty title for the slide deck",
    };
  }

  let slides: Slide[];
  try {
    slides = JSON.parse(slides_json);
  } catch {
    return {
      status: "error",
      error_type: "syntax_error",
      error_message: "Invalid JSON in slides array",
      suggestion:
        'slides must be a JSON array of objects: [{"title": "...", "content": "...", "type": "content"}]',
    };
  }

  if (!Array.isArray(slides) || slides.length === 0) {
    return {
      status: "error",
      error_type: "syntax_error",
      error_message: "slides must be a non-empty JSON array",
      suggestion:
        'Provide at least one slide: [{"title": "Title", "content": "Body text"}]',
    };
  }

  const warnings: string[] = [];

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i]!;
    if (!s.title && !s.content) {
      return {
        status: "error",
        error_type: "syntax_error",
        error_message: `Slide ${i + 1} has no title or content`,
        suggestion: "Each slide needs at least a title or content field",
      };
    }
    if (s.type && !VALID_SLIDE_TYPES.includes(s.type)) {
      return {
        status: "error",
        error_type: "syntax_error",
        error_message: `Slide ${i + 1} has invalid type "${s.type}"`,
        suggestion: `Valid types: ${VALID_SLIDE_TYPES.join(", ")}`,
      };
    }
  }

  if (slides.length > 30) {
    warnings.push(
      `Deck has ${slides.length} slides (recommended max: 30). Long decks lose audience attention.`
    );
  }

  const params = { title, slides_json, theme, author };
  const cached = cache_lookup("slides", params, "html");
  if (cached) return cached;

  const html = build_slide_deck({ title, slides, theme, author });

  const output_path = resolve_output_path("slides", params, "html");
  writeFileSync(output_path, html, "utf-8");

  const rel = relative_path(output_path);
  const stats = statSync(output_path);

  return {
    status: "completed",
    output_path: rel,
    format: "html",
    size_bytes: stats.size,
    embed_markdown: `[${title}](./${rel})`,
    warning: warnings.length > 0 ? warnings.join("; ") : undefined,
  };
}
