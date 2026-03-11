import type { MediaToolResult } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// --- Mermaid ---

const MERMAID_DIAGRAM_TYPES = [
  "flowchart",
  "sequenceDiagram",
  "erDiagram",
  "stateDiagram",
  "stateDiagram-v2",
  "gantt",
  "pie",
  "gitGraph",
  "classDiagram",
  "journey",
  "mindmap",
  "timeline",
  "quadrantChart",
  "graph",
];

export function validate_mermaid(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    errors.push("Empty diagram code");
    return { valid: false, errors, warnings };
  }

  const first_line = trimmed.split("\n")[0]!.trim();
  const has_type = MERMAID_DIAGRAM_TYPES.some((t) =>
    first_line.startsWith(t)
  );
  if (!has_type) {
    errors.push(
      `First line must declare diagram type. Got: "${first_line.slice(0, 50)}". ` +
        `Valid types: ${MERMAID_DIAGRAM_TYPES.join(", ")}`
    );
  }

  if (first_line.startsWith("graph ")) {
    warnings.push(
      "'graph' is legacy syntax. Consider 'flowchart' for more features."
    );
  }

  if (/;\s*$/m.test(trimmed)) {
    warnings.push(
      "Mermaid DSL doesn't use semicolons. Remove trailing semicolons to avoid parse errors."
    );
  }

  if (/<br\s*\/?>|<[a-z]+[> ]/i.test(trimmed)) {
    warnings.push(
      "HTML tags in labels are not supported by Mermaid CLI (mmdc). Use plain text."
    );
  }

  const node_matches = trimmed.match(/\b\w+[\[({]/g);
  const node_count = node_matches ? node_matches.length : 0;
  if (node_count > 25) {
    warnings.push(
      `Diagram has ~${node_count} nodes (recommended max: 25). Consider splitting into sub-diagrams.`
    );
  }

  const line_count = trimmed.split("\n").length;
  if (line_count > 50) {
    warnings.push(
      `Diagram has ${line_count} lines (recommended max: 50). Large diagrams are harder to debug.`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

// --- D2 ---

export function validate_d2(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = code.trim();

  if (!trimmed) {
    errors.push("Empty diagram code");
    return { valid: false, errors, warnings };
  }

  if (/^(flowchart|sequenceDiagram|erDiagram|graph\s)/m.test(trimmed)) {
    errors.push(
      "This looks like Mermaid syntax, not D2. Use render_mermaid instead."
    );
  }

  if (/\bsubgraph\b/.test(trimmed)) {
    errors.push(
      "'subgraph' is Mermaid syntax. In D2, use containers: name: { ... }"
    );
  }

  let depth = 0;
  for (const ch of trimmed) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) {
    errors.push(
      `Unbalanced braces (${depth > 0 ? "missing closing }" : "extra closing }"}). Check container blocks.`
    );
  }

  const content_lines = trimmed
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (content_lines.length > 40) {
    warnings.push(
      `Diagram has ${content_lines.length} statements (recommended max: 40). Consider splitting.`
    );
  }

  let max_depth = 0;
  let cur = 0;
  for (const ch of trimmed) {
    if (ch === "{") { cur++; max_depth = Math.max(max_depth, cur); }
    if (ch === "}") cur--;
  }
  if (max_depth > 3) {
    warnings.push(
      `Nesting depth is ${max_depth} (recommended max: 3). Deeply nested containers hurt readability.`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

// --- Graphviz ---

export function validate_graphviz(dot_source: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = dot_source.trim();

  if (!trimmed) {
    errors.push("Empty DOT source");
    return { valid: false, errors, warnings };
  }

  if (!/^\s*(strict\s+)?(digraph|graph)\s/m.test(trimmed)) {
    errors.push(
      "DOT source must start with 'digraph name {' or 'graph name {'. Missing graph declaration."
    );
  }

  if (/^\s*graph\s/m.test(trimmed) && /->/.test(trimmed)) {
    errors.push(
      "Undirected 'graph' blocks require '--' not '->'. Use 'digraph' for directed edges."
    );
  }

  let depth = 0;
  for (const ch of trimmed) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) {
    errors.push(
      `Unbalanced braces in DOT source (${depth > 0 ? "missing }" : "extra }"})`
    );
  }

  const edge_defs = trimmed.match(/(->|--)/g);
  if (edge_defs && edge_defs.length > 200) {
    warnings.push(
      `Graph has ~${edge_defs.length} edges (recommended max: 200). Dense graphs produce spaghetti layouts.`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

// --- Vega-Lite ---

export function validate_vegalite(spec_json: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmed = spec_json.trim();

  if (!trimmed) {
    errors.push("Empty Vega-Lite spec");
    return { valid: false, errors, warnings };
  }

  let spec: Record<string, unknown>;
  try {
    spec = JSON.parse(trimmed);
  } catch (e) {
    errors.push(
      `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`
    );
    return { valid: false, errors, warnings };
  }

  if (!spec.$schema) {
    warnings.push(
      'Missing "$schema". Add: "$schema": "https://vega.github.io/schema/vega-lite/v5.json"'
    );
  }

  if (!spec.data) {
    errors.push(
      'Missing "data" field. Vega-Lite specs require inline data or a URL.'
    );
  }

  const is_composite =
    spec.layer || spec.hconcat || spec.vconcat || spec.concat;
  if (!spec.mark && !is_composite) {
    errors.push(
      'Missing "mark" field. Specify chart type: "bar", "line", "point", "area", etc.'
    );
  }

  if (!spec.encoding && !is_composite) {
    warnings.push(
      'Missing "encoding" field. Most charts need x/y encoding channels.'
    );
  }

  if (spec.data && typeof spec.data === "object" && "values" in (spec.data as object)) {
    const values = (spec.data as { values: unknown[] }).values;
    if (Array.isArray(values) && values.length > 500) {
      warnings.push(
        `Inline data has ${values.length} rows (recommended max: 500). Large datasets slow rendering.`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// Convert fatal validation errors to a MediaToolResult
export function validation_error(
  result: ValidationResult,
  doc_url: string
): MediaToolResult | null {
  if (result.valid) return null;
  return {
    status: "error",
    error_type: "syntax_error",
    error_message: result.errors.join("; "),
    suggestion:
      result.warnings.length > 0
        ? `Also note: ${result.warnings.join("; ")}. See ${doc_url}`
        : `See ${doc_url}`,
  };
}
