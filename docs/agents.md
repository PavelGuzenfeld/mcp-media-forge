# Agent Instructions: Building and Maintaining MCP Media Forge

*Instructions for AI coding agents working on this repository.*

---

## 1. Read These First

Before making any changes, read the relevant documents in this order:

1. **[README.md](../README.md)** — project overview, priority stack
2. **[architecture.md](architecture.md)** — `MediaToolResult` schema, tool catalog, caching, security constraints
3. **[implementation-plan.md](implementation-plan.md)** — current phase, directory structure, tech stack
4. **[verification-plan.md](verification-plan.md)** — test cases and acceptance criteria for each tool

The priority stack in README.md determines what to build next. The architecture defines the interfaces. The verification plan defines "done".

---

## 2. Project Rules

### No Host Pollution

NEVER install packages, binaries, or dependencies on the host machine. All rendering tools (mmdc, d2, dot, marp, manim, ffmpeg, agg, vl-convert) run inside Docker containers.

- Source code lives on the host (volume-mounted)
- Dependencies/binaries exist only inside containers
- Search for headers/libs with `docker exec`, not host Glob/Grep

### Feature Branch Workflow

Always develop on feature branches. Never commit to `master` directly.

```
git checkout -b feature/<tool-name>
# ... work ...
git push -u origin feature/<tool-name>
# create PR to master
```

### Docker Builds Run in Background

ALWAYS run `docker compose`, `docker build`, and test commands with `run_in_background: true`. Never block the conversation waiting for builds.

---

## 3. Tech Stack

```
Language:     TypeScript (Node.js)
MCP SDK:      @modelcontextprotocol/sdk
Build:        tsup (bundle to single file)
Testing:      vitest
Container:    Docker (multi-stage build)
Distribution: npm + GHCR (ghcr.io/PavelGuzenfeld/mcp-media-forge)
```

---

## 4. Directory Structure

```
mcp-media-forge/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # One file per tool
│   │   ├── mermaid.ts        # render_mermaid
│   │   ├── d2.ts             # render_d2
│   │   ├── graphviz.ts       # render_graphviz
│   │   ├── marp.ts           # render_slides
│   │   ├── vegalite.ts       # render_chart
│   │   ├── manim.ts          # render_animation
│   │   ├── ffmpeg.ts         # assemble_video, images_to_gif
│   │   └── terminal.ts       # terminal_to_gif, cast_to_gif
│   ├── core/
│   │   ├── cache.ts          # Input-hash caching layer
│   │   ├── output.ts         # File path management, PROJECT_ROOT scoping
│   │   ├── docker.ts         # Container exec helpers (timeout, volume mounts)
│   │   ├── types.ts          # MediaToolResult, TimelineSpec, shared types
│   │   └── jobs.ts           # Async job-ticket system (Phase 2)
│   └── utils/
│       └── hash.ts           # SHA-256 content hashing
├── docker/
│   ├── Dockerfile            # Rendering container (all tools)
│   └── docker-compose.yml
├── tests/
│   ├── unit/                 # Pure function tests (cache, hash, paths)
│   ├── component/            # Individual tool tests (input → file)
│   ├── integration/          # MCP protocol + full pipeline
│   └── golden/               # Known-good input/output pairs per tool
├── docs/                     # This documentation
├── examples/                 # Sample inputs and expected outputs
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Coding Conventions

### TypeScript Style

- **Functions**: `snake_case` — `render_mermaid`, `check_job`, `list_assets`
- **Variables**: `snake_case` — `output_path`, `job_id`, `spec_json`
- **Types/Interfaces**: `PascalCase` — `MediaToolResult`, `TimelineSpec`, `AssetInfo`
- **Files**: `snake_case` — `mermaid.ts`, `vegalite.ts`, `cache.ts`
- **Constants**: `UPPER_SNAKE_CASE` — `PROJECT_ROOT`, `DEFAULT_THEME`

### Every Tool Must

1. Accept text-based input (DSL code, JSON spec, or Markdown)
2. Return `MediaToolResult` (defined in `src/core/types.ts`)
3. Use the caching layer (`src/core/cache.ts`) — hash input, skip render if cached
4. Validate output path against `PROJECT_ROOT` (no path traversal)
5. Return structured errors with `error_type`, `error_message`, and `suggestion`
6. Include `embed_markdown` in successful results (ready-to-paste markdown)
7. Shell out to container tools via `src/core/docker.ts` — never install tools on host

### MediaToolResult Schema

This is the canonical response for every tool. Defined in `src/core/types.ts`:

```typescript
interface MediaToolResult {
  status: "completed" | "processing" | "error";

