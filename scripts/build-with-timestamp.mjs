import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DEFAULT_GITHUB_OWNER = "sauciucrazvan";
const DEFAULT_GITHUB_REPO = "amber-desktop-client";

function parseDotEnv(content) {
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    if (!key) continue;

    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function loadDotEnvFiles(baseDir) {
  const candidates = [".env", ".env.local"];

  for (const fileName of candidates) {
    const filePath = path.join(baseDir, fileName);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, "utf8");
    const parsed = parseDotEnv(content);

    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  const last = day % 10;
  if (last === 1) return "st";
  if (last === 2) return "nd";
  if (last === 3) return "rd";
  return "th";
}

function run(command, args, extraEnv = {}) {
  const isNpm = command === "npm";
  const runner = isNpm ? process.execPath : command;
  const runnerArgs = isNpm
    ? [process.env.npm_execpath, ...args].filter(Boolean)
    : args;

  console.log(`[build] running: ${command} ${args.join(" ")}`);

  const result = spawnSync(runner, runnerArgs, {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.error) {
    console.error(`[build] failed to start: ${command}`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(
      `[build] command failed (${result.status}): ${command} ${args.join(" ")}`,
    );
    process.exit(result.status ?? 1);
  }
}

function runAndCapture(command, args, extraEnv = {}) {
  const isNpm = command === "npm";
  const runner = isNpm ? process.execPath : command;
  const runnerArgs = isNpm
    ? [process.env.npm_execpath, ...args].filter(Boolean)
    : args;

  const result = spawnSync(runner, runnerArgs, {
    cwd: rootDir,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    encoding: "utf8",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  return {
    ok: !result.error && result.status === 0,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error,
    status: result.status,
  };
}

function parseBuildOptions(argv) {
  const defaultWinTargets = ["nsis"];

  const options = {
    linux: false,
    win: false,
    linuxTargets: ["AppImage"],
    winTargets: [...defaultWinTargets],
    forceMsi: false,
    publish: false,
    publishProvider: undefined,
    publishUrl: undefined,
    githubOwner: undefined,
    githubRepo: undefined,
    githubReleaseType: "release",
    includeGitReleaseNotes: false,
    gitReleaseBase: undefined,
    gitReleaseLimit: 30,
  };

  const hasTruthyNpmConfig = (key) => {
    const raw = process.env[`npm_config_${key}`];
    if (!raw) return false;
    const normalized = String(raw).trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  };

  for (const arg of argv) {
    // Support accidental `npm run build - --win` style invocation where `-` reaches this script.
    if (arg === "-" || arg === "--") {
      continue;
    }

    if (arg === "--all") {
      options.linux = true;
      options.win = true;
      continue;
    }

    if (arg === "--linux") {
      options.linux = true;
      continue;
    }

    if (arg === "--win" || arg === "--windows") {
      options.win = true;
      continue;
    }

    if (arg.startsWith("--linux-targets=")) {
      const value = arg.slice("--linux-targets=".length);
      options.linuxTargets = value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      options.linux = true;
      continue;
    }

    if (arg.startsWith("--win-targets=")) {
      const value = arg.slice("--win-targets=".length);
      options.winTargets = value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      options.win = true;
      continue;
    }

    if (arg === "--force-msi") {
      options.forceMsi = true;
      continue;
    }

    if (arg === "--publish") {
      options.publish = true;
      continue;
    }

    if (arg.startsWith("--publish-provider=")) {
      options.publishProvider = arg.slice("--publish-provider=".length).trim();
      options.publish = true;
      continue;
    }

    if (arg.startsWith("--publish-url=")) {
      options.publishUrl = arg.slice("--publish-url=".length).trim();
      options.publish = true;
      continue;
    }

    if (arg.startsWith("--github-owner=")) {
      options.githubOwner = arg.slice("--github-owner=".length).trim();
      options.publish = true;
      continue;
    }

    if (arg.startsWith("--github-repo=")) {
      options.githubRepo = arg.slice("--github-repo=".length).trim();
      options.publish = true;
      continue;
    }

    if (arg.startsWith("--github-release-type=")) {
      options.githubReleaseType = arg
        .slice("--github-release-type=".length)
        .trim();
      options.publish = true;
      continue;
    }

    if (arg === "--git-release-notes") {
      options.includeGitReleaseNotes = true;
      continue;
    }

    if (arg.startsWith("--git-release-base=")) {
      options.gitReleaseBase = arg.slice("--git-release-base=".length).trim();
      options.includeGitReleaseNotes = true;
      continue;
    }

    if (arg.startsWith("--git-release-limit=")) {
      const raw = arg.slice("--git-release-limit=".length).trim();
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.gitReleaseLimit = parsed;
      }
      options.includeGitReleaseNotes = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(
        `Usage: node scripts/build-with-timestamp.mjs [options]\n\nOptions:\n  --all                       Build both Linux and Windows artifacts\n  --linux                     Build Linux artifact(s)\n  --win | --windows           Build Windows artifact(s)\n  --linux-targets=a,b         Override Linux targets (default: AppImage)\n  --win-targets=a,b           Override Windows targets (default: nsis)\n  --force-msi                 Legacy flag (msi is replaced with nsis)\n  --publish                   Publish after build\n  --publish-provider=name     Publish provider: github or generic\n  --publish-url=url           Generic publish base URL\n  --github-owner=name         GitHub owner/org for releases\n  --github-repo=name          GitHub repository for releases\n  --github-release-type=kind  GitHub release type (default: release)\n  --git-release-notes         Add git commit list to GitHub release notes\n  --git-release-base=ref      Use commit/tag ref as release notes base\n  --git-release-limit=n       Max commits included in notes (default: 30)\n`,
      );
      process.exit(0);
    }
  }

  if (!options.linux && !options.win) {
    if (hasTruthyNpmConfig("all")) {
      options.linux = true;
      options.win = true;
    } else if (hasTruthyNpmConfig("linux")) {
      options.linux = true;
    } else if (hasTruthyNpmConfig("win") || hasTruthyNpmConfig("windows")) {
      options.win = true;
    }
  }

  if (!options.linux && !options.win) {
    options.linux = true;
    options.win = true;
  }

  if (options.linuxTargets.length === 0) {
    options.linuxTargets = ["AppImage"];
  }

  if (options.winTargets.length === 0) {
    options.winTargets = [...defaultWinTargets];
  }

  const hasMsiTarget = options.winTargets.some(
    (target) => target.toLowerCase() === "msi",
  );

  if (hasMsiTarget) {
    console.warn(
      "[build] msi target is disabled for this project. Switching to nsis.",
    );
    const nextTargets = options.winTargets
      .filter((target) => target.toLowerCase() !== "msi")
      .concat("nsis");

    options.winTargets = Array.from(
      new Set(nextTargets.map((target) => target.toLowerCase())),
    );
  }

  if (!options.publishProvider) {
    options.publishProvider = process.env.AMBER_PUBLISH_PROVIDER?.trim();
  }

  if (!options.publishUrl) {
    options.publishUrl =
      process.env.AMBER_PUBLISH_URL?.trim() ||
      process.env.AMBER_UPDATER_URL?.trim();
  }

  if (!options.githubOwner) {
    options.githubOwner =
      process.env.AMBER_GH_OWNER?.trim() ||
      process.env.GH_OWNER?.trim() ||
      DEFAULT_GITHUB_OWNER;
  }

  if (!options.githubRepo) {
    options.githubRepo =
      process.env.AMBER_GH_REPO?.trim() ||
      process.env.GH_REPO?.trim() ||
      DEFAULT_GITHUB_REPO;
  }

  if (!options.githubReleaseType) {
    options.githubReleaseType = "release";
  }

  if (!options.gitReleaseBase) {
    options.gitReleaseBase = process.env.AMBER_RELEASE_NOTES_BASE?.trim();
  }

  if (!options.includeGitReleaseNotes) {
    const envFlag = process.env.AMBER_GIT_RELEASE_NOTES?.trim().toLowerCase();
    options.includeGitReleaseNotes =
      envFlag === "1" || envFlag === "true" || envFlag === "yes";
  }

  if (!options.gitReleaseLimit || options.gitReleaseLimit < 1) {
    options.gitReleaseLimit = 30;
  }

  if (options.publish && !options.publishProvider) {
    console.error(
      "[build] publish requested, but no publish provider was set. Use --publish-provider=github|generic or AMBER_PUBLISH_PROVIDER.",
    );
    process.exit(1);
  }

  return options;
}

function parseReleaseTagValue(tag) {
  const match = /^v(\d+)\.(\d+)\.(\d+)(?:-h?(\d+))?$/.exec(tag);
  if (!match) return undefined;

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    revision: Number.parseInt(match[4] || "0", 10),
  };
}

function compareReleaseTagsDesc(leftTag, rightTag) {
  const left = parseReleaseTagValue(leftTag);
  const right = parseReleaseTagValue(rightTag);

  if (left && right) {
    if (left.major !== right.major) return right.major - left.major;
    if (left.minor !== right.minor) return right.minor - left.minor;
    if (left.patch !== right.patch) return right.patch - left.patch;
    if (left.revision !== right.revision) return right.revision - left.revision;
    return 0;
  }

  if (left && !right) return -1;
  if (!left && right) return 1;

  return rightTag.localeCompare(leftTag, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getRemoteReleaseTags() {
  const remoteTagsResult = runAndCapture("git", [
    "ls-remote",
    "--tags",
    "--refs",
    "origin",
    "v*",
  ]);

  if (!remoteTagsResult.ok) {
    return [];
  }

  return remoteTagsResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      const ref = parts[1] || "";
      return ref.replace(/^refs\/tags\//, "").trim();
    })
    .filter(Boolean);
}

function getLocalReleaseTags() {
  const localTagsResult = runAndCapture("git", ["tag", "--list", "v*"]);
  if (!localTagsResult.ok) {
    return [];
  }

  return localTagsResult.stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function getPreviousReleaseTagFromGithub(options, currentTagName) {
  if (!options.githubOwner || !options.githubRepo) {
    return undefined;
  }

  const token = getGithubReleaseToken();
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "amber-build-script",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${options.githubOwner}/${options.githubRepo}/releases?per_page=50`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    return undefined;
  }

  const releases = await response.json();
  if (!Array.isArray(releases)) {
    return undefined;
  }

  for (const release of releases) {
    const tagName = String(release?.tag_name || "").trim();
    if (!tagName) continue;
    if (tagName === currentTagName) continue;
    if (!tagName.startsWith("v")) continue;
    return tagName;
  }

  return undefined;
}

async function resolveReleaseBaseRef(options, currentTagName) {
  if (options.gitReleaseBase) {
    return options.gitReleaseBase;
  }

  const githubReleaseTag = await getPreviousReleaseTagFromGithub(
    options,
    currentTagName,
  );
  if (githubReleaseTag) {
    return githubReleaseTag;
  }

  const remoteTags = getRemoteReleaseTags();
  const localTags = getLocalReleaseTags();
  const allTags = Array.from(new Set([...remoteTags, ...localTags])).sort(
    compareReleaseTagsDesc,
  );

  for (const tag of allTags) {
    if (currentTagName && tag === currentTagName) continue;
    return tag;
  }

  return undefined;
}

function toGithubMention(loginOrName) {
  if (!loginOrName) return "unknown";
  const value = String(loginOrName).trim();
  if (!value) return "unknown";
  return value.startsWith("@") ? value : `@${value}`;
}

function mentionFromEmailOrName(email, name) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const noreplyMatch = /^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/.exec(
    normalizedEmail,
  );
  if (noreplyMatch?.[1]) {
    return toGithubMention(noreplyMatch[1]);
  }

  return String(name || "").trim() || "unknown";
}

async function getGithubCommitLines(options, baseRef, limit) {
  if (!options.githubOwner || !options.githubRepo) {
    return undefined;
  }

  const headShaResult = runAndCapture("git", ["rev-parse", "HEAD"]);
  if (!headShaResult.ok) {
    return undefined;
  }

  const headSha = headShaResult.stdout.trim();
  if (!headSha) {
    return undefined;
  }

  const token = getGithubReleaseToken();
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "amber-build-script",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${options.githubOwner}/${options.githubRepo}/compare/${encodeURIComponent(baseRef)}...${encodeURIComponent(headSha)}`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    return undefined;
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.commits)) {
    return undefined;
  }

  const lines = payload.commits.slice(0, limit).map((commit) => {
    const shortSha = String(commit?.sha || "").slice(0, 7) || "unknown";
    const subject = String(commit?.commit?.message || "")
      .split(/\r?\n/)[0]
      .trim();
    const mention = commit?.author?.login
      ? toGithubMention(commit.author.login)
      : mentionFromEmailOrName(
          commit?.commit?.author?.email,
          commit?.commit?.author?.name,
        );

    return `- ${shortSha} ${subject || "(no message)"} (${mention})`;
  });

  return lines.join("\n").trim() || undefined;
}

function getFallbackCommitLines(baseRef, limit) {
  const result = runAndCapture("git", [
    "log",
    `${baseRef}..HEAD`,
    `--max-count=${limit}`,
    "--pretty=format:%h%x09%s%x09%ae%x09%an",
  ]);

  if (!result.ok) {
    return undefined;
  }

  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sha = "", subject = "", email = "", name = ""] = line.split("\t");
      const mention = mentionFromEmailOrName(email, name);
      return `- ${sha || "unknown"} ${subject || "(no message)"} (${mention})`;
    });

  return lines.join("\n").trim() || undefined;
}

