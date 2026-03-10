/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import("electron").IpcRenderer;
  windowControls: {
    minimize: () => void;
    toggleMaximize: () => void;
    close: () => void;
    getPlatform: () => Promise<NodeJS.Platform>;
  };
  autoUpdater: {
    getStatus: () => Promise<{
      status: string;
      message: string;
      progress: number;
      canAutoUpdate: boolean;
      updateVersion?: string;
    }>;
    checkForUpdates: () => Promise<{
      ok: boolean;
      message: string;
    }>;
    quitAndInstall: () => Promise<{
      ok: boolean;
      message: string;
    }>;
    onStatusChange: (
      listener: (status: {
        status: string;
        message: string;
        progress: number;
        canAutoUpdate: boolean;
        updateVersion?: string;
      }) => void,
    ) => () => void;
  };
}
