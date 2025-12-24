import Settings from "@/views/settings/Settings";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface HeaderProps {
    extra?: ReactNode;
}

export default function Header({ extra } : HeaderProps) {
    const [, setLocation] = useLocation();

    const storedSidebarPos = localStorage.getItem("sidebarPos");
    const sidebarSide: "left" | "right" = storedSidebarPos === "right" ? "right" : "left";

    return (
        <>
            <header className="min-w-full flex flex-row items-center gap-1 justify-between p-4">
                <section id="left" className="flex flex-row items-center gap-2 h-5">
                    {sidebarSide == "left" ? extra : null}
                    <Button variant="ghost" onClick={() => setLocation("/")}><Home /></Button>
                    <Separator orientation="vertical" />
                </section>
                <section id="right" className="flex flex-row items-center gap-2 h-5">                    
                    <Separator orientation="vertical" />
                    <Settings />
                    {sidebarSide == "left" ? null : extra}
                </section>
            </header>
        </>
    )
}