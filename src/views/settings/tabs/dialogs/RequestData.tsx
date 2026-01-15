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
import { API_BASE_URL } from "@/config";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function RequestData() {
  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(API_BASE_URL + "/account/request/data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json().catch(() => null);
      setError(data?.detail);

      if (res.ok) {
        toast.success(t("settings.account.data.toast"));
        setOpen(false);
      }
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
            <Button
              variant="link"
              className="cursor-pointer"
              onClick={() => {}}
            >
              {t("settings.account.data.title")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125 min-h-25 max-h-75 flex flex-col items-start justify-start">
            <DialogHeader>
              <DialogTitle>{t("settings.account.delete.title")}</DialogTitle>
              <DialogDescription>
                {t("settings.account.data.description")}
              </DialogDescription>
            </DialogHeader>
            {/* content */}
            {error && <p className="text-red-500">{t(error)}</p>}

            <div className="w-full inline-flex justify-end gap-1">
              <Button
                variant="outline"
                className="cursor-pointer"
                type="button"
                onClick={() => setOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                disabled={isSubmitting}
                type="button"
                onClick={onSubmit}
              >
                {t("settings.account.data.action")}
              </Button>
            </div>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