  // status = "completed"
  output_path?: string;
  format?: string;
  size_bytes?: number;
  embed_markdown?: string;
  warning?: string;

  // status = "processing" (async tools only)
  job_id?: string;
  estimated_seconds?: number;

  // status = "error"
  error_message?: string;
  error_type?: "syntax_error" | "rendering_error" | "timeout" | "dependency_missing" | "output_error";
  line?: number;
  suggestion?: string;
}
```

### Output Path Convention

All generated files go to:

```
{PROJECT_ROOT}/docs/generated/{tool}-{sha256(input)[:12]}.{ext}
```

Examples:
- `docs/generated/mermaid-a1b2c3d4e5f6.svg`
- `docs/generated/d2-7f8e9a0b1c2d.png`
- `docs/generated/marp-slide-001-3e4f5a6b.png`

Content-hash naming provides caching, deduplication, and git-friendly behavior. See [architecture.md Section 1.3](architecture.md#13-output-path-convention).

---

## 6. How to Add a New Tool

Follow this checklist when implementing any tool from the priority stack:

### Step 1: Create the tool file

Create `src/tools/<toolname>.ts`. Follow the pattern of existing tools.

```typescript
// src/tools/example.ts
import { cache_lookup, cache_store } from '../core/cache';
import { resolve_output_path } from '../core/output';
import { docker_exec } from '../core/docker';
import type { MediaToolResult } from '../core/types';

export async function render_example(
  code: string,
  format: "svg" | "png" = "svg",
  theme?: string
): Promise<MediaToolResult> {
  // 1. Check cache
  const cached = cache_lookup("example", { code, format, theme });
  if (cached) return cached;

  // 2. Resolve output path
  const output_path = resolve_output_path("example", { code, format, theme }, format);

  // 3. Shell out to container tool
  const result = await docker_exec("example-tool", [
    "--input", "-",
    "--output", `/output/${path.basename(output_path)}`,
    "--format", format,
  ], { stdin: code, timeout: 10_000 });

  // 4. Handle errors
  if (!result.success) {
    return {
      status: "error",
      error_type: "rendering_error",
      error_message: result.stderr,
      suggestion: parse_suggestion(result.stderr),
    };
  }

  // 5. Build and cache result
  const media_result: MediaToolResult = {
    status: "completed",
    output_path,
    format,
    size_bytes: fs.statSync(output_path).size,
    embed_markdown: `![Diagram](${output_path})`,
  };
  cache_store("example", { code, format, theme }, media_result);
  return media_result;
}
```

### Step 2: Register in MCP server

Add the tool to `src/index.ts` with its JSON schema for the MCP SDK.

### Step 3: Add to Docker image

If the tool binary isn't already in the container, add it to `docker/Dockerfile`.

### Step 4: Write tests

- Add component tests in `tests/component/<toolname>.test.ts`
- Follow test cases from [verification-plan.md Section 3](verification-plan.md#3-component-tests-individual-tools)
- Add golden file test inputs/outputs in `tests/golden/<toolname>/`

### Step 5: Verify acceptance

Check all criteria from [verification-plan.md Section 10](verification-plan.md#10-acceptance-criteria-definition-of-done):

- [ ] All component tests pass
- [ ] Cache hit/miss works
- [ ] Structured errors for invalid input
- [ ] `embed_markdown` renders on GitHub
- [ ] Performance within benchmarks
- [ ] Security tests pass
- [ ] Golden file added

---

## 7. Tool-Specific Implementation Notes

### Mermaid (`render_mermaid`) — P0

- Binary: `mmdc` (Mermaid CLI, npm package `@mermaid-js/mermaid-cli`)
- Container install: `npm install -g @mermaid-js/mermaid-cli`
- Invocation: `mmdc -i input.mmd -o output.svg -t <theme>`
- Themes: default, dark, forest, neutral

### D2 (`render_d2`) — P0

- Binary: `d2` (single Go binary, zero dependencies)
- Container install: `curl -fsSL https://d2lang.com/install.sh | sh`
- Invocation: `d2 --theme <id> --layout <engine> input.d2 output.svg`
- Layouts: dagre (default), elk, tala
- Theme IDs: 0=default, 1=neutral-grey, 3=terminal, 100=neutral-default, etc.

