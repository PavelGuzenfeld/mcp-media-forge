# MCP Media Forge

MCP server that generates diagrams, charts, and visual documentation from text DSLs — designed for embedding into Markdown.

LLM agents call tools like `render_mermaid` or `render_d2` with text input, and get back file paths to SVG/PNG assets ready to embed in docs.

## Tools

| Tool | Input | Output | Status |
|------|-------|--------|--------|
| `render_mermaid` | Mermaid code | SVG/PNG flowcharts, sequence, ER, state, Gantt | Implemented |
| `render_d2` | D2 code | SVG/PNG architecture diagrams with containers/icons | Implemented |
| `render_graphviz` | DOT code | SVG/PNG dependency graphs, network diagrams | Implemented |
| `render_chart` | Vega-Lite JSON | SVG/PNG bar, line, scatter, area charts | Implemented |
| `list_assets` | — | List of generated files | Implemented |
| `render_slides` | Marp markdown | PNG/PDF slide decks | Planned |
| `render_animation` | Manim Python | GIF/MP4 technical animations | Planned |
| `terminal_to_gif` | Shell commands | GIF terminal recordings | Planned |
| `assemble_video` | Timeline JSON | MP4/GIF video assembly | Planned |

## Quick Start

### 1. Start the rendering container

```bash
cd docker
docker compose up -d
```

This builds a container with Mermaid CLI, D2, Graphviz, and Vega-Lite renderers.

### 2. Install and build the MCP server

```bash
npm install
npm run build
```

### 3. Register with Claude Code

Add to `~/.claude/settings.json`:

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

### 4. Use it

Ask Claude to generate a diagram:

> "Create a sequence diagram showing the OAuth2 flow and embed it in the README"

Claude will call `render_mermaid` with the diagram code, get back a file path, and embed it in your markdown.

## How It Works

```
Claude/Agent
    |
    | MCP Protocol (JSON-RPC over stdio)
    v
MCP Media Forge (Node.js on host)
    |
    | docker exec
    v
Rendering Container
  ├── mmdc       (Mermaid CLI)
  ├── d2         (D2 diagrams)
  ├── dot/neato  (Graphviz)
  └── vl2svg     (Vega-Lite charts)
    |
    v
docs/generated/
  mermaid-a1b2c3.svg
  d2-7f8e9a.svg
  ...
```

**Key principles:**
- **Text in, file path out** — never returns base64 blobs
- **Content-hash naming** — same input = same file = free caching + git-friendly
- **SVG preferred** — vector, small, diffs in git
- **Docker-contained** — no tools installed on host
- **Structured errors** — enables LLM self-correction loops

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_ROOT` | `cwd()` | Project root for output path resolution |
| `OUTPUT_DIR` | `docs/generated` | Output directory relative to PROJECT_ROOT |
| `MEDIA_FORGE_CONTAINER` | `media-forge-renderer` | Docker container name |

## Examples

See [examples/](examples/) for sample inputs, MCP tool calls, and expected results for each tool.

## Development

```bash
npm install
npm run build          # Build with tsup
npm run dev            # Watch mode
npm test               # Run all tests
npm run test:unit      # Unit tests only (no Docker needed)
npm run test:component # Component tests (requires Docker container)
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | Protocol constraints, tool interfaces, caching, security |
| [Implementation Plan](docs/implementation-plan.md) | Phased build plan |
| [Agent Instructions](docs/agents.md) | Guide for AI agents working on this repo |
| [Verification Plan](docs/verification-plan.md) | Testing strategy and acceptance criteria |
| [Examples](examples/README.md) | Sample inputs with expected outputs |

## License

[MIT](LICENSE)
