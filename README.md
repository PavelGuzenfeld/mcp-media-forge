# MCP Media Forge

[![npm](https://img.shields.io/npm/v/mcp-media-forge)](https://www.npmjs.com/package/mcp-media-forge)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

MCP server that generates diagrams, charts, HTML pages, and slide decks from text DSLs -- designed for AI coding agents to embed into Markdown.

LLM agents call tools like `render_mermaid`, `render_html_page`, or `render_slides` with text input, and get back file paths to assets ready to embed in docs.

## Output Gallery

### Mermaid Flowchart
<img src="docs/generated/example-flowchart.svg" width="400" alt="Mermaid flowchart">

### Mermaid Sequence Diagram
<img src="docs/generated/example-sequence.svg" width="500" alt="Mermaid sequence diagram">

### D2 Architecture Diagram
<img src="docs/generated/example-architecture.svg" width="600" alt="D2 architecture diagram">

### Graphviz Dependency Graph
<img src="docs/generated/example-dependencies.svg" width="500" alt="Graphviz dependency graph">

### Vega-Lite Bar Chart
<img src="docs/generated/example-bar-chart.svg" width="450" alt="Vega-Lite bar chart">

## Tools

### Diagram & Chart Renderers (Docker)

| Tool | Input | Formats | Use Case |
|------|-------|---------|----------|
| `render_mermaid` | Mermaid code | SVG, PNG | Flowcharts, sequence, ER, state, Gantt, git graphs |
| `render_d2` | D2 code | SVG, PNG | Architecture diagrams with containers and icons |
| `render_graphviz` | DOT code | SVG, PNG | Dependency graphs, network diagrams |
| `render_chart` | Vega-Lite JSON | SVG, PNG | Bar, line, scatter, area, heatmap charts |

### HTML Generators (No Docker)

| Tool | Input | Output | Use Case |
|------|-------|--------|----------|
| `render_html_page` | HTML body + theme | Self-contained HTML | Technical docs, reports, dashboards |
| `render_slides` | JSON slide array + theme | HTML slide deck | Presentations, status updates, walkthroughs |

### Utilities

| Tool | Description |
|------|-------------|
| `get_tool_guide` | Usage examples, anti-patterns, complexity limits per tool |
| `list_assets` | List all generated files in the output directory |

## Quick Start

### 1. Start the rendering container (for diagram tools)

```bash
cd docker
docker compose up -d
```

> HTML page and slide tools work without Docker.

### 2. Install the MCP server

**Option A -- npx (no install)**

```bash
npx mcp-media-forge
```

**Option B -- Clone and build**

```bash
git clone https://github.com/PavelGuzenfeld/mcp-media-forge.git
cd mcp-media-forge
npm install
npm run build
```

### 3. Register with your MCP client

Any MCP-compatible client (Claude Code, Cursor, VS Code + Copilot, Cline, etc.) can use this server. The standard config:

```json
{
  "mcpServers": {
    "media-forge": {
      "command": "node",
      "args": ["/path/to/mcp-media-forge/dist/index.js"],
      "env": {
        "PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

Where to add this depends on your client:
- **Claude Code**: `~/.claude/settings.json`
- **Cursor**: MCP settings panel
- **VS Code (Copilot)**: `.vscode/mcp.json`
- **Cline**: MCP server configuration

### 4. Use it

Ask your AI assistant to generate diagrams, pages, or presentations:

> "Create a sequence diagram showing the OAuth2 flow and embed it in the README"

> "Generate an HTML page summarizing the API architecture with KPI cards"

> "Make a slide deck with our Q1 metrics and architecture overview"

The agent calls the appropriate tool, gets back a file path, and embeds it in your markdown.

## How It Works

```
AI Agent (any MCP client)
    |
    | MCP Protocol (JSON-RPC over stdio)
    v
MCP Media Forge (Node.js on host)
    |
    |--- Diagrams: docker exec (sandboxed, no network)
    |       |
    |       v
    |   Rendering Container
    |     ├── mmdc       (Mermaid CLI + Chromium)
    |     ├── d2         (D2 diagrams)
    |     ├── dot/neato  (Graphviz)
    |     └── vl2svg     (Vega-Lite via vl-convert)
    |
    |--- HTML/Slides: template engine (no Docker)
    |       |
    |       v
    |   CSS Design System (4 themes, depth tiers, components)
    |
    v
docs/generated/
  mermaid-a1b2c3.svg
  d2-7f8e9a.svg
  html_page-d4e5f6.html
  slides-8b9c0d.html
```

**Key design decisions:**

- **Text in, file path out** -- returns relative paths, never base64 blobs
- **Content-hash naming** -- same input = same file = free caching + git-friendly
- **SVG preferred** -- vector format, small files, diffs cleanly in git
- **Docker-contained** -- diagram renderers run in a sandboxed container with `network_mode: none`
- **Self-contained HTML** -- pages and slides have zero external dependencies (inline CSS/JS)
- **Input pre-validation** -- catches common mistakes before Docker round-trips
- **Structured errors** -- error responses include `error_type`, `error_message`, and `suggestion` to enable LLM self-correction

## Tool Reference

### get_tool_guide

Get usage guide for any tool before rendering. Returns examples, anti-patterns to avoid, complexity limits, and tips.

```json
{ "tool_name": "mermaid" }
```

Available guides: `mermaid`, `d2`, `graphviz`, `vegalite`, `html_page`, `slides`, or `all` for a summary.

### render_mermaid

```json
{
  "code": "flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Done]",
  "format": "svg",
  "theme": "default"
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `code` | string | required | Mermaid diagram code (must start with diagram type) |
| `format` | `svg` \| `png` | `svg` | Output format |
| `theme` | `default` \| `dark` \| `forest` \| `neutral` | `default` | Mermaid theme |

**Pre-validation catches:** missing diagram type, semicolons, HTML in labels, >25 nodes.

### render_d2

```json
{
  "code": "client -> server -> database",
  "format": "svg",
  "layout": "dagre"
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `code` | string | required | D2 diagram code |
| `format` | `svg` \| `png` | `svg` | Output format |
| `theme` | number | -- | Theme ID (0=default, 1=neutral-grey, 3=terminal) |
| `layout` | `dagre` \| `elk` \| `tala` | `dagre` | Layout engine |

**Pre-validation catches:** Mermaid/D2 syntax confusion, unbalanced braces, >3 nesting depth.

### render_graphviz

```json
{
  "dot_source": "digraph G { A -> B -> C }",
  "engine": "dot",
  "format": "svg"
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dot_source` | string | required | Graphviz DOT source code |
| `engine` | `dot` \| `neato` \| `fdp` \| `sfdp` \| `twopi` \| `circo` | `dot` | Layout engine |
| `format` | `svg` \| `png` | `svg` | Output format |

**Pre-validation catches:** missing graph wrapper, `->` in undirected graphs, unbalanced braces.

### render_chart

```json
{
  "spec_json": "{\"$schema\":\"https://vega.github.io/schema/vega-lite/v5.json\",\"data\":{\"values\":[{\"x\":1,\"y\":10}]},\"mark\":\"bar\",\"encoding\":{\"x\":{\"field\":\"x\"},\"y\":{\"field\":\"y\"}}}",
  "format": "svg"
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `spec_json` | string | required | Vega-Lite JSON specification |
| `format` | `svg` \| `png` | `svg` | Output format |
| `scale` | number | 1 | Scale factor for PNG output |

**Pre-validation catches:** invalid JSON, missing `$schema`/`data`/`mark`, >500 inline data rows.

### render_html_page

Generates a self-contained themed HTML page. No Docker required.

```json
{
  "title": "System Overview",
  "body_html": "<section id=\"metrics\"><h2>Metrics</h2><div class=\"mf-grid mf-grid-3\">...</div></section>",
  "theme": "swiss",
  "description": "Q1 architecture overview",
  "nav_sections": ["Metrics", "Architecture", "Roadmap"]
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | required | Page title |
| `body_html` | string | required | HTML body content (inner content only, no `<html>`/`<head>`/`<body>`) |
| `theme` | `swiss` \| `midnight` \| `warm` \| `terminal` | `swiss` | Visual theme |
| `description` | string | -- | Page description (meta tag + header) |
| `nav_sections` | string[] | -- | Section names for floating IntersectionObserver navigation |

**Design system CSS classes:**

| Class | Purpose |
|-------|---------|
| `mf-hero` | Primary highlight section (large shadow) |
| `mf-elevated` | Secondary highlight (medium shadow) |
| `mf-card` | Bordered content card |
| `mf-recessed` | De-emphasized content |
| `mf-grid mf-grid-2` | Responsive 2-column grid |
| `mf-grid mf-grid-3` | Responsive 3-column grid |
| `mf-split` | Two equal columns |
| `mf-kpi` + `mf-kpi-value` + `mf-kpi-label` | Key metric display |
| `mf-badge-success/warning/error/info` | Status badges |

**Themes:**

| Theme | Style | Best for |
|-------|-------|----------|
| `swiss` | White, geometric, blue accent | Technical docs |
| `midnight` | Deep navy, serif, gold accent | Presentations |
| `warm` | Cream paper, bold sans, terracotta | Reports |
| `terminal` | Dark, monospace, cyan accent | Developer content |

### render_slides

Generates a self-contained HTML slide deck with keyboard/touch navigation. No Docker required.

```json
{
  "title": "Q1 Review",
  "slides": "[{\"title\":\"Q1 Review\",\"content\":\"Engineering update\",\"type\":\"title\"},{\"title\":\"Metrics\",\"content\":\"<ul><li>99.9% uptime</li></ul>\",\"type\":\"content\"}]",
  "theme": "midnight",
  "author": "Engineering Team"
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | required | Presentation title |
| `slides` | string | required | JSON array of slide objects |
| `theme` | `swiss` \| `midnight` \| `warm` \| `terminal` | `swiss` | Visual theme |
| `author` | string | -- | Author (shown on title slide) |

**Slide types:**

| Type | Layout | Best for |
|------|--------|----------|
| `title` | Centered large text + subtitle | Opening/closing slides |
| `section` | Centered heading + description | Topic dividers |
| `content` | Heading + body (bullets, text) | Most content |
| `split` | Heading + two columns | Before/after, comparisons |
| `code` | Heading + code block | Code walkthroughs |
| `quote` | Large blockquote + attribution | Testimonials, key quotes |
| `kpi` | Heading + auto-grid metrics | Dashboards, stats |
| `image` | Heading + centered image | Screenshots, diagrams |

**Navigation:** Arrow keys, Space, PageUp/PageDown, Home/End. Touch: swipe left/right. Click dots to jump.

### list_assets

```json
{ "directory": "" }
```

Returns a JSON array of all generated files with name, path, size, and modification time.

## Error Handling

All tools return structured errors that help LLMs self-correct:

```json
{
  "status": "error",
  "error_type": "syntax_error",
  "error_message": "First line must declare diagram type. Got: \"A --> B\"",
  "suggestion": "Start with: flowchart TD, sequenceDiagram, erDiagram, ... See https://mermaid.js.org/syntax/"
}
```

Error types: `syntax_error`, `rendering_error`, `dependency_missing`.

**Pre-validation** catches common LLM mistakes before hitting the renderer:
- Mermaid: missing diagram type, semicolons, HTML tags, legacy `graph` syntax
- D2: Mermaid syntax confusion (`-->`, `subgraph`), unbalanced braces
- Graphviz: missing `digraph`/`graph` wrapper, `->` in undirected graphs
- Vega-Lite: invalid JSON, missing required fields, oversized inline data

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_ROOT` | `cwd()` | Project root for output path resolution |
| `OUTPUT_DIR` | `docs/generated` | Output directory relative to PROJECT_ROOT |
| `MEDIA_FORGE_CONTAINER` | `media-forge-renderer` | Docker container name |

## Development

```bash
npm install
npm run build          # Build with tsup
npm run dev            # Watch mode
npm test               # Run all tests (95 total)
npm run test:unit      # Unit tests only (no Docker needed)
npm run test:component # Integration tests (Docker tools need container)
npm run lint           # Type-check with tsc
```

### Running integration tests

```bash
cd docker && docker compose up -d   # Start renderer (diagram tools only)
cd .. && npm run test:component     # All integration tests
```

> HTML page and slide integration tests run without Docker.

## Examples

See [examples/](examples/) for sample input files:

| File | Tool | Description |
|------|------|-------------|
| [`mermaid/flowchart.mmd`](examples/mermaid/flowchart.mmd) | render_mermaid | Decision flowchart |
| [`mermaid/sequence.mmd`](examples/mermaid/sequence.mmd) | render_mermaid | Client-server sequence |
| [`d2/architecture.d2`](examples/d2/architecture.d2) | render_d2 | Backend architecture with containers |
| [`graphviz/dependencies.dot`](examples/graphviz/dependencies.dot) | render_graphviz | npm dependency graph |
| [`vegalite/bar-chart.json`](examples/vegalite/bar-chart.json) | render_chart | Tool performance comparison |

See [examples/README.md](examples/README.md) for MCP tool call examples and expected responses.

## License

[MIT](LICENSE)
