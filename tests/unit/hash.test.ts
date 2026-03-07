import { describe, it, expect } from "vitest";
import { content_hash } from "../../src/utils/hash.js";

describe("content_hash", () => {
  it("returns 12-char hex string", () => {
    const hash = content_hash("mermaid", { code: "graph LR; A-->B" });
    expect(hash).toMatch(/^[0-9a-f]{12}$/);
  });

  it("is deterministic", () => {
    const a = content_hash("mermaid", { code: "graph LR; A-->B", format: "svg" });
    const b = content_hash("mermaid", { code: "graph LR; A-->B", format: "svg" });
    expect(a).toBe(b);
  });

  it("differs for different inputs", () => {
    const a = content_hash("mermaid", { code: "graph LR; A-->B" });
    const b = content_hash("mermaid", { code: "graph LR; A-->C" });
    expect(a).not.toBe(b);
  });

  it("differs for different tool names", () => {
    const a = content_hash("mermaid", { code: "graph LR; A-->B" });
    const b = content_hash("d2", { code: "graph LR; A-->B" });
    expect(a).not.toBe(b);
  });

  it("includes all params in hash", () => {
    const a = content_hash("mermaid", { code: "x", format: "svg" });
    const b = content_hash("mermaid", { code: "x", format: "png" });
    expect(a).not.toBe(b);
  });
});
