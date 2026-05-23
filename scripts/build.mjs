import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DEFAULT_GITHUB_OWNER = "sauciucrazvan";
const DEFAULT_GITHUB_REPO = "amber-desktop-client";
const BUILD_TAG = `[\x1b[34mbuild\x1b[0m]`;

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, args, extraEnv = {}) {
  const isNpm = command === "npm";
  const runner = isNpm ? process.execPath : command;
  const runnerArgs = isNpm
    ? [process.env.npm_execpath, ...args].filter(Boolean)
    : args;

  console.log(`${BUILD_TAG} running: ${command} ${args.join(" ")}`);

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
    console.error(`${BUILD_TAG} failed to start: ${command}`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(
      `${BUILD_TAG} command failed (${result.status}): ${command} ${args.join(" ")}`,
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
    githubOwner: undefined,
    githubRepo: undefined,
    githubReleaseType: "release",
    gitReleaseBase: undefined,
    gitReleaseLimit: 30,
  };

  for (const arg of argv) {
    // Support accidental `npm run build - --win` style invocation where `-` reaches this script.
    if (arg === "-" || arg === "--") {
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

    if (arg.startsWith("--github-owner=")) {
      options.githubOwner = arg.slice("--github-owner=".length).trim();
      continue;
    }

    if (arg.startsWith("--github-repo=")) {
      options.githubRepo = arg.slice("--github-repo=".length).trim();
      continue;
    }

    if (arg.startsWith("--github-release-type=")) {
      options.githubReleaseType = arg
        .slice("--github-release-type=".length)
        .trim();
      continue;
    }

    if (arg.startsWith("--git-release-base=")) {
      options.gitReleaseBase = arg.slice("--git-release-base=".length).trim();
      continue;
    }

    if (arg.startsWith("--git-release-limit=")) {
      const raw = arg.slice("--git-release-limit=".length).trim();
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.gitReleaseLimit = parsed;
      }
      continue;
    }
  }

  if (!options.linux && !options.win) {
    options.linux = true;
    options.win = true;
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

  if (!options.gitReleaseLimit || options.gitReleaseLimit < 1) {
    options.gitReleaseLimit = 30;
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
  const headers = getGithubApiHeaders(token);

  let releases;
  try {
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

    releases = await response.json();
  } catch (error) {
    console.warn(
      `${BUILD_TAG} could not query GitHub releases for base tag selection: ${error?.message || error}`,
    );
    return undefined;
  }

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
  const headers = getGithubApiHeaders(token);

  let payload;
  try {
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

    payload = await response.json();
  } catch (error) {
    console.warn(
      `${BUILD_TAG} could not query GitHub compare API for commit mentions: ${error?.message || error}`,
    );
    return undefined;
  }

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
      `${BUILD_TAG} no previous release tag found for git release notes; skipping release notes. Use --git-release-base=<ref> if needed.`,
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
      `${BUILD_TAG} could not generate git release notes; continuing without commit list.`,
    );
    return undefined;
  }

  const title = `Changes since ${baseRef}:`;

  return {
    baseRef,
    content: `${title}\n\n${commits}`,
  };
}

async function getReleaseNotesPayload(options, buildVersion) {
  return buildGitReleaseNotes(options, buildVersion);
}

function getPublishArgs(options) {
  if (!options.githubOwner || !options.githubRepo) {
    console.error(
      `${BUILD_TAG} github publish requires owner and repo via --github-owner/--github-repo or AMBER_GH_OWNER/AMBER_GH_REPO.`,
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

function getReleaseInfoArgs(options, buildVersion, releaseNotesPayload) {
  if (!releaseNotesPayload?.content) return [];

  const releaseNotesFilePath = path.join(
    rootDir,
    ".tmp-github-release-notes.md",
  );
  writeFileSync(releaseNotesFilePath, releaseNotesPayload.content, "utf8");

  console.log(
    `${BUILD_TAG} github release notes base: ${releaseNotesPayload.baseRef}; file: ${releaseNotesFilePath}`,
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

function getGithubApiHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "amber-build-script",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function updateGithubReleaseBody(
  options,
  buildVersion,
  releaseNotesPayload,
) {
  if (!releaseNotesPayload?.content) return;

  const token = getGithubReleaseToken();
  if (!token) {
    console.warn(
      `${BUILD_TAG} skipping GitHub release body update: GH_TOKEN/GITHUB_TOKEN/GITHUB_RELEASE_TOKEN is not set.`,
    );
    return;
  }

  try {
    const tagName = `v${buildVersion}`;
    const baseUrl = `https://api.github.com/repos/${options.githubOwner}/${options.githubRepo}`;
    const commonHeaders = getGithubApiHeaders(token);

    let getReleaseResponse;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        getReleaseResponse = await fetch(
          `${baseUrl}/releases/tags/${encodeURIComponent(tagName)}`,
          {
            method: "GET",
            headers: commonHeaders,
          },
        );
      } catch (error) {
        if (attempt < 5) {
          await sleep(2000);
          continue;
        }

        console.warn(
          `${BUILD_TAG} could not fetch GitHub release for tag ${tagName}: ${error?.message || error}`,
        );
        return;
      }

      if (getReleaseResponse.ok) {
        break;
      }

      if (attempt < 5 && getReleaseResponse.status === 404) {
        await sleep(2000);
        continue;
      }

      break;
    }

    if (!getReleaseResponse?.ok) {
      const detail = getReleaseResponse
        ? await getReleaseResponse.text()
        : "no response";
      console.warn(
        `${BUILD_TAG} could not fetch GitHub release for tag ${tagName}: ${getReleaseResponse?.status || "n/a"} ${detail}`,
      );
      return;
    }

    const release = await getReleaseResponse.json();
    const releaseId = release?.id;

    if (!releaseId) {
      console.warn(
        `${BUILD_TAG} GitHub release for tag ${tagName} has no id; skipping body update.`,
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
        `${BUILD_TAG} failed to update GitHub release body for ${tagName}: ${patchResponse.status} ${detail}`,
      );
      return;
    }

    console.log(`${BUILD_TAG} GitHub release body updated for ${tagName}.`);
  } catch (error) {
    console.warn(
      `${BUILD_TAG} skipping GitHub release body update due to network/API error: ${error?.message || error}`,
    );
  }
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

  console.log(`${BUILD_TAG} ${buildLabel}`);
  console.log(`${BUILD_TAG} version: ${buildVersion}`);
  console.log(`${BUILD_TAG} id: ${buildId}`);

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
  console.error(`${BUILD_TAG} unexpected error`, error);
  process.exit(1);
});
