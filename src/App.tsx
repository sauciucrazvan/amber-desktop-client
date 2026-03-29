import { ThemeProvider } from "./components/theme/theme";
import Tree from "./views/Tree";
import { AuthProvider } from "./auth/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Titlebar from "./components/common/Titlebar";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { CallOverlay, CallProvider } from "./views/home/calls";

type UpdaterStatus = {
  status: string;
  message: string;
  progress: number;
  canAutoUpdate: boolean;
  updateVersion?: string;
};

function UpdaterNotifications() {
  const lastStatusRef = useRef<string>("");

  useEffect(() => {
    const notify = (payload: UpdaterStatus) => {
      if (!payload?.canAutoUpdate) return;
      if (payload.status === lastStatusRef.current) return;

      lastStatusRef.current = payload.status;

      if (payload.status === "checking") {
        toast.message("Checking for updates...");
        return;
      }

      if (payload.status === "available") {
        toast.info(payload.message || "A new update is available.");
        return;
      }

      if (payload.status === "not-available") {
        toast.success("You are already up to date.");
        return;
      }

      if (payload.status === "downloaded") {
        toast.success(payload.message || "Update downloaded.", {
          duration: 10000,
          action: {
            label: "Restart",
            onClick: () => {
              void window.autoUpdater.quitAndInstall();
            },
          },
        });
        return;
      }

      if (payload.status === "error") {
        toast.error(payload.message || "Update check failed.");
      }
    };

    window.autoUpdater
      .getStatus()
      .then((status) => notify(status))
      .catch(() => {});

    const unsubscribe = window.autoUpdater.onStatusChange((status) => {
      notify(status as UpdaterStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CallProvider>
          <UpdaterNotifications />
          <div className="flex h-screen flex-col overflow-hidden">
            <Titlebar />
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              <Tree />
            </div>
          </div>
          <CallOverlay />
        </CallProvider>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
