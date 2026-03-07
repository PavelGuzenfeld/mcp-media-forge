# Market Research: MCP Diagram & Visualization Servers

## Landscape Overview

The MCP diagram/visualization space has exploded in 2025-2026. There are **dozens** of MCP servers for diagram generation, but they cluster into a few clear categories. This analysis maps the competitive landscape and identifies where MCP Media Forge fits.

---

## Direct Competitors

### 1. Diagram Bridge MCP (tohachan)

**What it is:** A "bridge" MCP server that delegates rendering to [Kroki.io](https://kroki.io) (remote API).

| Aspect | Diagram Bridge | MCP Media Forge |
|--------|---------------|-----------------|
| Formats | Mermaid, PlantUML, C4, D2, GraphViz, BPMN, Structurizr, Excalidraw, Vega-Lite | Mermaid, D2, GraphViz, Vega-Lite |
| Rendering | Remote (Kroki.io API) | Local (Docker container) |
| Network required | Yes (sends diagram source to Kroki) | No (`network_mode: none`) |
| Output | Returns rendered images | Returns file paths for markdown embedding |
| Caching | LRU in-memory cache | Content-hash file cache (persistent, git-friendly) |
| Language | TypeScript | TypeScript |
| Unique features | Format selection tool, instruction generation tool | Structured error responses, deterministic naming |

**Key difference:** Diagram Bridge sends your diagram source code to an external API. MCP Media Forge renders everything locally in a sandboxed container with no network access. This matters for proprietary code, air-gapped environments, and privacy.

---

### 2. UML-MCP (antoinebou12)

**What it is:** A Python MCP server supporting 15+ diagram types via Kroki.io with PlantUML fallback.

| Aspect | UML-MCP | MCP Media Forge |
|--------|---------|-----------------|
| Language | Python | TypeScript (Node.js) |
| Diagram types | 15+ (UML class/seq/activity, Mermaid, D2, Graphviz, TikZ, ERD, BPMN, C4...) | 4 tools (Mermaid, D2, Graphviz, Vega-Lite) |
| Rendering | Remote (Kroki.io + PlantUML server fallback) | Local Docker |
| Output | SVG/PNG/PDF/JPEG, some base64 | SVG/PNG file paths, never base64 |
| Privacy | Sends source to remote APIs | Fully local, no network |
| Error handling | Basic | Structured (error_type, suggestion, line number) |
| Testing | Unknown | 37 tests (11 unit + 26 integration) |

**Key difference:** UML-MCP has broader format coverage but depends on remote services. MCP Media Forge is narrower but fully self-contained and designed specifically for LLM self-correction loops.

---

### 3. AntV MCP Server Chart (antvis)

**What it is:** Official AntV visualization MCP server. 3.1k GitHub stars. Focused on **data charts** (not architecture diagrams).

| Aspect | AntV Chart | MCP Media Forge |
|--------|-----------|-----------------|
| Stars | 3.1k | New |
| Focus | Data visualization (26+ chart types) | Diagrams + Charts |
| Chart types | Area, bar, box, column, dual-axes, heatmap, radar, flow, fishbone... | Bar, line, scatter, area, heatmap (via Vega-Lite) |
| Diagram support | Flow/fishbone only | Mermaid, D2, Graphviz (full diagram DSLs) |
| Rendering | Browser-based (AntV G2/G6) | Docker container |
| Output | Interactive HTML charts | Static SVG/PNG files |
| Embedding | Requires viewer | Direct markdown `![](path)` |

**Key difference:** AntV is chart-first with beautiful interactive visualizations. MCP Media Forge is documentation-first — static SVG/PNG assets that embed directly in markdown and diff cleanly in git.

---

### 4. Mermaid-Only MCP Servers

There are **at least 6** Mermaid-only MCP servers:

| Server | Approach |
|--------|----------|
| [reblabers/mermaid-diagram-generator](https://www.pulsemcp.com/servers/reblabers-mermaid-diagram-generator) | Mermaid rendering to images |
| [peng-shawn/mermaid-mcp-server](https://github.com/peng-shawn/mermaid-mcp-server) | Mermaid to PNG conversion |
| [hustcc/mcp-mermaid](https://github.com/hustcc/mcp-mermaid) | Mermaid diagram + chart generation |
| [codingthefuturewithai/mcp_mermaid_image_gen](https://github.com/codingthefuturewithai/mcp_mermaid_image_gen) | Multi-format (SVG/PNG/PDF) |
| [veelenga/claude-mermaid](https://github.com/veelenga/claude-mermaid) | Live preview with hot reload |
| [narasimhaponnada/mermaid-mcp](https://mcpservers.org/servers/narasimhaponnada/mermaid-mcp.git) | Basic Mermaid rendering |

**Key difference:** These are single-tool servers. MCP Media Forge combines Mermaid with D2, Graphviz, and Vega-Lite in one server, letting the LLM pick the best tool for the job.

---

### 5. ToDiagram MCP

**What it is:** Commercial SaaS with MCP integration. Creates interactive, editable diagrams.

| Aspect | ToDiagram | MCP Media Forge |
|--------|-----------|-----------------|
| Pricing | Free tier + Pro (paid, required for API keys) | Free / MIT |
| Output | Interactive web diagrams | Static SVG/PNG files |
| Data input | JSON, YAML, XML, CSV | Diagram DSLs (Mermaid, D2, DOT, Vega-Lite JSON) |
| Offline | No (cloud service) | Yes (local Docker) |
| Editing | Visual editor in browser | Text-based (agent re-renders) |

**Key difference:** ToDiagram is a SaaS product for interactive diagrams. MCP Media Forge produces static assets for documentation that live in your git repo.

---

### 6. AWS Diagram MCP Server (awslabs)

**What it is:** Official AWS tool for generating architecture diagrams using Python `diagrams` package.

| Aspect | AWS Diagram | MCP Media Forge |
|--------|------------|-----------------|
| Scope | AWS/cloud architecture only | General-purpose |
| DSL | Python (diagrams package) | Text DSLs (Mermaid, D2, DOT, JSON) |
| Icons | AWS/GCP/Azure/K8s icon sets | D2 icons, Mermaid shapes |
| Output | PNG diagrams | SVG/PNG |

**Key difference:** AWS Diagram is domain-specific (cloud architecture). MCP Media Forge is general-purpose.

---

### 7. Kroki (not MCP, but the underlying engine)

[Kroki.io](https://kroki.io) is the open-source diagram rendering API that many MCP servers delegate to.

| Aspect | Kroki | MCP Media Forge |
|--------|-------|-----------------|
| Type | REST API / self-hosted server | MCP server |
| Formats | 25+ diagram types | 4 (Mermaid, D2, Graphviz, Vega-Lite) |
| Deployment | Docker container or hosted API | Docker container |
| MCP native | No (needs wrapper) | Yes |
| Caching | None built-in | Content-hash file cache |
| Error handling | HTTP status codes | Structured LLM-friendly errors |

**Key difference:** Kroki is an API, not an MCP server. Several MCP servers wrap Kroki. MCP Media Forge runs each tool directly (no intermediary API) and adds LLM-specific features.

---

## Competitive Matrix

| Feature | Media Forge | Diagram Bridge | UML-MCP | AntV Chart | Mermaid-only |
|---------|:-----------:|:--------------:|:-------:|:----------:|:------------:|
| Mermaid | x | x | x | - | x |
| D2 | x | x | x | - | - |
| Graphviz | x | x | x | - | - |
| Vega-Lite charts | x | x | - | x (AntV) | - |
| PlantUML | - | x | x | - | - |
| Local rendering | x | - | - | x | varies |
| No network required | x | - | - | - | varies |
| File path output | x | - | - | - | varies |
| Content-hash cache | x | - | - | - | - |
| Structured errors | x | x | - | - | - |
| LLM self-correction | x | partial | - | - | - |
| Git-friendly output | x | - | - | - | - |
| MIT license | x | x | x | MIT | varies |
| Integration tests | 26 | unknown | unknown | unknown | unknown |

---

## Unique Positioning

MCP Media Forge occupies a specific niche that no existing tool covers fully:

### What makes it different

1. **Local-only, zero-network rendering** — The container runs with `network_mode: none`. No diagram source leaves the machine. This is unique among multi-format MCP servers (Diagram Bridge and UML-MCP both use Kroki.io).

2. **Documentation-first output model** — Returns relative file paths and embed markdown, not base64 blobs or interactive widgets. Output is designed to be committed to git and embedded in markdown files.

3. **Content-hash deterministic naming** — `mermaid-a1b2c3d4.svg` — same input always produces the same filename. This means free caching, no duplicate files, and clean git diffs.

4. **Structured error responses for LLM loops** — Every error includes `error_type`, `error_message`, and `suggestion`. An LLM can read "syntax_error on line 3, check Mermaid syntax at..." and self-correct without human intervention.

5. **Multi-tool, right-tool selection** — Having Mermaid, D2, Graphviz, and Vega-Lite in one server lets the LLM pick the best tool: Mermaid for sequence diagrams, D2 for architecture, Graphviz for dependency graphs, Vega-Lite for data charts.

### What it doesn't do (and why)

- **No PlantUML** — D2 and Mermaid cover the same use cases with simpler syntax. Could be added later.
- **No interactive output** — By design. Static SVG/PNG assets are the goal for documentation.
- **No remote API** — By design. Privacy and offline operation are core features.
- **Fewer diagram types than Kroki** — Focused on the 4 most useful types for documentation. Quality over quantity.

---

## Market Gaps and Opportunities

### Gap 1: No one does "documentation pipeline" well
Most MCP diagram servers are point tools — render one diagram. None integrate with a documentation workflow (generate diagrams, embed in markdown, track in git, update on change).

**Opportunity:** Add a `update_docs` tool that scans markdown files for diagram code blocks and re-renders them.

### Gap 2: No diagram diffing
When a diagram changes, there's no way to see what changed visually.

**Opportunity:** Generate both SVG and a text description of changes for PR reviews.

### Gap 3: Animation and video are unserved
No MCP server handles Manim animations, terminal recordings, or video assembly.

**Opportunity:** Phase 2 tools (render_slides, render_animation, terminal_to_gif) would be unique in the market.

### Gap 4: Presentation generation
Marp (markdown-to-slides) has no MCP server.

**Opportunity:** `render_slides` would be the first MCP server for presentation generation.

---

## Summary

The MCP diagram space is crowded but shallow. Most servers are thin wrappers around Mermaid or Kroki.io. MCP Media Forge differentiates on:

- **Privacy**: local-only rendering, no data leaves the machine
- **Git integration**: deterministic filenames, file path output, SVG-first
- **LLM ergonomics**: structured errors, multi-tool selection, embed-ready output
- **Quality**: 37 tests, proper error handling, Docker sandboxing

The closest competitor is **Diagram Bridge MCP** which has broader format coverage but requires network access to Kroki.io. For teams that care about privacy, offline operation, or deterministic documentation builds, MCP Media Forge is the only option.

---

## Sources

- [Kroki.io — unified diagram API](https://kroki.io/)
- [AntV MCP Server Chart (3.1k stars)](https://github.com/antvis/mcp-server-chart)
- [Diagram Bridge MCP](https://github.com/tohachan/diagram-bridge-mcp)
- [UML-MCP](https://github.com/antoinebou12/uml-mcp)
- [ToDiagram MCP](https://todiagram.com/mcp)
- [AWS Diagram MCP Server](https://awslabs.github.io/mcp/servers/aws-diagram-mcp-server)
- [Mermaid MCP servers on PulseMCP](https://www.pulsemcp.com/servers/reblabers-mermaid-diagram-generator)
- [peng-shawn/mermaid-mcp-server](https://github.com/peng-shawn/mermaid-mcp-server)
- [hustcc/mcp-mermaid](https://github.com/hustcc/mcp-mermaid)
- [codingthefuturewithai/mcp_mermaid_image_gen](https://github.com/codingthefuturewithai/mcp_mermaid_image_gen)
- [veelenga/claude-mermaid](https://github.com/veelenga/claude-mermaid)
- [Draw.io MCP Server](https://github.com/lgazo/drawio-mcp-server)
- [Diagrams as Code blog post](https://simmering.dev/blog/diagrams/)
- [MCP Architecture overview](https://modelcontextprotocol.io/docs/learn/architecture)
