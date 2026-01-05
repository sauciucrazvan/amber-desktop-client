import AppSidebar from "@/components/common/app-sidebar";
import Header from "@/components/common/header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
export default function Homepage() {
  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";

  return (
    <>
      <SidebarProvider>
        {sidebarSide == "left" ? <AppSidebar /> : null}
        <main className="w-full">
          <Header
            extra={<SidebarTrigger variant={"ghost"} className="p-4" />}
          />
        </main>
        {sidebarSide == "left" ? null : <AppSidebar />}
      </SidebarProvider>
    </>
  );
}
