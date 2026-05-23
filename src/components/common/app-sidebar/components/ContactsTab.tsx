import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import ErrorBox from "@/components/common/error-box";
import Contact from "@/components/common/contact";
import { useChat } from "@/features/chat";
import { useTranslation } from "react-i18next";
import { useAppSidebarDataContext } from "../hooks/useAppSidebarDataContext";

export default function ContactsTab() {
  const { t } = useTranslation();
  const { activeChat, openingChatUserId } = useChat();
  const {
    account,
    contacts,
    contactsError,
    isContactsLoading,
    conversationUnseenCountByUserId,
    handleOpenDirectChat,
  } = useAppSidebarDataContext();
  const myUserId = account?.id ?? null;

  if (isContactsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pt-4 shrink-0">
        <h2 className="text-lg font-semibold">{t("contacts.title")}</h2>
      </div>

      <SidebarGroup className="flex-1 min-h-0 pt-2">
        <SidebarMenu className="flex-1 min-h-0 overflow-y-auto pr-1">
          {contactsError ? (
            <SidebarMenuItem>
              <ErrorBox>{t("contacts.failed_loading")}</ErrorBox>
            </SidebarMenuItem>
          ) : contacts && contacts.length > 0 ? (
            contacts.map((contact) => {
              const isActive = activeChat?.otherUser.id === contact.user.id;
              const unseen_messages = isActive
                ? 0
                : (conversationUnseenCountByUserId?.[contact.user.id] ?? 0);

              return (
                <SidebarMenuItem
                  key={`${contact.user.id}-${contact.created_at}`}
                >
                  <Contact
                    username={contact.user.username}
                    full_name={contact.user.full_name}
                    online={contact.user.online}
                    avatar_url={contact.user.avatar_url}
                    last_message={contact.last_message}
                    unseen_messages={unseen_messages}
                    isActive={isActive}
                    myUserId={myUserId}
                    onClick={() => handleOpenDirectChat(contact.user)}
                    aria-busy={openingChatUserId === contact.user.id}
                  />
                </SidebarMenuItem>
              );
            })
          ) : (
            <SidebarMenuItem>
              <span className="mx-1 px-1 text-xs text-muted-foreground">
                {t("contacts.none")}
              </span>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
