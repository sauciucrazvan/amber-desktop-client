import { Ban, User, X } from "lucide-react";
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
  isActive?: boolean;
  isUnseen?: boolean;
} & ComponentPropsWithoutRef<"section">;

export default function Contact({
  username,
  full_name,
  online,
  isActive = false,
  isUnseen = false,
  className,
  ...props
}: ContactProps) {
  const { t } = useTranslation();
  const { accessToken } = useAuth();

  const isOnline = Boolean(online);

  const onBlock = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/contacts/block", {
        method: "PUT",
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
        await mutate("/contacts/list");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occured");
    }
  };

  const onRemove = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/contacts/remove", {
        method: "DELETE",
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
        await mutate("/contacts/list");
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
              "flex flex-row items-center gap-2 cursor-pointer rounded-md p-1 transition ease-in-out duration-300",
              isActive ? "bg-primary/10" : "hover:bg-primary/10",
              className,
            )}
            {...props}
          >
            <UserAvatar
              full_name={full_name}
              username={username}
              isOnline={isOnline}
            />
            <div className="flex min-w-0 flex-1 flex-row items-center justify-between gap-1">
              <h3
                className={cn(
                  "text-sm leading-tight",
                  !isActive && isUnseen && "font-semibold",
                )}
              >
                {full_name}
                <p className="text-xs font-normal text-muted-foreground">
                  @{username}
                </p>
              </h3>
              {!isActive && isUnseen ? (
                <span
                  aria-hidden
                  className="ml-2 inline-flex size-2.5 shrink-0 rounded-full bg-primary"
                />
              ) : null}
            </div>
          </section>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <UserProfile
            username={username}
            trigger={
              <ContextMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                <User /> {t("contacts.profile")}
              </ContextMenuItem>
            }
          />
          <ContextMenuItem onClick={onRemove} className="cursor-pointer">
            <X /> {t("contacts.remove")}
          </ContextMenuItem>
          <ContextMenuItem onClick={onBlock} className="cursor-pointer">
            <Ban /> {t("contacts.block")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
