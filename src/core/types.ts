export interface MediaToolResult {
  status: "completed" | "processing" | "error";

  // status = "completed"
  output_path?: string;
  format?: string;
  size_bytes?: number;
  embed_markdown?: string;
  warning?: string;

  // status = "processing" (async tools only)
  job_id?: string;
  estimated_seconds?: number;

  // status = "error"
  error_message?: string;
  error_type?:
    | "syntax_error"
    | "rendering_error"
    | "timeout"
    | "dependency_missing"
    | "output_error";
  line?: number;
  suggestion?: string;
}

export interface DockerExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
}
