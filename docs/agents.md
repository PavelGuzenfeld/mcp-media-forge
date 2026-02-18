# Agents: Agentic Workflows for Media Forge

*Last updated: 2026-02-18*

How LLM agents use Media Forge tools to autonomously generate and maintain visual documentation.

> **Cross-references**: Tool interfaces are defined in [architecture.md](architecture.md#3-tool-interface-design). Phase schedule is in [implementation-plan.md](implementation-plan.md). Test cases per tool are in [verification-plan.md](verification-plan.md#3-component-tests-individual-tools).

---

## 1. Agent Roles

### Documentation Agent

**Purpose**: Keep visual documentation in sync with the codebase.

**Trigger**: Code changes in `src/`, config changes, or manual request.

**Workflow**:
1. Scan changed files to determine which docs are affected
2. Read relevant `.md` files for existing media references
3. Regenerate stale diagrams/charts using Media Forge tools
4. Update markdown with new asset paths
5. Commit updated assets

**Tools Used**: `render_mermaid`, `render_d2`, `render_chart`, `list_assets`, `clean_assets`

---

### Presentation Agent

**Purpose**: Generate slide decks from technical content.

**Trigger**: User request ("create a presentation about the new auth system").

**Workflow**:
1. Gather context from codebase (architecture, APIs, data flow)
2. Generate Marp markdown with slide content
3. Render to PNG slides + PDF deck via `render_slides`
4. Embed cover slide in README/docs with link to full PDF
5. Optionally convert slides to animated GIF via `images_to_gif`

**Tools Used**: `render_slides`, `images_to_gif`

---

### Diagram Agent

**Purpose**: Create and update architecture diagrams, flowcharts, sequence diagrams.

**Workflow**:
1. Analyze code structure (imports, call graphs, class hierarchies)
2. Choose appropriate diagram type:
   - Architecture overview → D2
   - Sequence/interaction → Mermaid
   - Dependency graph → Graphviz DOT
   - Data flow → Mermaid or D2
3. Generate diagram source code
4. Render via appropriate tool
5. Embed in target `.md` file

**Tool Selection Logic**:

| Diagram Type | Tool | Reason |
|---|---|---|
| Architecture (boxes & arrows) | D2 | Superior layout, themes, icons |
| Sequence diagram | Mermaid | Native GitHub rendering |
| ER / database schema | Mermaid | Built-in ER syntax |
| Dependency graph | Graphviz | Best automatic layout for large graphs |
| Flowchart (simple) | Mermaid | Native GitHub rendering |
| Flowchart (complex) | D2 | Better nesting, containers |
| Class diagram | Mermaid or D2 | Either works |

---

### Video Agent

**Purpose**: Produce explainer videos and demo recordings for documentation.

**Trigger**: User request or CI pipeline.

**Workflow**:
1. Plan video structure (scenes, narration, assets needed)
2. Generate constituent assets:
   - Diagrams via Diagram Agent
   - Code screenshots via syntax highlighter
   - Terminal recordings via `terminal_to_gif`
   - Math animations via `render_animation` (Manim)
3. Assemble timeline JSON
4. Render video via `assemble_video` (async)
5. Generate GIF preview via FFmpeg
6. Embed GIF-link pattern in docs

**Tools Used**: `render_animation`, `terminal_to_gif`, `images_to_gif`, `assemble_video`, `check_job`

---

### Chart Agent

**Purpose**: Generate data visualizations from metrics, benchmarks, or analysis.

**Workflow**:
1. Receive data (inline, from file, or from API)
2. Choose chart type based on data shape:
   - Time series → line chart
   - Comparison → bar chart
   - Distribution → histogram
   - Proportion → pie/donut
   - Correlation → scatter plot
3. Generate Vega-Lite JSON spec
4. Render via `render_chart`
5. Embed SVG/PNG in docs

**Tools Used**: `render_chart`

---

## 2. Orchestration Patterns

### Single-Tool Call

Most common pattern. Agent generates text DSL, calls one tool, embeds result.

```
Agent: "I need an architecture diagram"
  → generates D2 code
  → calls render_d2(code, "svg")
  → receives file path
  → embeds ![Architecture](./docs/generated/d2-abc123.svg)
```

### Multi-Tool Pipeline

Agent composes multiple tools for complex output.

```
Agent: "Create a project overview video"
  → calls render_d2(arch_code) → arch.svg
  → calls render_mermaid(sequence_code) → sequence.svg
  → calls render_chart(metrics_json) → chart.png
  → calls render_slides(overview_md) → slide-001.png, slide-002.png, ...
  → calls images_to_gif([slide-001.png, ...], fps=1) → slides.gif
  → embeds GIF in README
```

### Self-Correcting Loop

When a tool returns an error, the agent fixes its input and retries.

```
Agent: generates invalid Mermaid code
  → calls render_mermaid(code)
  → receives: { status: "error", error_message: "Syntax error line 3: Expected '-->' but found '->'" }
  → fixes code: replaces '->' with '-->'
  → calls render_mermaid(fixed_code)
  → receives: { status: "completed", output_path: "..." }
```

The structured error format is critical for this pattern. Every tool must return:
- What went wrong (error type)
- Where it went wrong (line number if applicable)
- How to fix it (suggestion)

### Async Job Monitoring

For long-running operations (video rendering, Manim animations).

```
Agent: "Render this Manim scene"
  → calls render_animation(scene_code, "high", "mp4")
  → receives: { status: "processing", job_id: "job-456", estimated_seconds: 45 }
  → (continues other work or waits)
  → calls check_job("job-456")
  → receives: { status: "completed", output_path: "docs/generated/manim-xyz.mp4" }
  → embeds result
```

---

## 3. CI/CD Agent

### Automated Documentation Refresh

Runs in GitHub Actions on code push. Headless, no human interaction.

```yaml
# .github/workflows/docs-media.yml
name: Regenerate Documentation Media
on:
  push:
    paths: ['src/**', 'docs/**/*.md']

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Regenerate media
        run: |
          npx mcp-media-forge regenerate \
            --project-root . \
            --scan docs/ \
            --output docs/generated/

      - name: Commit if changed
        run: |
          git add docs/generated/
          git diff --cached --quiet || \
            git commit -m "docs: regenerate media assets"
          git push
```

### PR Documentation Bot

Comments on PRs with updated diagrams when architecture changes.

```yaml
on:
  pull_request:
    paths: ['src/**']

jobs:
  diagram-check:
    runs-on: ubuntu-latest
    steps:
      - name: Generate current diagrams
        run: npx mcp-media-forge render-all --output /tmp/current/

      - name: Compare with existing
        run: |
          # If diagrams differ, comment on PR with new versions
          npx mcp-media-forge diff --old docs/generated/ --new /tmp/current/
```

---

## 4. Agent Capabilities Matrix

| Agent | Input | Output | Async | Self-Correcting | CI-Compatible |
|---|---|---|---|---|---|
| Documentation Agent | Code changes | Updated .md files | No | Yes | Yes |
| Presentation Agent | Topic/content | PNG slides + PDF | No | Yes | Yes |
| Diagram Agent | Code/description | SVG/PNG diagrams | No | Yes | Yes |
| Video Agent | Storyboard | MP4 + GIF preview | Yes | Partial | Yes |
| Chart Agent | Data/metrics | SVG/PNG charts | No | Yes | Yes |
| CI/CD Agent | Git push | Committed assets | No | No | Yes |

---

## 5. Error Recovery Strategies

### Tool Not Available

If a rendering tool isn't installed in the container:

```json
{ "status": "error", "error_type": "dependency_missing", "error_message": "D2 binary not found. Install with: curl -fsSL https://d2lang.com/install.sh | sh" }
```

Agent should fall back to an alternative tool (e.g., Mermaid instead of D2).

### Rendering Timeout

If rendering exceeds the time limit:

```json
{ "status": "error", "error_type": "timeout", "error_message": "Manim render exceeded 120s limit. Try quality='low' or simplify the scene." }
```

Agent should retry with lower quality or simpler input.

### Output Too Large

If a generated GIF exceeds 5MB:

```json
{ "status": "completed", "output_path": "...", "size_bytes": 8500000, "warning": "File exceeds 5MB GitHub recommendation. Consider reducing fps or dimensions." }
```

Agent should call a compression tool or regenerate with lower settings.
