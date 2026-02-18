import { User, UserMinus, UserX } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { useAuth } from "@/auth/AuthContext";
import { mutate } from "swr";
import { cn, stringToColor } from "@/lib/utils";
import { ComponentPropsWithoutRef } from "react";
import UserProfile from "@/views/dialogs/UserProfile";

type ContactProps = {
  username: string;
  full_name: string;
  online?: boolean;
} & ComponentPropsWithoutRef<"section">;

export default function Contact({
  username,
  full_name,
  online,
  className,
  ...props
}: ContactProps) {
  const { t } = useTranslation();
  const { accessToken } = useAuth();

  const isOnline = Boolean(online);

  const onBlock = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/account/contacts/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(t(data.message).replace("{{user}}", username));
        await mutate("/account/contacts/list");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occured");
    }
  };

  const onRemove = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/account/contacts/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(t(data.message).replace("{{user}}", username));
        await mutate("/account/contacts/list");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occured");
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <section
            className={cn(
              "flex flex-row items-center gap-2 cursor-pointer rounded-md hover:bg-background p-1 transition ease-in-out duration-300",
              className,
            )}
            {...props}
          >
            <div className="relative">
              <Avatar className="w-6 h-6 text-xs">
                <AvatarFallback
                  style={
                    full_name
                      ? {
                          backgroundColor: stringToColor(full_name),
                        }
                      : undefined
                  }
                >
                  {full_name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span
                aria-label={isOnline ? "Online" : "Offline"}
                title={isOnline ? "Online" : "Offline"}
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                  isOnline ? "bg-emerald-500" : "bg-red-500",
                )}
              />
            </div>
            <div className="flex flex-row items-center gap-1">
              <h3 className="text-sm leading-tight">
                {full_name}
                <p className="text-xs text-muted-foreground">@{username}</p>
              </h3>
            </div>
          </section>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <UserProfile
            username={username}
            trigger={
              <ContextMenuItem onSelect={(e) => e.preventDefault()}>
                <User /> {t("contacts.profile")}
              </ContextMenuItem>
            }
          />
          <ContextMenuItem onClick={onRemove}>
            <UserMinus /> {t("contacts.remove")}
          </ContextMenuItem>
          <ContextMenuItem onClick={onBlock}>
            <UserX /> {t("contacts.block")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
