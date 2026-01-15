import { Plus } from "lucide-react";
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

type AccountMe = {
  username: string;
  full_name?: string | null;
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
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
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

  const contacts = ["Michael J.", "John Steel", "Freddie Mercury", "Lego man"];

  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Sidebar side={sidebarSide}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Contacts</SidebarGroupLabel>
            <SidebarGroupAction title="Add Contact" className="cursor-pointer">
              <Plus /> <span className="sr-only">Add Contact</span>
            </SidebarGroupAction>
            <SidebarMenu className="">
              {contacts.map((contact) => (
                <SidebarMenuItem key={contact}>
                  <Contact username={contact} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="mb-2 mr-2 mt-0 ml-0 w-full">
          <Separator />
          <section className="flex flex-row items-center gap-2 cursor-pointer rounded-md hover:bg-background p-2 transition ease-in-out duration-300">
            <Avatar>
              <AvatarFallback
                style={
                  account?.full_name
                    ? {
                        backgroundColor: stringToColor(
                          account.full_name ?? "unknown"
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
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
