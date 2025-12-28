import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { changeAppLanguage, getInitialLanguage, supportedLanguages, type SupportedLanguage } from "@/i18n";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function GeneralTab() {
    const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage());
    const { t } = useTranslation();

    const languageOptions = supportedLanguages
        .map((code) => ({
            code,
            label: t(`settings.general.language.options.${code}`),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

    return (
        <>
            <Separator />

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">{t("settings.general.language.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("settings.general.language.description")}</p>
                </div>

                <Select
                    value={language}
                    onValueChange={(value) => {
                        const next = supportedLanguages.includes(value as SupportedLanguage)
                            ? (value as SupportedLanguage)
                            : "en";
                        setLanguage(next);
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
                    <h3 className="text-md text-primary">{t("settings.general.help.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("settings.general.help.description")}</p>
                </div>

                <Button className="cursor-pointer">
                    {t("settings.general.help.action")}
                </Button>
            </div>

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">{t("settings.general.feedback.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("settings.general.feedback.description")}</p>
                </div>

                <Button className="cursor-pointer">
                    {t("settings.general.feedback.action")}
                </Button>
            </div>
        </>
    );
}