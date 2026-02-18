# Gemini Research: Architectural Analysis of Multimedia MCP Service

*Source: Gemini deep research, 2026-02-18*
*This document preserves the original Gemini analysis for reference. See [architecture.md](architecture.md) for the refined version incorporating practical review.*

---

## Executive Summary

The emergence of the Model Context Protocol (MCP) has fundamentally standardized the interface between Large Language Models (LLMs) and external systems, creating a unified substrate for "agentic" capabilities. While the initial wave of MCP server implementations focused on textual data retrieval -- querying databases, reading file systems, and searching the web -- the next evolutionary step lies in the generative synthesis of rich media.

This report responds to a specific architectural directive: the design and implementation of an MCP service capable of producing presentations, infographics, and videos specifically for embedding within .md (Markdown) technical documentation.

Technical documentation has historically suffered from a "synchronization gap" where code evolves rapidly while binary assets -- diagrams, slide decks, and explainer videos -- stagnate due to the high manual effort required to update them. By coupling LLM reasoning with programmatic media engines (such as FFmpeg, Marp, and Vega-Lite) through the MCP standard, we can achieve "Just-in-Time" multimedia documentation. In this paradigm, the assets are not static binaries but dynamic artifacts generated from textual descriptions stored alongside the code, updated automatically by agents whenever the underlying logic changes.

---

## 1. The MCP Landscape for Rich Media

### 1.1 The Binary Transport Constraint and JSON-RPC

At its core, MCP relies on JSON-RPC 2.0 for message exchange between the client (the AI host, such as Claude Desktop or an IDE) and the server (the tool provider). While efficient for structured data and text, JSON-RPC introduces significant friction when handling binary payloads like images or videos.

The primary limitation is the encoding overhead. To transmit a binary file (e.g., a PNG infographic or an MP4 video) within a JSON-RPC response, the data must be Base64 encoded. Base64 encoding increases the data size by approximately 33% compared to the raw binary. For a 10-second 1080p video clip (approx. 5-10 MB), the encoded payload would exceed 13 MB. Transmitting this through stdio -- the default transport for local MCP servers -- can saturate the buffer, cause high latency in the agent's reasoning loop, or trigger timeout errors in the host application.

Furthermore, large payloads in the context window (if the image data is returned directly to the model) can degrade the model's reasoning performance or exhaust token limits. Therefore, a **Reference-Based Architecture** is required. Instead of returning the content of the generated media in the tool result, the MCP server must return a reference to the content. This reference typically takes the form of a local file path (e.g., `file:///repo/assets/diagram.png`) or a custom URI scheme (e.g., `video://generated/demo.mp4`) that the host application can resolve and render separately from the LLM's context.

### 1.2 The "Tools vs. Resources" Dichotomy in Media Generation

A critical architectural decision for any MCP service is distinguishing between Tools and Resources. In the context of media generation, this distinction defines the workflow.

**Tools** are the active verbs of the protocol. They are model-controlled, meaning the LLM decides when to invoke them based on the user's intent. For this proposed service, the generation engines (e.g., `create_presentation`, `render_infographic`, `synthesize_video`) must be exposed as Tools.

**Resources**, conversely, are the passive nouns. They are application-controlled and represent data that can be read or subscribed to. Once a media asset is generated via a Tool, it should effectively become a Resource.

| Capability | MCP Primitive | Description | Implementation Strategy |
|---|---|---|---|
| Trigger Generation | Tool | The action of creating the asset | `CallTool("generate_video", {script: "..."})` |
| Preview Asset | Resource | Viewing the result | `ReadResource("video://.../preview.gif")` |
| Monitor Progress | Resource | Checking render status | `ReadResource("job://.../status")` with subscribe |
| Embed in Doc | Tool | Inserting the link into Markdown | `CallTool("update_readme", {path: "...", insertion: "..."})` |

### 1.3 URI Schemes and Custom Protocol Handlers

For a media service, we recommend defining schemes such as:
- `slide://{deck_id}/{slide_index}`: Points to a specific slide image
- `chart://{chart_id}/view`: Points to the rendered visualization
- `video://{video_id}/stream`: Points to the video file

However, since the ultimate goal is embedding into .md files which will be viewed in standard Markdown readers (GitHub, VS Code), these custom URIs must eventually resolve to standard `file://` paths or `https://` URLs. The MCP server acts as the bridge: it might internally identify an asset as `chart://cpu-usage`, but when the agent asks to embed it, the server writes the file to disk and provides the relative path `./assets/cpu-usage.png`.

