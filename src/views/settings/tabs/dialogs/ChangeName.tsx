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
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config";
import { Edit } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

export default function ChangeName() {
  const { t, i18n } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();
  const { mutate } = useSWRConfig();

  const [open, setOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(API_BASE_URL + "/account/modify/fullname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_full_name: fullName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = data?.detail;

        if (typeof detail === "string") {
          throw new Error(detail);
        }

        if (detail && typeof detail === "object") {
          const message = (detail as { message?: unknown }).message;
          const rd = (detail as { remaining_days?: unknown }).remaining_days;

          if (typeof rd === "number") setRemainingDays(rd);
          if (typeof message === "string") throw new Error(message);
        }

        throw new Error(`Request failed (${res.status})`);
      }

      toast.success(t("settings.account.name.updated"));
      await mutate("/account/me");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occured");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <form>
          <DialogTrigger asChild>
            <Button variant="link" className="cursor-pointer">
              <Edit />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125 min-h-50 max-h-75 flex flex-col items-start justify-start">
            <DialogHeader>
              <DialogTitle>{t("settings.account.name.title")}</DialogTitle>
              <DialogDescription>
                {t("settings.account.name.description")}
              </DialogDescription>
            </DialogHeader>
            {/* content */}
            <Input
              placeholder={t("register.fullnamePlaceholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />

            {error && (
              <p className="text-red-500">
                {i18n.exists(error) ? (
                  <Trans
                    i18nKey={error}
                    values={{ days: remainingDays ?? 0 }}
                    components={{ time: <span /> }}
                  />
                ) : remainingDays !== null ? (
                  `${error} (${remainingDays} days)`
                ) : (
                  error
                )}
              </p>
            )}

            <div className="w-full inline-flex justify-end gap-1">
              <Button
                variant="outline"
                className="cursor-pointer"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                disabled={isSubmitting}
                type="button"
                onClick={onSubmit}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
