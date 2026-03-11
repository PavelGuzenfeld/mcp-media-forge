/**
 * CSS design system inspired by visual-explainer.
 * - 4 curated theme presets (custom properties)
 * - Depth tiers for visual hierarchy
 * - Component patterns with `mf-` prefix (avoid collisions)
 * - prefers-reduced-motion support
 * - Dark mode via prefers-color-scheme or [data-theme="dark"]
 */

export type Theme = "swiss" | "midnight" | "warm" | "terminal";

export const THEME_META: Record<
  Theme,
  { label: string; description: string }
> = {
  swiss: {
    label: "Swiss Clean",
    description: "White, geometric, single blue accent — best for technical docs",
  },
  midnight: {
    label: "Midnight Editorial",
    description: "Deep navy, serif typography, gold accents — best for presentations",
  },
  warm: {
    label: "Warm Signal",
    description: "Cream paper, bold sans, terracotta — best for reports",
  },
  terminal: {
    label: "Terminal Mono",
    description: "Dark background, monospace, green/cyan — best for developer content",
  },
};

function theme_vars(theme: Theme): string {
  switch (theme) {
    case "swiss":
      return `
      --bg: #ffffff; --surface: #f8f9fa; --elevated: #ffffff;
      --text: #1a1a2e; --text-secondary: #4a4a6a; --text-muted: #8888a0;
      --accent: #2563eb; --accent-hover: #1d4ed8; --accent-subtle: #dbeafe;
      --border: #e2e8f0; --border-strong: #cbd5e1;
      --success: #059669; --warning: #d97706; --error: #dc2626;
      --font-body: 'Inter', system-ui, -apple-system, sans-serif;
      --font-heading: 'Inter', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      --radius: 8px; --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
      --shadow-md: 0 4px 12px rgba(0,0,0,.08); --shadow-lg: 0 12px 32px rgba(0,0,0,.12);`;
    case "midnight":
      return `
      --bg: #0f172a; --surface: #1e293b; --elevated: #334155;
      --text: #f1f5f9; --text-secondary: #cbd5e1; --text-muted: #94a3b8;
      --accent: #f59e0b; --accent-hover: #d97706; --accent-subtle: #451a03;
      --border: #334155; --border-strong: #475569;
      --success: #34d399; --warning: #fbbf24; --error: #f87171;
      --font-body: 'Georgia', 'Times New Roman', serif;
      --font-heading: 'Georgia', 'Times New Roman', serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      --radius: 6px; --shadow-sm: 0 1px 3px rgba(0,0,0,.3);
      --shadow-md: 0 4px 12px rgba(0,0,0,.4); --shadow-lg: 0 12px 32px rgba(0,0,0,.5);`;
    case "warm":
      return `
      --bg: #fdf6ee; --surface: #f5ebe0; --elevated: #ffffff;
      --text: #2d2013; --text-secondary: #5c4a32; --text-muted: #8b7355;
      --accent: #c2410c; --accent-hover: #9a3412; --accent-subtle: #fff7ed;
      --border: #e7d5c0; --border-strong: #d4b896;
      --success: #15803d; --warning: #ca8a04; --error: #b91c1c;
      --font-body: 'Source Sans 3', system-ui, sans-serif;
      --font-heading: 'Source Sans 3', system-ui, sans-serif;
      --font-mono: 'Source Code Pro', monospace;
      --radius: 10px; --shadow-sm: 0 1px 2px rgba(45,32,19,.06);
      --shadow-md: 0 4px 12px rgba(45,32,19,.1); --shadow-lg: 0 12px 32px rgba(45,32,19,.15);`;
    case "terminal":
      return `
      --bg: #0a0a0a; --surface: #161616; --elevated: #1e1e1e;
      --text: #e0e0e0; --text-secondary: #a0a0a0; --text-muted: #666666;
      --accent: #22d3ee; --accent-hover: #06b6d4; --accent-subtle: #083344;
      --border: #2a2a2a; --border-strong: #3a3a3a;
      --success: #4ade80; --warning: #facc15; --error: #f87171;
      --font-body: 'JetBrains Mono', 'Fira Code', monospace;
      --font-heading: 'JetBrains Mono', 'Fira Code', monospace;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      --radius: 4px; --shadow-sm: 0 1px 2px rgba(0,0,0,.4);
      --shadow-md: 0 4px 12px rgba(0,0,0,.5); --shadow-lg: 0 12px 32px rgba(0,0,0,.6);`;
  }
}

