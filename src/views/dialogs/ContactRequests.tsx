import { useAuth } from "@/auth/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Check, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
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

function stringToColor(str: string) {
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
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const initials = (first + last).toUpperCase();
  return initials || "?";
}

export default function ContactRequests() {
  const [open, setOpen] = useState(false);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorUsername, setErrorUsername] = useState("");

  const { t } = useTranslation();
  const { authFetch, isAuthenticated } = useAuth();

  const {
    data: requests,
    error: requestsError,
    isLoading: isRequestsLoading,
  } = useSWR<ContactRequestItem[]>(
    isAuthenticated ? "/account/contacts/requests" : null,
  );

  const requestCount = requests?.length ?? 0;

  const performAction = async (
    action: "accept" | "decline",
    target: { id: number; username: string },
  ) => {
    setErrorKey(null);
    setErrorUsername(target.username);
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

      toast.success(t(messageKey));
      await mutate("/account/contacts/requests");
      if (action === "accept") {
        await mutate("/account/contacts/list");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "An error occured";
      setErrorKey(message);
    } finally {
      setActionUserId(null);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon-sm"
            variant="outline"
            className="cursor-pointer h-full relative"
          >
            <UsersRound />
            {requestCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center">
                {requestCount > 99 ? "99+" : requestCount}
              </span>
            ) : null}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-125 max-h-100 min-h-0 flex flex-col items-start justify-start">
          <DialogHeader>
            <DialogTitle>{t("contacts.requests.title")}</DialogTitle>
            <DialogDescription>
              {t("contacts.requests.description")}
            </DialogDescription>
          </DialogHeader>
          {errorKey && (
            <p className="text-red-500">
              <Trans i18nKey={errorKey} values={{ user: errorUsername }} />
            </p>
          )}

          <Separator />

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
                      className="w-full flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <Avatar className="w-8 h-8 text-xs">
                          <AvatarFallback
                            style={{
                              backgroundColor: stringToColor(displayName),
                            }}
                          >
                            {initialsFromName(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {displayName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
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
                            performAction("decline", {
                              id: req.user.id,
                              username: req.user.username,
                            })
                          }
                        >
                          <X />
                        </Button>
                        <Button
                          size="sm"
                          className="cursor-pointer"
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
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("contacts.requests.none")}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
