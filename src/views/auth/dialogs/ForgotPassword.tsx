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

export default function ForgotPassword() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    if (!sent) {
      try {
        const res = await fetch(API_BASE_URL + "/account/recovery/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error("common.errors.too_many_requests");
          }

          const detail = data?.detail;
          throw new Error(detail);
        }

        toast.success(t("login.recovery.sent"));
        setSent(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occured");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        const res = await fetch(API_BASE_URL + "/account/recovery/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            code: code,
            new_password: newPassword,
            new_password_confirmation: newPasswordConfirmation,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error("common.errors.too_many_requests");
          }

          const detail = data?.detail;
          throw new Error(detail);
        }

        toast.success(t("login.recovery.success"));
        setOpen(false);
        setSent(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occured");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <form>
          <DialogTrigger asChild>
            <Button
              data-slot="field-description"
              variant={"link"}
              className="mt-2 cursor-pointer text-muted-foreground text-sm leading-normal font-normal [[data-variant=legend]+&amp;]:-mt-1.5 [&amp;&gt;a:hover]:text-primary [&amp;&gt;a]:underline [&amp;&gt;a]:underline-offset-4 px-6 text-center"
            >
              {t("login.forgotPassword")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125 min-h-25 max-h-100 flex flex-col items-start justify-start">
            <DialogHeader>
              <DialogTitle>{t("login.recovery.title")}</DialogTitle>
              <DialogDescription>
                {t("login.recovery.description")}
              </DialogDescription>
            </DialogHeader>
            {/* content */}
            <Input
              placeholder={t("login.usernamePlaceholder")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSubmit();
                }
              }}
            />

            {sent && (
              <>
                <Input
                  placeholder={t("login.recovery.code")}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />

                <Input
                  placeholder={t("settings.account.password.new_password")}
                  type={"password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />

                <Input
                  placeholder={t(
                    "settings.account.password.new_password_confirmation"
                  )}
                  type={"password"}
                  value={newPasswordConfirmation}
                  onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />
              </>
            )}

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
