import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Contact from "./contact";
import AddContactTab from "@/views/dialogs/contacts/AddContactTab";
import RequestsTab from "@/views/dialogs/contacts/RequestsTab";
import { useAuth } from "@/auth/AuthContext";
import { API_BASE_URL } from "@/config";
import useSWR from "swr";
import VerifyAccount from "@/views/dialogs/VerifyAccount";
import { useTranslation } from "react-i18next";
import { Spinner } from "../ui/spinner";
import UserAvatar from "./user-avatar";
import MyProfile from "@/views/dialogs/MyProfile";
import { Inbox, MessageCircle, UserRoundPlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useChat } from "@/views/home/chat/ChatContext";
import { toast } from "sonner";
import {
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type AccountMe = {
  username: string;
  full_name?: string | null;
  verified?: boolean | null;
};

type ContactListItem = {
  user: {
    id: number;
    username: string;
    full_name: string;
    online?: boolean;
  };
  created_at: string;
};

type DirectConversationSummary = {
  id: string;
  type: string;
  direct_pair?: string | null;
  created_at: string;
  notifications?: number;
};

export default function AppSidebar() {
  const MIN_SIDEBAR_WIDTH = 320;
  const MAX_SIDEBAR_WIDTH = 400;

  const { isAuthenticated, authFetch } = useAuth();
  const { data: account, isLoading } = useSWR<AccountMe>(
    isAuthenticated ? "/account/me" : null,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );
  const { t } = useTranslation();
  const { openDirectChat, openingChatUserId, activeChat } = useChat();
  const { open, isMobile } = useSidebar();
  const showVerifyAccount = account?.verified === false;

  const {
    data: contacts,
    error: contactsError,
    isLoading: isContactsLoading,
  } = useSWR<ContactListItem[]>(isAuthenticated ? "/contacts/list" : null, {
    refreshInterval: 2000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const stableContactIds = Array.from(
    new Set((contacts ?? []).map((contact) => contact.user.id)),
  ).sort((a, b) => a - b);
  const contactIdsKey = stableContactIds.join(",");

  const { data: conversationUnseenCountByUserId } = useSWR<
    Record<number, number>
  >(
    isAuthenticated && contactIdsKey
      ? `contacts-unseen-count:${contactIdsKey}`
      : null,
    async () => {
      if (stableContactIds.length === 0) return {};

      const results = await Promise.all(
        stableContactIds.map(async (userId) => {
          try {
            const res = await authFetch(
              `${API_BASE_URL}/chats/direct/${userId}`,
              {
                method: "POST",
              },
            );

            if (!res.ok) return [userId, 0] as const;

            const data = (await res.json()) as DirectConversationSummary;
            return [userId, Math.max(0, data.notifications ?? 0)] as const;
          } catch {
            return [userId, 0] as const;
          }
        }),
      );

      return Object.fromEntries(results);
    },
    {
      refreshInterval: 5000,
      dedupingInterval: 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  const { data: contactRequests, error: contactRequestsError } = useSWR<
    Array<{ user: { id: number }; created_at: string }>
  >(isAuthenticated ? "/contacts/requests" : null, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const requestCount = contactRequestsError
    ? 0
    : (contactRequests?.length ?? 0);

  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";
  const tooltipSide = sidebarSide === "left" ? "right" : "left";
  const tabsDirectionClass =
    sidebarSide === "left" ? "flex-row" : "flex-row-reverse";
  const railPaddingClass = sidebarSide === "left" ? "pl-1" : "pr-1";
  const panelChromeClass =
    sidebarSide === "left"
      ? "rounded-tl-md border-l border-t"
      : "rounded-tr-md border-r border-t";
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const storedWidth = Number(localStorage.getItem("amber.sidebarWidth"));
    if (!Number.isFinite(storedWidth)) return 256;
    return Math.min(
      MAX_SIDEBAR_WIDTH,
      Math.max(MIN_SIDEBAR_WIDTH, storedWidth),
    );
  });
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  useEffect(() => {
    localStorage.setItem("amber.sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    const sidebarWrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]',
    ) as HTMLElement | null;
    if (!sidebarWrapper) return;
    sidebarWrapper.style.setProperty("--sidebar-width", `${sidebarWidth}px`);
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;

      const { startX, startWidth } = resizeStateRef.current;
      const deltaX = event.clientX - startX;
      const nextWidth =
        sidebarSide === "left" ? startWidth + deltaX : startWidth - deltaX;
      const clampedWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, nextWidth),
      );

      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [sidebarSide]);

  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleOpenDirectChat = async (contact: ContactListItem["user"]) => {
    try {
      await openDirectChat(contact);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed opening chat");
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;
  if (!isMobile && !open) return null;

  return (
    <>
      <Sidebar side={sidebarSide} className="relative">
        <SidebarContent className="min-h-0 overflow-hidden">
          <Tabs
            defaultValue="contacts"
            className={`flex h-full min-h-0 ${tabsDirectionClass} gap-1`}
          >
            <div className={`flex h-full w-10 flex-col ${railPaddingClass}`}>
              <div className="flex justify-center pt-2">
                <TabsList className="h-auto w-auto flex-col items-center justify-start gap-1 p-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger
                          value="contacts"
                          aria-label={t("contacts.title")}
                          className="flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer"
                        >
                          <MessageCircle className="size-4" />
                          <span className="sr-only">{t("contacts.title")}</span>
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side={tooltipSide}
                      className="px-2 py-1 text-xs"
                    >
                      {t("contacts.title")}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger
                          value="add-contact"
                          aria-label={t("contacts.add.title", "Add contact")}
                          className="flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer"
                        >
                          <UserRoundPlus className="size-4" />
                          <span className="sr-only">
                            {t("contacts.add.title", "Add contact")}
                          </span>
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side={tooltipSide}
                      className="px-2 py-1 text-xs"
                    >
                      {t("contacts.add.title", "Add contact")}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger
                          value="requests"
                          aria-label={t("contacts.requests", "Requests")}
                          className="relative flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer"
                        >
                          <Inbox className="size-4" />
                          {requestCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-medium">
                              {requestCount > 9 ? "9+" : requestCount}
                            </span>
                          )}
                          <span className="sr-only">
                            {t("contacts.requests", "Requests")}
                          </span>
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side={tooltipSide}
                      className="px-2 py-1 text-xs"
                    >
                      {t("contacts.requests.title", "Requests")}
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </div>

              <div className="mt-auto w-full inline-flex py-2 items-center justify-center">
                <div className="flex flex-col w-full justify-center">
                  <MyProfile
                    trigger={
                      <section className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md p-0 transition ease-in-out duration-300 hover:bg-background">
                        <UserAvatar
                          full_name={account?.full_name}
                          username={account?.username}
                          isLoading={isLoading}
                          size="sm"
                        />
                      </section>
                    }
                  />
                </div>
              </div>
            </div>

            <TabsContent
              value="contacts"
              className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-0 flex flex-col`}
            >
              <div className="px-4 pt-4 shrink-0">
                <h2 className="text-lg font-semibold">{t("contacts.title")}</h2>
                {showVerifyAccount && (
                  <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "account.verify.notice",
                          "Verify your account to unlock full features.",
                        )}
                      </p>
                      <VerifyAccount trigger_type={"button"} />
                    </div>
                  </div>
                )}
              </div>
              <SidebarGroup className="flex-1 min-h-0 pt-2">
                <SidebarMenu className="flex-1 min-h-0 overflow-y-auto pr-1">
                  {contactsError ? (
                    <SidebarMenuItem>
                      <span className="px-1 text-xs text-muted-foreground">
                        {t("contacts.failed_loading")}
                      </span>
                    </SidebarMenuItem>
                  ) : isContactsLoading ? (
                    <SidebarMenuItem>
                      <span className="px-1 text-xs text-muted-foreground">
                        <Spinner />
                      </span>
                    </SidebarMenuItem>
                  ) : contacts && contacts.length > 0 ? (
                    contacts.map((contact) => {
                      const isActive =
                        activeChat?.otherUser.id === contact.user.id;
                      const unseen_messages = isActive
                        ? 0
                        : (conversationUnseenCountByUserId?.[contact.user.id] ??
                          0);

                      return (
                        <SidebarMenuItem
                          key={`${contact.user.id}-${contact.created_at}`}
                        >
                          <Contact
                            username={contact.user.username}
                            full_name={contact.user.full_name}
                            online={contact.user.online}
                            unseen_messages={unseen_messages}
                            isActive={isActive}
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
            </TabsContent>

            <TabsContent
              value="add-contact"
              className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-4 flex flex-col`}
            >
              <h2 className="text-lg font-semibold mb-4">
                {t("contacts.add.title")}
              </h2>
              {showVerifyAccount && (
                <div className="mb-4 rounded-md border bg-muted/40 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {t(
                        "account.verify.notice",
                        "Verify your account to unlock full features.",
                      )}
                    </p>
                    <VerifyAccount trigger_type={"button"} />
                  </div>
                </div>
              )}
              <AddContactTab />
            </TabsContent>

            <TabsContent
              value="requests"
              className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-4 flex flex-col`}
            >
              <RequestsTab
                notice={
                  showVerifyAccount ? (
                    <div className="rounded-md border bg-muted/40 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "account.verify.notice",
                            "Verify your account to unlock full features.",
                          )}
                        </p>
                        <VerifyAccount trigger_type={"button"} />
                      </div>
                    </div>
                  ) : null
                }
              />
            </TabsContent>
          </Tabs>
        </SidebarContent>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={handleResizeStart}
          className={`absolute inset-y-0 z-20 hidden w-2 cursor-col-resize transition-colors hover:bg-border/60 active:bg-border md:block ${
            sidebarSide === "left"
              ? "right-0 translate-x-1/2"
              : "left-0 -translate-x-1/2"
          }`}
        />
      </Sidebar>
    </>
  );
}
