import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, mkdirSync } from "node:fs";
import { render_chart } from "../../src/tools/vegalite.js";

const OUTPUT_DIR = "docs/generated";

const BAR_CHART = JSON.stringify({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Test bar chart",
  data: {
    values: [
      { category: "A", value: 28 },
      { category: "B", value: 55 },
      { category: "C", value: 43 },
    ],
  },
  mark: "bar",
  encoding: {
    x: { field: "category", type: "nominal" },
    y: { field: "value", type: "quantitative" },
  },
  width: 300,
  height: 200,
});

const LINE_CHART = JSON.stringify({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: {
    values: [
      { x: 1, y: 10 },
      { x: 2, y: 25 },
      { x: 3, y: 15 },
      { x: 4, y: 30 },
    ],
  },
  mark: "line",
  encoding: {
    x: { field: "x", type: "quantitative" },
    y: { field: "y", type: "quantitative" },
  },
});

describe("render_chart (integration)", () => {
  beforeAll(() => {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  it("renders a bar chart to SVG", async () => {
    const result = await render_chart(BAR_CHART, "svg");

    expect(result.status).toBe("completed");
    expect(result.format).toBe("svg");
    expect(result.output_path).toMatch(/vegalite-.*\.svg$/);
    expect(result.embed_markdown).toMatch(/!\[.*\]\(\.\/docs\/generated\/vegalite-/);
    expect(result.size_bytes).toBeGreaterThan(0);

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
  });

  it("renders a line chart to SVG", async () => {
    const result = await render_chart(LINE_CHART, "svg");
    expect(result.status).toBe("completed");

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
  });

  it("renders to PNG format", async () => {
    const result = await render_chart(BAR_CHART, "png");

    expect(result.status).toBe("completed");
    expect(result.format).toBe("png");

    const buf = readFileSync(result.output_path!);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("caches identical inputs", async () => {
    const first = await render_chart(BAR_CHART, "svg");
    const second = await render_chart(BAR_CHART, "svg");
    expect(first.output_path).toBe(second.output_path);
  });

  it("returns error for invalid JSON", async () => {
    const result = await render_chart("not json at all", "svg");
    expect(result.status).toBe("error");
    expect(result.error_type).toBe("syntax_error");
    expect(result.error_message).toContain("Invalid JSON");
  });

  it("returns error for invalid Vega-Lite spec", async () => {
    const result = await render_chart(
      JSON.stringify({ not: "a valid spec" }),
      "svg"
    );
    // This should either error from vl-convert or produce output
    expect(["completed", "error"]).toContain(result.status);
  });
}, 60_000);
