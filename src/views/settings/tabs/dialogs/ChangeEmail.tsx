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
import { useSWRConfig } from "swr";

export default function ChangeEmail() {
  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();
  const { mutate } = useSWRConfig();

  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(API_BASE_URL + "/account/modify/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_email: email,
          password: password,
        }),
      });

      const data = await res.json().catch(() => null);
      setError(data?.detail);

      if (res.ok) {
        toast.success(t("settings.account.email.updated"));
        await mutate("/account/me");
        setEmail("");
        setPassword("");
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
            <Button variant="link" className="cursor-pointer">
              {t("settings.account.email.title")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125 min-h-50 max-h-75 flex flex-col items-start justify-start">
            <DialogHeader>
              <DialogTitle>{t("settings.account.email.title")}</DialogTitle>
              <DialogDescription>
                {t("settings.account.email.description")}
              </DialogDescription>
            </DialogHeader>
            {/* content */}
            <Input
              placeholder={t("register.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSubmit();
                }
              }}
            />

            <Input
              placeholder={t("login.passwordPlaceholder")}
              type={"password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSubmit();
                }
              }}
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
                variant="default"
                className="cursor-pointer"
                disabled={isSubmitting}
                type="button"
                onClick={onSubmit}
              >
                {t("common.submit")}
              </Button>
            </div>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
