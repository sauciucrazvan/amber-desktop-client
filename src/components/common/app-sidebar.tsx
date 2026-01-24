import { Avatar, AvatarFallback } from "../ui/avatar";
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
  };
  created_at: string;
};

// Source - https://stackoverflow.com/a
// Posted by Joe Freeman, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-15, License - CC BY-SA 4.0
const stringToColor = (str: string) => {
  let hash = 0;
  str.split("").forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, "0");
  }
  return colour;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const initials = (first + last).toUpperCase();
  return initials || "?";
}

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
          <SidebarGroup>
            <SidebarGroupLabel>{t("contacts.title")}</SidebarGroupLabel>
            <SidebarGroupAction className="cursor-pointer">
              <AddContact />
            </SidebarGroupAction>
            <SidebarMenu className="">
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
                    <Contact
                      username={contact.user.username}
                      full_name={contact.user.full_name}
                    />
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
              <Avatar>
                <AvatarFallback
                  style={
                    account?.full_name
                      ? {
                          backgroundColor: stringToColor(
                            account.full_name ?? "unknown",
                          ),
                        }
                      : undefined
                  }
                >
                  {account?.full_name
                    ? initialsFromName(String(account.full_name))
                    : account?.username
                      ? initialsFromName(account.username)
                      : isLoading
                        ? "…"
                        : "?"}
                </AvatarFallback>
              </Avatar>
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
            <ContactRequests />
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
