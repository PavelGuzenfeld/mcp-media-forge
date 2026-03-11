/**
 * Self-contained HTML page template.
 * Wraps LLM-generated body HTML in a themed design system shell
 * with optional section navigation.
 */

import { base_css, type Theme } from "./styles.js";

export interface PageOptions {
  title: string;
  body_html: string;
  theme: Theme;
  description?: string;
  nav_sections?: string[];
}

export function build_page(options: PageOptions): string {
  const { title, body_html, theme, description, nav_sections } = options;

  const nav_html =
    nav_sections && nav_sections.length > 0
      ? `<nav class="mf-nav" id="mf-nav" aria-label="Sections">
          ${nav_sections.map((s) => `<a href="#${slug(s)}">${esc(s)}</a>`).join("\n          ")}
        </nav>`
      : "";

  const nav_js =
    nav_sections && nav_sections.length > 0
      ? `<script>
        (function() {
          var links = document.querySelectorAll('#mf-nav a');
          if (!links.length) return;
          var targets = Array.from(links).map(function(a) {
            return document.querySelector(a.getAttribute('href'));
          }).filter(Boolean);
          var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                links.forEach(function(a) { a.classList.remove('active'); });
                var active = document.querySelector('#mf-nav a[href="#' + entry.target.id + '"]');
                if (active) active.classList.add('active');
              }
            });
          }, { rootMargin: '-20% 0px -60% 0px' });
          targets.forEach(function(t) { observer.observe(t); });
        })();
        </script>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  ${description ? `<meta name="description" content="${esc(description)}">` : ""}
  <style>${base_css(theme)}</style>
</head>
<body>
  ${nav_html}
  <main class="mf-container">
    <header class="mf-hero">
      <h1>${esc(title)}</h1>
      ${description ? `<p class="mf-text-muted">${esc(description)}</p>` : ""}
    </header>
    ${body_html}
  </main>
  ${nav_js}
</body>
</html>`;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
