import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { render_mermaid } from "./tools/mermaid.js";
import { render_d2 } from "./tools/d2.js";
import { render_graphviz } from "./tools/graphviz.js";
import { render_chart } from "./tools/vegalite.js";
import { get_output_dir, relative_path } from "./core/output.js";
import type { MediaToolResult } from "./core/types.js";

const server = new McpServer({
  name: "mcp-media-forge",
  version: "0.1.0",
});

function result_to_mcp(result: MediaToolResult) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    isError: result.status === "error",
  };
}

// --- P0: Core Diagrams ---

server.tool(
  "render_mermaid",
  "Render a Mermaid diagram to SVG or PNG. Supports flowcharts, sequence diagrams, ER diagrams, state diagrams, Gantt charts, pie charts, and git graphs.",
  {
    code: z.string().describe("Mermaid diagram code"),
    format: z
      .enum(["svg", "png"])
      .default("svg")
      .describe("Output format (default: svg)"),
    theme: z
      .enum(["default", "dark", "forest", "neutral"])
      .default("default")
      .describe("Mermaid theme"),
  },
  async ({ code, format, theme }) => result_to_mcp(await render_mermaid(code, format, theme))
);

server.tool(
  "render_d2",
  "Render a D2 architecture diagram to SVG or PNG. Best for architecture diagrams with containers, icons, and complex layouts.",
  {
    code: z.string().describe("D2 diagram code"),
    format: z
      .enum(["svg", "png"])
      .default("svg")
      .describe("Output format (default: svg)"),
    theme: z
      .number()
      .optional()
      .describe("D2 theme ID (0=default, 1=neutral-grey, 3=terminal, 100=neutral-default)"),
    layout: z
      .enum(["dagre", "elk", "tala"])
      .default("dagre")
      .describe("Layout engine (default: dagre)"),
  },
  async ({ code, format, theme, layout }) =>
    result_to_mcp(await render_d2(code, format, theme, layout))
);

// --- P1: Extended Diagrams & Charts ---

server.tool(
  "render_graphviz",
  "Render a Graphviz DOT diagram to SVG or PNG. Best for dependency graphs, network diagrams, and large auto-layout graphs.",
  {
    dot_source: z.string().describe("Graphviz DOT source code"),
    engine: z
      .enum(["dot", "neato", "fdp", "sfdp", "twopi", "circo"])
      .default("dot")
      .describe("Layout engine (default: dot)"),
    format: z
      .enum(["svg", "png"])
      .default("svg")
      .describe("Output format (default: svg)"),
  },
  async ({ dot_source, engine, format }) =>
    result_to_mcp(await render_graphviz(dot_source, engine, format))
);

server.tool(
  "render_chart",
  "Render a Vega-Lite chart specification to SVG or PNG. Supports bar, line, scatter, area, heatmap, and other chart types via declarative JSON.",
  {
    spec_json: z
      .string()
      .describe("Vega-Lite JSON specification (as a string)"),
    format: z
      .enum(["svg", "png"])
      .default("svg")
      .describe("Output format (default: svg)"),
    scale: z
      .number()
      .optional()
      .describe("Scale factor for PNG output (default: 1)"),
  },
  async ({ spec_json, format, scale }) =>
    result_to_mcp(await render_chart(spec_json, format, scale))
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
