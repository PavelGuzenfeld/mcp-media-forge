import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, mkdirSync } from "node:fs";
import { render_d2 } from "../../src/tools/d2.js";

const OUTPUT_DIR = "docs/generated";

describe("render_d2 (integration)", () => {
  beforeAll(() => {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  it("renders a simple diagram to SVG", async () => {
    const result = await render_d2("a -> b -> c", "svg");

    expect(result.status).toBe("completed");
    expect(result.format).toBe("svg");
    expect(result.output_path).toMatch(/d2-.*\.svg$/);
    expect(result.embed_markdown).toMatch(/!\[.*\]\(\.\/docs\/generated\/d2-/);
    expect(result.size_bytes).toBeGreaterThan(0);

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
  });

  it("renders architecture diagram with containers", async () => {
    const code = `direction: right

client: Client {
  browser: Browser
}

server: Backend {
  api: API
  db: Database
}

client.browser -> server.api: HTTPS
server.api -> server.db: SQL`;

    const result = await render_d2(code, "svg");
    expect(result.status).toBe("completed");

    const svg = readFileSync(result.output_path!, "utf-8");
    expect(svg).toContain("<svg");
  });

  it("renders to PNG format", async () => {
    const result = await render_d2("x -> y", "png");

    expect(result.status).toBe("completed");
    expect(result.format).toBe("png");

    const buf = readFileSync(result.output_path!);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it("supports theme selection", async () => {
    const result = await render_d2("a -> b", "svg", 3); // terminal theme
    expect(result.status).toBe("completed");
  });

  it("caches identical inputs", async () => {
    const first = await render_d2("p -> q", "svg");
    const second = await render_d2("p -> q", "svg");
    expect(first.output_path).toBe(second.output_path);
  });

  it("returns structured error for invalid syntax", async () => {
    const result = await render_d2("}{invalid d2}{", "svg");
    expect(result.status).toBe("error");
    expect(result.error_message).toBeDefined();
    expect(result.suggestion).toBeDefined();
  });
}, 60_000);
