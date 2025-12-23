import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Homepage() {
    const [, setLocation] = useLocation();

    return (
        <>
            <Button onClick={() => setLocation("/login")}>Login</Button>
            <Button onClick={() => setLocation("/settings")}>Settings</Button>
        </>
    )
}