export function base_css(theme: Theme): string {
  return `
    :root { ${theme_vars(theme)} }

    /* --- Reset & Base --- */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; scroll-behavior: smooth; }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
    body {
      font-family: var(--font-body); color: var(--text); background: var(--bg);
      line-height: 1.7; -webkit-font-smoothing: antialiased;
    }

    /* --- Typography --- */
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading); line-height: 1.3; color: var(--text);
    }
    h1 { font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem; }
    h2 { font-size: 1.75rem; font-weight: 700; margin: 2rem 0 0.75rem; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
    p { margin-bottom: 1rem; color: var(--text-secondary); }
    a { color: var(--accent); text-decoration: none; }
    a:hover { color: var(--accent-hover); text-decoration: underline; }
    strong { color: var(--text); font-weight: 600; }
    code {
      font-family: var(--font-mono); font-size: 0.875em;
      background: var(--surface); padding: 0.15em 0.4em; border-radius: 4px;
      border: 1px solid var(--border);
    }
    pre {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 1rem 1.25rem; overflow-x: auto; margin-bottom: 1.5rem;
    }
    pre code { background: none; border: none; padding: 0; font-size: 0.85rem; }
    ul, ol { margin: 0 0 1rem 1.5rem; color: var(--text-secondary); }
    li { margin-bottom: 0.35rem; }
    blockquote {
      border-left: 4px solid var(--accent); padding: 0.75rem 1.25rem;
      background: var(--accent-subtle); border-radius: 0 var(--radius) var(--radius) 0;
      margin-bottom: 1.5rem; font-style: italic; color: var(--text-secondary);
    }

    /* --- Tables --- */
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    th, td {
      padding: 0.625rem 1rem; text-align: left; border-bottom: 1px solid var(--border);
    }
    th { font-weight: 600; color: var(--text); background: var(--surface); }
    tr:hover td { background: var(--surface); }

    /* --- Depth Tiers --- */
    .mf-hero {
      background: var(--elevated); box-shadow: var(--shadow-lg);
      border-radius: var(--radius); padding: 2.5rem; margin-bottom: 2rem;
    }
    .mf-elevated {
      background: var(--elevated); box-shadow: var(--shadow-md);
      border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.5rem;
    }
    .mf-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 1.25rem; margin-bottom: 1rem;
    }
    .mf-recessed {
      background: var(--surface); border-radius: var(--radius);
      padding: 1rem; margin-bottom: 1rem; opacity: 0.85;
    }

    /* --- Layout --- */
    .mf-container { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
    .mf-grid { display: grid; gap: 1.5rem; }
    .mf-grid-2 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .mf-grid-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .mf-flex { display: flex; gap: 1rem; flex-wrap: wrap; }
    .mf-split { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    @media (max-width: 768px) { .mf-split { grid-template-columns: 1fr; } }

    /* --- Components --- */
    .mf-badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600;
      padding: 0.2em 0.6em; border-radius: 999px; text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .mf-badge-success { background: var(--success); color: white; }
    .mf-badge-warning { background: var(--warning); color: white; }
    .mf-badge-error { background: var(--error); color: white; }
    .mf-badge-info { background: var(--accent); color: white; }

    .mf-kpi {
      text-align: center; padding: 1.5rem;
    }
    .mf-kpi-value {
      font-size: 2.5rem; font-weight: 800; color: var(--accent);
      line-height: 1.1; margin-bottom: 0.25rem;
    }
    .mf-kpi-label {
      font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* --- Section Nav (IntersectionObserver-based) --- */
    .mf-nav {
      position: fixed; top: 1rem; right: 1rem; z-index: 100;
      background: var(--elevated); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 0.75rem 1rem;
      box-shadow: var(--shadow-md); max-height: calc(100vh - 2rem);
      overflow-y: auto; font-size: 0.8rem;
    }
    .mf-nav a {
      display: block; padding: 0.25rem 0; color: var(--text-muted);
      transition: color 0.2s;
    }
    .mf-nav a.active { color: var(--accent); font-weight: 600; }
    @media (max-width: 1200px) { .mf-nav { display: none; } }

    /* --- Utilities --- */
    .mf-text-center { text-align: center; }
    .mf-text-muted { color: var(--text-muted); }
    .mf-mt-2 { margin-top: 2rem; }
    .mf-mb-2 { margin-bottom: 2rem; }
    .mf-sr-only {
      position: absolute; width: 1px; height: 1px; overflow: hidden;
      clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
  `;
}
