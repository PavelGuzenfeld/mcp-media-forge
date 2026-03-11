export interface ToolGuide {
  name: string;
  best_for: string[];
  input_format: string;
  example: string;
  anti_patterns: AntiPattern[];
  complexity_limits: ComplexityLimit[];
  tips: string[];
}

interface AntiPattern {
  pattern: string;
  why: string;
  fix: string;
}

interface ComplexityLimit {
  metric: string;
  recommended_max: number;
  warning: string;
}

export const TOOL_GUIDES: Record<string, ToolGuide> = {
  mermaid: {
    name: "render_mermaid",
    best_for: [
      "Flowcharts and decision trees",
      "Sequence diagrams (API call flows)",
      "ER diagrams (database schemas)",
      "State diagrams",
      "Gantt charts",
      "Git graphs",
      "Pie charts",
    ],
    input_format:
      "Mermaid DSL - must start with diagram type declaration (flowchart, sequenceDiagram, erDiagram, etc.)",
    example: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
    anti_patterns: [
      {
        pattern: "Using 'graph' instead of 'flowchart'",
        why: "'graph' is legacy syntax with fewer features",
        fix: "Use 'flowchart TD' (top-down) or 'flowchart LR' (left-right)",
      },
      {
        pattern: "Unquoted special characters in labels",
        why: "Characters like (), {}, [] have syntactic meaning in Mermaid",
        fix: 'Wrap labels with special chars in quotes: A["my (label)"]',
      },
      {
        pattern: "Missing diagram type declaration",
        why: "First line must declare the diagram type",
        fix: "Start with: flowchart TD, sequenceDiagram, erDiagram, stateDiagram-v2, gantt, pie, gitGraph",
      },
      {
        pattern: "Using HTML tags like <br> in labels",
        why: "Mermaid CLI (mmdc) does not support HTML in labels",
        fix: "Use plain text only in node labels",
      },
      {
        pattern: "Semicolons at end of lines",
        why: "Mermaid DSL doesn't use semicolons - they cause parse errors",
        fix: "Remove all semicolons from diagram code",
      },
    ],
    complexity_limits: [
      {
        metric: "nodes",
        recommended_max: 25,
        warning:
          "Diagrams with >25 nodes become unreadable. Split into sub-diagrams or use subgraphs.",
      },
      {
        metric: "lines of code",
        recommended_max: 50,
        warning:
          "Keep diagrams under 50 lines. Longer diagrams are harder to debug and slow to render.",
      },
    ],
    tips: [
      "Use subgraph blocks to group related nodes",
      "SVG format is preferred - smaller files, clean git diffs",
      "The 'neutral' theme works best for documentation",
      "Use 'forest' theme for dark backgrounds",
      "Flowchart directions: TD (top-down), LR (left-right), BT (bottom-top), RL (right-left)",
    ],
  },

  d2: {
    name: "render_d2",
    best_for: [
      "Architecture diagrams with containers and nested groups",
      "System design with icons and labels",
      "Network topology diagrams",
      "Complex layouts that need ELK engine",
    ],
    input_format:
      "D2 DSL - shapes, connections, and containers with optional styles",
    example: `server: Backend Server {
  api: REST API
  db: PostgreSQL
  api -> db: queries
}
client: Browser {
  app: React App
}
client.app -> server.api: HTTP/JSON`,
    anti_patterns: [
      {
        pattern: "Forgetting to close container braces",
        why: "Unclosed braces cause cryptic parse errors",
        fix: "Match every opening { with a closing }",
      },
      {
        pattern: "Using Mermaid syntax (-->, subgraph)",
        why: "D2 has its own syntax - Mermaid keywords are not valid",
        fix: "Use D2 arrows: ->, <-, <->. Use containers: name: { ... }",
      },
      {
        pattern: "Requesting PNG without understanding the overhead",
        why: "PNG requires SVG-to-PNG conversion via Chromium, much slower",
        fix: "Use SVG unless PNG is specifically needed for non-SVG contexts",
      },
    ],
    complexity_limits: [
      {
        metric: "nodes",
        recommended_max: 30,
        warning:
          "D2 handles complexity better than Mermaid but >30 nodes still hurts readability.",
      },
      {
        metric: "nesting depth",
        recommended_max: 3,
        warning:
          "Deeply nested containers (>3 levels) become hard to read. Flatten or split.",
      },
    ],
    tips: [
      "Use dagre layout (default) for hierarchical diagrams",
      "Use elk layout for complex diagrams with many crossing edges",
      "Theme 0 = default, 1 = neutral grey, 3 = terminal green, 100 = neutral default",
      "D2 supports shape kinds: rectangle (default), oval, diamond, cylinder, cloud, etc.",
      "Use -- for connections without arrows, -> for directed, <-> for bidirectional",
    ],
  },

  graphviz: {
    name: "render_graphviz",
    best_for: [
      "Dependency graphs (package, module, class)",
      "Network and infrastructure diagrams",
      "Large auto-layout graphs (100+ nodes)",
      "Tree structures",
      "Call graphs and flow analysis",
    ],
    input_format:
      "DOT language - must be wrapped in 'digraph name { ... }' or 'graph name { ... }'",
    example: `digraph G {
    rankdir=LR;
    node [shape=box, style=filled, fillcolor="#f0f0f0"];
    A -> B -> C;
    A -> D;
    B -> D;
}`,
    anti_patterns: [
      {
        pattern: "Missing 'digraph' or 'graph' wrapper",
        why: "DOT source must be wrapped in a digraph{} or graph{} block",
        fix: "Always start with: digraph G { ... } or graph G { ... }",
      },
      {
        pattern: "Using -> in undirected graphs",
        why: "'graph' blocks require -- not ->",
        fix: "Use -> with digraph, -- with graph",
      },
      {
        pattern: "Using 'dot' engine for everything",
        why: "Different engines suit different graph structures",
        fix: "dot=hierarchical, neato=spring model, fdp=force-directed, circo=circular, twopi=radial, sfdp=large graphs",
      },
    ],
    complexity_limits: [
      {
        metric: "nodes",
        recommended_max: 100,
        warning:
          "Graphviz handles large graphs well, but >100 nodes may need sfdp engine for performance.",
      },
      {
        metric: "edges",
        recommended_max: 200,
        warning:
          "Dense graphs (>200 edges) become spaghetti. Use clustering or filter edges.",
      },
    ],
    tips: [
      "Use rankdir=LR for left-to-right layout, TB (default) for top-to-bottom",
      "Use subgraph cluster_name { ... } for grouped nodes (prefix 'cluster_' is required)",
      "sfdp engine handles very large graphs (1000+ nodes) efficiently",
      "neato is best for undirected graphs with natural clustering",
      "Node shapes: box, ellipse, diamond, record, Mrecord, plaintext, circle, doublecircle",
    ],
  },

  vegalite: {
    name: "render_chart",
    best_for: [
      "Bar charts and histograms",
      "Line charts and time series",
      "Scatter plots and bubble charts",
      "Area charts",
      "Heatmaps",
      "Box plots",
      "Layered/composite charts",
    ],
    input_format:
      'Vega-Lite JSON specification (as a string). Must include "$schema", "data", "mark", and "encoding".',
    example: JSON.stringify(
      {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        data: {
          values: [
            { category: "A", value: 28 },
            { category: "B", value: 55 },
            { category: "C", value: 43 },
          ],
        },
        mark: "bar",
        encoding: {
          x: { field: "category", type: "nominal" },
          y: { field: "value", type: "quantitative" },
        },
      },
      null,
      2
    ),
    anti_patterns: [
      {
        pattern: 'Missing "$schema" field',
        why: "Without $schema, vl-convert may not know which Vega-Lite version to use",
        fix: 'Add "$schema": "https://vega.github.io/schema/vega-lite/v5.json"',
      },
      {
        pattern: "Using 'type: ordinal' for continuous numeric data",
        why: "Ordinal treats values as discrete categories, breaking axis scaling",
        fix: "Use 'quantitative' for numbers, 'temporal' for dates, 'nominal' for categories",
      },
      {
        pattern: "Inline data with thousands of rows",
        why: "Large inline datasets bloat the spec and slow rendering",
        fix: "Keep inline data under 500 rows. For larger datasets, aggregate first.",
      },
      {
        pattern: "Omitting encoding types",
        why: "Vega-Lite requires explicit type declarations for each encoding channel",
        fix: "Always specify type: 'quantitative', 'nominal', 'ordinal', or 'temporal'",
      },
    ],
    complexity_limits: [
      {
        metric: "data points",
        recommended_max: 500,
        warning:
          "Charts with >500 inline data points are slow to render and produce large files.",
      },
      {
        metric: "layers",
        recommended_max: 5,
        warning:
          "More than 5 layers makes charts hard to read. Consider splitting into multiple charts.",
      },
    ],
    tips: [
      'Always include "$schema" for version compatibility',
      "PNG with scale factor 2 produces crisp retina output",
      "Use 'color' encoding channel for multi-series charts",
      "Vega-Lite auto-infers axis labels from field names - use 'title' in encoding to override",
      "Use 'layer' for overlaying multiple marks (e.g., line + point)",
    ],
  },

  html_page: {
    name: "render_html_page",
    best_for: [
      "Technical documentation with rich formatting",
      "Visual project summaries and reports",
      "Architecture decision records",
      "API documentation pages",
      "Data analysis reports with tables and KPIs",
    ],
    input_format:
      "HTML body content (the inner content — not a full page). The tool wraps it in a themed template with CSS design system.",
    example: `<section id="overview">
  <h2>Overview</h2>
  <p>This system processes incoming data through three stages.</p>
  <div class="mf-grid mf-grid-3">
    <div class="mf-card">
      <div class="mf-kpi">
        <div class="mf-kpi-value">99.9%</div>
        <div class="mf-kpi-label">Uptime</div>
      </div>
    </div>
    <div class="mf-card">
      <div class="mf-kpi">
        <div class="mf-kpi-value">45ms</div>
        <div class="mf-kpi-label">P95 Latency</div>
      </div>
    </div>
    <div class="mf-card">
      <div class="mf-kpi">
        <div class="mf-kpi-value">12M</div>
        <div class="mf-kpi-label">Requests/Day</div>
      </div>
    </div>
  </div>
</section>`,
    anti_patterns: [
      {
        pattern: "Including <html>, <head>, or <body> tags",
        why: "The tool generates the full page wrapper — body_html is the inner content only",
        fix: "Provide only the content that goes inside <main>. No DOCTYPE, html, head, or body tags.",
      },
      {
        pattern: "Using generic CSS class names like .card, .container",
        why: "May collide with embedded libraries (Mermaid, Chart.js). Use mf- prefixed classes.",
        fix: "Use the design system classes: mf-card, mf-container, mf-hero, mf-elevated, mf-grid, etc.",
      },
      {
        pattern: "Adding external CSS/JS via <link> or <script src>",
        why: "Pages should be self-contained for portability and offline use",
        fix: "Use the built-in design system. For Mermaid diagrams, use render_mermaid and embed the SVG.",
      },
      {
        pattern: "Huge inline images as base64 data URIs",
        why: "Bloats the HTML file. Use render_mermaid/render_chart for diagrams instead.",
        fix: "Reference generated SVG/PNG files via relative paths in <img> tags.",
      },
    ],
    complexity_limits: [
      {
        metric: "sections",
        recommended_max: 10,
        warning: "Pages with >10 sections are better split into multiple pages.",
      },
      {
        metric: "body HTML size",
        recommended_max: 50000,
        warning: "Body HTML >50KB suggests the content should be split into multiple pages.",
      },
    ],
    tips: [
      "Use mf-hero for the main highlight section, mf-elevated for secondary highlights",
      "Use mf-grid mf-grid-2 or mf-grid-3 for responsive card grids",
      "Use mf-kpi with mf-kpi-value and mf-kpi-label for key metrics",
      "Use mf-badge-success/warning/error/info for status indicators",
      "Add id attributes to <section> and pass nav_sections for automatic section navigation",
      "Themes: swiss (clean docs), midnight (presentations), warm (reports), terminal (dev content)",
    ],
  },

  slides: {
    name: "render_slides",
    best_for: [
      "Technical presentations and talks",
      "Project status updates",
      "Architecture overviews",
      "Code walkthroughs",
      "Sprint review presentations",
    ],
    input_format:
      'JSON array of slide objects: [{"title": "...", "content": "...", "type": "content"}]. Content is HTML.',
    example: JSON.stringify(
      [
        {
          title: "My Presentation",
          content: "A brief overview of the system architecture",
          type: "title",
        },
        {
          title: "Key Metrics",
          content:
            '<div class="mf-kpi"><div class="mf-kpi-value">99.9%</div><div class="mf-kpi-label">Uptime</div></div>',
          type: "kpi",
        },
        {
          title: "Architecture",
          content:
            "<ul><li>Frontend: React + TypeScript</li><li>Backend: Node.js + Express</li><li>Database: PostgreSQL</li></ul>",
          type: "content",
        },
      ],
      null,
      2
    ),
    anti_patterns: [
      {
        pattern: "Too much text per slide",
        why: "Slides should be visual aids, not documents. Dense text loses the audience.",
        fix: "Max 5-6 bullet points per content slide. Max 25 words for quote slides. Max 10 code lines.",
      },
      {
        pattern: "Missing slide types",
        why: "Using only 'content' type makes every slide look the same",
        fix: "Mix slide types: title, content, split, code, quote, kpi, section, image",
      },
      {
        pattern: "More than 30 slides",
        why: "Long decks lose audience attention and take too long to present",
        fix: "Keep decks under 30 slides. Split into multiple decks if needed.",
      },
      {
        pattern: "No title slide",
        why: "First slide should introduce the topic",
        fix: 'Make the first slide type: "title" with the presentation title and a brief subtitle',
      },
    ],
    complexity_limits: [
      {
        metric: "slides",
        recommended_max: 30,
        warning: "Decks with >30 slides lose audience attention.",
      },
      {
        metric: "bullets per slide",
        recommended_max: 6,
        warning: "More than 6 bullets per slide is too dense. Split across slides.",
      },
    ],
    tips: [
      "Navigate: Arrow keys, Space, PageUp/PageDown, Home/End. Touch: swipe left/right.",
      "Slide types: title (opening), section (divider), content (bullets), split (two columns), code, quote, kpi, image",
      "Use 'section' type slides as dividers between major topics",
      "KPI slides: put mf-kpi blocks in content for auto-grid layout",
      "Code slides: put code directly in content (will be wrapped in <pre><code>)",
      "Quote slides: title becomes the attribution, content is the quote text",
    ],
  },
};

export function get_guide(tool_name: string): ToolGuide | null {
  const key = tool_name
    .replace(/^render_/, "")
    .replace(/^chart$/, "vegalite")
    .replace(/^html_page$/, "html_page");
  return TOOL_GUIDES[key] ?? null;
}

export function get_all_guides_summary(): string {
  const lines: string[] = [
    "Available rendering tools and their best use cases:\n",
  ];
  for (const [key, guide] of Object.entries(TOOL_GUIDES)) {
    lines.push(`## ${guide.name}`);
    lines.push(`Best for: ${guide.best_for.join(", ")}`);
    lines.push(`Complexity limits: ${guide.complexity_limits.map((c) => `${c.metric} <= ${c.recommended_max}`).join(", ")}`);
    lines.push("");
  }
  return lines.join("\n");
}
