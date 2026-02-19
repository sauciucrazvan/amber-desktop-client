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
import { Separator } from "@/components/ui/separator";
import { API_BASE_URL } from "@/config";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function ChangePassword() {
  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState(0);

  const onSubmit = async () => {
    setError(null);

    if (stage === 0) {
      setStage(1);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(API_BASE_URL + "/account/modify/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        }),
      });

      const data = await res.json().catch(() => null);
      setError(data?.detail);

      if (res.ok) {
        toast.success(t("settings.account.password.updated"));
        setOpen(false);
        setStage(0);
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
              {t("settings.account.password.title")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125 min-h-50 max-h-100 flex flex-col gap-4 p-0">
            <div className="flex flex-1 flex-col gap-4 px-6 pt-6">
              <DialogHeader>
                <DialogTitle>
                  {t("settings.account.password.title")}
                </DialogTitle>
                <DialogDescription>
                  {t("settings.account.password.description")}
                </DialogDescription>
              </DialogHeader>
              {/* content */}
              {stage == 0 && (
                <section className="flex flex-col items-start justify-start gap-2 w-full">
                  <Input
                    placeholder={t(
                      "settings.account.password.current_password",
                    )}
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSubmitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  />
                </section>
              )}

              {stage == 1 && (
                <section className="flex flex-col items-start justify-start gap-2 w-full">
                  <Input
                    placeholder={t("settings.account.password.new_password")}
                    type="password"
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
                      "settings.account.password.new_password_confirmation",
                    )}
                    type="password"
                    value={newPasswordConfirmation}
                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                    disabled={isSubmitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  />
                </section>
              )}

              {error && <p className="text-red-500">{t(error)}</p>}
            </div>

            <section className="mt-auto w-full flex items-center justify-between gap-4 border-t bg-muted/50 px-6 py-4">
              <div className="inline-flex items-center gap-1 w-full text-2xl cursor-default text-muted-foreground select-none">
                <div className={stage >= 0 ? "text-foreground" : undefined}>
                  •
                </div>
                <div className={stage >= 1 ? "text-foreground" : undefined}>
                  •
                </div>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="w-full inline-flex justify-end gap-1">
                {stage == 0 && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
                {stage == 1 && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setStage(0)}
                  >
                    {t("login.recovery.action.back")}
                  </Button>
                )}
                <Button
                  variant="default"
                  className="cursor-pointer"
                  disabled={isSubmitting}
                  type="button"
                  onClick={onSubmit}
                >
                  {stage == 1
                    ? t("common.submit")
                    : t("login.recovery.action.next")}
                </Button>
              </div>
            </section>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
