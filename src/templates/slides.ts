/**
 * Self-contained slide deck template.
 * Full presentation engine with keyboard/touch navigation,
 * progress bar, multiple slide types, and transitions.
 * Inspired by visual-explainer's SlideEngine.
 */

import { base_css, type Theme } from "./styles.js";

export interface Slide {
  title: string;
  content: string;
  type?: SlideType;
  notes?: string;
}

export type SlideType =
  | "title"
  | "content"
  | "split"
  | "code"
  | "quote"
  | "kpi"
  | "image"
  | "section";

export interface SlideDeckOptions {
  title: string;
  slides: Slide[];
  theme: Theme;
  author?: string;
}

export function build_slide_deck(options: SlideDeckOptions): string {
  const { title, slides, theme, author } = options;

  const slides_html = slides
    .map((slide, i) => {
      const type = slide.type || "content";
      return `
      <section class="mf-slide mf-slide-${type}" data-index="${i}" ${slide.notes ? `data-notes="${esc(slide.notes)}"` : ""}>
        <div class="mf-slide-inner">
          ${slide_content(slide, type, i === 0 ? author : undefined)}
        </div>
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>
    ${base_css(theme)}
    ${slide_css()}
  </style>
</head>
<body>
  <div class="mf-deck" id="mf-deck">
    ${slides_html}
  </div>

  <div class="mf-controls">
    <div class="mf-progress" id="mf-progress">
      <div class="mf-progress-bar" id="mf-progress-bar"></div>
    </div>
    <div class="mf-counter" id="mf-counter"></div>
    <div class="mf-dots" id="mf-dots">
      ${slides.map((_, i) => `<button class="mf-dot" data-index="${i}" aria-label="Slide ${i + 1}"></button>`).join("")}
    </div>
  </div>

  <script>${slide_engine_js()}</script>
</body>
</html>`;
}

function slide_content(
  slide: Slide,
  type: SlideType,
  author?: string
): string {
  switch (type) {
    case "title":
      return `
        <h1 class="mf-slide-title">${esc(slide.title)}</h1>
        <div class="mf-slide-subtitle">${slide.content}</div>
        ${author ? `<div class="mf-slide-author">${esc(author)}</div>` : ""}`;
    case "section":
      return `
        <h2 class="mf-slide-section-heading">${esc(slide.title)}</h2>
        <div class="mf-slide-section-desc">${slide.content}</div>`;
    case "quote":
      return `
        <blockquote class="mf-slide-quote">${slide.content}</blockquote>
        <div class="mf-slide-attribution">${esc(slide.title)}</div>`;
    case "kpi":
      return `
        <h3 class="mf-slide-heading">${esc(slide.title)}</h3>
        <div class="mf-slide-kpi-grid">${slide.content}</div>`;
    case "code":
      return `
        <h3 class="mf-slide-heading">${esc(slide.title)}</h3>
        <pre class="mf-slide-code"><code>${slide.content}</code></pre>`;
    case "split":
      return `
        <h3 class="mf-slide-heading">${esc(slide.title)}</h3>
        <div class="mf-slide-split">${slide.content}</div>`;
    case "image":
      return `
        <h3 class="mf-slide-heading">${esc(slide.title)}</h3>
        <div class="mf-slide-image">${slide.content}</div>`;
    default: // "content"
      return `
        <h3 class="mf-slide-heading">${esc(slide.title)}</h3>
        <div class="mf-slide-body">${slide.content}</div>`;
  }
}

function slide_css(): string {
  return `
    /* --- Slide Deck Layout --- */
    body { overflow: hidden; height: 100vh; }
    .mf-deck {
      width: 100vw; height: 100vh; position: relative; overflow: hidden;
    }
    .mf-slide {
      position: absolute; inset: 0; display: flex; align-items: center;
      justify-content: center; padding: 3rem;
      opacity: 0; transform: translateX(40px);
      transition: opacity 0.4s ease, transform 0.4s ease;
      pointer-events: none; background: var(--bg);
    }
    .mf-slide.active {
      opacity: 1; transform: translateX(0); pointer-events: auto; z-index: 1;
    }
    .mf-slide.prev {
      opacity: 0; transform: translateX(-40px);
    }
    @media (prefers-reduced-motion: reduce) {
      .mf-slide { transition: none; transform: none; }
      .mf-slide.prev { transform: none; }
    }
    .mf-slide-inner {
      max-width: 900px; width: 100%;
    }

    /* --- Slide Types --- */
    .mf-slide-title { text-align: center; }
    .mf-slide-title .mf-slide-title { font-size: 3rem; margin-bottom: 1rem; }
    .mf-slide-title .mf-slide-subtitle {
      font-size: 1.35rem; color: var(--text-secondary); margin-bottom: 1.5rem;
    }
    .mf-slide-title .mf-slide-author {
      font-size: 0.9rem; color: var(--text-muted);
    }

    .mf-slide-section { text-align: center; }
    .mf-slide-section-heading {
      font-size: 2.5rem; color: var(--accent); margin-bottom: 0.75rem;
    }
    .mf-slide-section-desc {
      font-size: 1.2rem; color: var(--text-secondary);
    }

    .mf-slide-heading {
      font-size: 1.75rem; margin-bottom: 1.25rem;
      border-bottom: 2px solid var(--accent); padding-bottom: 0.5rem;
    }
    .mf-slide-body { font-size: 1.1rem; color: var(--text-secondary); }
    .mf-slide-body ul, .mf-slide-body ol { margin-left: 1.5rem; }
    .mf-slide-body li { margin-bottom: 0.6rem; font-size: 1.1rem; }

    .mf-slide-quote {
      font-size: 1.5rem; font-style: italic; border-left: 4px solid var(--accent);
      padding: 1.5rem 2rem; background: var(--surface); border-radius: 0 var(--radius) var(--radius) 0;
      margin-bottom: 1rem; max-width: 700px;
    }
    .mf-slide-attribution {
      font-size: 0.9rem; color: var(--text-muted); text-align: right;
    }

    .mf-slide-kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1.5rem;
    }

    .mf-slide-code pre {
      font-size: 0.85rem; max-height: 60vh; overflow: auto;
    }

    .mf-slide-split {
      display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
    }
    @media (max-width: 768px) {
      .mf-slide-split { grid-template-columns: 1fr; }
    }

    .mf-slide-image {
      display: flex; justify-content: center; align-items: center;
    }
    .mf-slide-image img {
      max-width: 100%; max-height: 60vh; border-radius: var(--radius);
      box-shadow: var(--shadow-md);
    }

    /* --- Controls --- */
    .mf-controls {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
      padding: 0.5rem 1.5rem 1rem; display: flex; align-items: center;
      gap: 1rem; background: linear-gradient(transparent, var(--bg));
    }
    .mf-progress {
      flex: 1; height: 3px; background: var(--border); border-radius: 2px;
      overflow: hidden;
    }
    .mf-progress-bar {
      height: 100%; background: var(--accent); transition: width 0.3s ease;
      width: 0%;
    }
    .mf-counter {
      font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);
      min-width: 4em; text-align: right;
    }
    .mf-dots {
      display: flex; gap: 0.35rem;
    }
    .mf-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--border-strong); border: none; cursor: pointer;
      transition: background 0.2s, transform 0.2s; padding: 0;
    }
    .mf-dot.active {
      background: var(--accent); transform: scale(1.3);
    }
    @media (min-width: 769px) and (max-width: 1200px) {
      .mf-dots { display: none; }
    }
  `;
}

function slide_engine_js(): string {
  return `
    (function() {
      var slides = document.querySelectorAll('.mf-slide');
      var dots = document.querySelectorAll('.mf-dot');
      var bar = document.getElementById('mf-progress-bar');
      var counter = document.getElementById('mf-counter');
      var current = 0;
      var total = slides.length;

      function go(index) {
        if (index < 0 || index >= total) return;
        slides.forEach(function(s, i) {
          s.classList.remove('active', 'prev');
          if (i === index) s.classList.add('active');
          else if (i < index) s.classList.add('prev');
        });
        dots.forEach(function(d, i) {
          d.classList.toggle('active', i === index);
        });
        bar.style.width = ((index + 1) / total * 100) + '%';
        counter.textContent = (index + 1) + ' / ' + total;
        current = index;
      }

      function next() { go(current + 1); }
      function prev() { go(current - 1); }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
        else if (e.key === 'Home') { e.preventDefault(); go(0); }
        else if (e.key === 'End') { e.preventDefault(); go(total - 1); }
      });

      dots.forEach(function(d) {
        d.addEventListener('click', function() {
          go(parseInt(d.getAttribute('data-index')));
        });
      });

      var touchStartX = 0;
      document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
      });
      document.addEventListener('touchend', function(e) {
        var diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 50) {
          if (diff < 0) next(); else prev();
        }
      });

      go(0);
    })();
  `;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
