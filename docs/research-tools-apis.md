# Research: Tools and APIs for MCP Media Generation

*Last updated: 2026-02-18*

Evaluation of rendering tools and APIs that could be wrapped as MCP services, focusing on suitability for embedding into Markdown technical documentation.

> **Cross-references**: Existing MCP servers are cataloged in [research-mcp-landscape.md](research-mcp-landscape.md). Embedding patterns for each output format are in [research-markdown-embedding.md](research-markdown-embedding.md). The final tool selection is in [architecture.md](architecture.md#32-tool-catalog).

---

## 1. Presentation Generators

### Marp — Recommended

- **API**: Excellent. `@marp-team/marp-core` (Node.js library), `@marp-team/marp-cli` (CLI)
- **License**: MIT
- **Output**: HTML, PDF, PNG, PPTX
- **Quality**: Clean, professional. Custom themes via CSS. Limited animation.
- **Embeddability**: PNG per slide embeds directly in Markdown. PDF for download links.
- **MCP fit**: **Excellent**. Stateless (Markdown in, image/HTML out). Lightweight. No external services.
- **Tool design**: `render_slides(markdown, theme, format)` — see [architecture.md](architecture.md#32-tool-catalog)

### Reveal.js

- **API**: Moderate. Front-end framework. Needs Puppeteer for static image export.
- **License**: MIT
- **Output**: HTML (native), PNG/PDF (via headless browser)
- **Quality**: High, animated, interactive. Rich plugin ecosystem.
- **Embeddability**: HTML requires hosting. Image capture needs extra tooling.
- **MCP fit**: Moderate. Browser dependency for static output. Better as hosted artifact.

### Slidev

- **API**: Moderate. Vue-based. CLI export needs Vite + Playwright. Heavy.
- **License**: MIT
- **Output**: HTML SPA, PDF, PNG
- **Quality**: Very high for developer audiences. Built-in Mermaid/LaTeX.
- **MCP fit**: **Low**. Heavy runtime, slow startup. Not suitable for automated generation.

### python-pptx

- **API**: Excellent. Pure Python, full programmatic control over PPTX.
- **License**: MIT
- **Output**: PPTX (needs LibreOffice for PDF/PNG conversion)
- **Quality**: Depends on code quality. No built-in themes.
- **MCP fit**: Moderate. PPTX not directly embeddable. Conversion pipeline adds complexity.

---

## 2. Diagram / Infographic Tools

### Mermaid — Recommended (P0)

- **API**: Excellent. `mmdc` CLI renders text to SVG/PNG/PDF.
- **License**: MIT
- **Output**: SVG (native), PNG, PDF
- **Quality**: Good for flowcharts, sequence, Gantt, ER, git graphs, pie charts.
- **Embeddability**: **Excellent**. GitHub/GitLab render Mermaid fenced blocks natively.
- **MCP fit**: **Excellent**. Simple text-in, image-out. Stateless. Existing servers available.

### D2 — Recommended (P0)

- **API**: Excellent. Single Go binary. D2 text files to SVG/PNG. Zero dependencies.
- **License**: MPL-2.0
- **Output**: SVG (with optional animation), PNG, PDF
- **Quality**: **Very high**. Multiple layout engines (dagre, ELK, TALA). Custom themes, icons, markdown labels, code blocks in nodes, 3D shapes.
- **Embeddability**: SVG/PNG embed perfectly.
- **MCP fit**: **Excellent**. Single binary, fast, text-in image-out. Superior to Mermaid visually.

### Graphviz (DOT)

- **API**: Excellent. `dot` CLI. WASM version (viz.js) for Node.js.
- **License**: EPL-1.0
- **Output**: SVG, PNG, PDF, PS, many others
- **Quality**: Best automatic graph layout. Industry standard for decades.
- **Embeddability**: SVG/PNG embed perfectly.
- **MCP fit**: **Excellent**. Fast, lightweight native binary.
- **Tool design**: `render_graphviz(dot_source, engine, format)` where engine is dot/neato/fdp/sfdp/twopi/circo — see [architecture.md](architecture.md#32-tool-catalog)

### PlantUML

- **API**: Good. Java CLI jar. Also available as REST server with URL-based rendering.
- **License**: **GPL-2.0** (implications for bundling)
- **Output**: SVG, PNG, PDF, LaTeX, ASCII art
- **Quality**: Good for UML specifically. Output style is somewhat dated.
- **Embeddability**: SVG/PNG fine. Server mode allows URL-based embedding.
- **MCP fit**: Good. Server mode ideal. JVM startup time is a consideration.

### Excalidraw

- **API**: Moderate. Web-primary. `excalidraw-to-svg` exists but needs DOM (jsdom/headless browser).
- **License**: MIT
- **Output**: SVG, PNG, native JSON
- **Quality**: Distinctive hand-drawn aesthetic. Popular in tech docs.
- **Embeddability**: SVG/PNG embed well.
- **MCP fit**: Moderate. JSON format is complex. Better as renderer for pre-made diagrams.

### Vega-Lite — Recommended for data charts

- **API**: Excellent. JSON specs. `vl-convert` (Python/Rust) for server-side rendering.
- **License**: BSD-3-Clause
- **Output**: SVG, PNG, PDF
- **Quality**: Excellent for data visualization. Declarative JSON that LLMs generate well.
- **Embeddability**: SVG/PNG embed perfectly.
- **MCP fit**: **Good for data charts**. Not a general-purpose diagram tool. Cannot do flowcharts, architecture diagrams, or sequence diagrams.
- **Tool design**: `render_chart(spec_json, format, scale)` — see [architecture.md](architecture.md#32-tool-catalog)

### ECharts

- **API**: Good. JavaScript library. Server-side rendering via `echarts` + `canvas` (node-canvas).
- **License**: Apache-2.0
- **Output**: SVG, PNG (via canvas)
- **Quality**: Very high, 25+ chart types, rich interactivity (lost in static export).
- **MCP fit**: Good. Broader chart type coverage than Vega-Lite. Existing MCP server available.

---

## 3. Video / Animation Tools

### Manim (Community Edition) — Recommended

- **API**: Good. Python library. Scenes as Python classes. CLI: `manim render`.
- **License**: MIT
- **Output**: MP4, GIF, PNG (last frame), WebM
- **Quality**: **Exceptional** for math/technical animations. Smooth vector animations, LaTeX, 3D.
- **Embeddability**: GIF inline in Markdown. MP4 for links/hosting.
- **MCP fit**: **Good**. LLMs generate Manim scene code reliably. CPU-intensive rendering. Docker recommended.
- **Tool design**: `render_animation(scene_code, quality, format)` returns GIF/MP4 — see [architecture.md](architecture.md#32-tool-catalog)

### FFmpeg

- **API**: Excellent. Universal CLI. Wrappers in every language.
- **License**: LGPL-2.1 / GPL-2.0 (codec-dependent)
- **Output**: Any video/audio/image format
- **Quality**: Lossless processing. Output depends on input.
- **MCP fit**: **Good as backend**. Not generative itself. Essential for format conversion, GIF creation, video composition.
- **Tool design**: `images_to_gif(image_paths, fps, width)`, `assemble_video(timeline)` — see [architecture.md](architecture.md#32-tool-catalog)

### Asciinema + agg

- **API**: Good. `asciinema rec` captures terminal. `agg` converts `.cast` to GIF.
- **License**: GPL-3.0 (asciinema), Apache-2.0 (agg)
- **Output**: `.cast` (text-based recording), GIF, SVG
- **Quality**: Perfect terminal reproduction. Text-based source format.
- **Embeddability**: GIF universal. SVG preview links to interactive player.
- **MCP fit**: **Excellent**. Lightweight pipeline. Tiny output files.
- **Tool design**: `terminal_to_gif(commands, shell)` or `cast_to_gif(cast_file_path, theme)` — see [architecture.md](architecture.md#32-tool-catalog)

### Remotion (React Videos)

- **API**: Excellent. Videos as React components. `@remotion/renderer` for programmatic use.
- **License**: BSL (free < $10M revenue)
- **Output**: MP4, WebM, GIF, PNG stills, transparent video
- **Quality**: Excellent. Full web rendering (CSS, SVG, Canvas, WebGL).
- **MCP fit**: Good for template-based video. Heavy runtime (Node + Chromium). CPU/GPU intensive.

### Motion Canvas

- **API**: Moderate. TypeScript animation framework. Newer, less mature than Remotion.
- **License**: MIT
- **Output**: MP4, PNG sequences, GIF (via FFmpeg)
- **Quality**: High for technical/explainer animations.
- **MCP fit**: Moderate. Good API for LLM-generated code. Smaller ecosystem.

---

## 4. AI Image Generation (for illustrations)

### DALL-E API (OpenAI)

- **API**: Simple REST API. Text prompt in, image out.
- **License**: Commercial ($0.04-0.08/image for DALL-E 3)
- **Quality**: High for illustrations. Poor for precise technical diagrams.
- **MCP fit**: Good for conceptual illustrations. Not for technical precision.

### Ideogram

- **API**: REST API. **Best text rendering** in AI-generated images.
- **License**: Commercial (free tier + paid)
- **Quality**: Best-in-class for infographic-style content with readable text.
- **MCP fit**: Moderate-good for infographics specifically.

### Stable Diffusion (self-hosted)

- **API**: Python (diffusers), ComfyUI API, Automatic1111 API. Requires GPU.
- **License**: Open weights (various)
- **Quality**: Very good. ControlNet for structural guidance.
- **MCP fit**: Good self-hosted option. Avoids API costs if GPU available.

---

## 5. AI Video Generation (not recommended for tech docs)

| Service | API | Cost | Use Case | Recommendation |
|---|---|---|---|---|
| Synthesia | REST | $$$ per minute | Avatar talking-head | Skip — wrong aesthetic for tech docs |
| HeyGen | REST | $$ per minute | Avatar talking-head | Skip — same |
| D-ID | REST | $$ per credit | Animate photos | Skip — niche |
| Runway Gen-3/4 | REST | $$$ per second | Cinematic video | Skip — non-deterministic |
| Sora | REST | $$$ | Text-to-video | Skip — too generic |

**Rationale**: Technical documentation needs deterministic, reproducible output. Generative AI video is expensive, slow, non-deterministic, and produces the wrong aesthetic. Use Manim, FFmpeg, and asciinema instead.

---

## 6. Summary: Tool Selection Matrix

| Tool | Input | Output | Cost | Speed | Deterministic | Priority |
|---|---|---|---|---|---|---|
| Mermaid (mmdc) | Text DSL | SVG/PNG | Free | <1s | Yes | **P0** |
| D2 | Text DSL | SVG/PNG | Free | <1s | Yes | **P0** |
| Graphviz | DOT | SVG/PNG | Free | <1s | Yes | **P1** |
| Marp | Markdown | PNG/PDF | Free | <2s | Yes | **P1** |
| Vega-Lite | JSON | SVG/PNG | Free | <1s | Yes | **P1** |
| Manim | Python | GIF/MP4 | Free | 10-60s | Yes | **P2** |
| Asciinema+agg | Terminal/.cast | GIF | Free | <5s | Yes | **P2** |
| FFmpeg | CLI/timeline | MP4/GIF | Free | Varies | Yes | **P2** |
| Excalidraw | JSON | SVG/PNG | Free | <2s | Yes | **P3** |
| Ideogram | Text prompt | PNG | Paid | ~10s | No | **P3** |