### Graphviz (`render_graphviz`) — P1

- Binary: `dot` (and neato, fdp, sfdp, twopi, circo)
- Container install: `apt-get install graphviz`
- Invocation: `<engine> -Tsvg -o output.svg input.dot`
- All 6 engines: dot, neato, fdp, sfdp, twopi, circo

### Marp (`render_slides`) — P1

- Binary: `marp` (npm package `@marp-team/marp-cli`)
- Requires: Chromium/Chrome in container
- Container install: `npm install -g @marp-team/marp-cli` + install Chrome
- Invocation: `marp --input deck.md --images png` or `marp --input deck.md --pdf`
- Themes: default, gaia, uncover
- Note: Use `--allow-local-files` for local image references
- Note: Use `--no-sandbox` when running as root in container

### Vega-Lite (`render_chart`) — P1

- Library: `vl-convert` (Rust binary or Python package)
- Container install: `pip install vl-convert-python` or use Rust binary
- Invocation: programmatic — pass JSON spec, receive PNG/SVG bytes
- Validate spec against Vega-Lite schema before rendering

### Manim (`render_animation`) — P2

- Library: Manim Community Edition (Python)
- Container install: `pip install manim` + cairo, pango, LaTeX, ffmpeg
- Invocation: write scene code to temp file, run `manim render -ql scene.py SceneName`
- Quality flags: `-ql` (low/480p), `-qm` (medium/720p), `-qh` (high/1080p)
- Security: container must have no network access, resource limits, timeout
- Output: defaults to MP4, convert to GIF with FFmpeg if requested

### Asciinema + agg (`terminal_to_gif`, `cast_to_gif`) — P2

- Binaries: `asciinema` (Python) + `agg` (Rust binary)
- Invocation: `asciinema rec --command "<cmd>" output.cast` then `agg output.cast output.gif`
- agg install: download pre-built binary from GitHub releases
- Themes: asciinema, monokai, solarized-dark, etc.

### FFmpeg (`assemble_video`, `images_to_gif`) — P2

- Binary: `ffmpeg`
- Container install: `apt-get install ffmpeg`
- For `images_to_gif`: `ffmpeg -framerate <fps> -i img_%03d.png -vf "scale=<w>:-1" output.gif`
- For `assemble_video`: build `filter_complex` filtergraph programmatically from TimelineSpec JSON
- NEVER construct ffmpeg commands via string interpolation — use argument arrays

---

## 8. Synchronous vs Asynchronous Tools

| Tool | Pattern | Threshold |
|---|---|---|
| render_mermaid | Always sync | <1s |
| render_d2 | Always sync | <1s |
| render_graphviz | Always sync | <1s |
| render_chart | Always sync | <1s |
| render_slides | Always sync | 2-5s |
| render_animation | Async if quality >= medium | 10-60s |
| terminal_to_gif | Always async | Real-time |
| images_to_gif | Sync for <10 images | <5s |
| assemble_video | Always async | 5-120s |

Async tools return `{ status: "processing", job_id, estimated_seconds }` immediately. Implement the job system in `src/core/jobs.ts` during Phase 2.

---

## 9. Testing Workflow

### Run tests

```bash
# Unit tests (pure functions, no Docker needed)
npm test -- --filter unit

# Component tests (requires Docker container running)
npm test -- --filter component

# Integration tests (full MCP protocol)
npm test -- --filter integration

# All tests
npm test
```

### Add a golden file test

```
tests/golden/<tool>/
  <name>.input.<ext>           # e.g., flowchart.input.mmd
  <name>.expected.<ext>        # e.g., flowchart.expected.svg (or .sha256 hash)
```

The test runner renders the input and compares the output hash with the expected hash. If different, either the tool version changed (update the golden file) or the code broke (fix it).

### Performance benchmarks

