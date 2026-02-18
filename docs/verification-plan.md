# Verification Plan: MCP Media Forge

*Last updated: 2026-02-18*

Comprehensive testing and validation strategy for every component of the Media Forge MCP server.

---

## 1. Testing Layers

```
┌─────────────────────────────────────────────┐
│  E2E: Agent workflow tests                  │  Real LLM + MCP server + rendering
├─────────────────────────────────────────────┤
│  Integration: MCP protocol + tool pipeline  │  MCP client → server → tool → file
├─────────────────────────────────────────────┤
│  Component: Individual tool tests           │  Tool function → file output
├─────────────────────────────────────────────┤
│  Unit: Core logic (cache, hash, paths)      │  Pure functions, no I/O
└─────────────────────────────────────────────┘
```

---

## 2. Unit Tests

### 2.1 Cache Layer

| Test | Input | Expected | Pass Criteria |
|---|---|---|---|
| Hash determinism | Same input twice | Identical hash | `hash(a) === hash(a)` |
| Hash sensitivity | Different inputs | Different hash | `hash(a) !== hash(b)` |
| Hash includes tool name | Same content, different tools | Different hash | `hash("mermaid", x) !== hash("d2", x)` |
| Hash includes params | Same code, different theme | Different hash | `hash(code, "default") !== hash(code, "dark")` |
| Cache hit | Existing file for hash | Returns path, no render | Render function NOT called |
| Cache miss | No file for hash | Triggers render | Render function called |
| Cache with deleted file | Hash exists but file deleted | Re-renders | New file created |

### 2.2 Output Path Management

| Test | Input | Expected | Pass Criteria |
|---|---|---|---|
| Path construction | tool="mermaid", hash="abc123" | `docs/generated/mermaid-abc123.svg` | Exact path match |
| Path traversal blocked | `../../etc/passwd` | Error thrown | `SecurityError` |
| Relative path resolution | `./docs/generated/x.svg` | Resolved under project root | `startsWith(PROJECT_ROOT)` |
| Custom output dir | `output_dir="/custom"` | Files under `/custom/` | Path starts with `/custom/` |
| Existing file not overwritten | Same hash, file exists | Existing file returned | mtime unchanged |

### 2.3 MediaToolResult Schema

| Test | Input | Expected | Pass Criteria |
|---|---|---|---|
| Successful result | Completed render | All required fields present | `status`, `output_path`, `format`, `embed_markdown` |
| Error result | Failed render | Error fields present | `status="error"`, `error_message`, `error_type` |
| Async result | Job submitted | Job fields present | `status="processing"`, `job_id` |
| embed_markdown format | SVG output | Valid markdown image syntax | Matches `![...](./docs/generated/...)` |

---

## 3. Component Tests (Individual Tools)

Each tool tested in isolation: input → tool function → verify output file.

### 3.1 Mermaid (`render_mermaid`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| Simple flowchart | `graph LR; A-->B` | SVG file | File exists, >0 bytes, valid SVG header |
| Sequence diagram | `sequenceDiagram\n A->>B: Hello` | SVG file | Contains `<svg` tag |
| PNG format | `graph TD; A-->B`, format="png" | PNG file | Valid PNG magic bytes `\x89PNG` |
| Custom theme | code + theme="dark" | SVG with dark colors | File exists, different from default theme |
| Invalid syntax | `graph INVALID :::` | Structured error | `error_type="syntax_error"`, `error_message` contains line info |
| Empty input | `""` | Structured error | `error_type="syntax_error"` |
| Large diagram (50+ nodes) | Generated large graph | SVG file | File exists, renders in <10s |
| All diagram types | flowchart, sequence, class, state, ER, gantt, pie, git | SVG per type | All produce valid SVG |

