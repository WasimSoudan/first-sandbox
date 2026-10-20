import { Sandbox } from "@vercel/sandbox";

type PackageManager = "pnpm" | "npm" | "yarn";

async function detectPackageManager(sandbox: Sandbox): Promise<PackageManager> {
  if (await sandbox.readFileToBuffer({ path: "repo/pnpm-lock.yaml" })) {
    return "pnpm";
  }
  if (await sandbox.readFileToBuffer({ path: "repo/yarn.lock" })) {
    return "yarn";
  }
  return "npm";
}

async function commandOutput(result: {
  stdout: () => Promise<string>;
  stderr: () => Promise<string>;
}): Promise<string> {
  const stdout = (await result.stdout()).trim();
  const stderr = (await result.stderr()).trim();
  return [stdout, stderr].filter(Boolean).join("\n");
}

const INTERESTING_PATHS = [
  "repo/package.json",
  "repo/src/index.ts",
  "repo/src/app.ts",
  "repo/lib/auth.ts",
];
export type TestResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};
export type LifecycleResult = {
  sandboxName: string;
  cloneExitCode: number;
  files: Array<{ path: string; content: string }>;
  testResult: TestResult;
};

export async function runSandboxLifecycle(
  repoUrl: string
): Promise<LifecycleResult> {
  const sandbox = await Sandbox.create({
    persistent: false,
    timeout: 10 * 60 * 1000,
  });

  try {
    const clone = await sandbox.runCommand("git", [
      "clone",
      "--depth",
      "1",
      repoUrl,
      "repo",
    ]);
    if (clone.exitCode !== 0) {
      throw new Error(`Clone failed: ${await clone.stderr()}`);
    }

    const files: Array<{ path: string; content: string }> = [];

    for (const fullPath of INTERESTING_PATHS) {
      const content = await sandbox.readFileToBuffer({ path: fullPath });
      if (content) {
        files.push({
          path: fullPath.replace(/^repo\//, ""),
          content: content.toString("utf8"),
        });
      }
    }
    const packageManager = await detectPackageManager(sandbox);
    const install = await sandbox.runCommand({
      cmd: packageManager,
      args: ["install"],
      cwd: "repo",
    });
    if (install.exitCode !== 0) {
      throw new Error(`Install failed: ${await commandOutput(install)}`);
    }
    const test = await sandbox.runCommand({
      cmd: packageManager,
      args: ["test"],
      cwd: "repo",
    });

    return {
      sandboxName: sandbox.name,
      cloneExitCode: clone.exitCode,
      files,
      testResult: {
        exitCode: test.exitCode,
        stdout: await test.stdout(),
        stderr: await test.stderr(),
      },
    };
  } finally {
    await sandbox.stop();
  }
}
