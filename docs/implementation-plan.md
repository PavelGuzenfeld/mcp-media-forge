# Implementation Plan: MCP Media Forge

*Last updated: 2026-02-18*

Phased build plan — start with highest-ROI tools, validate the architecture, then expand.

> **Cross-references**: Tool interfaces and `MediaToolResult` schema are defined in [architecture.md](architecture.md#3-tool-interface-design). Test cases per tool are in [verification-plan.md](verification-plan.md#3-component-tests-individual-tools). Agent build instructions are in [agents.md](agents.md). Tool evaluation is in [research-tools-apis.md](research-tools-apis.md).

---

## Phase 0: Scaffold (Week 1)

### Goals
- Repository structure, build system, CI
- MCP server skeleton with one working tool
- Docker container with first rendering tools

### Tasks

- [ ] Initialize TypeScript project with MCP SDK (`@modelcontextprotocol/sdk`)
- [ ] Define common response schema (`MediaToolResult`)
- [ ] Implement file-path output convention (`docs/generated/{tool}-{hash}.{ext}`)
- [ ] Implement input-hash caching layer
- [ ] Create Dockerfile with base rendering tools (mmdc, d2, dot)
- [ ] Implement `render_mermaid` as first tool (validates full pipeline)
- [ ] Write integration test: Mermaid code → SVG file on disk
- [ ] Configure CI (GitHub Actions): lint, test, build Docker image

### Tech Stack Decision

```
Language:     TypeScript (Node.js)
MCP SDK:      @modelcontextprotocol/sdk
Build:        tsup (bundle to single file)
Testing:      vitest
Container:    Docker (multi-stage: build + runtime)
Distribution: npm + Docker Hub
```

**Rationale**: TypeScript aligns with the MCP ecosystem. Most existing MCP servers are TypeScript. The server shells out to CLI tools — language choice doesn't affect rendering quality.

### Directory Structure

```
mcp-media-forge/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/
│   │   ├── mermaid.ts        # render_mermaid
│   │   ├── d2.ts             # render_d2
│   │   ├── graphviz.ts       # render_graphviz
│   │   ├── marp.ts           # render_slides
│   │   ├── vegalite.ts       # render_chart
│   │   ├── manim.ts          # render_animation
│   │   ├── ffmpeg.ts         # video assembly
│   │   └── terminal.ts       # terminal_to_gif
│   ├── core/
│   │   ├── cache.ts          # input-hash caching
│   │   ├── output.ts         # file path management
│   │   ├── docker.ts         # container exec helpers
│   │   └── types.ts          # shared types
│   └── utils/
│       └── hash.ts           # SHA-256 helpers
├── docker/
│   ├── Dockerfile            # rendering container
│   └── docker-compose.yml
├── tests/
│   ├── mermaid.test.ts
│   ├── d2.test.ts
│   └── ...
├── docs/                     # project documentation (this folder)
├── examples/                 # example inputs and outputs
├── package.json
├── tsconfig.json
└── README.md
```

---

## Phase 1: Core Diagram Tools (Weeks 2-3)

### Goals
- All P0 diagram tools working
- P1 presentation and chart tools working
- Full test coverage

### Tasks

- [ ] Implement `render_d2` — D2 text to SVG/PNG
  - Install D2 binary in Docker image
  - Support theme selection (default, neutral-default, terminal, etc.)
  - Support layout engine selection (dagre, elk, tala)
- [ ] Implement `render_graphviz` — DOT to SVG/PNG (P1)
  - Support all 6 engine selections (dot, neato, fdp, sfdp, twopi, circo)
- [ ] Implement `render_slides` — Marp markdown to PNG/PDF
  - Install Marp CLI + Chromium in Docker image
  - Export individual slide PNGs for embedding
  - Export full PDF for download link
  - Generate `embed_markdown` with cover image linking to PDF
- [ ] Implement `render_chart` — Vega-Lite JSON to SVG/PNG
  - Use vl-convert (Rust binary or Python package) in container
  - Validate JSON against Vega-Lite schema before rendering
  - Return structured error on invalid spec
- [ ] Implement `list_assets` utility tool
- [ ] Write integration tests for all tools
- [ ] Test with Claude Desktop and VS Code as MCP clients

### Acceptance Criteria

Each tool must:
1. Accept text input, produce a file on disk
2. Return `MediaToolResult` with `embed_markdown` ready to paste
3. Cache results (same input = instant return)
4. Return structured errors on invalid input
5. Work inside Docker container

---

## Phase 2: Animation & Video (Weeks 4-6)

### Goals
- Manim animations working
- Terminal-to-GIF pipeline working
- FFmpeg video assembly working
- Async job-ticket pattern for long-running operations

### Tasks

- [ ] Implement async job system
  - Job queue with status tracking
  - `check_job(job_id)` tool
  - Timeout handling (configurable per tool)
- [ ] Implement `render_animation` — Manim scene to GIF/MP4
  - Install Manim CE + dependencies in Docker image (cairo, LaTeX, ffmpeg)
  - LLM provides Python scene code
  - Server writes scene to temp file, runs `manim render`
  - Security: run in container with no network, resource limits
  - Default to GIF output (universally embeddable)
- [ ] Implement `terminal_to_gif`
  - Option A: accept list of commands, run in container, record with asciinema, convert with agg
  - Option B: accept `.cast` file path, convert with agg
  - Configure theme, dimensions, idle time limit
- [ ] Implement `images_to_gif` — image sequence to animated GIF
  - Accept array of image paths + fps + dimensions
  - Use FFmpeg: `ffmpeg -framerate N -i ... -vf "scale=W:-1" output.gif`
- [ ] Implement `assemble_video` — timeline JSON to MP4
  - Accept high-level timeline spec (clips, durations, transitions)
  - Translate to FFmpeg filter_complex
  - Async execution via job system
- [ ] Write integration tests for all async tools
- [ ] Test full workflow: generate diagrams → assemble into video

### Timeline JSON Schema

```typescript
interface TimelineSpec {
  output_format: "mp4" | "gif" | "webm";
  resolution?: { width: number; height: number };  // default 1920x1080
  clips: Array<{
    type: "image" | "video" | "color";
    source: string;           // file path or hex color
    duration?: number;        // seconds (for images/colors)
    start?: number;           // trim start (for videos)
    end?: number;             // trim end (for videos)
    audio?: string;           // audio file path
    transition?: "fade" | "cut";
    text_overlay?: {
      text: string;
      position: "top" | "center" | "bottom";
      font_size?: number;
    };
  }>;
}
```

---

## Phase 3: Polish & Distribution (Weeks 7-8)

### Goals
- npm package published
- Docker image on Docker Hub / GHCR
- Documentation complete
- CI/CD integration example

### Tasks

- [ ] Implement `clean_assets` — remove unreferenced generated files
  - Scan all .md files for references to `docs/generated/`
  - Delete files not referenced by any document
  - `dry_run` mode by default
- [ ] Build npm distribution
  - `npx mcp-media-forge` starts the server
  - Auto-pulls Docker image on first run if not present
  - Configuration via `media-forge.config.json` or CLI flags
- [ ] Build Docker image
  - Multi-stage: builder (compile tools) → runtime (minimal)
  - Push to GHCR and Docker Hub
- [ ] Write Claude Desktop configuration example
  ```json
  {
    "mcpServers": {
      "media-forge": {
        "command": "npx",
        "args": ["mcp-media-forge", "--project-root", "/path/to/project"]
      }
    }
  }
  ```
- [ ] Write VS Code MCP configuration example
- [ ] Create `examples/` directory with sample inputs and outputs
- [ ] Write CI/CD integration guide (GitHub Actions)
- [ ] Write CONTRIBUTING.md

---

## Phase 4: Extensions (Future)

### P3 Tools (build on demand)
- [ ] SVG template engine for infographics
- [ ] Excalidraw JSON renderer (or integrate existing MCP server)
- [ ] Ideogram API integration (AI-powered infographics)

### Advanced Features
- [ ] `regenerate` CLI command — scan docs for stale assets, re-render
- [ ] Manifest file (`docs/generated/manifest.json`) mapping logical names to hashed files
- [ ] Watch mode — re-render on source file changes
- [ ] MCP Resource subscriptions for job progress
- [ ] Cost estimation tool for paid API integrations

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Docker image size (Manim + Chrome + LaTeX) | Multi-stage build; separate "full" and "lite" images |
| Marp requires headless Chrome | Use `--no-sandbox` in container; pre-installed Chromium |
| Manim rendering is slow (30-60s) | Async job system; low-quality default; cache aggressively |
| FFmpeg filtergraph complexity | Build filtergraphs programmatically; test extensively |
| LLM generates invalid Mermaid/D2 | Structured error messages enable self-correction loop |
| Large GIFs (>5MB) | Auto-optimize: reduce fps, scale down, limit duration |
| Security: arbitrary code execution (Manim) | Container sandbox, no network, resource limits, timeout |

---

## Success Metrics

1. **Functional**: All P0 and P1 tools pass integration tests
2. **Performance**: Diagram rendering <2s, slide generation <5s
3. **Usability**: Agent can generate and embed a diagram in one tool call
4. **Portability**: Generated markdown renders correctly on GitHub, GitLab, MkDocs
5. **Reliability**: Structured errors enable LLM self-correction >80% of the time
