import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { render_slides } from "../../src/tools/slides.js";
import { get_output_dir } from "../../src/core/output.js";

describe("render_slides", () => {

  const basic_slides = JSON.stringify([
    { title: "Welcome", content: "Intro subtitle", type: "title" },
    {
      title: "Key Points",
      content: "<ul><li>Point one</li><li>Point two</li></ul>",
      type: "content",
    },
  ]);

  it("generates a self-contained slide deck", () => {
    const result = render_slides("Test Deck", basic_slides, "swiss");
    expect(result.status).toBe("completed");
    expect(result.format).toBe("html");
    expect(result.output_path).toMatch(/\.html$/);
    expect(result.size_bytes).toBeGreaterThan(0);
  });

  it("includes slide engine JavaScript", () => {
    const result = render_slides("JS Test", basic_slides, "swiss");
    const html = readFileSync(
      `${get_output_dir()}/${result.output_path!.split("/").pop()}`,
      "utf-8"
    );
    expect(html).toContain("ArrowRight");
    expect(html).toContain("ArrowLeft");
    expect(html).toContain("touchstart");
    expect(html).toContain("mf-progress-bar");
  });

  it("renders different slide types", () => {
    const slides = JSON.stringify([
      { title: "Title Slide", content: "Subtitle", type: "title" },
      { title: "Section Break", content: "Details", type: "section" },
      {
        title: "Bullets",
        content: "<ul><li>A</li><li>B</li></ul>",
        type: "content",
      },
      {
        title: "Code Example",
        content: "const x = 42;",
        type: "code",
      },
      {
        title: "Einstein",
        content: "Imagination is more important than knowledge.",
        type: "quote",
      },
      {
        title: "Metrics",
        content:
          '<div class="mf-kpi"><div class="mf-kpi-value">42</div><div class="mf-kpi-label">Items</div></div>',
        type: "kpi",
      },
    ]);
    const result = render_slides("Types Test", slides, "midnight");
    expect(result.status).toBe("completed");
    const html = readFileSync(
      `${get_output_dir()}/${result.output_path!.split("/").pop()}`,
      "utf-8"
    );
    expect(html).toContain("mf-slide-title");
    expect(html).toContain("mf-slide-section");
    expect(html).toContain("mf-slide-content");
    expect(html).toContain("mf-slide-code");
    expect(html).toContain("mf-slide-quote");
    expect(html).toContain("mf-slide-kpi");
  });

  it("includes author on title slide", () => {
    const result = render_slides("Authored", basic_slides, "swiss", "Jane Doe");
    const html = readFileSync(
      `${get_output_dir()}/${result.output_path!.split("/").pop()}`,
      "utf-8"
    );
    expect(html).toContain("Jane Doe");
  });

  it("includes navigation dots for each slide", () => {
    const result = render_slides("Dots Test", basic_slides, "swiss");
    const html = readFileSync(
      `${get_output_dir()}/${result.output_path!.split("/").pop()}`,
      "utf-8"
    );
    expect(html).toContain('data-index="0"');
    expect(html).toContain('data-index="1"');
  });

  it("rejects empty title", () => {
    const result = render_slides("", basic_slides, "swiss");
    expect(result.status).toBe("error");
    expect(result.error_message).toContain("Title");
  });

  it("rejects invalid JSON", () => {
    const result = render_slides("Bad JSON", "{not valid", "swiss");
    expect(result.status).toBe("error");
    expect(result.error_message).toContain("Invalid JSON");
  });

  it("rejects empty slides array", () => {
    const result = render_slides("Empty", "[]", "swiss");
    expect(result.status).toBe("error");
    expect(result.error_message).toContain("non-empty");
  });

  it("rejects invalid slide type", () => {
    const slides = JSON.stringify([
      { title: "Bad", content: "x", type: "nonexistent" },
    ]);
    const result = render_slides("Bad Type", slides, "swiss");
    expect(result.status).toBe("error");
    expect(result.error_message).toContain("invalid type");
  });

  it("warns on >30 slides", () => {
    const slides = JSON.stringify(
      Array.from({ length: 35 }, (_, i) => ({
        title: `Slide ${i + 1}`,
        content: `Content ${i + 1}`,
      }))
    );
    const result = render_slides("Long Deck", slides, "swiss");
    expect(result.status).toBe("completed");
    expect(result.warning).toContain("35 slides");
  });

  it("caches identical content", () => {
    const a = render_slides("Same", basic_slides, "swiss");
    const b = render_slides("Same", basic_slides, "swiss");
    expect(a.output_path).toBe(b.output_path);
  });

  it("supports prefers-reduced-motion", () => {
    const result = render_slides("Motion Test", basic_slides, "swiss");
    const html = readFileSync(
      `${get_output_dir()}/${result.output_path!.split("/").pop()}`,
      "utf-8"
    );
    expect(html).toContain("prefers-reduced-motion");
  });
});
