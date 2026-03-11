import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { render_html_page } from "../../src/tools/html_page.js";
import { get_output_dir } from "../../src/core/output.js";

describe("render_html_page", () => {

  it("generates a self-contained HTML page", () => {
    const result = render_html_page(
      "Test Page",
      "<h2>Hello</h2><p>World</p>",
      "swiss"
    );
    expect(result.status).toBe("completed");
    expect(result.format).toBe("html");
    expect(result.output_path).toMatch(/\.html$/);
    expect(result.size_bytes).toBeGreaterThan(0);
    expect(result.embed_markdown).toMatch(/html_page-[a-f0-9]+\.html/);
  });

  it("embeds the theme CSS", () => {
    const result = render_html_page(
      "Themed",
      "<p>content</p>",
      "midnight"
    );
    expect(result.status).toBe("completed");
    const html = readFileSync(
      `${get_output_dir()}/${result.output_path!.split("/").pop()}`,
      "utf-8"
    );
    expect(html).toContain("--bg:");
    expect(html).toContain("--accent:");
    expect(html).toContain("#0f172a"); // midnight bg color
  });

  it("includes section navigation when nav_sections provided", () => {
    const result = render_html_page(
      "Nav Test",
      '<section id="overview"><h2>Overview</h2></section>',
      "swiss",
      undefined,
      ["Overview"]
    );
    expect(result.status).toBe("completed");
    const html = readFileSync(
      `${get_output_dir()}/${result.output_path!.split("/").pop()}`,
      "utf-8"
    );
    expect(html).toContain("mf-nav");
    expect(html).toContain('href="#overview"');
    expect(html).toContain("IntersectionObserver");
  });

  it("includes description in header and meta", () => {
    const result = render_html_page(
      "Desc Test",
      "<p>body</p>",
      "swiss",
      "A brief description"
    );
    expect(result.status).toBe("completed");
    const html = readFileSync(
      `${get_output_dir()}/${result.output_path!.split("/").pop()}`,
      "utf-8"
    );
    expect(html).toContain("A brief description");
    expect(html).toContain('name="description"');
  });

  it("rejects empty title", () => {
    const result = render_html_page("", "<p>body</p>", "swiss");
    expect(result.status).toBe("error");
    expect(result.error_message).toContain("Title");
  });

  it("rejects empty body", () => {
    const result = render_html_page("Title", "", "swiss");
    expect(result.status).toBe("error");
    expect(result.error_message).toContain("Body");
  });

  it("caches identical content", () => {
    const a = render_html_page("Same", "<p>same</p>", "swiss");
    const b = render_html_page("Same", "<p>same</p>", "swiss");
    expect(a.output_path).toBe(b.output_path);
  });

  it("different themes produce different files", () => {
    const a = render_html_page("Theme", "<p>test</p>", "swiss");
    const b = render_html_page("Theme", "<p>test</p>", "terminal");
    expect(a.output_path).not.toBe(b.output_path);
  });

  it("all four themes produce valid pages", () => {
    for (const theme of ["swiss", "midnight", "warm", "terminal"] as const) {
      const result = render_html_page("Theme Test", `<p>${theme}</p>`, theme);
      expect(result.status).toBe("completed");
    }
  });
});
