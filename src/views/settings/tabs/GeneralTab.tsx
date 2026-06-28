import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeAppLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "@/i18n";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { AppWindow, Play } from "lucide-react";

type AppSettingsPayload = {
  allowTray?: boolean;
  startOnBoot?: boolean;
};

export default function GeneralTab() {
  const [allowTray, setAllowTray] = useState(true);
  const [startOnBoot, setStartOnBoot] = useState(false);
  const { t, i18n } = useTranslation();

  const activeLanguage = useMemo<SupportedLanguage>(() => {
    const base = (i18n.resolvedLanguage ?? i18n.language ?? "en")
      .toLowerCase()
      .split("-")[0];

    return supportedLanguages.includes(base as SupportedLanguage)
      ? (base as SupportedLanguage)
      : "en";
  }, [i18n.language, i18n.resolvedLanguage]);

  const languageOptions = supportedLanguages
    .map((code) => ({
      code,
      label: t(`settings.general.language.options.${code}`),
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );

  useEffect(() => {
    let isMounted = true;
    const ipc = window.ipcRenderer;

    if (!ipc?.invoke)
      return () => {
        isMounted = false;
      };

    ipc
      .invoke("settings:get")
      .then((value: AppSettingsPayload | undefined) => {
        if (!isMounted || !value) return;

        if (typeof value.allowTray === "boolean") {
          setAllowTray(value.allowTray);
        }

        if (typeof value.startOnBoot === "boolean") {
          setStartOnBoot(value.startOnBoot);
        }
      })
      .catch(() => {
        if (isMounted) setAllowTray(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-5 pr-1 pb-6">
      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-sm font-semibold text-primary">
            {t("settings.general.language.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.general.language.description")}
          </p>
        </div>

        <Select
          value={activeLanguage}
          onValueChange={(value) => {
            const next = supportedLanguages.includes(value as SupportedLanguage)
              ? (value as SupportedLanguage)
              : "en";
            void changeAppLanguage(next);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((opt) => (
              <SelectItem key={opt.code} value={opt.code}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-sm font-medium">
            {t("settings.general.system.title", "System")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.general.system.description",
              "How the application works",
            )}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between rounded-lg px-2.5 py-2">
            <div className="min-w-0 flex items-center gap-2">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                <AppWindow className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <h3 className="truncate text-xs font-medium">
                  {t("settings.general.tray.title")}
                </h3>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {t("settings.general.tray.description")}
                </p>
              </div>
            </div>
            <Switch
              checked={allowTray}
              className="cursor-pointer"
              onCheckedChange={(checked) => {
                const nextValue = checked === true;
                setAllowTray(nextValue);
                window.ipcRenderer?.invoke("settings:set", {
                  allowTray: nextValue,
                });
              }}
            />
          </div>

          <Separator className="my-1" />

          <div className="flex items-center justify-between rounded-lg px-2.5 py-2">
            <div className="min-w-0 flex items-center gap-2">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                <Play className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <h3 className="truncate text-xs font-medium">
                  {t("settings.general.startOnBoot.title", "Start on boot")}
                </h3>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {t(
                    "settings.general.startOnBoot.description",
                    "Launch Amber automatically when you sign in.",
                  )}
                </p>
              </div>
            </div>
            <Switch
              checked={startOnBoot}
              className="cursor-pointer"
              onCheckedChange={(checked) => {
                const nextValue = checked === true;
                setStartOnBoot(nextValue);
                window.ipcRenderer?.invoke("settings:set", {
                  startOnBoot: nextValue,
                });
              }}
            />
          </div>
        </div>
      </section>

      <div className="pt-4 px-1 text-left text-xs text-muted-foreground mt-auto">
        <a
          className="hover:text-primary underline-offset-4 hover:underline"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.ipcRenderer?.invoke(
              "open-external-link",
              "https://github.com/sauciucrazvan/amber",
            );
          }}
          role="button"
          tabIndex={0}
        >
          {t("settings.general.help.action")}
        </a>
        <span className="px-2">•</span>
        <a
          className="hover:text-primary underline-offset-4 hover:underline"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.ipcRenderer?.invoke(
              "open-external-link",
              "https://github.com/sauciucrazvan/amber/issues",
            );
          }}
          target="_blank"
          rel="noreferrer"
        >
          {t("settings.general.feedback.action")}
        </a>
      </div>
    </div>
  );
}
