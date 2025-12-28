import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

export default function AccountTab() {
    const [, setLocation] = useLocation();
    const { t } = useTranslation();

    return (
        <>
            <Separator />

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">{t("settings.account.data.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("settings.account.data.description")}</p>
                </div>

                <Button size="sm" className="cursor-pointer" onClick={() => open()}>
                    {t("settings.account.data.action")}
                </Button>
            </div>

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">{t("settings.account.signOut.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("settings.account.signOut.description")}</p>
                </div>

                <Button size="sm" variant="outline" className="cursor-pointer hover:text-white/80" onClick={() => setLocation("/login")}>
                    <LogOut /> {t("settings.account.signOut.action")}
                </Button>
            </div>

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">{t("settings.account.delete.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("settings.account.delete.description")}</p>
                </div>

                <Button size="sm" variant="destructive" className="cursor-pointer hover:text-white/80" onClick={() => setLocation("/login")}>
                    <Trash /> {t("settings.account.delete.action")}
                </Button>
            </div>
        </>
    );
}