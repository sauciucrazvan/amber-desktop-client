import { useAuth } from "@/auth/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

        <DialogContent className="sm:max-w-125 min-h-25 max-h-100 flex flex-col items-start justify-start">
          {!isLoading && (
            <>
              <DialogHeader className="w-full">
                <DialogTitle className="w-full flex flex-col items-center justify-center gap-2 text-center">
                  <div className="relative">
                    <Avatar className="w-20 h-20 text-3xl">
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
                        "absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full border-2 border-background",
                        user!.online ? "bg-emerald-500" : "bg-red-500",
                      )}
                    />
                  </div>
                  <div className="flex flex-row items-start justify-start gap-1">
                    <div className="flex flex-row items-center gap-1">
                      <h3 className="text-lg leading-tight">
                        {user!.full_name}
                        <p className="text-sm text-muted-foreground">
                          @{user!.username}
                        </p>
                      </h3>
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription className="inline-flex items-center justify-center gap-1">
                  {user!.verified && (
                    <Badge className="rounded-md bg-blue-500 text-foreground">
                      <Verified size="16" /> {t("common.verified")}
                    </Badge>
                  )}
                </DialogDescription>
              </DialogHeader>

              {/* content */}
              <section className="w-full inline-flex items-center justify-center gap-2">
                <a
                  onClick={onBlock}
                  className="cursor-pointer bg-background hover:bg-secondary w-20 py-2 border-border border-2 rounded-md flex flex-col items-center"
                >
                  <ShieldBan /> {t("contacts.block")}
                </a>

                <a
                  onClick={onRemove}
                  className="cursor-pointer bg-background hover:bg-secondary w-20 py-2 border-border border-2 rounded-md flex flex-col items-center"
                >
                  <Trash /> {t("contacts.remove")}
                </a>
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
