import { execFile } from "node:child_process";
import type { DockerExecResult } from "./types.js";

const CONTAINER_NAME =
  process.env.MEDIA_FORGE_CONTAINER || "media-forge-renderer";
const DEFAULT_TIMEOUT = 30_000;

export async function docker_exec(
  command: string[],
  options: {
    stdin?: string;
    timeout?: number;
    env?: Record<string, string>;
  } = {}
): Promise<DockerExecResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  const args = ["exec"];
  if (options.stdin) args.push("-i");
  if (options.env) {
    for (const [k, v] of Object.entries(options.env)) {
      args.push("-e", `${k}=${v}`);
    }
  }
  args.push(CONTAINER_NAME, ...command);

  return new Promise((resolve) => {
    const child = execFile("docker", args, { timeout }, (error, stdout, stderr) => {
      const exit_code = error && "code" in error ? (error.code as number) : 0;
      resolve({
        success: !error,
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        exit_code: typeof exit_code === "number" ? exit_code : 1,
      });
    });

    if (options.stdin && child.stdin) {
      child.stdin.write(options.stdin);
      child.stdin.end();
    }
  });
}

export async function check_tool(tool_name: string): Promise<boolean> {
  const result = await docker_exec(["which", tool_name], { timeout: 5000 });
  return result.success;
}
