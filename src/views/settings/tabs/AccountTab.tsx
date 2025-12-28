import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export default function AccountTab() {
    const [, setLocation] = useLocation();

    return (
        <>
            <Separator />

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <Button size="sm" variant="destructive" className="cursor-pointer hover:text-white/80" onClick={() => setLocation("/login")}>Sign out</Button>
            </div>
        </>
    );
}