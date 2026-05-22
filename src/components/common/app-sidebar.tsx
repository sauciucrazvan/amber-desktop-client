import { Sidebar, SidebarContent, useSidebar } from "../ui/sidebar";
import { useAuth } from "@/features/auth/AuthContext";
import { useTranslation } from "react-i18next";
import { useChat } from "@/features/chat";
import { useAppSidebarData, useResizableSidebar } from "./app-sidebar/index";
import AppSidebarTabs from "./app-sidebar/components/AppSidebarTabs";

export default function AppSidebar() {
  const { isAuthenticated, authFetch } = useAuth();
  const { t } = useTranslation();
  const { openDirectChat, openingChatUserId, activeChat } = useChat();
  const { open, isMobile } = useSidebar();

  const {
    sidebarSide,
    tooltipSide,
    tabsDirectionClass,
    railPaddingClass,
    panelChromeClass,
    resizeHandleClass,
    handleResizeStart,
  } = useResizableSidebar();

  const {
    account,
    isAccountLoading,
    contacts,
    contactsError,
    isContactsLoading,
    conversationUnseenCountByUserId,
    requestCount,
    callHistory,
    callHistoryError,
    isCallHistoryLoading,
    showVerifyAccount,
    handleOpenDirectChat,
  } = useAppSidebarData({
    isAuthenticated,
    authFetch,
    openDirectChat,
  });

  if (!isAuthenticated) return <>Unauthorized.</>;
  if (!isMobile && !open) return null;

  return (
    <>
      <Sidebar collapsible="offcanvas" side={sidebarSide} className="relative">
        <SidebarContent className="min-h-0 overflow-hidden">
          <AppSidebarTabs
            t={t}
            requestCount={requestCount}
            account={account}
            isAccountLoading={isAccountLoading}
            tabsDirectionClass={tabsDirectionClass}
            railPaddingClass={railPaddingClass}
            panelChromeClass={panelChromeClass}
            tooltipSide={tooltipSide}
            contacts={contacts}
            contactsError={contactsError}
            isContactsLoading={isContactsLoading}
            showVerifyAccount={showVerifyAccount}
            activeChat={activeChat}
            openingChatUserId={openingChatUserId}
            myUserId={account?.id ?? null}
            conversationUnseenCountByUserId={conversationUnseenCountByUserId}
            onOpenDirectChat={handleOpenDirectChat}
            callHistory={callHistory}
            callHistoryError={callHistoryError}
            isCallHistoryLoading={isCallHistoryLoading}
          />
        </SidebarContent>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={handleResizeStart}
          className={resizeHandleClass}
        />
      </Sidebar>
    </>
  );
}

