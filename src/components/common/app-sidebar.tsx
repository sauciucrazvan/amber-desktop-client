import { Separator } from "../ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "../ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Contact from "./contact";
import { useAuth } from "@/auth/AuthContext";
import useSWR from "swr";
import VerifyAccount from "@/views/dialogs/VerifyAccount";
import { useTranslation } from "react-i18next";
import { Spinner } from "../ui/spinner";
import UserProfile from "@/views/dialogs/UserProfile";
import UserAvatar from "./user-avatar";
import MyProfile from "@/views/dialogs/MyProfile";
import { Inbox, MessageCircle, UserRoundPlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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

export default function AppSidebar() {
  const { isAuthenticated } = useAuth();
  const { data: account, isLoading } = useSWR<AccountMe>(
    isAuthenticated ? "/account/me" : null,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );
  const { t } = useTranslation();

  const {
    data: contacts,
    error: contactsError,
    isLoading: isContactsLoading,
  } = useSWR<ContactListItem[]>(
    isAuthenticated ? "/account/contacts/list" : null,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";
  const tooltipSide = sidebarSide === "left" ? "right" : "left";

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Sidebar side={sidebarSide}>
        <SidebarContent className="min-h-0 overflow-hidden">
          <Tabs
            defaultValue="contacts"
            className="flex h-full min-h-0 flex-row gap-1"
          >
            <div className="flex h-full w-11 flex-col pl-1">
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
                          aria-label={t("contacts.add_contact", "Add contact")}
                          className="flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer"
                        >
                          <UserRoundPlus className="size-4" />
                          <span className="sr-only">
                            {t("contacts.add_contact", "Add contact")}
                          </span>
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side={tooltipSide}
                      className="px-2 py-1 text-xs"
                    >
                      {t("contacts.add_contact", "Add contact")}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger
                          value="requests"
                          aria-label={t("contacts.requests", "Requests")}
                          className="flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer"
                        >
                          <Inbox className="size-4" />
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

              <div className="mt-auto w-full px-1 py-2">
                <div className="flex w-full justify-center">
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
              className="min-h-0 flex-1 overflow-hidden rounded-tl-2xl border-l bg-background p-0"
            >
              <SidebarGroup className="flex-1 min-h-0">
                <SidebarGroupLabel>{t("contacts.title")}</SidebarGroupLabel>
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
                    contacts.map((contact) => (
                      <SidebarMenuItem
                        key={`${contact.user.id}-${contact.created_at}`}
                      >
                        <UserProfile
                          username={contact.user.username}
                          trigger={
                            <Contact
                              username={contact.user.username}
                              full_name={contact.user.full_name}
                              online={contact.user.online}
                            />
                          }
                        ></UserProfile>
                      </SidebarMenuItem>
                    ))
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
              className="min-h-0 flex-1 overflow-hidden rounded-tl-2xl border-l bg-background p-3"
            >
              <span className="text-xs text-muted-foreground">
                {t(
                  "contacts.add_contact_placeholder",
                  "Add contact coming soon.",
                )}
              </span>
            </TabsContent>

            <TabsContent
              value="requests"
              className="min-h-0 flex-1 overflow-hidden rounded-tl-2xl border-l bg-background p-3"
            >
              <span className="text-xs text-muted-foreground">
                {t("contacts.requests_placeholder", "Requests coming soon.")}
              </span>
            </TabsContent>
          </Tabs>
        </SidebarContent>
        {!account?.verified && (
          <SidebarFooter className="m-0 w-full gap-0 p-0">
            <Separator className="w-full" />
            <div className="inline-flex h-full w-full items-center justify-end px-2 py-2">
              <VerifyAccount trigger_type={"button"} />
            </div>
          </SidebarFooter>
        )}
      </Sidebar>
    </>
  );
}
