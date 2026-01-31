import AppSidebar from "@/components/common/app-sidebar";
import Header from "@/components/common/header";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";
import ConversationDialog from "./dialogs/ConversationDialog";
export default function Homepage() {
  const { t } = useTranslation();

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

          <section className="flex flex-row items-center justify-center h-[75%] w-full gap-2 text-muted-foreground">
            <ConversationDialog />

            <Button
              variant="outline"
              className="cursor-pointer h-fit flex flex-col items-center gap-2 w-[25%]"
            >
              <Paperclip className="size-12" />
              {t("homepage.file")}
            </Button>
          </section>
          <section className="w-full inline-flex items-center justify-center ">
            <img
              src="/amber.png"
              alt="Amber logo"
              height={64}
              width={64}
              className="grayscale-100 opacity-25"
            />
          </section>
        </main>
        {sidebarSide == "left" ? null : <AppSidebar />}
      </SidebarProvider>
    </>
  );
}
