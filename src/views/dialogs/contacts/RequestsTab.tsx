import { useAuth } from "@/auth/AuthContext";
import UserAvatar from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { API_BASE_URL } from "@/config";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

type ContactRequestItem = {
  user: {
    id: number;
    username: string;
    full_name: string;
  };
  created_at: string;
};

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {}
  return `Request failed (${res.status})`;
}

export default function ContactRequests() {
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const { isAuthenticated, authFetch } = useAuth();

  const { t } = useTranslation();

  const {
    data: requests,
    error: requestsError,
    isLoading: isRequestsLoading,
  } = useSWR<ContactRequestItem[]>(
    isAuthenticated ? "/account/contacts/requests" : null,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const performAction = async (
    action: "accept" | "decline",
    target: { id: number; username: string },
  ) => {
    setActionUserId(target.id);
    try {
      const res = await authFetch(
        API_BASE_URL + `/account/contacts/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: target.username,
          }),
        },
      );

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("common.errors.too_many_requests");
        }

        throw new Error(await readErrorMessage(res));
      }

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {}

      const messageKey =
        typeof (data as { message?: unknown })?.message === "string"
          ? ((data as { message: string }).message as string)
          : action === "accept"
            ? "contacts.accepted"
            : "contacts.declined";

      toast.success(t(messageKey).replace("{{user}}", target.username));
      await mutate("/account/contacts/requests");
      if (action === "accept") {
        await mutate("/account/contacts/list");
      }
    } catch (e) {
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <>
      {requestsError ? (
        <p className="text-sm text-muted-foreground">
          {t("contacts.failed_loading")}
        </p>
      ) : isRequestsLoading ? (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          <span>{t("common.info")}</span>
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="w-full min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="w-full flex flex-col gap-2">
            {requests.map((req) => {
              const displayName = req.user.full_name || req.user.username;
              return (
                <div
                  key={`${req.user.id}-${req.created_at}`}
                  className="w-full flex gap-3 items-center"
                >
                  <div className="shrink-0">
                    <UserAvatar
                      full_name={req.user!.full_name}
                      username={req.user!.username}
                      size="lg"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div>
                      <div className="text-sm font-medium">{displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        @{req.user.username}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        className="flex-1 cursor-pointer rounded-sm h-6 px-1.5 text-xs"
                        disabled={actionUserId === req.user.id}
                        onClick={() =>
                          performAction("decline", {
                            id: req.user.id,
                            username: req.user.username,
                          })
                        }
                      >
                        <X />
                      </Button>
                      <Button
                        className="flex-1 cursor-pointer rounded-sm h-6 px-1.5 text-xs"
                        disabled={actionUserId === req.user.id}
                        onClick={() =>
                          performAction("accept", {
                            id: req.user.id,
                            username: req.user.username,
                          })
                        }
                      >
                        <Check />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("contacts.requests.none")}
        </p>
      )}
    </>
  );
}
