import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BUILD_LABEL, BUILD_VERSION } from "@/build-info";
import { useEffect, useState } from "react";

const APP_NAME = "Amber";

type RuntimeInfo = {
  electronVersion: string;
  chromiumVersion: string;
  nodeVersion: string;
  osPlatform: string;
  osRelease: string;
  osArch: string;
};

type UpdaterStatus = {
  status: string;
  message: string;
  progress: number;
  canAutoUpdate: boolean;
  updateVersion?: string;
};

export default function AboutTab() {
  const majorVersion = BUILD_VERSION.split(".")[0] ?? BUILD_VERSION;
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatus | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let isMounted = true;

    window.ipcRenderer
      .invoke("runtime-info:get")
      .then((info) => {
        if (isMounted) setRuntimeInfo(info as RuntimeInfo);
      })
      .catch(() => {
        if (isMounted) setRuntimeInfo(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    window.autoUpdater
      .getStatus()
      .then((status) => {
        if (isMounted) setUpdaterStatus(status);
      })
      .catch(() => {
        if (isMounted) {
          setUpdaterStatus({
            status: "error",
            message: "Unable to read updater status.",
            progress: 0,
            canAutoUpdate: false,
          });
        }
      });

    const unsubscribe = window.autoUpdater.onStatusChange((status) => {
      if (isMounted) {
        setUpdaterStatus(status as UpdaterStatus);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const canCheckForUpdates = Boolean(
    updaterStatus?.canAutoUpdate && !isChecking,
  );

  const onCheckForUpdates = async () => {
    setIsChecking(true);
    try {
      await window.autoUpdater.checkForUpdates();
    } finally {
      setIsChecking(false);
    }
  };

  const onInstallUpdate = async () => {
    await window.autoUpdater.quitAndInstall();
  };

  return (
    <>
      <Separator />

      <section className="mt-3 flex w-full flex-col items-center gap-3 text-center">
        <img
          src={`${import.meta.env.BASE_URL}amber.png`}
          alt="Amber logo"
          className="size-18 rounded-xl"
          draggable={false}
        />

        <div className="text-center">
          <h3 className="text-lg font-semibold">{`${APP_NAME} ${majorVersion}`}</h3>
          <p className="text-xs text-muted-foreground">{BUILD_LABEL}</p>
        </div>
      </section>

      <section className="mt-4 w-full max-w-md mx-auto flex flex-col gap-2 rounded-md border p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Build number</span>
          <span>{BUILD_VERSION}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Platform</span>
          <span>
            {runtimeInfo
              ? `${runtimeInfo.osPlatform} ${runtimeInfo.osRelease} (${runtimeInfo.osArch})`
              : navigator.platform}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Electron</span>
          <span>{runtimeInfo?.electronVersion ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Chromium</span>
          <span>{runtimeInfo?.chromiumVersion ?? "—"}</span>
        </div>
      </section>

      <section className="mt-3 w-full max-w-md mx-auto flex flex-col gap-3 rounded-md border p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Updates</span>
          <span>{updaterStatus?.status ?? "idle"}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {updaterStatus?.message ?? "Updater status unavailable."}
        </p>

        {updaterStatus?.status === "downloading" ? (
          <p className="text-xs text-muted-foreground">
            {Math.round(updaterStatus.progress)}% downloaded
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void onCheckForUpdates();
            }}
            disabled={!canCheckForUpdates}
          >
            {isChecking ? "Checking..." : "Check for updates"}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              void onInstallUpdate();
            }}
            disabled={updaterStatus?.status !== "downloaded"}
          >
            Restart to update
          </Button>
        </div>
      </section>
    </>
  );
}
