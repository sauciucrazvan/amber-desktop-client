import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Settings from "../settings/Settings";

export default function Homepage() {
    const [, setLocation] = useLocation();

    return (
        <>
            <Button onClick={() => setLocation("/login")}>Login</Button>
            {/* <Button onClick={() => setLocation("/settings")}>Settings</Button> */}

            <Settings />
        </>
    )
}