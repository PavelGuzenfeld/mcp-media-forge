import { createHash } from "node:crypto";

export function content_hash(
  tool_name: string,
  params: Record<string, unknown>
): string {
  const input = `${tool_name}|${JSON.stringify(params)}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 12);
}
