import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, mkdirSync } from "node:fs";
import { render_html_page } from "../../src/tools/html_page.js";

const OUTPUT_DIR = "docs/generated";

describe("render_html_page (integration)", () => {
  beforeAll(() => {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  it("renders a complete HTML page with body content", () => {
    const result = render_html_page(
      "Integration Test Page",
      `<section id="overview">
        <h2>Overview</h2>
        <p>This is an integration test for the HTML page renderer.</p>
        <div class="mf-grid mf-grid-3">
          <div class="mf-card">
            <div class="mf-kpi">
              <div class="mf-kpi-value">42</div>
              <div class="mf-kpi-label">Tests</div>
            </div>
          </div>
          <div class="mf-card">
            <div class="mf-kpi">
              <div class="mf-kpi-value">100%</div>
              <div class="mf-kpi-label">Pass Rate</div>
            </div>
          </div>
          <div class="mf-card">
            <div class="mf-kpi">
              <div class="mf-kpi-value">0</div>
              <div class="mf-kpi-label">Failures</div>
            </div>
          </div>
        </div>
      </section>
      <section id="details">
        <h2>Details</h2>
        <table>
          <thead><tr><th>Tool</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Mermaid</td><td><span class="mf-badge mf-badge-success">OK</span></td></tr>
            <tr><td>D2</td><td><span class="mf-badge mf-badge-success">OK</span></td></tr>
            <tr><td>Graphviz</td><td><span class="mf-badge mf-badge-success">OK</span></td></tr>
          </tbody>
        </table>
      </section>`,
      "swiss",
      "End-to-end test of the HTML page renderer",
      ["Overview", "Details"]
    );

    expect(result.status).toBe("completed");
    expect(result.format).toBe("html");
    expect(result.output_path).toMatch(/html_page-.*\.html$/);
    expect(result.size_bytes).toBeGreaterThan(0);

    const html = readFileSync(result.output_path!, "utf-8");

    // Full page structure
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html lang=\"en\">");
    expect(html).toContain("</html>");

    // Title and description
    expect(html).toContain("Integration Test Page");
    expect(html).toContain("End-to-end test of the HTML page renderer");
    expect(html).toContain('<meta name="description"');

    // Design system CSS is embedded
    expect(html).toContain("--bg:");
    expect(html).toContain("--accent:");
    expect(html).toContain("--font-body:");
    expect(html).toContain("mf-hero");
    expect(html).toContain("mf-card");
    expect(html).toContain("mf-kpi");

    // Body content is present
    expect(html).toContain("mf-grid mf-grid-3");
    expect(html).toContain("mf-badge mf-badge-success");
    expect(html).toContain("42");
    expect(html).toContain("100%");

    // Section navigation
    expect(html).toContain("mf-nav");
    expect(html).toContain('href="#overview"');
    expect(html).toContain('href="#details"');
    expect(html).toContain("IntersectionObserver");

    // Accessibility
    expect(html).toContain('aria-label="Sections"');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain("viewport");

    // Reduced motion support
    expect(html).toContain("prefers-reduced-motion");
  });

  it("renders all four themes with correct CSS variables", () => {
    const theme_markers: Record<string, string> = {
      swiss: "#2563eb",    // swiss accent blue
      midnight: "#0f172a", // midnight bg
      warm: "#fdf6ee",     // warm bg
      terminal: "#22d3ee", // terminal accent cyan
    };

    for (const [theme, marker] of Object.entries(theme_markers)) {
      const result = render_html_page(
        `${theme} Theme Test`,
        `<p>Testing ${theme} theme</p>`,
        theme as "swiss" | "midnight" | "warm" | "terminal"
      );

      expect(result.status).toBe("completed");

      const html = readFileSync(result.output_path!, "utf-8");
      expect(html).toContain(marker);
    }
  });

  it("produces self-contained HTML with no external dependencies", () => {
    const result = render_html_page(
      "Self-Contained Test",
      "<p>No external deps</p>",
      "swiss"
    );

    const html = readFileSync(result.output_path!, "utf-8");

    // No external stylesheet or script references
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="http/);
    expect(html).not.toMatch(/<script[^>]+src="http/);

    // CSS is inline in <style> tags
    expect(html).toContain("<style>");
  });

  it("escapes title and description to prevent XSS", () => {
    const result = render_html_page(
      '<script>alert("xss")</script>',
      "<p>safe body</p>",
      "swiss",
      'A "quoted" <description>'
    );

    expect(result.status).toBe("completed");

    const html = readFileSync(result.output_path!, "utf-8");

    // Title should be escaped in the heading and <title> tag
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('<script>alert("xss")</script>');

    // Description should be escaped
    expect(html).toContain("&lt;description&gt;");
    expect(html).toContain("&quot;quoted&quot;");
  });

  it("generates valid embed_markdown with path to HTML file", () => {
    const result = render_html_page(
      "Markdown Link Test",
      "<p>test</p>",
      "swiss"
    );

    expect(result.embed_markdown).toMatch(
      /docs\/generated\/html_page-[a-f0-9]+\.html/
    );
  });

  it("caches identical inputs and returns same path", () => {
    const a = render_html_page("Cache Test", "<p>same</p>", "midnight");
    const b = render_html_page("Cache Test", "<p>same</p>", "midnight");
    expect(a.output_path).toBe(b.output_path);
    expect(a.size_bytes).toBe(b.size_bytes);
  });

  it("page without nav_sections omits navigation element and JS", () => {
    const result = render_html_page(
      "No Nav Test",
      "<p>no sections</p>",
      "swiss"
    );

    const html = readFileSync(result.output_path!, "utf-8");
    // No nav element (CSS definitions in stylesheet are fine)
    expect(html).not.toContain('id="mf-nav"');
    // No nav JS block (observer.observe is only in the nav script, not in CSS comments)
    expect(html).not.toContain("observer.observe");
  });

  it("depth tier classes render correctly in output", () => {
    const result = render_html_page(
      "Depth Tiers",
      `<div class="mf-hero"><h2>Hero</h2></div>
       <div class="mf-elevated"><h3>Elevated</h3></div>
       <div class="mf-card"><p>Card</p></div>
       <div class="mf-recessed"><p>Recessed</p></div>`,
      "swiss"
    );

    const html = readFileSync(result.output_path!, "utf-8");

    // CSS definitions for depth tiers exist
    expect(html).toContain(".mf-hero");
    expect(html).toContain(".mf-elevated");
    expect(html).toContain(".mf-card");
    expect(html).toContain(".mf-recessed");

    // Content is present
    expect(html).toContain("Hero");
    expect(html).toContain("Elevated");
    expect(html).toContain("Card");
    expect(html).toContain("Recessed");
  });
});
