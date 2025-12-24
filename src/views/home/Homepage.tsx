import Header from "@/components/common/header";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Homepage() {
    const [, setLocation] = useLocation();

    return (
        <>
            <Header />
    
            <main>
                <Button onClick={() => setLocation("/login")}>Login</Button>

            </main>
        </>
    )
}