### 3.2 D2 (`render_d2`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| Simple diagram | `a -> b -> c` | SVG file | Valid SVG |
| Containers/nesting | `x: { a -> b }; y: { c -> d }; x -> y` | SVG file | Contains nested groups |
| Theme: neutral | code + theme="neutral-default" | SVG | File exists |
| Theme: terminal | code + theme="terminal" | SVG | Different from neutral |
| Layout: ELK | code + layout="elk" | SVG | Different layout from dagre |
| Layout: TALA | code + layout="tala" | SVG | Renders without error |
| PNG format | code + format="png" | PNG file | Valid PNG |
| Icons | `x: { shape: image; icon: ... }` | SVG with image | File exists |
| Invalid syntax | `-> ->` | Structured error | `error_type="syntax_error"` |
| Markdown in labels | `a: |md\n # Title\n|` | SVG with formatted text | File exists |

### 3.3 Graphviz (`render_graphviz`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| Directed graph | `digraph { A -> B -> C }` | SVG file | Valid SVG |
| Undirected graph | `graph { A -- B -- C }` | SVG file | Valid SVG |
| Engine: dot | code + engine="dot" | SVG | Hierarchical layout |
| Engine: neato | code + engine="neato" | SVG | Spring layout |
| Engine: fdp | code + engine="fdp" | SVG | Force-directed |
| Engine: circo | code + engine="circo" | SVG | Circular layout |
| Large graph (100+ nodes) | Generated graph | SVG | Completes in <10s |
| Invalid DOT | `digraph { -> }` | Structured error | Error message present |
| Subgraphs / clusters | `subgraph cluster_0 { ... }` | SVG | Contains cluster box |

### 3.4 Marp (`render_slides`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| Single slide | `# Title\nContent` | 1 PNG file | Valid PNG, reasonable dimensions |
| Multi-slide | `# Slide 1\n---\n# Slide 2\n---\n# Slide 3` | 3 PNG files | 3 files, named slide-001, slide-002, slide-003 |
| PDF output | markdown + format="pdf" | PDF file | Valid PDF header `%PDF` |
| Theme: default | markdown + theme="default" | PNG | File exists |
| Theme: gaia | markdown + theme="gaia" | PNG | Visually different (different file hash) |
| Theme: uncover | markdown + theme="uncover" | PNG | Visually different |
| Code block in slide | Markdown with fenced code | PNG | Renders without error |
| Image in slide | Markdown with `![](image.png)` | PNG | Renders (may show broken image) |
| Empty markdown | `""` | Error or single blank slide | Graceful handling |
| embed_markdown | Multi-slide deck | Cover image linking to PDF | Matches `[![...](slide-001.png)](...pdf)` |

### 3.5 Vega-Lite (`render_chart`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| Bar chart | Valid bar chart spec | SVG file | Valid SVG, contains `<rect>` elements |
| Line chart | Valid line chart spec | SVG file | Valid SVG, contains `<path>` elements |
| Scatter plot | Valid scatter spec | SVG file | Valid SVG |
| PNG format | spec + format="png" | PNG file | Valid PNG |
| Scale factor | spec + scale=2 | PNG file | Larger dimensions than scale=1 |
| Invalid JSON | `{not json}` | Structured error | `error_type="syntax_error"` |
| Valid JSON, invalid spec | `{"foo": "bar"}` | Structured error | Schema validation error message |
| Missing data field | Spec without `data` | Structured error | Mentions missing `data` field |
| Missing encoding | Spec without `encoding` | Structured error | Mentions missing `encoding` |

### 3.6 Manim (`render_animation`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| Simple scene | Circle creation scene | GIF file | Valid GIF, >0 bytes |
| MP4 format | scene + format="mp4" | MP4 file | Valid MP4 (ftyp header) |
| Quality: low | scene + quality="low" | GIF | Smaller file than medium |
| Quality: medium | scene + quality="medium" | GIF | Renders in <30s |
| Quality: high | scene + quality="high" | GIF | Larger file, <60s |
| Invalid Python | `def not_a_scene():` | Structured error | Python error in message |
| Timeout | Extremely complex scene | Structured error | `error_type="timeout"` |
| No network access | Scene with `urllib.request` | Error or no network | Sandboxed |

