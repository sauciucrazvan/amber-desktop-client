import AppSidebar from "@/components/common/app-sidebar";
import Header from "@/components/common/header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
export default function Homepage() {
    return (
        <>
    
            <SidebarProvider>
                <AppSidebar />
                <main className="w-full">
                    <Header extra={ <SidebarTrigger variant={"ghost"} className="p-4" /> } />
                </main>
            </SidebarProvider>
        </>
    )
}