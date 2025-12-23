import { useTheme } from "@/components/theme/theme";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const [, setLocation] = useLocation();

    return (
        <>
            <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Toggle theme</Button>
        
            <Button onClick={() => setLocation("/", { transition: true })}>Home</Button>
            
        </>
    )

}