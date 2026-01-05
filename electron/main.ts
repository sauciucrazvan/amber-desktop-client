import { app, BrowserWindow, Menu, Tray, nativeImage } from "electron";
//import { createRequire } from 'node:module'
import { fileURLToPath } from "node:url";
import path from "node:path";

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
    }
  );

  const splashPath = path.join(process.env.VITE_PUBLIC, "splash.html");
  splash.loadFile(splashPath);
  splash.once("ready-to-show", () => {
    splash?.show();
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  win.setMenu(null);

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  win.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error("[renderer] did-fail-load", {
        errorCode,
        errorDescription,
        validatedURL,
      });
    }
  );

  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("[renderer] render-process-gone", details);
  });

  win.webContents.openDevTools({ mode: "detach" });

  win.once("ready-to-show", () => {
    win?.show();
    if (splash && !splash.isDestroyed()) {
      splash.close();
    }
  });

  win.on("close", (event) => {
    if (isQuitting) return;

    event.preventDefault();
    win?.hide();
    win?.setSkipTaskbar(true);
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

function createTray() {
  if (tray) return;

  const iconPath = path.join(
    process.env.VITE_PUBLIC,
    process.platform === "win32" ? "amber.ico" : "amber.png"
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
  if (tray && !isQuitting) return;

  app.quit();
  win = null;
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createSplashWindow();
  createTray();
  createWindow();
});

app.on("before-quit", () => {
  isQuitting = true;
});
