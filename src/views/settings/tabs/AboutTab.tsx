import { Separator } from "@/components/ui/separator";
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

export default function AboutTab() {
  const majorVersion = BUILD_VERSION.split(".")[0] ?? BUILD_VERSION;
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);

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
    </>
  );
}