Targets are in [verification-plan.md Section 7](verification-plan.md#7-performance-benchmarks). Key targets:

- Diagram rendering: **<500ms** (p95 for simple), **<2s** (p95 for complex)
- Slide generation: **<3s** (3 slides), **<10s** (20 slides)
- Cache hit: **<10ms**

---

## 10. Security Rules

These are non-negotiable. Every tool must enforce them.

1. **Path traversal protection**: Validate all output paths resolve under `PROJECT_ROOT`. Use `path.resolve()` then check `startsWith(PROJECT_ROOT)`. See [architecture.md Section 6](architecture.md#6-security).

2. **No shell interpolation**: Never build commands via string concatenation. Use argument arrays with `child_process.execFile` or equivalent.

3. **Container isolation**: All tools run in Docker with:
   - No network (for local tools)
   - Read-only filesystem except output volume
   - Resource limits (CPU, memory)
   - Timeout enforcement

4. **Input validation**: Validate Vega-Lite JSON against schema. Validate file paths. Reject oversized inputs.

5. **Manim sandboxing**: Manim executes arbitrary Python — the container MUST have no network access and strict resource limits.

---

## 11. CI/CD

### Test pipeline (`.github/workflows/test.yml`)

Runs on every push and PR. See [verification-plan.md Section 9](verification-plan.md#9-regression-test-suite) for the full workflow.

### Media regeneration (`.github/workflows/docs-media.yml`)

Runs when `src/**` or `docs/**/*.md` change. Regenerates all media assets and commits if changed. See [architecture.md Section 8](architecture.md#8-integration-with-cicd).

---

## 12. Common Pitfalls

| Pitfall | Prevention |
|---|---|
| Installing tools on host | Use Docker. Check `docker/Dockerfile` for what's installed |
| Blocking on Docker builds | Always use `run_in_background: true` |
| Returning base64 image data | Return file paths via `MediaToolResult.output_path` |
| Forgetting cache layer | Every tool must check cache before rendering |
| String-interpolated shell commands | Use argument arrays, never template strings |
| Missing `embed_markdown` field | Every successful result must include ready-to-paste markdown |
| Hardcoded output paths | Use `resolve_output_path()` with content-hash naming |
| Adding tools without tests | Follow the component test table in verification-plan.md |
| Committing to master | Use feature branches, create PRs |
| Large GIF output | Auto-check size, add `warning` if >5MB |

---

## 13. End-User Workflows (Reference)

This section describes how consumers of the MCP server use it — not how to develop it.

### Diagram Tool Selection

When an end-user agent generates diagrams, it should choose tools based on diagram type:

| Diagram Type | Tool | Reason |
|---|---|---|
| Architecture (boxes & arrows) | `render_d2` | Superior layout, themes, icons |
| Sequence diagram | `render_mermaid` | Native GitHub rendering |
| ER / database schema | `render_mermaid` | Built-in ER syntax |
| Dependency graph | `render_graphviz` | Best auto-layout for large graphs |
| Flowchart (simple) | `render_mermaid` | Native GitHub rendering |
| Flowchart (complex) | `render_d2` | Better nesting, containers |
| Class diagram | `render_mermaid` or `render_d2` | Either works |
| Data chart | `render_chart` | Vega-Lite declarative JSON |
| Technical animation | `render_animation` | Manim scene code |
| Terminal demo | `terminal_to_gif` | Asciinema + agg |

### Orchestration Patterns

**Single-tool call** (most common):
```
Agent generates D2 code → calls render_d2 → embeds SVG in markdown
```

**Multi-tool pipeline**:
```
render_d2 → render_chart → render_slides → images_to_gif → embed GIF
```

**Self-correcting loop**:
```
render_mermaid(invalid) → error with suggestion → fix → render_mermaid(fixed) → success
```

**Async monitoring** (Phase 2+ tools):
```
assemble_video(timeline) → job_id → check_job(id) → ... → completed → embed
```

### Error Recovery

| Error | Agent Action |
|---|---|
| `dependency_missing` | Fall back to alternative tool (e.g., Mermaid instead of D2) |
| `syntax_error` with `suggestion` | Fix input based on suggestion, retry |
| `timeout` | Retry with lower quality or simpler input |
| `warning: "File exceeds 5MB"` | Regenerate with lower fps/dimensions |
