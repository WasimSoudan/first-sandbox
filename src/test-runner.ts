import type { Sandbox } from "@vercel/sandbox";

export type TestFinding = {
  severity: "medium" | "high";
  category: "test-failure";
  summary: string;
  details: string;
};

export type PackageManagerCommands = {
  name: "pnpm" | "npm" | "yarn";
  install: { cmd: string; args: string[]; cwd: string };
  test: { cmd: string; args: string[]; cwd: string };
};

const FAILURE_MARKERS = ["FAIL ", "✕ ", "× "];

export async function detectPackageManager(
  sandbox: Sandbox,
  repoDir = "repo"
): Promise<PackageManagerCommands> {
  const checks: Array<{ file: string; commands: PackageManagerCommands }> = [
    {
      file: "pnpm-lock.yaml",
      commands: {
        name: "pnpm",
        install: { cmd: "pnpm", args: ["install"], cwd: repoDir },
        test: { cmd: "pnpm", args: ["test"], cwd: repoDir },
      },
    },
    {
      file: "yarn.lock",
      commands: {
        name: "yarn",
        install: { cmd: "yarn", args: ["install"], cwd: repoDir },
        test: { cmd: "yarn", args: ["test"], cwd: repoDir },
      },
    },
    {
      file: "package-lock.json",
      commands: {
        name: "npm",
        install: { cmd: "npm", args: ["install"], cwd: repoDir },
        test: { cmd: "npm", args: ["test"], cwd: repoDir },
      },
    },
  ];

  for (const { file, commands } of checks) {
    if (await sandbox.fs.exists(`${repoDir}/${file}`)) {
      return commands;
    }
  }

  // No lockfile at all: default to npm install as the last-resort fallback
  return {
    name: "npm",
    install: { cmd: "npm", args: ["install"], cwd: repoDir },
    test: { cmd: "npm", args: ["test"], cwd: repoDir },
  };
}

export function parseTestFailures(output: string): TestFinding[] {
  const lines = output.split("\n");

  return lines
    .map((line) => line.trim())
    .filter((line) => FAILURE_MARKERS.some((marker) => line.startsWith(marker)))
    .map((line) => ({
      severity: "high" as const,
      category: "test-failure" as const,
      summary: "Automated test failure",
      details: line,
    }));
}
