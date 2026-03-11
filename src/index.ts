import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { render_mermaid } from "./tools/mermaid.js";
import { render_d2 } from "./tools/d2.js";
import { render_graphviz } from "./tools/graphviz.js";
import { render_chart } from "./tools/vegalite.js";
import { render_html_page } from "./tools/html_page.js";
import { render_slides } from "./tools/slides.js";
import { get_guide, get_all_guides_summary, TOOL_GUIDES } from "./tools/guides.js";
import { get_output_dir, relative_path } from "./core/output.js";
import type { MediaToolResult } from "./core/types.js";

const server = new McpServer({
  name: "mcp-media-forge",
  version: "0.0.1",
});

function result_to_mcp(result: MediaToolResult) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    isError: result.status === "error",
  };
}

// --- Tool Guide (inspired by visual-explainer's reference docs as design system) ---

server.tool(
  "get_tool_guide",
  `Get usage guide for a rendering tool — includes examples, anti-patterns to avoid, complexity limits, and tips. Call this BEFORE your first render to avoid common mistakes. Available guides: mermaid, d2, graphviz, vegalite, html_page, slides (or "all" for a summary).`,
  {
    tool_name: z
      .string()
      .describe(
        'Tool to get guide for: "mermaid", "d2", "graphviz", "vegalite", "html_page", "slides", or "all"'
      ),
  },
  async ({ tool_name }) => {
    if (tool_name === "all") {
      return {
        content: [
          {
            type: "text" as const,
            text: get_all_guides_summary(),
          },
        ],
      };
    }
    const guide = get_guide(tool_name);
    if (!guide) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown tool "${tool_name}". Available: mermaid, d2, graphviz, vegalite, html_page, slides, all`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(guide, null, 2) },
      ],
    };
  }
);

// --- P0: Core Diagrams ---

server.tool(
  "render_mermaid",
  [
    "Render a Mermaid diagram to SVG or PNG.",
    "Supports: flowchart, sequenceDiagram, erDiagram, stateDiagram-v2, gantt, pie, gitGraph, classDiagram, journey, mindmap.",
    "IMPORTANT: Code must start with diagram type (e.g., 'flowchart TD'). Do NOT use semicolons. Do NOT use HTML tags in labels.",
    "Anti-patterns: 'graph' (use 'flowchart'), unquoted special chars in labels, >25 nodes without subgraphs.",
    "Call get_tool_guide('mermaid') for examples and full anti-pattern list.",
  ].join(" "),
  {
    code: z
      .string()
      .describe(
        "Mermaid diagram code. Must start with diagram type declaration (e.g., 'flowchart TD', 'sequenceDiagram'). No semicolons."
      ),
    format: z
      .enum(["svg", "png"])
      .default("svg")
      .describe("Output format. SVG preferred (smaller, git-friendly diffs)"),
    theme: z
      .enum(["default", "dark", "forest", "neutral"])
      .default("default")
      .describe(
        "Mermaid theme. 'neutral' best for docs, 'forest' for dark backgrounds"
      ),
  },
  async ({ code, format, theme }) =>
    result_to_mcp(await render_mermaid(code, format, theme))
);

server.tool(
  "render_d2",
  [
    "Render a D2 architecture diagram to SVG or PNG.",
    "Best for: architecture diagrams with containers, nested groups, icons, and complex layouts.",
    "IMPORTANT: D2 syntax is NOT Mermaid. Use '->' for arrows (not '-->'), containers with 'name: { ... }' (not 'subgraph').",
    "Anti-patterns: Mermaid syntax, unbalanced braces, >3 nesting levels.",
    "Call get_tool_guide('d2') for examples.",
  ].join(" "),
  {
    code: z
      .string()
      .describe(
        "D2 diagram code. Use '->' for arrows, 'name: { ... }' for containers. NOT Mermaid syntax."
      ),
    format: z
      .enum(["svg", "png"])
      .default("svg")
      .describe(
        "Output format. SVG preferred. PNG is slower (requires Chromium conversion)."
      ),
    theme: z
      .number()
      .optional()
      .describe(
        "D2 theme ID: 0=default, 1=neutral-grey, 3=terminal, 100=neutral-default"
      ),
    layout: z
      .enum(["dagre", "elk", "tala"])
      .default("dagre")
      .describe(
        "Layout engine. dagre=hierarchical (default), elk=complex layouts with many crossings"
      ),
  },
  async ({ code, format, theme, layout }) =>
    result_to_mcp(await render_d2(code, format, theme, layout))
);

// --- P1: Extended Diagrams & Charts ---

server.tool(
  "render_graphviz",
  [
    "Render a Graphviz DOT diagram to SVG or PNG.",
    "Best for: dependency graphs, network diagrams, tree structures, large auto-layout graphs (100+ nodes).",
    "IMPORTANT: Source must be wrapped in 'digraph G { ... }' or 'graph G { ... }'. Use '->' with digraph, '--' with graph.",
    "Engine guide: dot=hierarchical, neato=spring, fdp=force-directed, sfdp=large graphs, circo=circular, twopi=radial.",
    "Call get_tool_guide('graphviz') for examples.",
  ].join(" "),
  {
    dot_source: z
      .string()
      .describe(
        "Graphviz DOT source. Must start with 'digraph G {' or 'graph G {'. Use '->' for directed, '--' for undirected."
      ),
    engine: z
      .enum(["dot", "neato", "fdp", "sfdp", "twopi", "circo"])
      .default("dot")
      .describe(
        "Layout engine: dot=hierarchical, neato=spring, fdp=force-directed, sfdp=large, circo=circular, twopi=radial"
      ),
    format: z
      .enum(["svg", "png"])
      .default("svg")
      .describe("Output format. SVG preferred."),
  },
  async ({ dot_source, engine, format }) =>
    result_to_mcp(await render_graphviz(dot_source, engine, format))
);

server.tool(
  "render_chart",
  [
    "Render a Vega-Lite chart to SVG or PNG.",
    "Supports: bar, line, point (scatter), area, rect (heatmap), boxplot, and layered/composite charts.",
    'IMPORTANT: spec_json must be valid JSON with "$schema", "data", "mark", and "encoding" fields.',
    "Anti-patterns: missing $schema, omitting encoding types, >500 inline data rows.",
    "Call get_tool_guide('vegalite') for examples.",
  ].join(" "),
  {
    spec_json: z
      .string()
      .describe(
        'Vega-Lite JSON spec (as string). Must include "$schema", "data", "mark", "encoding". Always specify encoding types (quantitative/nominal/temporal/ordinal).'
      ),
    format: z
      .enum(["svg", "png"])
      .default("svg")
      .describe("Output format. SVG preferred."),
    scale: z
      .number()
      .optional()
      .describe(
        "Scale factor for PNG (default: 1). Use 2 for retina-crisp output."
      ),
  },
  async ({ spec_json, format, scale }) =>
    result_to_mcp(await render_chart(spec_json, format, scale))
);

// --- P2: HTML Pages & Slides (inspired by visual-explainer) ---

server.tool(
  "render_html_page",
  [
    "Render a self-contained themed HTML page from body content.",
    "No Docker required. Wraps your HTML in a design system with typography, depth tiers, cards, grids, KPIs, badges, and section navigation.",
    "IMPORTANT: body_html is the INNER content only — do NOT include <html>, <head>, or <body> tags.",
    "Use mf- prefixed CSS classes: mf-hero, mf-elevated, mf-card, mf-grid, mf-kpi, mf-badge-success, etc.",
    "Themes: swiss (clean docs), midnight (presentations), warm (reports), terminal (dev content).",
    "Call get_tool_guide('html_page') for design system reference and examples.",
  ].join(" "),
  {
    title: z.string().describe("Page title (shown in header and browser tab)"),
    body_html: z
      .string()
      .describe(
        "HTML body content (inner content only, no <html>/<head>/<body>). Use mf- prefixed classes for styling."
      ),
    theme: z
      .enum(["swiss", "midnight", "warm", "terminal"])
      .default("swiss")
      .describe(
        "Visual theme: swiss=clean docs, midnight=dark editorial, warm=cream reports, terminal=dev monospace"
      ),
    description: z
      .string()
      .optional()
      .describe("Page description (shown below title and in meta tag)"),
    nav_sections: z
      .array(z.string())
      .optional()
      .describe(
        "Section names for floating navigation. Must match id attributes on <section> elements in body_html."
      ),
  },
  async ({ title, body_html, theme, description, nav_sections }) =>
    result_to_mcp(
      render_html_page(title, body_html, theme, description, nav_sections)
    )
);

server.tool(
  "render_slides",
  [
    "Render a self-contained HTML slide deck with keyboard/touch navigation, progress bar, and transitions.",
    "No Docker required. Supports 8 slide types: title, content, split, code, quote, kpi, image, section.",
    "IMPORTANT: slides is a JSON array string of objects with title, content (HTML), and optional type.",
    "Content density limits: max 6 bullets per slide, max 10 code lines, max 25 words for quotes, max 30 slides total.",
    "Call get_tool_guide('slides') for slide type reference and examples.",
  ].join(" "),
  {
    title: z.string().describe("Presentation title"),
    slides: z
      .string()
      .describe(
        'JSON array of slide objects: [{"title": "...", "content": "HTML...", "type": "content|title|split|code|quote|kpi|image|section"}]'
      ),
    theme: z
      .enum(["swiss", "midnight", "warm", "terminal"])
      .default("swiss")
      .describe("Visual theme for the slide deck"),
    author: z
      .string()
      .optional()
      .describe("Author name (shown on title slide)"),
  },
  async ({ title, slides, theme, author }) =>
    result_to_mcp(render_slides(title, slides, theme, author))
);

// --- Utility ---

server.tool(
  "list_assets",
  "List all generated media assets in the output directory.",
  {
    directory: z
      .string()
      .optional()
      .describe("Subdirectory to list (default: docs/generated)"),
  },
  async ({ directory }) => {
    const dir = directory
      ? path.resolve(get_output_dir(), directory)
      : get_output_dir();

    try {
      const files = readdirSync(dir);
      const assets = files.map((f: string) => {
        const full = path.join(dir, f);
        const stats = statSync(full);
        return {
          name: f,
          path: relative_path(full),
          size_bytes: stats.size,
          modified: stats.mtime.toISOString(),
        };
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(assets, null, 2) },
        ],
      };
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ files: [], message: "No assets found" }),
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
