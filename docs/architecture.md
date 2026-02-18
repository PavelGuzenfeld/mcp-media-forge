# Architecture: MCP Media Forge Server

*Last updated: 2026-02-18*

This document covers protocol-level constraints, architectural patterns, and design decisions for the Media Forge MCP server.

---

## 1. MCP Protocol Constraints

### 1.1 Binary Transport and JSON-RPC

MCP uses JSON-RPC 2.0 over stdio (local) or HTTP+SSE (remote). Binary payloads (images, videos) must be Base64-encoded for inline transport, adding ~33% overhead. A 10MB video becomes 13MB+ of JSON text.

**Decision: Reference-Based Architecture**

The server MUST return file paths, never inline binary data.

```json
// Tool result — correct
{
  "status": "completed",
  "output_path": "docs/generated/architecture-a1b2c3.svg",
  "format": "svg",
  "size_bytes": 12480,
  "embed_markdown": "![Architecture](./docs/generated/architecture-a1b2c3.svg)"
}

// Tool result — wrong (never do this)
{
  "image_data": "iVBORw0KGgoAAAANSUhEUgAA..."  // base64 blob
}
```

### 1.2 Tools vs Resources

| MCP Primitive | Role in Media Forge | Examples |
|---|---|---|
| **Tool** (model-controlled) | Active generation | `render_mermaid`, `generate_slides`, `assemble_video` |
| **Resource** (app-controlled) | Passive inspection | `media://jobs/{id}/status`, `media://assets/{id}/metadata` |

**Workflow**:
1. Agent calls Tool to generate media
2. Tool returns file path + metadata
3. Agent can read Resource to check status (async) or inspect output
4. Agent embeds the file path into the markdown document

### 1.3 Output Path Convention

All generated assets go to a project-relative directory:

```
{project_root}/docs/generated/{tool}-{content_hash}.{ext}
```

Examples:
- `docs/generated/mermaid-a1b2c3d4e5f6.svg`
- `docs/generated/d2-7f8e9a0b1c2d.png`
- `docs/generated/marp-slide-001-3e4f5a6b.png`
- `docs/generated/manim-scene-c8d9e0f1.gif`

Content-hash naming enables:
- **Caching**: same input = same file, skip re-rendering
- **Deduplication**: identical diagrams across docs share one file
- **Git-friendly**: unchanged diagrams don't create new commits

---

## 2. Execution Architecture

### 2.1 Synchronous vs Asynchronous

| Operation | Typical Time | Pattern |
|---|---|---|
| Mermaid render | <1s | Synchronous |
| D2 render | <1s | Synchronous |
| Graphviz render | <1s | Synchronous |
| Vega-Lite chart | <1s | Synchronous |
| Marp slides | 2-5s | Synchronous |
| Manim animation | 10-60s | **Asynchronous (Job-Ticket)** |
| FFmpeg video assembly | 5-120s | **Asynchronous (Job-Ticket)** |
| Terminal recording | Real-time | **Asynchronous** |

**Synchronous tools** return the result immediately in the tool response.

**Asynchronous tools** implement the Job-Ticket pattern:
1. `assemble_video(timeline)` → returns `{ job_id: "abc123", status: "processing" }`
2. `check_job("abc123")` → returns `{ status: "processing", progress: 45 }`
3. `check_job("abc123")` → returns `{ status: "completed", output_path: "..." }`

### 2.2 Local Execution (Primary Model)

All rendering tools run locally inside a Docker container:

```
Host Machine
  |
  | stdio (JSON-RPC)
  v
MCP Media Forge Server (Node.js process on host)
  |
  | docker exec (or volume-mounted CLI binaries)
  v
Rendering Container
  ├── mmdc (Mermaid CLI)
  ├── d2 (D2 binary)
  ├── dot (Graphviz)
  ├── marp (Marp CLI + Chrome)
  ├── manim (Python + cairo + LaTeX)
  ├── ffmpeg
  ├── agg (asciinema GIF generator)
  └── vl-convert (Vega-Lite renderer)
```

**Key principle**: The MCP server process itself is lightweight (Node.js on host). Heavy rendering is delegated to containerized tools via `docker exec` or subprocess calls to volume-mounted binaries.

Output directory is volume-mounted so generated files appear directly in the project tree.

### 2.3 Remote Execution (Optional, Future)

For AI-powered generation (DALL-E, Ideogram) or heavy compute:

```
MCP Server → HTTPS → Cloud API → download result → write to output dir
```

The server handles API keys, rate limiting, and cost estimation transparently. The agent sees the same interface regardless of local vs remote execution.

---

## 3. Tool Interface Design

### 3.1 Common Response Schema

Every tool returns a consistent structure:

```typescript
interface MediaToolResult {
  status: "completed" | "processing" | "error";
  output_path?: string;          // relative to project root
  format?: string;               // svg, png, gif, mp4, pdf
  size_bytes?: number;
  embed_markdown?: string;       // ready-to-paste markdown
  job_id?: string;               // for async operations
  error_message?: string;        // structured error for self-healing
}
```

### 3.2 Tool Catalog

#### P0: Diagrams

