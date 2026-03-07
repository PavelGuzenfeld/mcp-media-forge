import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, mkdirSync } from "node:fs";
import { render_mermaid } from "../../src/tools/mermaid.js";

const OUTPUT_DIR = "docs/generated";

describe("render_mermaid (integration)", () => {
  beforeAll(() => {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  it("renders a simple flowchart to SVG", async () => {
    const result = await render_mermaid(
      "graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Done]",
      "svg",
      "default"
    );

    expect(result.status).toBe("completed");
    expect(result.format).toBe("svg");
    expect(result.output_path).toMatch(/mermaid-.*\.svg$/);
    expect(result.embed_markdown).toMatch(/!\[.*\]\(\.\/docs\/generated\/mermaid-/);
    expect(result.size_bytes).toBeGreaterThan(0);

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
    expect(svg).toContain("Start");
    expect(svg).toContain("Decision");
  });

  it("renders a sequence diagram to SVG", async () => {
    const code = `sequenceDiagram
    participant C as Client
    participant S as Server
    C->>S: Request
    S-->>C: Response`;

    const result = await render_mermaid(code, "svg", "default");
    expect(result.status).toBe("completed");

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
    expect(svg).toContain("Client");
    expect(svg).toContain("Server");
  });

  it("renders to PNG format", async () => {
    const result = await render_mermaid(
      "graph LR\n    A --> B",
      "png",
      "default"
    );

    expect(result.status).toBe("completed");
    expect(result.format).toBe("png");
    expect(result.output_path).toMatch(/\.png$/);

    const buf = readFileSync(result.output_path!);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50); // P
    expect(buf[2]).toBe(0x4e); // N
    expect(buf[3]).toBe(0x47); // G
  });

  it("supports dark theme", async () => {
    const result = await render_mermaid(
      "graph LR\n    A --> B",
      "svg",
      "dark"
    );
    expect(result.status).toBe("completed");
  });

  it("caches identical inputs", async () => {
    const code = "graph TD\n    X --> Y";
    const first = await render_mermaid(code, "svg", "default");
    const second = await render_mermaid(code, "svg", "default");

    expect(first.output_path).toBe(second.output_path);
    expect(second.status).toBe("completed");
  });

  it("returns structured error for invalid syntax", async () => {
    const result = await render_mermaid(
      "not valid mermaid at all }{}{",
      "svg",
      "default"
    );

    expect(result.status).toBe("error");
    expect(result.error_type).toBeDefined();
    expect(result.error_message).toBeDefined();
    expect(result.suggestion).toBeDefined();
  });

  it("renders an ER diagram", async () => {
    const code = `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        int id
    }`;

    const result = await render_mermaid(code, "svg", "default");
    expect(result.status).toBe("completed");

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
  });
}, 60_000);
