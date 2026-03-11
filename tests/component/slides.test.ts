import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, mkdirSync } from "node:fs";
import { render_slides } from "../../src/tools/slides.js";

const OUTPUT_DIR = "docs/generated";

describe("render_slides (integration)", () => {
  beforeAll(() => {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  const full_deck = JSON.stringify([
    {
      title: "Project Status Update",
      content: "Q1 2026 Engineering Review",
      type: "title",
    },
    {
      title: "Agenda",
      content: "What we'll cover today",
      type: "section",
    },
    {
      title: "Key Metrics",
      content: [
        '<div class="mf-kpi"><div class="mf-kpi-value">99.9%</div><div class="mf-kpi-label">Uptime</div></div>',
        '<div class="mf-kpi"><div class="mf-kpi-value">45ms</div><div class="mf-kpi-label">P95 Latency</div></div>',
        '<div class="mf-kpi"><div class="mf-kpi-value">12M</div><div class="mf-kpi-label">Requests/Day</div></div>',
      ].join(""),
      type: "kpi",
    },
    {
      title: "Architecture Overview",
      content:
        "<ul><li>Frontend: React + TypeScript</li><li>Backend: Node.js microservices</li><li>Database: PostgreSQL + Redis</li><li>Infra: Kubernetes on AWS</li></ul>",
      type: "content",
    },
    {
      title: "Before / After",
      content:
        '<div><h4>Before</h4><p>Monolith, 2s response time</p></div><div><h4>After</h4><p>Microservices, 45ms P95</p></div>',
      type: "split",
    },
    {
      title: "API Example",
      content: 'GET /api/v2/status\n\n{\n  "status": "healthy",\n  "uptime": "99.9%"\n}',
      type: "code",
    },
    {
      title: "— Engineering Team Lead",
      content:
        "Moving to microservices was the best decision we made this quarter.",
      type: "quote",
    },
    {
      title: "Questions?",
      content: "Thank you for your attention",
      type: "title",
    },
  ]);

  it("renders a full multi-type slide deck", () => {
    const result = render_slides(
      "Project Status Update",
      full_deck,
      "midnight",
      "Engineering Team"
    );

    expect(result.status).toBe("completed");
    expect(result.format).toBe("html");
    expect(result.output_path).toMatch(/slides-.*\.html$/);
    expect(result.size_bytes).toBeGreaterThan(0);

    const html = readFileSync(result.output_path!, "utf-8");

    // Full page structure
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html lang=\"en\">");

    // All slide types rendered
    expect(html).toContain("mf-slide-title");
    expect(html).toContain("mf-slide-section");
    expect(html).toContain("mf-slide-kpi");
    expect(html).toContain("mf-slide-content");
    expect(html).toContain("mf-slide-split");
    expect(html).toContain("mf-slide-code");
    expect(html).toContain("mf-slide-quote");

    // Content is present
    expect(html).toContain("Project Status Update");
    expect(html).toContain("Engineering Team"); // author
    expect(html).toContain("99.9%");
    expect(html).toContain("React + TypeScript");
    expect(html).toContain("Microservices, 45ms P95");
    expect(html).toContain("GET /api/v2/status");

    // Midnight theme applied
    expect(html).toContain("#0f172a"); // midnight bg
    expect(html).toContain("#f59e0b"); // midnight accent
  });

  it("includes full slide engine with keyboard navigation", () => {
    const slides = JSON.stringify([
      { title: "One", content: "First", type: "title" },
      { title: "Two", content: "Second" },
    ]);

    const result = render_slides("Nav Test", slides, "swiss");
    const html = readFileSync(result.output_path!, "utf-8");

    // Keyboard events
    expect(html).toContain("ArrowRight");
    expect(html).toContain("ArrowLeft");
    expect(html).toContain("PageDown");
    expect(html).toContain("PageUp");
    expect(html).toContain("Home");
    expect(html).toContain("End");
    expect(html).toContain("' '"); // Space key
  });

  it("includes touch swipe navigation", () => {
    const slides = JSON.stringify([
      { title: "A", content: "a" },
      { title: "B", content: "b" },
    ]);

    const result = render_slides("Touch Test", slides, "swiss");
    const html = readFileSync(result.output_path!, "utf-8");

    expect(html).toContain("touchstart");
    expect(html).toContain("touchend");
    expect(html).toContain("screenX");
  });

  it("includes progress bar and slide counter", () => {
    const slides = JSON.stringify([
      { title: "One", content: "1" },
      { title: "Two", content: "2" },
      { title: "Three", content: "3" },
    ]);

    const result = render_slides("Progress Test", slides, "swiss");
    const html = readFileSync(result.output_path!, "utf-8");

    expect(html).toContain("mf-progress");
    expect(html).toContain("mf-progress-bar");
    expect(html).toContain("mf-counter");

    // Navigation dots — one per slide
    expect(html).toContain('data-index="0"');
    expect(html).toContain('data-index="1"');
    expect(html).toContain('data-index="2"');
  });

  it("supports prefers-reduced-motion", () => {
    const slides = JSON.stringify([{ title: "Motion", content: "test" }]);

    const result = render_slides("Motion Test", slides, "swiss");
    const html = readFileSync(result.output_path!, "utf-8");

    // Global reduced motion override
    expect(html).toContain("prefers-reduced-motion");
    expect(html).toContain("animation-duration: 0.01ms");

    // Slide-specific reduced motion
    expect(html).toContain(".mf-slide { transition: none;");
  });

  it("produces self-contained HTML with no external dependencies", () => {
    const slides = JSON.stringify([
      { title: "Self", content: "contained" },
    ]);

    const result = render_slides("Self-Contained", slides, "swiss");
    const html = readFileSync(result.output_path!, "utf-8");

    // No external references
    expect(html).not.toMatch(/<link[^>]+href="http/);
    expect(html).not.toMatch(/<script[^>]+src="http/);

    // CSS and JS are inline
    expect(html).toContain("<style>");
    expect(html).toContain("<script>");
  });

  it("renders all four themes", () => {
    const slides = JSON.stringify([
      { title: "Theme", content: "test", type: "title" },
    ]);

    const theme_markers: Record<string, string> = {
      swiss: "#2563eb",
      midnight: "#0f172a",
      warm: "#fdf6ee",
      terminal: "#22d3ee",
    };

    for (const [theme, marker] of Object.entries(theme_markers)) {
      const result = render_slides(
        `${theme} Deck`,
        slides,
        theme as "swiss" | "midnight" | "warm" | "terminal"
      );
      expect(result.status).toBe("completed");

      const html = readFileSync(result.output_path!, "utf-8");
      expect(html).toContain(marker);
    }
  });

  it("escapes slide titles to prevent XSS", () => {
    const slides = JSON.stringify([
      {
        title: '<img src=x onerror="alert(1)">',
        content: "Safe content",
        type: "content",
      },
    ]);

    const result = render_slides("XSS Test", slides, "swiss");
    const html = readFileSync(result.output_path!, "utf-8");

    expect(html).toContain("&lt;img");
    expect(html).not.toContain('onerror="alert(1)"');
  });

  it("handles slide with speaker notes", () => {
    const slides = JSON.stringify([
      {
        title: "With Notes",
        content: "Visible content",
        notes: "Speaker notes here",
      },
    ]);

    const result = render_slides("Notes Test", slides, "swiss");
    const html = readFileSync(result.output_path!, "utf-8");

    expect(html).toContain("data-notes=");
    expect(html).toContain("Speaker notes here");
  });

  it("caches identical inputs", () => {
    const slides = JSON.stringify([
      { title: "Cache", content: "test" },
    ]);

    const a = render_slides("Cache Test", slides, "swiss");
    const b = render_slides("Cache Test", slides, "swiss");
    expect(a.output_path).toBe(b.output_path);
  });

  it("returns structured error for invalid slides JSON", () => {
    const result = render_slides("Bad", "not json", "swiss");
    expect(result.status).toBe("error");
    expect(result.error_type).toBe("syntax_error");
    expect(result.error_message).toContain("Invalid JSON");
  });

  it("returns structured error for empty slides array", () => {
    const result = render_slides("Empty", "[]", "swiss");
    expect(result.status).toBe("error");
    expect(result.error_message).toContain("non-empty");
  });

  it("returns structured error for invalid slide type", () => {
    const slides = JSON.stringify([
      { title: "Bad", content: "x", type: "nonexistent" },
    ]);
    const result = render_slides("Bad Type", slides, "swiss");
    expect(result.status).toBe("error");
    expect(result.error_message).toContain("invalid type");
  });

  it("renders large deck (35 slides) and includes all slides", () => {
    const slides = JSON.stringify(
      Array.from({ length: 35 }, (_, i) => ({
        title: `Slide ${i + 1}`,
        content: `Content for slide ${i + 1}`,
      }))
    );

    const result = render_slides("Long Deck", slides, "swiss");
    expect(result.status).toBe("completed");

    // All 35 slides should be rendered
    const html = readFileSync(result.output_path!, "utf-8");
    expect(html).toContain('data-index="34"');
    expect(html).toContain("Slide 35");
  });
}, 30_000);
