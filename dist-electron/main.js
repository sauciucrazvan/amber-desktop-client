import { app as o, BrowserWindow as s } from "electron";
import { fileURLToPath as c } from "node:url";
import e from "node:path";
const t = e.dirname(c(import.meta.url));
process.env.APP_ROOT = e.join(t, "..");
const i = process.env.VITE_DEV_SERVER_URL, R = e.join(process.env.APP_ROOT, "dist-electron"), r = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = i ? e.join(process.env.APP_ROOT, "public") : r;
let n;
function l() {
  n = new s({
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: e.join(t, "preload.mjs")
    }
  }), n.setMenu(null), n.webContents.on("did-finish-load", () => {
    n?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), i ? n.loadURL(i) : n.loadFile(e.join(r, "index.html"));
}
o.on("window-all-closed", () => {
  process.platform !== "darwin" && (o.quit(), n = null);
});
o.on("activate", () => {
  s.getAllWindows().length === 0 && l();
});
o.whenReady().then(l);
export {
  R as MAIN_DIST,
  r as RENDERER_DIST,
  i as VITE_DEV_SERVER_URL
};
