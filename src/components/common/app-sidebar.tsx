import { Separator } from "../ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "../ui/sidebar";
import Contact from "./contact";
import { useAuth } from "@/auth/AuthContext";
import useSWR from "swr";
import VerifyAccount from "@/views/dialogs/VerifyAccount";
import { useTranslation } from "react-i18next";
import { Spinner } from "../ui/spinner";
import AddContact from "@/views/dialogs/AddContact";
import ContactRequests from "@/views/dialogs/ContactRequests";
import UserProfile from "@/views/dialogs/UserProfile";
import UserAvatar from "./user-avatar";

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
  const {
    data: account,
    error,
    isLoading,
  } = useSWR<AccountMe>(isAuthenticated ? "/account/me" : null);
  const { t } = useTranslation();

  const {
    data: contacts,
    error: contactsError,
    isLoading: isContactsLoading,
  } = useSWR<ContactListItem[]>(
    isAuthenticated ? "/account/contacts/list" : null,
  );

  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Sidebar side={sidebarSide}>
        <SidebarContent>
          <SidebarGroup className="flex-1 min-h-0">
            <SidebarGroupLabel>{t("contacts.title")}</SidebarGroupLabel>
            <SidebarGroupAction className="cursor-pointer">
              <AddContact />
            </SidebarGroupAction>
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
        </SidebarContent>
        <SidebarFooter className="mb-2 mr-2 mt-0 ml-0 w-full">
          <Separator />
          <div className="inline-flex items-center justify-between w-full h-full gap-1">
            <section className="w-full flex flex-row items-center gap-2 cursor-pointer rounded-md hover:bg-background p-2 transition ease-in-out duration-300">
              <UserAvatar
                full_name={account?.full_name}
                username={account?.username}
                isLoading={isLoading}
                size="sm"
              />
              <div className="flex flex-col items-start gap-1">
                <h3 className="text-md leading-tight">
                  {error
                    ? "Failed to load"
                    : isLoading
                      ? "Loading…"
                      : (account?.full_name ?? "") || ""}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {error
                    ? ""
                    : isLoading
                      ? ""
                      : account?.username
                        ? `@${account.username}`
                        : ""}
                </p>
              </div>
            </section>
            {!account?.verified && <VerifyAccount trigger_type={"button"} />}
            {account?.verified && <ContactRequests />}
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