### 3.7 Terminal Recording (`terminal_to_gif` / `cast_to_gif`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| Simple commands | `["echo hello", "ls"]` | GIF file | Valid GIF |
| Cast file conversion | Valid .cast file | GIF file | Valid GIF |
| Custom theme | cast + theme="monokai" | GIF | File exists |
| Custom dimensions | cast + cols=120, rows=30 | GIF | Renders at specified size |
| Empty commands | `[]` | Error | Graceful error |
| Invalid cast file | Corrupted .cast | Structured error | Error message |

### 3.8 Image-to-GIF (`images_to_gif`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| 3 PNGs at 1fps | 3 PNG paths, fps=1 | GIF, ~3s duration | Valid GIF |
| Custom fps | images + fps=10 | GIF | Different frame timing |
| Custom width | images + width=400 | GIF | Smaller than original |
| Missing image | Non-existent path in array | Structured error | Lists missing file |
| Single image | 1 PNG path | GIF (static) | Valid GIF |
| Mixed formats | PNG + SVG + JPG | GIF | Handles format conversion |

### 3.9 Video Assembly (`assemble_video`)

| Test | Input | Expected Output | Validation |
|---|---|---|---|
| 2 images, 3s each | Timeline with 2 image clips | MP4, ~6s | Valid MP4, duration check |
| Image + audio | Image clip with audio file | MP4 with audio | Has audio stream |
| Fade transition | 2 clips with fade | MP4 | Renders without error |
| Cut transition | 2 clips with cut | MP4 | Renders without error |
| Text overlay | Clip with text_overlay | MP4 | Renders without error |
| GIF output | timeline + format="gif" | GIF | Valid GIF |
| Missing source file | Timeline referencing missing file | Structured error | Lists missing file |
| Returns job_id | Any valid timeline | Immediate response | `status="processing"`, `job_id` present |
| Job completion | After render finishes | Completed status | `status="completed"`, `output_path` present |

---

## 4. Integration Tests

### 4.1 MCP Protocol Tests

Test the full MCP JSON-RPC communication.

| Test | Scenario | Validation |
|---|---|---|
| Tool discovery | Client calls `tools/list` | All tools returned with correct schemas |
| Tool invocation | Client calls tool with valid args | Tool executes, returns MediaToolResult |
| Invalid tool name | Client calls non-existent tool | MCP error response (method not found) |
| Missing required param | Call `render_mermaid` without `code` | MCP error (invalid params) |
| Extra unknown params | Call with extra fields | Ignored or error (per MCP spec) |
| Concurrent tool calls | 3 parallel diagram renders | All complete independently |
| Large input | 50KB Mermaid code | Handles without truncation |
| Resource read | Read `media://assets/...` | Returns asset metadata |

### 4.2 Cache Integration

| Test | Scenario | Validation |
|---|---|---|
| First render | New input | File created, render executed |
| Second render (same input) | Identical input | Same file returned, render NOT executed (timing check) |
| Different input | Modified code | New file created with different hash |
| Cache after restart | Restart server, same input | Cached file found (persisted on disk) |

### 4.3 Docker Integration

| Test | Scenario | Validation |
|---|---|---|
| Container available | Server starts | Can exec commands in container |
| Tool binary present | Check each tool | `d2 --version`, `mmdc --version`, `dot -V`, etc. all succeed |
| Volume mount | Render to output dir | File appears on host filesystem |
| Resource limits | CPU-intensive render | Doesn't exceed configured limits |
| Timeout enforcement | Infinite loop input | Killed after timeout, error returned |

---

## 5. End-to-End (E2E) Tests

### 5.1 Single-Tool Workflow

| Test | Steps | Expected Outcome |
|---|---|---|
| Mermaid → GitHub embed | 1. Generate Mermaid SVG 2. Verify markdown syntax 3. Verify SVG renders in browser | Valid image in rendered markdown |
| D2 → README update | 1. Generate D2 diagram 2. Insert into README.md 3. View on GitHub | Diagram visible in GitHub README |
| Marp → slide deck | 1. Generate slides from markdown 2. Verify PNG files 3. Verify PDF link works | Cover image + downloadable PDF |

### 5.2 Multi-Tool Pipeline

