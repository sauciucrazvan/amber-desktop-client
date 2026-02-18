import { useAuth } from "@/auth/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { API_BASE_URL } from "@/config";
import { cn, stringToColor } from "@/lib/utils";
import { ShieldBan, Trash, Verified } from "lucide-react";
import { ReactNode, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

interface UserProfileProps {
  username: string;
  trigger: ReactNode;
}

type Profile = {
  id: number;
  username: string;
  full_name: string;
  online: boolean;
  verified: boolean;
  disabled: boolean;
};

export default function UserProfile({ username, trigger }: UserProfileProps) {
  const { t } = useTranslation();
  const { isAuthenticated, accessToken } = useAuth();

  const [open, setOpen] = useState<boolean>(false);

  const {
    data: user,
    error: error,
    isLoading: isLoading,
  } = useSWR<Profile>(
    isAuthenticated ? "/account/contacts/profile/" + username : null,
  );

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

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        <DialogContent className="sm:max-w-125 min-h-25 max-h-100 flex flex-col items-start justify-start select-none">
          {!isLoading && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-row items-center gap-2">
                  <div className="relative">
                    <Avatar className="w-8 h-8 text-xs">
                      <AvatarFallback
                        style={
                          user!.full_name
                            ? {
                                backgroundColor: stringToColor(user!.full_name),
                              }
                            : undefined
                        }
                      >
                        {user!.full_name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      aria-label={user!.online ? "Online" : "Offline"}
                      title={user!.online ? "Online" : "Offline"}
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                        user!.online ? "bg-emerald-500" : "bg-red-500",
                      )}
                    />
                  </div>
                  <div className="flex flex-row items-start justify-start gap-1">
                    <div className="flex flex-row items-center gap-1">
                      <h3 className="text-md leading-tight">
                        {user!.full_name}
                        <p className="text-sm text-muted-foreground">
                          @{user!.username}
                        </p>
                      </h3>
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription className="inline-flex items-center gap-1">
                  {user!.verified && (
                    <Badge className="rounded-md bg-blue-500 text-foreground">
                      <Verified size="16" /> {t("common.verified")}
                    </Badge>
                  )}
                </DialogDescription>
              </DialogHeader>

              {/* content */}
              <section className="inline-flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={onBlock}
                  size="sm"
                  className="cursor-pointer hover:bg-destructive/20"
                >
                  <ShieldBan /> {t("contacts.block")}
                </Button>

                <Button
                  variant="destructive"
                  onClick={onRemove}
                  size="sm"
                  className="cursor-pointer hover:bg-destructive/20"
                >
                  <Trash /> {t("contacts.remove")}
                </Button>
              </section>
            </>
          )}

          {error && (
            <p className="text-red-500">
              <Trans i18nKey={error} values={{ user: username }} />
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
