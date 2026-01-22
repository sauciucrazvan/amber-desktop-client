import { ShieldBan, Trash } from "lucide-react";
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

export default function Contact({
  username,
  full_name,
}: {
  username: string;
  full_name: string;
}) {
  const { t } = useTranslation();
  const { accessToken } = useAuth();

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
        toast.success(t(data.message));
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
        toast.success(t(data.message));
        await mutate("/account/contacts/list");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occured");
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <section className="flex flex-row items-center gap-2 cursor-pointer rounded-md hover:bg-background p-1 transition ease-in-out duration-300">
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
            <div className="flex flex-row items-center gap-1">
              <h3 className="text-sm leading-tight">
                {full_name}
                <p className="text-xs text-muted-foreground">@{username}</p>
              </h3>
            </div>
          </section>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onBlock}>
            <ShieldBan /> {t("contacts.block")}
          </ContextMenuItem>
          <ContextMenuItem onClick={onRemove}>
            <Trash /> {t("contacts.remove")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
