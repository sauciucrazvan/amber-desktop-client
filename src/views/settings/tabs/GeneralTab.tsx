import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { changeAppLanguage, getInitialLanguage, type SupportedLanguage } from "@/i18n";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function GeneralTab() {
    const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage());
    const { t } = useTranslation();

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
                        const next = value === "ro" ? "ro" : "en";
                        setLanguage(next);
                        void changeAppLanguage(next);
                    }}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">{t("settings.general.language.options.en")}</SelectItem>
                        <SelectItem value="ro">{t("settings.general.language.options.ro")}</SelectItem>
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