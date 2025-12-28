import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { changeAppLanguage, getInitialLanguage, type SupportedLanguage } from "@/i18n";
import { useState } from "react";

export default function GeneralTab() {
    const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage());

    return (
        <>
            <Separator />

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">Language</h3>
                    <p className="text-xs text-muted-foreground">Choose the application language</p>
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
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ro">Română</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">Help</h3>
                    <p className="text-xs text-muted-foreground">Found an issue or need help with something?</p>
                </div>

                <Button className="cursor-pointer">
                    Support
                </Button>
            </div>

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">Feedback</h3>
                    <p className="text-xs text-muted-foreground">Help us improve</p>
                </div>

                <Button className="cursor-pointer">
                    Feedback
                </Button>
            </div>
        </>
    );
}