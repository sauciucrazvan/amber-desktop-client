import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  changeAppLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "@/i18n";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type AppSettingsPayload = {
  allowTray?: boolean;
};

export default function GeneralTab() {
  const [allowTray, setAllowTray] = useState(true);
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
      })
      .catch(() => {
        if (isMounted) setAllowTray(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-0 h-full w-full flex-col">
      <Separator />

      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-md text-primary">
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

      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-md text-primary">
            {t("settings.general.tray.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.general.tray.description")}
          </p>
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

      <div className="mt-auto w-full pt-4 text-left text-xs text-muted-foreground">
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
