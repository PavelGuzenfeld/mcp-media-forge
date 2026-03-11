import { describe, it, expect } from "vitest";
import {
  get_guide,
  get_all_guides_summary,
  TOOL_GUIDES,
} from "../../src/tools/guides.js";

describe("get_guide", () => {
  it("returns guide for 'mermaid'", () => {
    const g = get_guide("mermaid");
    expect(g).not.toBeNull();
    expect(g!.name).toBe("render_mermaid");
    expect(g!.best_for.length).toBeGreaterThan(0);
    expect(g!.anti_patterns.length).toBeGreaterThan(0);
    expect(g!.complexity_limits.length).toBeGreaterThan(0);
    expect(g!.tips.length).toBeGreaterThan(0);
    expect(g!.example).toBeTruthy();
  });

  it("returns guide for 'render_mermaid' (with prefix)", () => {
    const g = get_guide("render_mermaid");
    expect(g).not.toBeNull();
    expect(g!.name).toBe("render_mermaid");
  });

  it("returns guide for 'd2'", () => {
    expect(get_guide("d2")).not.toBeNull();
  });

  it("returns guide for 'graphviz'", () => {
    expect(get_guide("graphviz")).not.toBeNull();
  });

  it("returns guide for 'vegalite'", () => {
    expect(get_guide("vegalite")).not.toBeNull();
  });

  it("returns guide for 'chart' (alias)", () => {
    const g = get_guide("chart");
    expect(g).not.toBeNull();
    expect(g!.name).toBe("render_chart");
  });

  it("returns null for unknown tool", () => {
    expect(get_guide("unknown")).toBeNull();
  });
});

describe("get_all_guides_summary", () => {
  it("returns summary string mentioning all tools", () => {
    const summary = get_all_guides_summary();
    expect(summary).toContain("render_mermaid");
    expect(summary).toContain("render_d2");
    expect(summary).toContain("render_graphviz");
    expect(summary).toContain("render_chart");
  });
});

describe("TOOL_GUIDES", () => {
  it("has entries for all 4 tools", () => {
    expect(Object.keys(TOOL_GUIDES)).toEqual(
      expect.arrayContaining(["mermaid", "d2", "graphviz", "vegalite"])
    );
  });

  it("every guide has required fields", () => {
    for (const guide of Object.values(TOOL_GUIDES)) {
      expect(guide.name).toBeTruthy();
      expect(guide.best_for.length).toBeGreaterThan(0);
      expect(guide.input_format).toBeTruthy();
      expect(guide.example).toBeTruthy();
      expect(guide.anti_patterns.length).toBeGreaterThan(0);
      expect(guide.complexity_limits.length).toBeGreaterThan(0);
      expect(guide.tips.length).toBeGreaterThan(0);
    }
  });

  it("every anti_pattern has pattern, why, and fix", () => {
    for (const guide of Object.values(TOOL_GUIDES)) {
      for (const ap of guide.anti_patterns) {
        expect(ap.pattern).toBeTruthy();
        expect(ap.why).toBeTruthy();
        expect(ap.fix).toBeTruthy();
      }
    }
  });
});
