import Settings from "@/views/settings/Settings";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function Header() {
    const [, setLocation] = useLocation();

    return (
        <>
            <header className="flex flex-row items-center gap-1 justify-between p-4">
                <section id="left" className="flex flex-row items-center gap-2 h-5">
                    <Button variant="ghost" onClick={() => setLocation("/")}><Home /></Button>
                    <Separator orientation="vertical" />
                </section>
                <section id="center" className="flex flex-row items-center gap-2 h-5">
                </section>
                <section id="right" className="flex flex-row items-center gap-2 h-5">
                    <Separator orientation="vertical" />
                    <Settings />
                </section>
            </header>
        </>
    )
}