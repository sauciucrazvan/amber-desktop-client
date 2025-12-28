import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

export default function AccountTab() {
    const [, setLocation] = useLocation();
    const { t } = useTranslation();

    return (
        <>
            <Separator />

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <Button size="sm" variant="destructive" className="cursor-pointer hover:text-white/80" onClick={() => setLocation("/login")}>{t("settings.account.signOut")}</Button>
            </div>
        </>
    );
}