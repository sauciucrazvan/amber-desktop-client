import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppearanceTab from "./tabs/AppearanceTab";
import AccountTab from "./tabs/AccountTab";
import GeneralTab from "./tabs/GeneralTab";

interface SettingsProps {
    minimalViews: boolean,
}

export default function Settings(props : SettingsProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!event.ctrlKey) return;
            if (event.key !== ",") return;
            if (event.repeat) return;

            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName?.toLowerCase();
            const isTypingTarget =
                tagName === "input" ||
                tagName === "textarea" ||
                (target instanceof HTMLElement && target.isContentEditable);

            if (isTypingTarget) return;

            event.preventDefault();
            setOpen(true);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <form>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="cursor-pointer"><SettingsIcon /></Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-106.25 min-h-100 max-h-100 flex flex-col items-start justify-start">
                        <DialogHeader>
                            <DialogTitle>{t("settings.title")}</DialogTitle>
                            <DialogDescription className="sr-only">{t("settings.description")}</DialogDescription>
                        </DialogHeader>
                        {/* content */}
                        <Tabs defaultValue="general" className="min-w-full">
                            <TabsList>
                                <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
                                <TabsTrigger value="appearance">{t("settings.tabs.appearance")}</TabsTrigger>
                                <TabsTrigger value="account" disabled={props.minimalViews}>{t("settings.tabs.account")}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general">
                                <GeneralTab />
                            </TabsContent>
                            <TabsContent value="appearance">
                                <AppearanceTab />
                            </TabsContent>
                            <TabsContent value="account">
                                <AccountTab />
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </form>
            </Dialog>
        </>
    )

}