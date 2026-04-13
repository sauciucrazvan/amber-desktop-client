import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  ipcMain,
  shell,
} from "electron";
//import { createRequire } from 'node:module'
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { readFileSync, writeFileSync } from "node:fs";
import { autoUpdater } from "electron-updater";

//const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

if (VITE_DEV_SERVER_URL) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
  app.disableHardwareAcceleration();
}

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let splash: BrowserWindow | null;
let tray: Tray | null;

let isQuitting = false;
let allowTray = true;
let updaterCheckInterval: NodeJS.Timeout | null = null;
let launchHiddenAtStartup = false;

type UpdaterStatus =
  | "idle"
  | "disabled"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

type UpdaterState = {
  status: UpdaterStatus;
  message: string;
  progress: number;
  canAutoUpdate: boolean;
  updateVersion?: string;
};

type UpdaterProvider = "generic" | "github";

const DEFAULT_GITHUB_OWNER = "sauciucrazvan";
const DEFAULT_GITHUB_REPO = "amber-desktop-client";
const DEFAULT_GITHUB_LATEST_DOWNLOAD_URL = `https://github.com/${DEFAULT_GITHUB_OWNER}/${DEFAULT_GITHUB_REPO}/releases/latest/download`;

let updaterState: UpdaterState = {
  status: "idle",
  message: "Auto-updater has not started yet.",
  progress: 0,
  canAutoUpdate: false,
};

const SETTINGS_FILE = "app-settings.json";

type AppSettings = {
  allowTray?: boolean;
  startOnBoot?: boolean;
  preferredMicrophoneId?: string;
  preferredCameraId?: string;
  preferredSpeakerId?: string;
  selectedServerId?: string;
};

type ServerDefinition = {
  id: string;
  name: string;
  apiBaseUrl: string;
  wsBaseUrl: string;
};

type ServerConfigFile = {
  defaultServerId?: string;
  servers?: ServerDefinition[];
};

let preferredMicrophoneId = "";
let preferredCameraId = "";
let preferredSpeakerId = "";
let startOnBoot = false;
let selectedServerId = "";

const AMBER_SERVER_ID = "default";

function getSettingsPath() {
  return path.join(app.getPath("userData"), SETTINGS_FILE);
}

function loadSettings() {
  try {
    const raw = readFileSync(getSettingsPath(), "utf8");
    const parsed = JSON.parse(raw) as AppSettings;
    allowTray = parsed.allowTray ?? true;
    startOnBoot = parsed.startOnBoot ?? false;
    preferredMicrophoneId = parsed.preferredMicrophoneId ?? "";
    preferredCameraId = parsed.preferredCameraId ?? "";
    preferredSpeakerId = parsed.preferredSpeakerId ?? "";
    selectedServerId = parsed.selectedServerId ?? "";
  } catch {
    allowTray = true;
    startOnBoot = false;
    preferredMicrophoneId = "";
    preferredCameraId = "";
    preferredSpeakerId = "";
    selectedServerId = "";
  }
}

function saveSettings() {
  const payload: AppSettings = {
    allowTray,
    startOnBoot,
    preferredMicrophoneId,
    preferredCameraId,
    preferredSpeakerId,
    selectedServerId,
  };
  writeFileSync(getSettingsPath(), JSON.stringify(payload, null, 2), "utf8");
}

function getServersFilePath() {
  return path.join(process.env.APP_ROOT, "servers.json");
}

function normalizeServerDefinition(value: unknown): ServerDefinition | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Partial<ServerDefinition>;
  const id = typeof item.id === "string" ? item.id.trim() : "";
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const apiBaseUrl =
    typeof item.apiBaseUrl === "string" ? item.apiBaseUrl.trim() : "";
  const wsBaseUrl =
    typeof item.wsBaseUrl === "string" ? item.wsBaseUrl.trim() : "";

  if (!id || !name || !apiBaseUrl || !wsBaseUrl) return null;

  return {
    id,
    name,
    apiBaseUrl,
    wsBaseUrl,
  };
}

function loadServerConfigFile() {
  try {
    const raw = readFileSync(getServersFilePath(), "utf8");
    const parsed = JSON.parse(raw) as ServerConfigFile;
    const servers = Array.isArray(parsed.servers)
      ? parsed.servers
          .map((server) => normalizeServerDefinition(server))
          .filter((server): server is ServerDefinition => Boolean(server))
      : [];

    if (servers.length === 0) {
      return {
        defaultServerId: AMBER_SERVER_ID,
        servers: [],
      };
    }

    const defaultServerId =
      typeof parsed.defaultServerId === "string" &&
      servers.some((server) => server.id === parsed.defaultServerId)
        ? parsed.defaultServerId
        : servers[0].id;

    return {
      defaultServerId,
      servers,
    };
  } catch {
    return {
      defaultServerId: AMBER_SERVER_ID,
      servers: [],
    };
  }
}

