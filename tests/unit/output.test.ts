import { describe, it, expect } from "vitest";
import path from "node:path";
import { resolve_output_path, relative_path } from "../../src/core/output.js";

describe("resolve_output_path", () => {
  it("returns path under docs/generated", () => {
    const result = resolve_output_path("mermaid", { code: "test" }, "svg");
    expect(result).toContain("docs/generated");
    expect(result).toContain("mermaid-");
    expect(result.endsWith(".svg")).toBe(true);
  });

  it("includes content hash in filename", () => {
    const result = resolve_output_path("mermaid", { code: "test" }, "svg");
    const basename = path.basename(result);
    expect(basename).toMatch(/^mermaid-[0-9a-f]{12}\.svg$/);
  });

  it("is deterministic", () => {
    const a = resolve_output_path("mermaid", { code: "test" }, "svg");
    const b = resolve_output_path("mermaid", { code: "test" }, "svg");
    expect(a).toBe(b);
  });
});

describe("relative_path", () => {
  it("strips project root", () => {
    const abs = path.resolve(process.cwd(), "docs/generated/mermaid-abc.svg");
    const rel = relative_path(abs);
    expect(rel).toBe("docs/generated/mermaid-abc.svg");
  });
});
