import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve_output_path } from "../../src/core/output.js";
import { cache_lookup } from "../../src/core/cache.js";

const TEST_DIR = "docs/generated";

describe("cache_lookup", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    try { rmSync(TEST_DIR, { recursive: true, force: true }); }
    catch { /* parallel cleanup race — harmless */ }
  });

  it("returns null for missing file", () => {
    const result = cache_lookup("mermaid", { code: "nonexistent" }, "svg");
    expect(result).toBeNull();
  });

  it("returns MediaToolResult for existing file", () => {
    const params = { code: "graph LR; A-->B" };
    const output_path = resolve_output_path("mermaid", params, "svg");
    writeFileSync(output_path, "<svg>test</svg>");

    const result = cache_lookup("mermaid", params, "svg");
    expect(result).not.toBeNull();
    expect(result!.status).toBe("completed");
    expect(result!.format).toBe("svg");
    expect(result!.size_bytes).toBeGreaterThan(0);
    expect(result!.embed_markdown).toContain("mermaid-");
    expect(result!.output_path).toContain("docs/generated/mermaid-");
  });
});