| Test | Steps | Expected Outcome |
|---|---|---|
| Diagram + chart combo | 1. Render architecture diagram (D2) 2. Render performance chart (Vega-Lite) 3. Embed both in doc | Both images render correctly |
| Slides to GIF | 1. Render slides (Marp) 2. Convert to GIF (images_to_gif) 3. Embed GIF | Animated slideshow in markdown |
| Full video pipeline | 1. Render diagrams 2. Render charts 3. Assemble video (async) 4. Generate GIF preview 5. Embed GIF-link | GIF preview links to MP4 |

### 5.3 Error Recovery

| Test | Steps | Expected Outcome |
|---|---|---|
| Invalid Mermaid → fix → retry | 1. Send invalid code 2. Receive error 3. Fix based on error message 4. Retry | Second attempt succeeds |
| Tool fallback | 1. Request D2 render 2. D2 not installed 3. Fall back to Mermaid | Diagram generated via fallback |
| Timeout → lower quality | 1. Request high-quality Manim 2. Timeout 3. Retry with quality="low" | Lower quality succeeds |

---

## 6. Platform Rendering Validation

Verify that generated assets render correctly on each target platform.

### 6.1 GitHub

| Asset Type | Test Method | Pass Criteria |
|---|---|---|
| SVG image | Push to repo, view README | Image renders, correct dimensions |
| PNG image | Push to repo, view README | Image renders |
| GIF animation | Push to repo, view README | Animates, autoplays |
| `<video>` MP4 | Push to repo, view README | Video player appears with controls |
| Mermaid fenced block | Push to repo, view README | Diagram renders natively |
| Image with link | `[![](img)](pdf)` | Clickable image, link works |
| Image sizing | `<img width="600">` | Correct width |

### 6.2 GitLab

| Asset Type | Test Method | Pass Criteria |
|---|---|---|
| SVG/PNG/GIF | Push, view in web UI | All render |
| Mermaid blocks | Push, view in web UI | Diagrams render |
| Video | Push, view | Platform-specific behavior documented |

### 6.3 MkDocs Material

| Asset Type | Test Method | Pass Criteria |
|---|---|---|
| SVG/PNG | Build site, view locally | Images render with lightbox zoom |
| Mermaid | Build site, view | Diagrams render via plugin |
| Video | Build site, view | `<video>` tag works |
| PDF link | Build site, click | PDF opens/downloads |

### 6.4 VS Code Preview

| Asset Type | Test Method | Pass Criteria |
|---|---|---|
| SVG/PNG/GIF | Open .md in preview | All render inline |
| Video | Open .md in preview | Video player or fallback |
| Relative paths | Images in subdirectory | Paths resolve correctly |

---

## 7. Performance Benchmarks

### 7.1 Rendering Speed

| Tool | Target (p95) | Max Acceptable | Test Input |
|---|---|---|---|
| Mermaid (simple) | <500ms | 2s | 10-node flowchart |
| Mermaid (complex) | <2s | 5s | 50-node diagram |
| D2 (simple) | <500ms | 2s | 10-node diagram |
| D2 (complex) | <2s | 5s | 50-node with containers |
| Graphviz (simple) | <200ms | 1s | 20-node graph |
| Graphviz (large) | <2s | 10s | 200-node graph |
| Marp (3 slides) | <3s | 5s | 3-slide deck |
| Marp (20 slides) | <10s | 20s | 20-slide deck |
| Vega-Lite | <500ms | 2s | Bar chart, 100 data points |
| Manim (simple) | <15s | 30s | Circle + text animation |
| Manim (complex) | <45s | 120s | Multi-scene with 3D |
| images_to_gif (5 images) | <2s | 5s | 5 PNG, 800x600 |
| FFmpeg video (30s) | <15s | 60s | 10 clips, fade transitions |

### 7.2 Cache Performance

| Metric | Target | Test |
|---|---|---|
| Cache hit latency | <10ms | Hash lookup + file existence check |
| Cache miss overhead | <50ms | Hash computation + file path setup |
| Hash computation | <5ms | SHA-256 of 50KB input |

### 7.3 Output Size