async function buildGitReleaseNotes(options, buildVersion) {
  const currentTagName = `v${buildVersion}`;
  const baseRef = await resolveReleaseBaseRef(options, currentTagName);
  if (!baseRef) {
    console.warn(
      "[build] no previous release tag found for git release notes; skipping release notes. Use --git-release-base=<ref> if needed.",
    );
    return undefined;
  }

  let commits = await getGithubCommitLines(
    options,
    baseRef,
    options.gitReleaseLimit,
  );
  if (!commits) {
    commits = getFallbackCommitLines(baseRef, options.gitReleaseLimit);
  }

  if (!commits) {
    console.warn(
      "[build] could not generate git release notes; continuing without commit list.",
    );
    return undefined;
  }

  if (!commits) {
    return {
      baseRef,
      content: `No new commits since ${baseRef}.`,
    };
  }

  const title = `Changes since ${baseRef}:`;

  return {
    baseRef,
    content: `${title}\n\n${commits}`,
  };
}

async function getReleaseNotesPayload(options, buildVersion) {
  if (!options.publish) return undefined;
  if (options.publishProvider?.toLowerCase() !== "github") return undefined;
  if (!options.includeGitReleaseNotes) return undefined;

  return buildGitReleaseNotes(options, buildVersion);
}

function getPublishArgs(options) {
  if (!options.publish) return [];

  const provider = options.publishProvider?.toLowerCase();
  if (provider === "generic") {
    if (!options.publishUrl) {
      console.error(
        "[build] generic publish requires --publish-url or AMBER_PUBLISH_URL/AMBER_UPDATER_URL.",
      );
      process.exit(1);
    }

    return [
      "--publish",
      "always",
      "--config.publish.provider=generic",
      `--config.publish.url=${options.publishUrl}`,
    ];
  }

  if (provider === "github") {
    if (!options.githubOwner || !options.githubRepo) {
      console.error(
        "[build] github publish requires owner and repo via --github-owner/--github-repo or AMBER_GH_OWNER/AMBER_GH_REPO.",
      );
      process.exit(1);
    }

    return [
      "--publish",
      "always",
      "--config.publish.provider=github",
      `--config.publish.owner=${options.githubOwner}`,
      `--config.publish.repo=${options.githubRepo}`,
      `--config.publish.releaseType=${options.githubReleaseType || "release"}`,
    ];
  }

  console.error(
    `[build] unsupported publish provider: ${options.publishProvider}. Use github or generic.`,
  );
  process.exit(1);
}

