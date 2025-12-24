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

    return (
        <>
            <header className="min-w-full flex flex-row items-center gap-1 justify-between p-4">
                <section id="left" className="flex flex-row items-center gap-2 h-5">
                    {extra}
                    <Button variant="ghost" onClick={() => setLocation("/")}><Home /></Button>
                    <Separator orientation="vertical" />
                </section>
                <section id="right" className="flex flex-row items-center gap-2 h-5">
                    <Button variant="outline" className="cursor-pointer" onClick={() => setLocation("/login")}>Login</Button>
                    
                    <Separator orientation="vertical" />
                    <Settings />
                </section>
            </header>
        </>
    )
}