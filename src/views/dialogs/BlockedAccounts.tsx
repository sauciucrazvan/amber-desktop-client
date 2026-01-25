import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { API_BASE_URL } from "@/config";
import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

type BlockedItem = {
  user: {
    id: number;
    username: string;
  };
  created_at: string;
};

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {}
  return `unblock failed (${res.status})`;
}

export default function BlockedAccounts() {
  const [open, setOpen] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);

  const { t } = useTranslation();
  const { authFetch, isAuthenticated } = useAuth();

  const {
    data: blockedAccounts,
    error: blockedAccountsError,
    isLoading: isBlockedAccountsLoading,
  } = useSWR<BlockedItem[]>(
    isAuthenticated ? "/account/contacts/blocked" : null,
  );

  const blockedCount = blockedAccounts?.length ?? 0;

  const performUnblock = async (target: { id: number; username: string }) => {
    setActionUserId(target.id);
    try {
      const res = await authFetch(API_BASE_URL + `/account/contacts/unblock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: target.username,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("common.errors.too_many_requests");
        }

        throw new Error(await readErrorMessage(res));
      }

      try {
        await res.json();
      } catch {}

      toast.success(t("contacts.unblocked", { user: target.username }));
      await mutate("/account/contacts/blocked");
    } catch (e) {
      const message = e instanceof Error ? e.message : "An error occured";
      const looksLikeI18nKey =
        typeof message === "string" && message.includes(".");
      toast.error(looksLikeI18nKey ? t(message) : message);
    } finally {
      setActionUserId(null);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="cursor-pointer" variant="link">
            {t("contacts.blocked.trigger")} (
            {blockedCount > 99 ? "99+" : blockedCount})
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-125 max-h-100 min-h-0 flex flex-col items-start justify-start">
          <DialogHeader>
            <DialogTitle>{t("contacts.blocked.title")}</DialogTitle>
            <DialogDescription>
              {t("contacts.blocked.description")}
            </DialogDescription>
          </DialogHeader>
          <Separator />

          {blockedAccountsError ? (
            <p className="text-sm text-muted-foreground">
              {t("contacts.failed_loading")}
            </p>
          ) : isBlockedAccountsLoading ? (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>{t("common.info")}</span>
            </div>
          ) : blockedAccounts && blockedAccounts.length > 0 ? (
            <div className="w-full min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="w-full flex flex-col gap-2">
                {blockedAccounts.map((req) => {
                  return (
                    <div
                      key={`${req.user.id}-${req.created_at}`}
                      className="w-full flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            @{req.user.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          disabled={actionUserId === req.user.id}
                          onClick={() =>
                            performUnblock({
                              id: req.user.id,
                              username: req.user.username,
                            })
                          }
                        >
                          <X />
                          <span>{t("contacts.unblock")}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("contacts.blocked.none")}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
