# MCP Media Forge

A Model Context Protocol (MCP) service for generating presentations, infographics, diagrams, and videos — designed for embedding into Markdown technical documentation.

## Problem

Technical documentation suffers from a **synchronization gap**: code evolves rapidly while visual assets (diagrams, slide decks, explainer videos) stagnate due to high manual effort. Binary assets in `docs/` folders become stale within weeks of being created.

## Solution

An MCP server that exposes media generation as tools, enabling LLM agents to produce and update visual documentation artifacts automatically. Assets are generated from **text-based source formats** (Mermaid, D2, Markdown slides, Manim scenes) stored alongside the code, keeping visuals in sync with the codebase.

## Architecture

```
LLM Agent
    |
    | MCP Protocol (JSON-RPC over stdio)
    v
+-------------------+
| MCP Media Forge   |
| Server            |
+---+---+---+---+---+
    |   |   |   |
    v   v   v   v
  Marp D2  mmdc FFmpeg  Manim  Vega-Lite  agg
  (slides) (diagrams)  (video) (animation)(charts)(terminal)
    |   |   |   |       |       |          |
    v   v   v   v       v       v          v
  docs/generated/
    *.svg  *.png  *.pdf  *.gif  *.mp4
```

## Key Design Principles

1. **Text-to-image pipelines** — LLM generates text DSL, MCP tool renders it
2. **Reference-based output** — return file paths, never base64 blobs
3. **SVG preferred** — vector, small, diffs in git; PNG as fallback
4. **GIF for animations** — universally rendered, no player needed
5. **Docker-contained** — all rendering tools inside containers
6. **Compose existing servers** — build only what's missing

## Documentation

| Document | Description |
|---|---|
| [Research: MCP Landscape](docs/research-mcp-landscape.md) | Existing MCP servers for visual content |
| [Research: Tools & APIs](docs/research-tools-apis.md) | Evaluation of rendering tools and APIs |
| [Research: Markdown Embedding](docs/research-markdown-embedding.md) | How to embed rich media in .md files |
| [Architecture Analysis](docs/architecture.md) | Protocol constraints, async patterns, security |
| [Agents & Workflows](docs/agents.md) | Agentic workflows, orchestration patterns, CI/CD |
| [Implementation Plan](docs/implementation-plan.md) | Phased build plan with priorities |
| [Verification Plan](docs/verification-plan.md) | Testing strategy, acceptance criteria, validation |

## Quick Reference: Priority Stack

| Priority | Tool | Produces | Status |
|---|---|---|---|
| P0 | Mermaid (mmdc) | Flowcharts, sequence, ER diagrams | Existing MCP servers available |
| P0 | D2 | Architecture diagrams | CLI wrapper needed |
| P1 | Marp | Slide decks (PNG/PDF) | CLI wrapper needed |
| P1 | Vega-Lite / ECharts | Data charts | JSON renderer needed |
| P2 | Manim | Technical animations (GIF/MP4) | Python wrapper needed |
| P2 | Asciinema + agg | Terminal demos (GIF) | CLI pipeline needed |
| P2 | FFmpeg | Video assembly | Filtergraph builder needed |
| P3 | SVG templates | Infographics | Custom engine needed |
| P3 | Excalidraw | Hand-drawn diagrams | Existing MCP server available |

## License

TBD