function getReleaseInfoArgs(options, buildVersion, releaseNotesPayload) {
  if (!options.publish) return [];
  if (options.publishProvider?.toLowerCase() !== "github") return [];
  if (!options.includeGitReleaseNotes) return [];
  if (!releaseNotesPayload?.content) return [];

  const releaseNotesFilePath = path.join(
    rootDir,
    ".tmp-github-release-notes.md",
  );
  writeFileSync(releaseNotesFilePath, releaseNotesPayload.content, "utf8");

  console.log(
    `[build] github release notes base: ${releaseNotesPayload.baseRef}; file: ${releaseNotesFilePath}`,
  );

  return [
    `--config.releaseInfo.releaseName=v${buildVersion}`,
    `--config.releaseInfo.releaseNotesFile=${releaseNotesFilePath}`,
  ];
}

function getGithubReleaseToken() {
  return (
    process.env.GITHUB_RELEASE_TOKEN?.trim() ||
    process.env.GH_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim()
  );
}

async function updateGithubReleaseBody(
  options,
  buildVersion,
  releaseNotesPayload,
) {
  if (!options.publish) return;
  if (options.publishProvider?.toLowerCase() !== "github") return;
  if (!releaseNotesPayload?.content) return;

  const token = getGithubReleaseToken();
  if (!token) {
    console.warn(
      "[build] skipping GitHub release body update: GH_TOKEN/GITHUB_TOKEN/GITHUB_RELEASE_TOKEN is not set.",
    );
    return;
  }

  const tagName = `v${buildVersion}`;
  const baseUrl = `https://api.github.com/repos/${options.githubOwner}/${options.githubRepo}`;
  const commonHeaders = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "amber-build-script",
  };

  let getReleaseResponse;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    getReleaseResponse = await fetch(
      `${baseUrl}/releases/tags/${encodeURIComponent(tagName)}`,
      {
        method: "GET",
        headers: commonHeaders,
      },
    );

    if (getReleaseResponse.ok) {
      break;
    }

    if (attempt < 5 && getReleaseResponse.status === 404) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    break;
  }

  if (!getReleaseResponse.ok) {
    const detail = await getReleaseResponse.text();
    console.warn(
      `[build] could not fetch GitHub release for tag ${tagName}: ${getReleaseResponse.status} ${detail}`,
    );
    return;
  }

  const release = await getReleaseResponse.json();
  const releaseId = release?.id;

  if (!releaseId) {
    console.warn(
      `[build] GitHub release for tag ${tagName} has no id; skipping body update.`,
    );
    return;
  }

  const patchResponse = await fetch(`${baseUrl}/releases/${releaseId}`, {
    method: "PATCH",
    headers: {
      ...commonHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: releaseNotesPayload.content,
      name: tagName,
    }),
  });

  if (!patchResponse.ok) {
    const detail = await patchResponse.text();
    console.warn(
      `[build] failed to update GitHub release body for ${tagName}: ${patchResponse.status} ${detail}`,
    );
    return;
  }

  console.log(`[build] GitHub release body updated for ${tagName}.`);
}

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const shortYear = year % 100;
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const monthName = now.toLocaleString("en-US", { month: "long" });
  const suffix = getOrdinalSuffix(day);
  const meridiem = hour >= 12 ? "PM" : "AM";

  const buildId = `${year}${pad2(month)}${pad2(day)}-${pad2(hour)}${pad2(minute)}`;
  const buildVersion = `${shortYear}.${month}.${day}-h${pad2(hour)}${pad2(minute)}`;
  const buildLabel = `Built on ${monthName} ${day}${suffix}, ${year} at ${pad2(hour)}:${pad2(minute)} ${meridiem}`;
  const buildIso = now.toISOString();

  loadDotEnvFiles(rootDir);

  const buildOptions = parseBuildOptions(process.argv.slice(2));
  const publishArgs = getPublishArgs(buildOptions);
  const releaseNotesPayload = await getReleaseNotesPayload(
    buildOptions,
    buildVersion,
  );
  const releaseInfoArgs = getReleaseInfoArgs(
    buildOptions,
    buildVersion,
    releaseNotesPayload,
  );

  const buildInfoPath = path.join(rootDir, "src", "build-info.ts");
  const buildInfoContent = `export const BUILD_ID = "${buildId}";\nexport const BUILD_VERSION = "${buildVersion}";\nexport const BUILD_LABEL = "${buildLabel}";\nexport const BUILD_ISO = "${buildIso}";\n`;

  writeFileSync(buildInfoPath, buildInfoContent, "utf8");

  console.log(`[build] ${buildLabel}`);
  console.log(`[build] version: ${buildVersion}`);
  console.log(`[build] id: ${buildId}`);

  run("npm", ["exec", "tsc"]);
  run("npm", ["exec", "vite", "build"]);

  const extraMetadataArgs = [
    `--config.extraMetadata.version=${buildVersion}`,
    `--config.extraMetadata.buildTimestamp=${buildLabel}`,
    `--config.extraMetadata.buildId=${buildId}`,
  ];

  if (buildOptions.linux) {
    run("npm", [
      "exec",
      "electron-builder",
      "--",
      "--linux",
      ...buildOptions.linuxTargets,
      ...extraMetadataArgs,
      ...publishArgs,
      ...releaseInfoArgs,
    ]);
  }

  if (buildOptions.win) {
    run("npm", [
      "exec",
      "electron-builder",
      "--",
      "--win",
      ...buildOptions.winTargets,
      ...extraMetadataArgs,
      ...publishArgs,
      ...releaseInfoArgs,
    ]);
  }

  await updateGithubReleaseBody(
    buildOptions,
    buildVersion,
    releaseNotesPayload,
  );
}

main().catch((error) => {
  console.error("[build] unexpected error", error);
  process.exit(1);
});