function getResolvedServerConfig() {
  const { defaultServerId, servers } = loadServerConfigFile();

  if (servers.length === 0) {
    return {
      servers,
      activeServerId: "",
      activeServer: undefined,
    };
  }

  const packagedServerId = servers.some(
    (server) => server.id === AMBER_SERVER_ID,
  )
    ? AMBER_SERVER_ID
    : defaultServerId;

  // Packaged builds are fixed to Amber/default and cannot be switched.
  if (app.isPackaged) {
    const activeServer =
      servers.find((server) => server.id === packagedServerId) ?? servers[0];
    return {
      servers,
      activeServerId: activeServer.id,
      activeServer,
    };
  }

  const activeServerId = servers.some(
    (server) => server.id === selectedServerId,
  )
    ? selectedServerId
    : defaultServerId;
  const activeServer =
    servers.find((server) => server.id === activeServerId) ?? servers[0];

  return {
    servers,
    activeServerId,
    activeServer,
  };
}

function applyLoginItemSettings() {
  if (!app.isReady()) return;

  app.setLoginItemSettings({
    openAtLogin: startOnBoot,
    openAsHidden: startOnBoot,
    args: startOnBoot ? ["--start-hidden"] : [],
  });
}

function shouldLaunchHiddenFromStartup() {
  if (!startOnBoot || !allowTray) return false;

  const launchedWithHiddenArg = process.argv.includes("--start-hidden");
  const wasOpenedAtLogin = app.getLoginItemSettings().wasOpenedAtLogin;
  return launchedWithHiddenArg || wasOpenedAtLogin;
}

function showMainWindow() {
  if (!win || win.isDestroyed()) return;
  win.show();

  if (splash && !splash.isDestroyed()) {
    splash.close();
  }
}

function updateUpdaterState(next: Partial<UpdaterState>) {
  updaterState = {
    ...updaterState,
    ...next,
  };

  if (win && !win.isDestroyed()) {
    win.webContents.send("updater:status", updaterState);
  }
}

function canUseAutoUpdater() {
  if (VITE_DEV_SERVER_URL) return false;
  if (!app.isPackaged) return false;
  return true;
}

