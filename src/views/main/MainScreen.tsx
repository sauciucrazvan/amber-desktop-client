import AppSidebar from "@/components/common/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import GetStarted from "./dialogs/GetStarted";
import { ChatProvider, ConversationPanel, useChat } from "@/features/chat";

function MainScreenContent() {
  const { activeChat } = useChat();
  const amberLogoSrc = `${import.meta.env.BASE_URL}amber.png`;

  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";

  return (
    <SidebarProvider>
      <div className="flex min-h-0 flex-1 flex-col w-full">
        <div className="flex min-h-0 flex-1">
          {sidebarSide == "left" && <AppSidebar />}
          <main className="min-w-0 flex-1 overflow-hidden border-t">
            {activeChat ? (
              <ConversationPanel />
            ) : (
              <>
                <section className="flex flex-row items-center justify-center h-[75%] w-full gap-2 text-muted-foreground">
                  <GetStarted />
                </section>
                <section className="w-full inline-flex items-center justify-center">
                  <img
                    src={amberLogoSrc}
                    alt="Amber logo"
                    height={64}
                    width={64}
                    draggable={false}
                    className="grayscale-100 opacity-25"
                  />
                </section>
              </>
            )}
          </main>
          {sidebarSide == "right" && <AppSidebar />}
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function MainScreen() {
  return (
    <ChatProvider>
      <MainScreenContent />
    </ChatProvider>
  );
}
