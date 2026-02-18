# Research: MCP Servers for Visual Content Generation

*Last updated: 2026-02-18*

## Overview

This document catalogs existing MCP servers that produce visual content — presentations, diagrams, charts, infographics, and video. The goal is to identify what already exists (and can be reused) versus what needs to be built.

---

## 1. Presentation Generation

### PowerPoint (PPTX)

| Project | URL | Notes |
|---|---|---|
| **Office-PowerPoint-MCP-Server** | [GongRzhe/Office-PowerPoint-MCP-Server](https://github.com/GongRzhe/Office-PowerPoint-MCP-Server) | python-pptx, 34 tools, 25+ templates. Most feature-complete |
| **PPT-MCP** | [guangxiangdebizi/PPT-MCP](https://github.com/guangxiangdebizi/PPT-MCP) | Node.js/TypeScript using PptxGenJS |
| **powerpoint-mcp** | [Ichigo3766/powerpoint-mcp](https://github.com/Ichigo3766/powerpoint-mcp) | Works with existing .pptx files |
| **pptx-generator-mcp** | [dmytro-ustynov/pptx-generator-mcp](https://github.com/dmytro-ustynov/pptx-generator-mcp) | PPTX from Markdown |
| **SlideSpeak MCP** | [slidespeak.co](https://slidespeak.co/blog/2025/04/02/introducing-slidespeak-mcp-for-presentations) | Commercial |
| **Plus AI MCP** | [plusai.com/features/mcp](https://plusai.com/features/mcp) | Commercial, custom templates |

### Marp (Markdown Presentations)

| Project | URL | Notes |
|---|---|---|
| **Marp MCP Server** | [masaki39/marp-mcp](https://glama.ai/mcp/servers/@masaki39/marp-mcp) | Academic-themed. PDF, HTML, PPTX export |

### Slidev (Vue-based)

| Project | URL | Notes |
|---|---|---|
| **slidev-mcp** | [LSTM-Kirigaya/slidev-mcp](https://github.com/LSTM-Kirigaya/slidev-mcp) | Auto-generates Slidev presentations |
| **slidev-builder-mcp** | [adolfosalasgomez3011/slidev-builder-mcp](https://github.com/adolfosalasgomez3011/slidev-builder-mcp) | Multi-format export, live preview |

### Reveal.js (HTML)

| Project | URL | Notes |
|---|---|---|
| **mdslides-mcp-server** | [bsmnyk/mdslides-mcp-server](https://github.com/bsmnyk/mdslides-mcp-server) | Markdown to Reveal.js slides, Docker available |
| **Majin Slide MCP** | [npm: @taiyokimura/majin-slide-mcp](https://www.npmjs.com/package/@taiyokimura/majin-slide-mcp) | Reveal.js-compatible Markdown |

### Google Slides

| Project | URL | Notes |
|---|---|---|
| **google-slides-mcp** | [matteoantoci/google-slides-mcp](https://github.com/matteoantoci/google-slides-mcp) | Create, read, modify via Slides API |
| **Zapier Google Slides MCP** | [zapier.com/mcp/google-slides](https://zapier.com/mcp/google-slides) | Commercial, Zapier integration |

### Assessment

Presentations are the **most mature** MCP category. GongRzhe's PowerPoint server is production-quality. Marp has a working server but it's academic-focused. For our use case (embedding in .md), Marp is the right choice since it produces images and PDFs from Markdown input.

---

## 2. Diagram and Chart Generation

### Mermaid

| Project | URL | Notes |
|---|---|---|
| **mcp-mermaid** | [hustcc/mcp-mermaid](https://github.com/hustcc/mcp-mermaid) | Full syntax, themes, SVG/PNG/base64 export |
| **mermaid-mcp-server** | [peng-shawn/mermaid-mcp-server](https://github.com/peng-shawn/mermaid-mcp-server) | PNG/SVG conversion |
| **@narasimhaponnada/mermaid-mcp-server** | [npm](https://www.npmjs.com/package/@narasimhaponnada/mermaid-mcp-server) | 22+ diagram types, 50+ templates, ELK/Dagre layout |
| **claude-mermaid** | [veelenga/claude-mermaid](https://github.com/veelenga/claude-mermaid) | Preview Mermaid in Claude |

### Multi-Format (PlantUML, Mermaid, D2, Kroki)

| Project | URL | Notes |
|---|---|---|
| **UML-MCP** | [antoinebou12/uml-mcp](https://github.com/antoinebou12/uml-mcp) | PlantUML + Mermaid + Kroki, intelligent fallback |
| **Diagram Bridge MCP** | [tohachan/diagram-bridge-mcp](https://glama.ai/mcp/servers/@tohachan/diagram-bridge-mcp) | 9+ formats including C4 Model, GraphViz |

### Excalidraw (Hand-drawn Style)

| Project | URL | Notes |
|---|---|---|
| **excalidraw-mcp (Official)** | [excalidraw/excalidraw-mcp](https://github.com/excalidraw/excalidraw-mcp) | First-party, interactive canvas |
| **mcp_excalidraw** | [yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw) | Live canvas, iterative refinement |
| **excalidraw-mcp-server** | [debu-sinha/excalidraw-mcp-server](https://github.com/debu-sinha/excalidraw-mcp-server) | Security-hardened, 14 tools |

### tldraw (Infinite Canvas)

| Project | URL | Notes |
|---|---|---|
| **tldraw-mcp** | [talhaorak/tldraw-mcp](https://github.com/talhaorak/tldraw-mcp) | Manages .tldr canvas files |
| **tldraw-mcp** | [shahidhustles/tldraw-mcp](https://github.com/shahidhustles/tldraw-mcp) | Natural language diagram creation |

### Charts and Data Visualization

| Project | URL | Notes |
|---|---|---|
| **mcp-server-chart (AntV)** | [antvis/mcp-server-chart](https://github.com/antvis/mcp-server-chart) | 25+ chart types, TypeScript |
| **mcp-echarts** | [hustcc/mcp-echarts](https://github.com/hustcc/mcp-echarts) | Apache ECharts, SVG/PNG |
| **Quickchart-MCP-Server** | [GongRzhe/Quickchart-MCP-Server](https://github.com/GongRzhe/Quickchart-MCP-Server) | QuickChart.io API |

### SVG Generation

| Project | URL | Notes |
|---|---|---|
| **svgmaker-mcp** | [GenWaveLLC/svgmaker-mcp](https://github.com/GenWaveLLC/svgmaker-mcp) | AI-powered SVG from text, image-to-SVG |

### Infographics

| Project | URL | Notes |
|---|---|---|
| **infographic_mcp** | [LobeHub listing](https://lobehub.com/mcp/bekanesp-infographic_mcp) | Gemini + KIE.AI, requires paid API keys |

### Assessment

Mermaid has **best coverage** with 4+ competing servers. The official Excalidraw MCP is notable as first-party. Charts are well-served by AntV and ECharts servers. **Major gaps**: no dedicated D2 server, no Graphviz server, infographic generation is nearly nonexistent.

---

## 3. Video Generation

### AI Video

| Project | URL | Notes |
|---|---|---|
| **sora-mcp** | [Doriandarko/sora-mcp](https://github.com/Doriandarko/sora-mcp) | OpenAI Sora 2, text-to-video |
| **mcp-veo2** | [mario-andreschak/mcp-veo2](https://github.com/mario-andreschak/mcp-veo2) | Google Veo2, text/image-to-video |
| **kie-ai-mcp-server** | [felores/kie-ai-mcp-server](https://github.com/felores/kie-ai-mcp-server) | Multi-model hub: Veo3, Runway, Suno, ElevenLabs |

### Video/Audio Editing

| Project | URL | Notes |
|---|---|---|
| **video-audio-mcp** | [misbahsy/video-audio-mcp](https://github.com/misbahsy/video-audio-mcp) | FFmpeg-powered editing |

### Screen Capture

| Project | URL | Notes |
|---|---|---|
| **Peekaboo** | [steipete/Peekaboo](https://github.com/steipete/Peekaboo) | macOS screenshots + VQA |
| **screenshot_mcp_server** | [codingthefuturewithai/screenshot_mcp_server](https://github.com/codingthefuturewithai/screenshot_mcp_server) | Screenshot capture |
| **markupr** | [eddiesanjuan/markupr](https://github.com/eddiesanjuan/markupr) | Screen + voice to Markdown |

### Assessment

**Least mature category.** AI video servers are thin API wrappers to expensive cloud services — unsuitable for technical documentation. The FFmpeg wrapper is practical but not generative. **Notable gaps**: no Manim MCP server, no terminal-to-GIF pipeline, no slide-to-video assembly, no animated GIF from diagram sequences.

---

## 4. Image Generation (Adjacent)

| Project | URL | Notes |
|---|---|---|
| **image-gen-mcp-server** | [merlinrabens/image-gen-mcp-server](https://github.com/merlinrabens/image-gen-mcp-server) | Multi-provider: Gemini, DALL-E, Stability AI |
| **mcp-image-gen** | [sarthakkimtani/mcp-image-gen](https://github.com/sarthakkimtani/mcp-image-gen) | Together AI |
| **fal-mcp-server** | (awesome-mcp-servers) | Fal.ai models (FLUX, SD, MusicGen) |

---

## 5. Registries and Discovery

| Resource | URL |
|---|---|
| **Official MCP Registry** | [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/) |
| **Official MCP Servers Repo** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) |
| **awesome-mcp-servers (punkpeye)** | [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) |
| **awesome-mcp-servers (wong2)** | [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) |
| **mcpservers.org** | [mcpservers.org](https://mcpservers.org/) |
| **Glama MCP Directory** | [glama.ai/mcp/servers](https://glama.ai/mcp/servers) |
| **PulseMCP** | [pulsemcp.com](https://www.pulsemcp.com/) |

---

## 6. Gap Analysis Summary

### Well Covered (reuse existing servers)
- PowerPoint generation
- Mermaid diagrams
- Excalidraw (hand-drawn)
- Charts (AntV, ECharts)

### Thin Coverage (servers exist but limited)
- Reveal.js / Slidev slides
- Google Slides integration
- D2 diagrams (only via Kroki passthrough)
- PlantUML (only via multi-format servers)

### Missing Entirely (must build)
- **D2 dedicated MCP server** — superior diagram quality to Mermaid
- **Manim animation server** — no MCP server exists
- **Terminal-to-GIF pipeline** — asciinema + agg, no MCP server
- **Slide-to-video assembly** — slides + narration to MP4
- **Graphviz/DOT dedicated server**
- **Infographic layout engine** — only one exists, depends on paid APIs
- **Template-aware presentation server** — brand-aware slide generation
