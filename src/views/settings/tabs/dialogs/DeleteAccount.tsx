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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function DeleteAccount() {
  const { t } = useTranslation();
  const { accessToken, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(API_BASE_URL + "/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          password: password,
        }),
      });

      const data = await res.json().catch(() => null);
      setError(data?.detail);

      if (res.ok) {
        toast.success(t("settings.account.delete.toast"));
        setOpen(false);
        logout();
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
            <Button variant="link" className="cursor-pointer">
              {t("settings.account.delete.title")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125 min-h-50 max-h-75 flex flex-col items-start justify-start">
            <DialogHeader>
              <DialogTitle>{t("settings.account.delete.title")}</DialogTitle>
              <DialogDescription>
                {t("settings.account.delete.description")}
              </DialogDescription>
            </DialogHeader>
            {/* content */}
            <Input
              placeholder={t("register.passwordPlaceholder")}
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />

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
                variant="destructive"
                className="cursor-pointer"
                disabled={isSubmitting}
                type="button"
                onClick={onSubmit}
              >
                {t("settings.account.delete.action")}
              </Button>
            </div>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