| Asset | Target Size | Max Acceptable |
|---|---|---|
| SVG diagram | <100KB | 500KB |
| PNG diagram | <200KB | 1MB |
| GIF animation (5s) | <2MB | 5MB |
| GIF animation (15s) | <5MB | 10MB |
| MP4 video (30s, 1080p) | <10MB | 50MB |
| PDF slide deck (10 slides) | <5MB | 20MB |

---

## 8. Security Tests

| Test | Scenario | Expected | Pass Criteria |
|---|---|---|---|
| Path traversal | Output path `../../etc/passwd` | Blocked | SecurityError thrown |
| Path traversal (encoded) | `%2e%2e%2f` encoded path | Blocked | SecurityError thrown |
| Symlink escape | Symlink pointing outside root | Blocked | Resolved path validated |
| Command injection (Mermaid) | Code with `; rm -rf /` | Rendered as text or error | No command execution |
| Command injection (FFmpeg) | Filename with `$(whoami)` | Filename treated as literal | No command substitution |
| Manim code injection | Scene code accessing `/etc/shadow` | Blocked by container sandbox | Permission denied or no access |
| Manim network access | Scene code with HTTP request | Blocked | Network unreachable in container |
| Resource exhaustion | Infinite-loop Manim scene | Killed by timeout | Process terminated, error returned |
| Large output | Diagram generating 100MB SVG | Blocked or truncated | Size limit enforced |
| Concurrent abuse | 50 parallel render requests | Rate limited | Queue or reject excess |

---

## 9. Regression Test Suite

### Automated CI Checks (run on every PR)

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test -- --filter unit

  component:
    runs-on: ubuntu-latest
    services:
      media-forge:
        image: ghcr.io/user/mcp-media-forge:latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test -- --filter component

  integration:
    runs-on: ubuntu-latest
    needs: [unit, component]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test -- --filter integration

  platform-render:
    runs-on: ubuntu-latest
    needs: integration
    steps:
      - uses: actions/checkout@v4
      - name: Generate all test assets
        run: npm run generate-test-assets
      - name: Validate outputs
        run: npm run validate-assets
```

### Golden File Tests

For each tool, maintain a set of known-good inputs and outputs:

```
tests/
  golden/
    mermaid/
      flowchart.input.mmd       # Input
      flowchart.expected.svg     # Expected output (or hash)
    d2/
      architecture.input.d2
      architecture.expected.svg
    marp/
      deck.input.md
      deck.expected-001.png
```

On test run: render input → compare output hash with expected hash. If different, either the tool version changed or the code broke.

---

## 10. Acceptance Criteria (Definition of Done)

### Per-Tool Acceptance

A tool is "done" when:

- [ ] All component tests pass (see Section 3)
- [ ] Cache hit/miss behavior verified
- [ ] Structured errors returned for all invalid inputs
- [ ] `embed_markdown` output renders on GitHub
- [ ] Performance within target benchmarks
- [ ] Security tests pass (path traversal, injection)
- [ ] Golden file test added to regression suite

### Per-Phase Acceptance

**Phase 0**: Server scaffold + `render_mermaid` working end-to-end
- [ ] MCP client can discover and call `render_mermaid`
- [ ] SVG file produced and embeddable in markdown
- [ ] Cache hit returns instantly on repeated call
- [ ] Docker container builds and runs

**Phase 1**: All P0+P1 tools
- [ ] All diagram tools (Mermaid, D2, Graphviz) pass component tests
- [ ] Marp slides render with all 3 themes
- [ ] Vega-Lite validates spec before rendering
- [ ] Multi-tool pipeline test passes (diagram + chart in one doc)

**Phase 2**: Animation + video
- [ ] Manim renders GIF in sandboxed container
- [ ] Terminal-to-GIF pipeline works
- [ ] Async job system handles concurrent jobs
- [ ] Video assembly produces playable MP4
- [ ] GIF-link pattern verified on GitHub

**Phase 3**: Distribution
- [ ] `npx mcp-media-forge` starts server
- [ ] Docker image published and pullable
- [ ] Claude Desktop config tested
- [ ] VS Code MCP config tested
- [ ] CI/CD regenerate workflow tested
- [ ] `clean_assets` correctly identifies unreferenced files
