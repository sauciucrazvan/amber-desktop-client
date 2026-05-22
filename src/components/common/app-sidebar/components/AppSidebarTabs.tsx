import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { TFunction } from "i18next";
import type { ActiveChat } from "@/features/chat";
import RequestsTab from "@/views/tabs/RequestsTab";
import CallHistoryTabContent from "./CallHistoryTabContent";
import ContactsTabContent from "./ContactsTabContent";
import SidebarRail from "./SidebarRail";
import VerifyNotice from "./VerifyNotice";
import type { AccountMe, CallHistoryItem, ContactListItem } from "../types";

type AppSidebarTabsProps = {
  t: TFunction;
  requestCount: number;
  account: AccountMe | null;
  isAccountLoading: boolean;
  tabsDirectionClass: string;
  railPaddingClass: string;
  panelChromeClass: string;
  tooltipSide: "left" | "right";
  contacts?: ContactListItem[];
  contactsError: unknown;
  isContactsLoading: boolean;
  showVerifyAccount: boolean;
  activeChat: ActiveChat | null;
  openingChatUserId: number | null;
  myUserId: number | null;
  conversationUnseenCountByUserId?: Record<number, number>;
  onOpenDirectChat: (contact: ContactListItem["user"]) => Promise<void>;
  callHistory?: CallHistoryItem[];
  callHistoryError: unknown;
  isCallHistoryLoading: boolean;
};

export default function AppSidebarTabs({
  t,
  requestCount,
  account,
  isAccountLoading,
  tabsDirectionClass,
  railPaddingClass,
  panelChromeClass,
  tooltipSide,
  contacts,
  contactsError,
  isContactsLoading,
  showVerifyAccount,
  activeChat,
  openingChatUserId,
  myUserId,
  conversationUnseenCountByUserId,
  onOpenDirectChat,
  callHistory,
  callHistoryError,
  isCallHistoryLoading,
}: AppSidebarTabsProps) {
  return (
    <Tabs
      defaultValue="contacts"
      className={`flex h-full min-h-0 ${tabsDirectionClass} gap-1`}
    >
      <SidebarRail
        railPaddingClass={railPaddingClass}
        tooltipSide={tooltipSide}
        requestCount={requestCount}
        account={account}
        isAccountLoading={isAccountLoading}
        t={t}
      />

      <TabsContent
        value="contacts"
        className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-0 flex flex-col`}
      >
        <ContactsTabContent
          t={t}
          contacts={contacts}
          contactsError={contactsError}
          isContactsLoading={isContactsLoading}
          showVerifyAccount={showVerifyAccount}
          activeChat={activeChat}
          openingChatUserId={openingChatUserId}
          myUserId={myUserId}
          conversationUnseenCountByUserId={conversationUnseenCountByUserId}
          onOpenDirectChat={onOpenDirectChat}
        />
      </TabsContent>

      <TabsContent
        value="requests"
        className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-4 flex flex-col`}
      >
        <RequestsTab
          notice={
            showVerifyAccount ? (
              <VerifyNotice
                t={t}
                className="rounded-md border bg-muted/40 px-3 py-2"
              />
            ) : null
          }
        />
      </TabsContent>

      <TabsContent
        value="call-history"
        className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-0 flex flex-col`}
      >
        <CallHistoryTabContent
          t={t}
          callHistory={callHistory!}
          callHistoryError={callHistoryError}
          isCallHistoryLoading={isCallHistoryLoading}
          openingChatUserId={openingChatUserId}
          onOpenDirectChat={onOpenDirectChat}
        />
      </TabsContent>
    </Tabs>
  );
}
