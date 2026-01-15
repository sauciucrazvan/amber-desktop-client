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

          {/* <div className="px-4">
            <div className="w-full min-h-122 bg-border/50 rounded-md p-4 flex flex-col justify-between">
              <h1>Messages with Michael J.</h1>
              <div className="inline-flex items-start gap-1">
                <Input placeholder="Message..."></Input>
                <Button variant="outline">
                  <Send />
                </Button>
              </div>
            </div>
          </div> */}
        </main>
        {sidebarSide == "left" ? null : <AppSidebar />}
      </SidebarProvider>
    </>
  );
}