---

## 2. Architectural Patterns for Media Generation Services

### 2.1 The Asynchronous "Job-Ticket" Pattern

Generating a 60-second video using FFmpeg or rendering a high-resolution 4K infographic can take significantly longer than the typical timeout thresholds of an LLM tool call (often 30-60 seconds).

The service should implement an Asynchronous Job-Ticket Pattern:

1. **Submission**: The agent calls the generation tool (e.g., `generate_video`)
2. **Immediate Acknowledgement**: The server starts rendering in a background process and immediately returns a `job_id`, `status: "processing"`, and an `estimated_completion_time`
3. **Polling/Notification**: The agent uses a `check_status` tool or subscribes to a resource `job://{job_id}` to receive updates
4. **Completion**: The resource updates to `status: "completed"` and provides the final file paths

### 2.2 Local vs. Remote Execution Models

**Local Execution (The "Sidecar" Model):**
- Pros: Zero latency for asset transfer; direct filesystem access; no cloud costs
- Cons: High local resource consumption; requires tool installation (FFmpeg, Chrome, etc.)

**Remote Execution (The "Cloud-Gateway" Model):**
- Pros: Access to GPU-powered generative models; offloads compute
- Cons: Latency; authentication complexity; cost

**Hybrid Recommendation:**
- Lightweight assets (Charts, Slides, Diagrams) → render locally
- Heavy assets (AI Avatars, High-fidelity Video) → offload to remote APIs

### 2.3 Asset-State Management

- **Temporary vs. Permanent**: Intermediates in `/tmp/mcp-media-forge/`, finals in `./docs/media/`
- **Versioning**: Content-hashing (e.g., `diagram-a1b2c3.png`) to prevent overwrites and optimize Git storage

---

## 3. The Presentation Engine: Presentations-as-Code

### 3.1 Marp: The Markdown Presentation Ecosystem

Marp allows users to write slides using standard Markdown with a delimiter (`---`) separating slides. It supports directives for theming, background images, and layout.

**Why Marp for MCP?**
- Text-Centric: LLMs excel at generating Markdown
- CLI-Driven: `@marp-team/marp-cli` converts Markdown into PDF, PPTX, or images
- Embeddable: Export first slide as PNG for README display

Implementation:
```bash
marp --input deck.md --output deck.pdf --allow-local-files
```

### 3.2 The "Preview-Embed" Pattern

Since Markdown documents are static, the MCP server must:
1. **Generate**: Create the full presentation (`presentation.pdf`)
2. **Snapshot**: Generate a high-quality image of the Title Slide (`presentation-cover.png`)
3. **Link**: Construct the Markdown to embed the image wrapped in a link to the PDF

```markdown
[![Presentation](./assets/presentation-cover.png)](./assets/presentation.pdf)
```

---

## 4. The Infographic & Visualization Engine

### 4.1 Declarative Visualization: Vega-Lite

Vega-Lite specifications are JSON objects. LLMs are highly optimized for generating valid JSON structures.

Advantages:
- JSON syntax aligns with LLM capabilities
- Server-side rendering via `vl-convert` (Python/Rust)
- Schema validation enables self-correcting loops

### 4.2 The "JsonCut" Layered Composition Model

For infographics that are not strictly charts, a schema-based approach to image composition:

```json
{
  "width": 1200,
  "height": 630,
  "layers": [
    { "type": "background", "color": "#1a1a2e" },
    { "type": "text", "content": "5 Steps to Deploy", "x": 600, "y": 50, "font_size": 36 },
    { "type": "icon", "name": "docker", "x": 100, "y": 150 },
    { "type": "chart_embed", "vega_spec": "..." }
  ]
}
```

The server uses Pillow (Python) or Sharp (Node.js) to render layers into a single PNG.

### 4.3 Diagramming as Code: Mermaid & GraphViz

- **Mermaid.js**: Supported natively by GitHub. MCP server wraps `mmdc` CLI.
- **GraphViz (DOT)**: Essential for complex dependency graphs. MCP server wraps `dot` CLI.

---

## 5. The Video Production Engine

### 5.1 Programmatic Video: The FFmpeg Automation Pipeline

The MCP Tool Workflow (`assemble_video`):

1. **Asset Generation**: Agent generates charts, code screenshots, voiceover audio
2. **Timeline Specification**: Agent constructs a JSON timeline
3. **Filtergraph Construction**: Server translates JSON into FFmpeg `filter_complex`
4. **Rendering**: FFmpeg executes the render

