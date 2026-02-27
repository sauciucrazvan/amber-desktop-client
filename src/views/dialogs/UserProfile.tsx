import { useAuth } from "@/auth/AuthContext";
import UserAvatar from "@/components/common/user-avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { API_BASE_URL } from "@/config";
import { Ban, Quote, X } from "lucide-react";
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
  bio?: string;
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
  } = useSWR<Profile>(isAuthenticated ? "/contacts/profile/" + username : null);

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

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        <DialogContent className="sm:max-w-85 min-h-25 max-h-100 flex flex-col items-start justify-start">
          {!isLoading && (
            <>
              <DialogHeader className="w-full">
                <DialogTitle className="w-full flex flex-col items-center justify-center gap-2 text-center">
                  <UserAvatar
                    full_name={user!.full_name}
                    username={user!.username}
                    isOnline={user!.online}
                    size="xl"
                  />
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
                  <Card className="w-full gap-0 mt-2 py-2">
                    <CardHeader className="inline-flex items-center gap-1 text-md font-bold mt-1">
                      <Quote size="12" /> {t("profile.bio.title")}
                    </CardHeader>
                    <CardContent className="italic text-gray-400 mb-2">
                      {user && user.bio ? user.bio : t("profile.bio.empty")}
                    </CardContent>
                  </Card>
                </DialogDescription>
              </DialogHeader>

              {/* content */}
              <section className="w-full inline-flex items-center justify-center gap-2">
                <a
                  onClick={onRemove}
                  className="cursor-pointer bg-background hover:bg-secondary w-20 py-2 border-border border-2 rounded-md flex flex-col items-center"
                >
                  <X /> {t("contacts.remove")}
                </a>

                <a
                  onClick={onBlock}
                  className="cursor-pointer bg-background hover:bg-secondary w-20 py-2 border-border border-2 rounded-md flex flex-col items-center"
                >
                  <Ban /> {t("contacts.block")}
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
