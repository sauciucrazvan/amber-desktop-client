import { User, UserMinus, UserX } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config";
import { useAuth } from "@/auth/AuthContext";
import { mutate } from "swr";
import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef } from "react";
import UserProfile from "@/views/dialogs/UserProfile";
import UserAvatar from "./user-avatar";

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
            <UserAvatar
              full_name={full_name}
              username={username}
              isOnline={isOnline}
            />
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
