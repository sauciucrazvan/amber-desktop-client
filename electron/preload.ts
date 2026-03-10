import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

contextBridge.exposeInMainWorld("windowControls", {
  minimize() {
    ipcRenderer.send("window:minimize");
  },
  toggleMaximize() {
    ipcRenderer.send("window:toggle-maximize");
  },
  close() {
    ipcRenderer.send("window:close");
  },
  getPlatform() {
    return ipcRenderer.invoke("window:platform") as Promise<NodeJS.Platform>;
  },
});

contextBridge.exposeInMainWorld("autoUpdater", {
  getStatus() {
    return ipcRenderer.invoke("updater:get-status") as Promise<{
      status: string;
      message: string;
      progress: number;
      canAutoUpdate: boolean;
      updateVersion?: string;
    }>;
  },
  checkForUpdates() {
    return ipcRenderer.invoke("updater:check-for-updates") as Promise<{
      ok: boolean;
      message: string;
    }>;
  },
  quitAndInstall() {
    return ipcRenderer.invoke("updater:quit-and-install") as Promise<{
      ok: boolean;
      message: string;
    }>;
  },
  onStatusChange(listener: (status: unknown) => void) {
    const channel = "updater:status";
    const wrapped = (_event: Electron.IpcRendererEvent, status: unknown) => {
      listener(status);
    };

    ipcRenderer.on(channel, wrapped);

    return () => {
      ipcRenderer.off(channel, wrapped);
    };
  },
});