async function checkForAppUpdates() {
  if (!updaterState.canAutoUpdate) {
    return {
      ok: false,
      message: "Auto-updater is disabled in this environment.",
    };
  }

  try {
    await autoUpdater.checkForUpdates();
    return {
      ok: true,
      message: "Checking for updates.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while checking for updates.";

    updateUpdaterState({
      status: "error",
      message,
    });

    return {
      ok: false,
      message,
    };
  }
}

function configureAutoUpdater() {
  const canAutoUpdate = canUseAutoUpdater();

  if (!canAutoUpdate) {
    updateUpdaterState({
      status: "disabled",
      message: "Auto-updater is only available for packaged builds.",
      canAutoUpdate: false,
      progress: 0,
    });
    return;
  }

  const provider = (process.env.AMBER_UPDATER_PROVIDER?.trim() || "") as
    | UpdaterProvider
    | "";

  if (!provider || provider === "generic") {
    const genericFeedUrl = process.env.AMBER_UPDATER_URL?.trim();
    const feedUrl = genericFeedUrl || DEFAULT_GITHUB_LATEST_DOWNLOAD_URL;

    autoUpdater.setFeedURL({
      provider: "generic",
      url: feedUrl,
    });
  }

  if (provider === "github") {
    const owner =
      process.env.AMBER_GH_OWNER?.trim() ||
      process.env.GH_OWNER?.trim() ||
      DEFAULT_GITHUB_OWNER;
    const repo =
      process.env.AMBER_GH_REPO?.trim() ||
      process.env.GH_REPO?.trim() ||
      DEFAULT_GITHUB_REPO;

    if (!owner || !repo) {
      updateUpdaterState({
        status: "disabled",
        message:
          "AMBER_UPDATER_PROVIDER=github requires a valid owner/repo configuration.",
        canAutoUpdate: false,
      });
      return;
    }

    autoUpdater.setFeedURL({
      provider: "github",
      owner,
      repo,
      private: Boolean(process.env.GH_TOKEN),
      token: process.env.GH_TOKEN,
    });
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  updateUpdaterState({
    status: "idle",
    message: "Auto-updater is ready.",
    canAutoUpdate: true,
    progress: 0,
  });

  autoUpdater.on("checking-for-update", () => {
    updateUpdaterState({
      status: "checking",
      message: "Checking for updates...",
      progress: 0,
    });
  });

  autoUpdater.on("update-available", (info) => {
    updateUpdaterState({
      status: "available",
      message: `Update ${info.version} is available. Downloading...`,
      progress: 0,
      updateVersion: info.version,
    });
  });

  autoUpdater.on("update-not-available", () => {
    updateUpdaterState({
      status: "not-available",
      message: "You are already on the latest version.",
      progress: 0,
      updateVersion: undefined,
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    updateUpdaterState({
      status: "downloading",
      message: `Downloading update (${Math.round(progress.percent)}%)...`,
      progress: progress.percent,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    updateUpdaterState({
      status: "downloaded",
      message: `Update ${info.version} downloaded. Restart to install.`,
      progress: 100,
      updateVersion: info.version,
    });
  });

  autoUpdater.on("error", (error) => {
    updateUpdaterState({
      status: "error",
      message: error?.message ?? "Auto-updater failed.",
    });
  });

  void checkForAppUpdates();

  updaterCheckInterval = setInterval(
    () => {
      void checkForAppUpdates();
    },
    30 * 60 * 1000,
  );
}

function focusMainWindow() {
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    return;
  }

  if (app.isReady()) {
    createWindow();
  } else {
    app.whenReady().then(() => {
      createWindow();
    });
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (splash && !splash.isDestroyed()) {
      splash.close();
    }
    focusMainWindow();
  });
}

function createSplashWindow() {
  splash = new BrowserWindow({
    width: 420,
    height: 220,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      sandbox: true,
    },
  });

  splash.on("closed", () => {
    splash = null;
  });

  splash.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error("[splash] did-fail-load", {
        errorCode,
        errorDescription,
        validatedURL,
      });
    },
  );

  const splashPath = path.join(process.env.VITE_PUBLIC, "splash.html");
  splash.loadFile(splashPath);
  splash.once("ready-to-show", () => {
    splash?.show();
  });
}

function createWindow(options?: { startHidden?: boolean }) {
  const startHidden = options?.startHidden === true;

  win = new BrowserWindow({
    width: 900,
    height: 600,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    frame: false,
    titleBarStyle: "hidden",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  win.setMenu(null);

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
    win?.webContents.send("updater:status", updaterState);

    if (startHidden) {
      win?.hide();
      win?.setSkipTaskbar(true);
      if (splash && !splash.isDestroyed()) {
        splash.close();
      }
      return;
    }

    showMainWindow();
  });

  win.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error("[renderer] did-fail-load", {
        errorCode,
        errorDescription,
        validatedURL,
      });
    },
  );

  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("[renderer] render-process-gone", details);
  });

  // win.webContents.openDevTools({ mode: "detach" });

  win.once("ready-to-show", () => {
    if (startHidden) return;
    showMainWindow();
  });

  win.on("close", (event) => {
    if (isQuitting) return;

    if (allowTray) {
      event.preventDefault();
      win?.hide();
      win?.setSkipTaskbar(true);
      return;
    }

    isQuitting = true;
    app.quit();
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

function createTray() {
  if (tray || !allowTray) return;

  const iconPath = path.join(
    process.env.VITE_PUBLIC,
    process.platform === "win32" ? "amber.ico" : "amber.png",
  );

  const image = nativeImage.createFromPath(iconPath);
  tray = new Tray(image);
  tray.setToolTip("Amber");

  const updateMenu = () => {
    const isVisible = Boolean(win && !win.isDestroyed() && win.isVisible());
    const menu = Menu.buildFromTemplate([
      {
        label: isVisible ? "Hide" : "Show",
        click: () => {
          if (!win || win.isDestroyed()) {
            createWindow();
            return;
          }

          if (win.isVisible()) {
            win.hide();
            win.setSkipTaskbar(true);
          } else {
            win.setSkipTaskbar(false);
            focusMainWindow();
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray?.setContextMenu(menu);
  };

  tray.on("click", () => {
    updateMenu();
    if (!win || win.isDestroyed()) {
      createWindow();
      return;
    }

    if (win.isVisible()) {
      win.hide();
      win.setSkipTaskbar(true);
    } else {
      win.setSkipTaskbar(false);
      focusMainWindow();
    }
  });

  tray.on("right-click", () => {
    updateMenu();
    tray?.popUpContextMenu();
  });

  updateMenu();
}

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
  if (allowTray && tray && !isQuitting) return;

  app.quit();
  win = null;
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  loadSettings();
  applyLoginItemSettings();
  launchHiddenAtStartup = shouldLaunchHiddenFromStartup();

  if (!launchHiddenAtStartup) {
    createSplashWindow();
  }

  createTray();
  createWindow({ startHidden: launchHiddenAtStartup });
  configureAutoUpdater();
});

app.on("before-quit", () => {
  isQuitting = true;

  if (updaterCheckInterval) {
    clearInterval(updaterCheckInterval);
    updaterCheckInterval = null;
  }
});

ipcMain.handle("runtime-info:get", () => {
  return {
    electronVersion: process.versions.electron,
    chromiumVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    osPlatform: os.platform(),
    osRelease: os.release(),
    osArch: os.arch(),
  };
});

ipcMain.handle("settings:get", () => {
  return {
    allowTray,
    startOnBoot,
    preferredMicrophoneId,
    preferredCameraId,
    preferredSpeakerId,
    selectedServerId,
  };
});

ipcMain.handle("settings:set", (_event, next: AppSettings) => {
  allowTray = next.allowTray ?? allowTray;
  startOnBoot = next.startOnBoot ?? startOnBoot;
  preferredMicrophoneId =
    typeof next.preferredMicrophoneId === "string"
      ? next.preferredMicrophoneId
      : preferredMicrophoneId;
  preferredCameraId =
    typeof next.preferredCameraId === "string"
      ? next.preferredCameraId
      : preferredCameraId;
  preferredSpeakerId =
    typeof next.preferredSpeakerId === "string"
      ? next.preferredSpeakerId
      : preferredSpeakerId;
  selectedServerId =
    typeof next.selectedServerId === "string"
      ? next.selectedServerId
      : selectedServerId;

  if (!allowTray && tray) {
    tray.destroy();
    tray = null;
  }

  if (allowTray && !tray && app.isReady()) {
    createTray();
  }

  applyLoginItemSettings();
  saveSettings();
  return { allowTray, startOnBoot, selectedServerId };
});

ipcMain.handle("server-config:get", () => {
  return getResolvedServerConfig();
});

ipcMain.handle("server-config:set-active", (_event, nextServerId: string) => {
  if (!VITE_DEV_SERVER_URL || app.isPackaged) {
    const { servers, activeServerId, activeServer } = getResolvedServerConfig();
    return {
      ok: false,
      activeServerId,
      activeServer,
      servers,
      message: "Server switching is only available in development runs.",
    };
  }

  const requestedId =
    typeof nextServerId === "string" ? nextServerId.trim() : "";
  const { servers, activeServerId } = getResolvedServerConfig();

  if (!requestedId || !servers.some((server) => server.id === requestedId)) {
    return {
      ok: false,
      activeServerId,
      activeServer: servers.find((server) => server.id === activeServerId),
      servers,
      message: "Invalid server id.",
    };
  }

  selectedServerId = requestedId;
  saveSettings();

  const activeServer = servers.find((server) => server.id === selectedServerId);

  return {
    ok: true,
    activeServerId: selectedServerId,
    activeServer,
    servers,
  };
});

ipcMain.handle("window:platform", () => process.platform);

ipcMain.on("window:minimize", () => {
  if (!win || win.isDestroyed()) return;
  win.minimize();
});

ipcMain.on("window:toggle-maximize", () => {
  if (!win || win.isDestroyed()) return;
  if (win.isMaximized()) {
    win.unmaximize();
    return;
  }
  win.maximize();
});

ipcMain.on("window:close", () => {
  if (!win || win.isDestroyed()) return;
  win.close();
});

ipcMain.handle("open-external-link", async (_event, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("updater:get-status", () => {
  return updaterState;
});
ipcMain.handle("updater:check-for-updates", async () => {
  return checkForAppUpdates();
});
ipcMain.handle("updater:quit-and-install", () => {
  if (updaterState.status !== "downloaded") {
    return {
      ok: false,
      message: "No downloaded update is ready to install.",
    };
  }

  autoUpdater.quitAndInstall();
  return {
    ok: true,
    message: "Installing update and restarting.",
  };
});
