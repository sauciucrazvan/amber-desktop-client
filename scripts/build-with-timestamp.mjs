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

function resolveReleaseBaseRef(options) {
  if (options.gitReleaseBase) {
    return options.gitReleaseBase;
  }

  const latestTag = runAndCapture("git", ["describe", "--tags", "--abbrev=0"]);
  if (latestTag.ok) {
    const value = latestTag.stdout.trim();
    if (value) return value;
  }

  return undefined;
}

function buildGitReleaseNotes(options) {
  const baseRef = resolveReleaseBaseRef(options);
  const range = baseRef ? `${baseRef}..HEAD` : "HEAD";
  const args = [
    "log",
    range,
    `--max-count=${options.gitReleaseLimit}`,
    "--pretty=format:- %h %s (%an)",
  ];

  const result = runAndCapture("git", args);
  if (!result.ok) {
    console.warn(
      "[build] could not generate git release notes; continuing without commit list.",
    );
    return undefined;
  }

  const commits = result.stdout.trim();
  if (!commits) {
    return baseRef
      ? `No new commits since ${baseRef}.`
      : "No commits found for release notes.";
  }

  const title = baseRef
    ? `Changes since ${baseRef}:`
    : `Recent changes (${options.gitReleaseLimit} commits max):`;

  return `${title}\n\n${commits}`;
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

function getReleaseInfoArgs(options, buildVersion) {
  if (!options.publish) return [];
  if (options.publishProvider?.toLowerCase() !== "github") return [];
  if (!options.includeGitReleaseNotes) return [];

  const releaseNotes = buildGitReleaseNotes(options);
  if (!releaseNotes) return [];

  return [
    `--config.releaseInfo.releaseName=v${buildVersion}`,
    `--config.releaseInfo.releaseNotes=${releaseNotes}`,
  ];
}

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
const releaseInfoArgs = getReleaseInfoArgs(buildOptions, buildVersion);

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
