import test from "node:test";
import assert from "node:assert/strict";

const githubRepoUrl = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

test("accepts a GitHub repository URL", () => {
  assert.equal(
    githubRepoUrl.test("https://github.com/WasimSoudan/first-sandbox"),
    true,
  );
});

test("rejects a non-GitHub URL", () => {
  assert.equal(githubRepoUrl.test("not-a-url"), false);
});
