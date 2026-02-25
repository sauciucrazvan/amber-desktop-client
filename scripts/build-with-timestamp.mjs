import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

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
const buildVersion = `${shortYear}.${month}.${day}-${pad2(hour)}${pad2(minute)}`;
const buildLabel = `Built on ${monthName} ${day}${suffix}, ${year} at ${pad2(hour)}:${pad2(minute)} ${meridiem}`;
const buildIso = now.toISOString();

const buildInfoPath = path.join(rootDir, "src", "build-info.ts");
const buildInfoContent = `export const BUILD_ID = "${buildId}";\nexport const BUILD_VERSION = "${buildVersion}";\nexport const BUILD_LABEL = "${buildLabel}";\nexport const BUILD_ISO = "${buildIso}";\n`;

writeFileSync(buildInfoPath, buildInfoContent, "utf8");

console.log(`[build] ${buildLabel}`);
console.log(`[build] version: ${buildVersion}`);
console.log(`[build] id: ${buildId}`);

run("npm", ["exec", "tsc"]);
run("npm", ["exec", "vite", "build"]);
run("npm", [
  "exec",
  "electron-builder",
  "--",
  `--config.extraMetadata.version=${buildVersion}`,
  `--config.extraMetadata.buildTimestamp=${buildLabel}`,
  `--config.extraMetadata.buildId=${buildId}`,
]);
