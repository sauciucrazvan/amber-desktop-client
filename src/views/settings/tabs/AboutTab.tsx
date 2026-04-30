import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUILD_LABEL, BUILD_VERSION } from "@/build-info";
import { API_BASE_URL, WS_BASE_URL, applyServerConfig } from "@/config";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

type SelectableServer = {
  id: string;
  name: string;
  apiBaseUrl: string;
  wsBaseUrl: string;
};

export default function AboutTab() {
  const { t } = useTranslation();
  const isDevelopmentBuild = import.meta.env.DEV;
  const majorVersion = BUILD_VERSION.split(".")[0] ?? BUILD_VERSION;
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatus | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isApplyingServer, setIsApplyingServer] = useState(false);
  const [serverError, setServerError] = useState("");
  const [availableServers, setAvailableServers] = useState<SelectableServer[]>(
    [],
  );
  const [activeServerId, setActiveServerId] = useState("");
  const [activePanel, setActivePanel] = useState("about");

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
            message: t("settings.about.unableToReadUpdaterStatus"),
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
  }, [t]);

  useEffect(() => {
    if (!isDevelopmentBuild) return;

    let isMounted = true;

    window.serverConfig
      .get()
      .then((payload) => {
        if (!isMounted) return;
        setAvailableServers(payload.servers ?? []);
        setActiveServerId(payload.activeServerId ?? "");
      })
      .catch(() => {
        if (isMounted) {
          setServerError(t("settings.about.developer.unableToLoad"));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isDevelopmentBuild, t]);

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

  const onSelectServer = async (serverId: string) => {
    if (!serverId) return;
    setIsApplyingServer(true);
    setServerError("");

    try {
      const result = await window.serverConfig.setActive(serverId);
      if (!result.ok || !result.activeServer) {
        setServerError(
          result.message || t("settings.about.developer.unableToApply"),
        );
        return;
      }

      setActiveServerId(result.activeServerId);
      setAvailableServers(result.servers ?? []);
      applyServerConfig(result.activeServer);
      window.location.reload();
    } catch {
      setServerError(t("settings.about.developer.unableToApply"));
    } finally {
      setIsApplyingServer(false);
    }
  };

  const statusLabel = updaterStatus
    ? t(`settings.about.status.${updaterStatus.status}`)
    : t("settings.about.status.idle");

  return (
    <>
      <section className="mt-3 mx-auto flex flex-col w-full max-w-md items-center gap-2 text-center">
        <img
          src={`${import.meta.env.BASE_URL}amber.png`}
          alt={"Amber Logo"}
          className="size-14 shrink-0 rounded-xl"
          draggable={false}
        />

        <div>
          <h3 className="text-lg font-semibold">{`${APP_NAME} ${majorVersion}`}</h3>
          <p className="text-xs text-muted-foreground">{BUILD_LABEL}</p>
        </div>
      </section>

      <Tabs
        value={activePanel}
        onValueChange={setActivePanel}
        className="mt-4 w-full max-w-md mx-auto"
      >
        <TabsList className="w-full">
          <TabsTrigger value="about" className="flex-1 cursor-pointer">
            {t("settings.about.tabs.data_for_nerds")}
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex-1 cursor-pointer">
            {t("settings.about.tabs.updates")}
          </TabsTrigger>
          {isDevelopmentBuild ? (
            <TabsTrigger value="developer" className="flex-1 cursor-pointer">
              {t("settings.about.tabs.developer")}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="about">
          <section className="w-full flex flex-col gap-2 rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.about.buildNumber")}
              </span>
              <span>{BUILD_VERSION}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.about.platform")}
              </span>
              <span>
                {runtimeInfo
                  ? `${runtimeInfo.osPlatform} ${runtimeInfo.osRelease} (${runtimeInfo.osArch})`
                  : navigator.platform}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.about.electron")}
              </span>
              <span>{runtimeInfo?.electronVersion ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.about.chromium")}
              </span>
              <span>{runtimeInfo?.chromiumVersion ?? "—"}</span>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="updates" className="w-full">
          <section className="w-full overflow-hidden flex flex-col gap-3 rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.about.updatesLabel")}
              </span>
              <span className="min-w-0 text-right wrap-break-word">
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground wrap-break-word">
              {updaterStatus?.message || t("settings.about.updaterUnavailable")}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  void onCheckForUpdates();
                }}
                disabled={!canCheckForUpdates}
              >
                {isChecking
                  ? t("settings.about.actions.checking")
                  : t("settings.about.actions.check")}
              </Button>

              <Button
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  void onInstallUpdate();
                }}
                disabled={updaterStatus?.status !== "downloaded"}
              >
                {t("settings.about.actions.restart")}
              </Button>
            </div>
          </section>
        </TabsContent>

        {isDevelopmentBuild ? (
          <TabsContent value="developer" className="w-full">
            <section className="w-full flex flex-col gap-3 rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t("settings.about.developer.server")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("settings.about.developer.debugOnly")}
                </span>
              </div>

              <Select
                value={activeServerId}
                disabled={isApplyingServer || availableServers.length === 0}
                onValueChange={(value) => {
                  void onSelectServer(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("settings.about.developer.selectServer")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableServers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-xs text-muted-foreground">
                <p>{`API: ${API_BASE_URL}`}</p>
                <p>{`WS: ${WS_BASE_URL}`}</p>
              </div>

              {serverError ? (
                <p className="text-xs text-red-500 wrap-break-word">
                  {serverError}
                </p>
              ) : null}
            </section>
          </TabsContent>
        ) : null}
      </Tabs>
    </>
  );
}
