import { useTheme } from "@/components/theme/theme";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function AppearanceTab() {
    const { theme, setTheme } = useTheme();

    const fontOptions = useMemo(
        () => [
            { value: "80", label: "0.8x" },
            { value: "90", label: "0.9x" },
            { value: "100", label: "1.0x (default)" },
            { value: "120", label: "1.2x" },
            { value: "150", label: "1.5x" },
            { value: "200", label: "2x" },
        ],
        []
    );

    const [sidebarPos, setSidebarPos] = useState<string>(() => localStorage.getItem("sidebarPos") ?? "left");
    const [fontScale, setFontScale] = useState<string>(() => localStorage.getItem("fontScale") ?? "100");

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontScale}%`;
        localStorage.setItem("fontScale", fontScale);
    }, [fontScale]);

    useEffect(() => {
        localStorage.setItem("sidebarPos", sidebarPos);
    }, [sidebarPos]);

    return (
        <>
            <Separator />

            {/* Theme */}
            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">Theme</h3>
                    <p className="text-xs text-muted-foreground">This changes the entire application theme.</p>
                </div>

                <Tabs defaultValue={theme}>
                    <TabsList>
                        <TabsTrigger className="cursor-pointer" value="dark" onClick={() => { setTheme("dark"); localStorage.setItem("theme", "dark"); }}>
                            <Moon className="text-purple-400" size="12" />
                        </TabsTrigger>

                        <TabsTrigger className="cursor-pointer" value="light" onClick={() => { setTheme("light"); localStorage.setItem("theme", "light"); }}>
                            <Sun className="text-yellow-400" size="12" />
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Scaling */}
            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">Scaling</h3>
                    <p className="text-xs text-muted-foreground">Fit more content on your screen.</p>
                </div>

                <Select value={fontScale} onValueChange={setFontScale}>
                    <SelectTrigger className="w-45">
                        <SelectValue placeholder="100%" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Scaling</SelectLabel>
                            {fontOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* Sidebar position */}
            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">Sidebar Position</h3>
                    <p className="text-xs text-muted-foreground">Change the sidebar position</p>
                </div>

                <Select value={sidebarPos} onValueChange={(value) => (setSidebarPos(value), window.location.reload())}>
                    <SelectTrigger className="w-45">
                        <SelectValue placeholder="Left" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Positions</SelectLabel>
                            <SelectItem value={"left"}>Left</SelectItem>
                            <SelectItem value={"right"}>Right</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </>
    );
}