```typescript
// Mermaid
render_mermaid(code: string, format: "svg"|"png" = "svg", theme?: string): MediaToolResult

// D2
render_d2(code: string, format: "svg"|"png" = "svg", theme?: string, layout?: "dagre"|"elk"|"tala"): MediaToolResult

// Graphviz
render_graphviz(dot_source: string, engine: "dot"|"neato"|"fdp"|"circo" = "dot", format: "svg"|"png" = "svg"): MediaToolResult
```

#### P1: Presentations & Charts

```typescript
// Marp slides
render_slides(markdown: string, theme?: string, format: "png"|"pdf"|"pptx" = "png"): MediaToolResult
// When format=png, returns array of slide image paths

// Vega-Lite chart
render_chart(spec_json: string, format: "svg"|"png" = "svg", scale?: number): MediaToolResult
```

#### P2: Animations & Video

```typescript
// Manim animation
render_animation(scene_code: string, quality: "low"|"medium"|"high" = "medium", format: "gif"|"mp4" = "gif"): MediaToolResult

// Terminal recording to GIF
terminal_to_gif(commands: string[], shell?: string): MediaToolResult
// or
cast_to_gif(cast_file_path: string, theme?: string): MediaToolResult

// Image sequence to GIF
images_to_gif(image_paths: string[], fps?: number, width?: number): MediaToolResult

// Video assembly (async)
assemble_video(timeline: TimelineSpec): MediaToolResult  // returns job_id
check_job(job_id: string): MediaToolResult
```

#### Utility

```typescript
// List generated assets
list_assets(directory?: string): AssetInfo[]

// Clean stale assets (not referenced in any .md file)
clean_assets(dry_run?: boolean): CleanResult
```

---

## 4. Caching Strategy

### Input Hashing

Before rendering, compute `SHA-256(tool_name + input_params)`. If a file with that hash exists, return it immediately.

```
Input: render_mermaid("graph LR; A-->B", "svg", "default")
Hash:  sha256("mermaid|graph LR; A-->B|svg|default") = "a1b2c3..."
Path:  docs/generated/mermaid-a1b2c3d4e5f6.svg
```

If `docs/generated/mermaid-a1b2c3d4e5f6.svg` exists → return immediately (0ms).

### Cache Invalidation

- Tool version changes → hash includes tool version
- Theme changes → hash includes theme parameter
- Manual: `clean_assets(dry_run=true)` shows what would be deleted

---

## 5. Error Handling

Media generation is failure-prone. The server must return **structured errors** that enable the LLM to self-correct:

```json
{
  "status": "error",
  "error_message": "Mermaid syntax error at line 3: Expected '-->' but found '->'. Use '-->' for directed edges.",
  "error_type": "syntax_error",
  "line": 3,
  "suggestion": "Replace '->' with '-->' on line 3"
}
```

Error categories:
- `syntax_error` — invalid input DSL (Mermaid, D2, DOT, Vega-Lite JSON)
- `rendering_error` — tool crashed during rendering
- `timeout` — rendering exceeded time limit
- `dependency_missing` — required tool not installed in container
- `output_error` — file system write failure

---

## 6. Security

### File System Scoping

The server is configured with a `PROJECT_ROOT`. All output paths are validated:

```typescript
const resolved = path.resolve(PROJECT_ROOT, requested_path);
if (!resolved.startsWith(PROJECT_ROOT)) {
  throw new Error("Path traversal blocked");
}
```

### Input Sanitization

- Mermaid/D2/DOT input is text DSL — limited attack surface
- Vega-Lite JSON is validated against schema before rendering
- FFmpeg commands are constructed programmatically (never shell-interpolated)
- Manim code runs in a sandboxed container with no network access

### Container Isolation

All rendering tools run inside Docker with:
- No network access (for local-only tools)
- Read-only filesystem except output volume
- Resource limits (CPU, memory, time)
- No privileged capabilities

---

## 7. Distribution

### Option A: npm Package (Recommended)

```bash
npx mcp-media-forge --project-root /path/to/project
```

The npm package contains the MCP server. On first run, it pulls the Docker image with rendering tools.

### Option B: Docker-Only

```bash
docker run -v $(pwd):/project -it mcp-media-forge
```

The entire server + tools in one container. Simpler but requires Docker for the MCP process itself.

### Option C: Hybrid

MCP server runs on host (npm). Individual tools are either:
- Native binaries (D2, Graphviz — single binaries, easy to install)
- Docker-contained (Marp, Manim — heavy dependencies)

---

## 8. Integration with CI/CD

The MCP server can run headless in CI to keep generated assets fresh:

```yaml
# .github/workflows/docs-media.yml
name: Regenerate Documentation Media
on:
  push:
    paths: ['docs/**/*.md', 'src/**']

jobs:
  regenerate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Media Forge
        run: |
          npx mcp-media-forge regenerate \
            --project-root . \
            --scan-docs docs/ \
            --output docs/generated/
      - name: Commit updated assets
        run: |
          git add docs/generated/
          git diff --cached --quiet || git commit -m "docs: regenerate media assets"
          git push
```

This ensures documentation media never drifts from the codebase.
