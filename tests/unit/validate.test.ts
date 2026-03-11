import { describe, it, expect } from "vitest";
import {
  validate_mermaid,
  validate_d2,
  validate_graphviz,
  validate_vegalite,
  validation_error,
} from "../../src/core/validate.js";

describe("validate_mermaid", () => {
  it("accepts valid flowchart", () => {
    const r = validate_mermaid("flowchart TD\n  A --> B");
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("accepts sequenceDiagram", () => {
    const r = validate_mermaid("sequenceDiagram\n  A->>B: hello");
    expect(r.valid).toBe(true);
  });

  it("rejects empty input", () => {
    const r = validate_mermaid("");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Empty");
  });

  it("rejects missing diagram type", () => {
    const r = validate_mermaid("A --> B\nB --> C");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("diagram type");
  });

  it("warns on legacy graph syntax", () => {
    const r = validate_mermaid("graph LR\n  A --> B");
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.includes("legacy"))).toBe(true);
  });

  it("warns on semicolons", () => {
    const r = validate_mermaid("flowchart TD\n  A --> B;");
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.includes("semicolons"))).toBe(true);
  });

  it("warns on HTML tags", () => {
    const r = validate_mermaid('flowchart TD\n  A["line<br>break"] --> B');
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.includes("HTML"))).toBe(true);
  });

  it("warns on high node count", () => {
    const nodes = Array.from({ length: 30 }, (_, i) => `  N${i}[Node ${i}]`);
    const r = validate_mermaid(`flowchart TD\n${nodes.join("\n")}`);
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.includes("nodes"))).toBe(true);
  });
});

describe("validate_d2", () => {
  it("accepts valid D2", () => {
    const r = validate_d2("a -> b: connection");
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejects empty input", () => {
    const r = validate_d2("");
    expect(r.valid).toBe(false);
  });

  it("rejects Mermaid syntax", () => {
    const r = validate_d2("flowchart TD\n  A --> B");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Mermaid");
  });

  it("rejects subgraph keyword", () => {
    const r = validate_d2("subgraph cluster\n  a -> b\nend");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("subgraph");
  });

  it("rejects unbalanced braces", () => {
    const r = validate_d2("server: Backend {\n  api: REST");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Unbalanced");
  });

  it("warns on deep nesting", () => {
    const r = validate_d2("a: {\n  b: {\n    c: {\n      d: {\n        e: leaf\n      }\n    }\n  }\n}");
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.includes("Nesting"))).toBe(true);
  });
});

describe("validate_graphviz", () => {
  it("accepts valid digraph", () => {
    const r = validate_graphviz("digraph G {\n  A -> B;\n}");
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("accepts strict graph", () => {
    const r = validate_graphviz("strict graph G {\n  A -- B;\n}");
    expect(r.valid).toBe(true);
  });

  it("rejects empty input", () => {
    const r = validate_graphviz("");
    expect(r.valid).toBe(false);
  });

  it("rejects missing graph wrapper", () => {
    const r = validate_graphviz("A -> B;\nB -> C;");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("digraph");
  });

  it("rejects -> in undirected graph", () => {
    const r = validate_graphviz("graph G {\n  A -> B;\n}");
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("'--'"))).toBe(true);
  });

  it("rejects unbalanced braces", () => {
    const r = validate_graphviz("digraph G {\n  A -> B;");
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Unbalanced"))).toBe(true);
  });
});

describe("validate_vegalite", () => {
  it("accepts valid spec", () => {
    const spec = JSON.stringify({
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      data: { values: [{ x: 1, y: 2 }] },
      mark: "point",
      encoding: {
        x: { field: "x", type: "quantitative" },
        y: { field: "y", type: "quantitative" },
      },
    });
    const r = validate_vegalite(spec);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejects empty input", () => {
    const r = validate_vegalite("");
    expect(r.valid).toBe(false);
  });

  it("rejects invalid JSON", () => {
    const r = validate_vegalite("{bad json");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Invalid JSON");
  });

  it("rejects missing data field", () => {
    const r = validate_vegalite(
      JSON.stringify({ $schema: "...", mark: "bar", encoding: {} })
    );
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("data");
  });

  it("rejects missing mark field", () => {
    const r = validate_vegalite(
      JSON.stringify({ $schema: "...", data: { values: [] }, encoding: {} })
    );
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("mark");
  });

  it("warns on missing $schema", () => {
    const r = validate_vegalite(
      JSON.stringify({
        data: { values: [{ x: 1 }] },
        mark: "bar",
        encoding: { x: { field: "x", type: "nominal" } },
      })
    );
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.includes("$schema"))).toBe(true);
  });

  it("warns on large inline data", () => {
    const values = Array.from({ length: 600 }, (_, i) => ({ x: i }));
    const r = validate_vegalite(
      JSON.stringify({
        $schema: "...",
        data: { values },
        mark: "point",
        encoding: { x: { field: "x", type: "quantitative" } },
      })
    );
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.includes("600"))).toBe(true);
  });

  it("accepts composite specs without mark", () => {
    const r = validate_vegalite(
      JSON.stringify({
        $schema: "...",
        data: { values: [{ x: 1 }] },
        layer: [{ mark: "bar", encoding: {} }],
      })
    );
    expect(r.valid).toBe(true);
  });
});

describe("validation_error", () => {
  it("returns null for valid input", () => {
    const r = validation_error(
      { valid: true, errors: [], warnings: [] },
      "https://example.com"
    );
    expect(r).toBeNull();
  });

  it("returns MediaToolResult for invalid input", () => {
    const r = validation_error(
      { valid: false, errors: ["bad input"], warnings: ["also this"] },
      "https://example.com"
    );
    expect(r).not.toBeNull();
    expect(r!.status).toBe("error");
    expect(r!.error_type).toBe("syntax_error");
    expect(r!.error_message).toContain("bad input");
    expect(r!.suggestion).toContain("also this");
  });
});
