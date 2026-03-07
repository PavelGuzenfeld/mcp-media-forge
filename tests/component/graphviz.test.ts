import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, mkdirSync } from "node:fs";
import { render_graphviz } from "../../src/tools/graphviz.js";

const OUTPUT_DIR = "docs/generated";

describe("render_graphviz (integration)", () => {
  beforeAll(() => {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  it("renders a simple digraph to SVG", async () => {
    const dot = `digraph G {
      A -> B -> C;
      B -> D;
    }`;

    const result = await render_graphviz(dot, "dot", "svg");

    expect(result.status).toBe("completed");
    expect(result.format).toBe("svg");
    expect(result.output_path).toMatch(/graphviz-.*\.svg$/);
    expect(result.size_bytes).toBeGreaterThan(0);

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
  });

  it("renders dependency graph with styling", async () => {
    const dot = `digraph deps {
      rankdir=LR;
      node [shape=box, style=filled, fillcolor=lightblue];
      "app" -> "lib-a";
      "app" -> "lib-b";
      "lib-a" -> "core";
      "lib-b" -> "core";
    }`;

    const result = await render_graphviz(dot, "dot", "svg");
    expect(result.status).toBe("completed");

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
  });

  it("renders to PNG format", async () => {
    const result = await render_graphviz(
      "digraph G { A -> B }",
      "dot",
      "png"
    );

    expect(result.status).toBe("completed");
    const buf = readFileSync(result.output_path!);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("supports neato engine", async () => {
    const dot = `graph G {
      A -- B;
      B -- C;
      C -- A;
    }`;

    const result = await render_graphviz(dot, "neato", "svg");
    expect(result.status).toBe("completed");
  });

  it("supports circo engine", async () => {
    const dot = `digraph G {
      A -> B -> C -> D -> A;
    }`;

    const result = await render_graphviz(dot, "circo", "svg");
    expect(result.status).toBe("completed");
  });

  it("caches identical inputs", async () => {
    const dot = "digraph G { X -> Y }";
    const first = await render_graphviz(dot, "dot", "svg");
    const second = await render_graphviz(dot, "dot", "svg");
    expect(first.output_path).toBe(second.output_path);
  });

  it("returns structured error for invalid DOT", async () => {
    const result = await render_graphviz(
      "not valid dot }{{}",
      "dot",
      "svg"
    );
    expect(result.status).toBe("error");
    expect(result.error_message).toBeDefined();
  });
}, 30_000);