```json
{
  "output": "demo.mp4",
  "clips": [
    {"image": "intro.png", "duration": 3, "transition": "fade"},
    {"image": "code_snippet.png", "audio": "explanation.mp3"},
    {"video": "terminal_recording.mp4", "start": 0, "end": 10}
  ]
}
```

### 5.2 Generative Video: External APIs

- **HeyGen/Synthesia**: Talking-head avatars
- **Runway**: Cinematic B-roll from text prompts

Critical considerations:
- **Cost**: Implement `get_cost_estimate` tool before generation
- **Latency**: Async Job-Ticket pattern is mandatory

---

## 6. Embedding & Rendering Strategies

### 6.1 Platform Differences

- **GitHub**: No `<video>` tag (limited), no `<iframe>`, allows `<img>` and GIF
- **VS Code**: Supports local video with security settings
- **GitLab/Bitbucket**: Varying inline video support

### 6.2 The Universal "GIF-Link" Pattern

1. Render high-quality `demo.mp4`
2. Use FFmpeg to create lightweight preview GIF (~5-10 seconds)
3. Embed GIF as hyperlink to full video

```markdown
[![Demo](./assets/demo-preview.gif)](./assets/demo.mp4)
```

---

## 7. Implementation Blueprint

### 7.1 Tech Stack

- Language: Python 3.10+
- SDK: Official `mcp` Python SDK
- Core Libraries: marp-cli (subprocess), vl-convert-python, ffmpeg-python, Pillow

### 7.2 Conceptual Code

```python
from mcp.server.fastmcp import FastMCP
import vl_convert as vlc
import ffmpeg

mcp = FastMCP("Media-Forge")

@mcp.tool()
async def render_chart(spec: str, output_path: str = "assets/chart.png") -> str:
    png_data = vlc.vegalite_to_png(spec, scale=2)
    with open(output_path, "wb") as f:
        f.write(png_data)
    return f"Chart saved to {output_path}"

@mcp.tool()
async def generate_gif_preview(video_path: str, gif_path: str) -> str:
    (
        ffmpeg
        .input(video_path, ss=0, t=5)
        .filter('fps', fps=10)
        .filter('scale', 320, -1)
        .output(gif_path)
        .run()
    )
    return f"Preview GIF saved to {gif_path}"
```

---

## 8. Security, Performance, and Scalability

### Security
- Container isolation for all rendering tools
- File system scoping (reject path traversal)
- Input validation (schema validation for JSON specs)

### Performance
- Input-hash caching (skip re-rendering identical inputs)
- Rate limiting for external API calls
- Resource limits on container processes

---

## 9. Comparative Analysis

| Feature | Marp (Slides) | Vega-Lite (Charts) | FFmpeg (Video) | Runway (Gen Video) |
|---|---|---|---|---|
| Input Format | Markdown | JSON | CLI / Filtergraph | Text Prompt |
| Agent Suitability | High (Native Text) | High (Structured Data) | Medium (Complex Syntax) | High (Natural Language) |
| Execution | Local (CLI) | Local (Python/Rust) | Local (CLI) | Remote (API) |
| Cost | Free | Free | Free | High ($/sec) |
| Latency | Low (<2s) | Low (<1s) | Medium (Seconds-Minutes) | High (Minutes) |
| Output | PDF, PNG, PPTX | PNG, SVG | MP4, GIF, WebM | MP4 |
| Best For | README Headers, Decks | Data Analysis, Metrics | Demos, Walkthroughs | Cinematic Intros |

---

## Review Notes (Claude)

The following adjustments were made in the refined [architecture.md](architecture.md):

1. **Added D2** as a primary diagram tool (superior to Mermaid for complex diagrams, not mentioned in original)
2. **Added Manim** for technical animations (the best tool for math/code explainer videos, not mentioned)
3. **Added Asciinema+agg** pipeline for terminal recordings (most practical video-like content for CLIs)
4. **Chose TypeScript over Python** for the MCP server (aligns with ecosystem, shells out to CLI tools regardless)
5. **De-prioritized generative AI video** (Runway, Synthesia) — wrong aesthetic, expensive, non-deterministic
6. **De-prioritized JsonCut compositor** — reinvents a layout engine; SVG templates or D2 are better
7. **Added existing MCP servers** to reuse rather than building everything from scratch
8. **Added content-addressable file naming** for cache and git optimization
