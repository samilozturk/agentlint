import { execFileSync } from "node:child_process";
import process from "node:process";

function git(args, options = {}) {
  const result = execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

  return typeof result === "string" ? result.trim() : "";
}

function githubRemoteUrl() {
  const token = process.env.GITHUB_MIRROR_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_MIRROR_TOKEN is required to mirror the default branch to GitHub.",
    );
  }

  const repository =
    process.env.GITHUB_MIRROR_REPOSITORY ?? "samilozturk/agentlint";
  return `https://x-access-token:${encodeURIComponent(token)}@github.com/${repository}.git`;
}

function ensureMirrorRemote(remoteName, remoteUrl) {
  const remotes = git(["remote"]);

  if (!remotes.split(/\r?\n/).includes(remoteName)) {
    git(["remote", "add", remoteName, remoteUrl]);
    return;
  }

  git(["remote", "set-url", remoteName, remoteUrl]);
}

function gitExitCode(args, options = {}) {
  try {
    execFileSync("git", args, {
      stdio: ["ignore", "ignore", "pipe"],
      ...options,
    });
    return 0;
  } catch (error) {
    if (typeof error?.status === "number") {
      return error.status;
    }

    throw error;
  }
}

function isAncestor(ancestorRef, descendantRef) {
  return gitExitCode(["merge-base", "--is-ancestor", ancestorRef, descendantRef]) === 0;
}

function fetchRemoteBranch(remoteName, remoteRef, trackingRef) {
  git(["fetch", "--depth=1", remoteName, `${remoteRef}:${trackingRef}`], {
    stdio: ["ignore", "ignore", "pipe"],
  });
}

function pushWithLease(remoteName, remoteRef, expectedSha) {
  execFileSync(
    "git",
    [
      "push",
      `--force-with-lease=${remoteRef}:${expectedSha ?? ""}`,
      remoteName,
      `HEAD:${remoteRef}`,
    ],
    { stdio: "inherit" },
  );
}

function main() {
  const branchName = process.env.CI_COMMIT_BRANCH;
  const defaultBranch = process.env.CI_DEFAULT_BRANCH ?? "main";
  if (!branchName) {
    process.stderr.write("No CI_COMMIT_BRANCH set. Skipping GitHub branch mirror.\n");
    return;
  }

  if (branchName !== defaultBranch) {
    process.stderr.write(
      `Branch ${branchName} is not the default branch ${defaultBranch}. Skipping mirror.\n`,
    );
    return;
  }

  const remoteName = "github-mirror";
  ensureMirrorRemote(remoteName, githubRemoteUrl());

  const localSha = git(["rev-parse", "HEAD"]);
  const remoteRef = `refs/heads/${branchName}`;
  const remoteBranch = git(["ls-remote", "--heads", remoteName, remoteRef]);
  if (remoteBranch) {
    const [remoteSha] = remoteBranch.split(/\s+/);
    if (remoteSha === localSha) {
      process.stderr.write(
        `${branchName} already points to ${localSha} on GitHub. Skipping mirror.\n`,
      );
      return;
    }

    const trackingRef = `refs/remotes/${remoteName}/${branchName}`;
    fetchRemoteBranch(remoteName, remoteRef, trackingRef);

    if (isAncestor(trackingRef, "HEAD")) {
      process.stderr.write(
        `GitHub ${branchName} at ${remoteSha} is behind GitLab ${localSha}. Updating mirror with a lease-safe push.\n`,
      );
    } else if (isAncestor("HEAD", trackingRef)) {
      process.stderr.write(
        `GitHub ${branchName} advanced to ${remoteSha} outside GitLab. Replacing it with authoritative GitLab commit ${localSha} using force-with-lease.\n`,
      );
    } else {
      process.stderr.write(
        `GitHub ${branchName} diverged at ${remoteSha}. Replacing it with authoritative GitLab commit ${localSha} using force-with-lease.\n`,
      );
    }

    pushWithLease(remoteName, remoteRef, remoteSha);
    return;
  }

  process.stderr.write(
    `GitHub ${branchName} does not exist yet. Creating it from GitLab commit ${localSha}.\n`,
  );
  pushWithLease(remoteName, remoteRef);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
