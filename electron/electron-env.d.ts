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
  serverConfig: {
    get: () => Promise<{
      servers: {
        id: string;
        name: string;
        apiBaseUrl: string;
        wsBaseUrl: string;
      }[];
      activeServerId: string;
      activeServer: {
        id: string;
        name: string;
        apiBaseUrl: string;
        wsBaseUrl: string;
      };
    }>;
    setActive: (
      serverId: string,
    ) => Promise<{
      ok: boolean;
      activeServerId: string;
      activeServer?: {
        id: string;
        name: string;
        apiBaseUrl: string;
        wsBaseUrl: string;
      };
      servers: {
        id: string;
        name: string;
        apiBaseUrl: string;
        wsBaseUrl: string;
      }[];
      message?: string;
    }>;
  };
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
