import { Tabs, TabsContent } from "@/components/ui/tabs";
import RequestsTab from "@/components/common/app-sidebar/components/RequestsTab";
import CallHistoryTab from "./CallHistoryTab";
import SidebarRail from "./SidebarRail";
import ContactsTab from "./ContactsTab";

type AppSidebarTabsProps = {
  tabsDirectionClass: string;
  railPaddingClass: string;
  panelChromeClass: string;
  tooltipSide: "left" | "right";
};

export default function AppSidebarTabs({
  tabsDirectionClass,
  railPaddingClass,
  panelChromeClass,
  tooltipSide,
}: AppSidebarTabsProps) {
  return (
    <Tabs
      defaultValue="contacts"
      className={`flex h-full min-h-0 ${tabsDirectionClass} gap-1`}
    >
      <SidebarRail
        railPaddingClass={railPaddingClass}
        tooltipSide={tooltipSide}
      />

      <TabsContent
        value="contacts"
        className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-0 flex flex-col`}
      >
        <ContactsTab />
      </TabsContent>

      <TabsContent
        value="requests"
        className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-4 flex flex-col`}
      >
        <RequestsTab />
      </TabsContent>

      <TabsContent
        value="call-history"
        className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-0 flex flex-col`}
      >
        <CallHistoryTab />
      </TabsContent>
    </Tabs>
  );
}
