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
import { Label } from "@/components/ui/label";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [stage, setStage] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      switch (stage) {
        case 0: {
          const res = await fetch(
            API_BASE_URL + "/account/modify/email/request",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                new_email: email,
                password: password,
              }),
            },
          );

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            if (res.status === 429) {
              throw new Error("common.errors.too_many_requests");
            }

            const detail = data?.detail;
            throw new Error(detail);
          }

          toast.success(t("settings.account.email.verify_sent"));
          setStage(1);
          break;
        }
        case 1: {
          if (isConfirmed) {
            setStage(2);
            break;
          }

          const res = await fetch(
            API_BASE_URL + "/account/modify/email/confirm",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                code: confirmCode,
              }),
            },
          );

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            if (res.status === 429) {
              throw new Error("common.errors.too_many_requests");
            }

            const detail = data?.detail;
            throw new Error(detail);
          }

          setIsConfirmed(true);
          setStage(2);
          break;
        }
        case 2: {
          const res = await fetch(
            API_BASE_URL + "/account/modify/email/verify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                code: verifyCode,
              }),
            },
          );

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            if (res.status === 429) {
              throw new Error("common.errors.too_many_requests");
            }

            const detail = data?.detail;
            throw new Error(detail);
          }

          toast.success(t("settings.account.email.updated"));

          setOpen(false);
          setStage(0);
          setIsConfirmed(false);

          setEmail("");
          setPassword("");
          setConfirmCode("");
          setVerifyCode("");

          await mutate("/account/me");
          break;
        }
        default: {
          setStage(0);
          setIsConfirmed(false);
          break;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occured");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  const descriptionKey =
    stage == 0
      ? "settings.account.email.request_description"
      : stage == 1
        ? "settings.account.email.confirm_description"
        : "settings.account.email.verify_description";

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <form>
          <DialogTrigger asChild>
            <Button variant="link" className="cursor-pointer">
              {t("settings.account.email.title")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125 min-h-25 max-h-100 flex flex-col items-start justify-start">
            <DialogHeader>
              <DialogTitle>{t("settings.account.email.title")}</DialogTitle>
              <DialogDescription>{t(descriptionKey)}</DialogDescription>
            </DialogHeader>
            {stage == 0 && (
              <>
                <Label>{t("register.emailPlaceholder")}</Label>
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
              </>
            )}

            {stage == 1 && (
              <>
                <Label>{t("settings.account.email.confirm_code")}</Label>
                <Input
                  placeholder={t("settings.account.email.confirm_code")}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />
              </>
            )}

            {stage == 2 && (
              <>
                <Label>{t("settings.account.email.verify_code")}</Label>
                <Input
                  placeholder={t("settings.account.email.verify_code")}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
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

            <section className="w-full inline-flex items-center justify-between gap-1">
              <div className="inline-flex items-center gap-1 w-full text-2xl cursor-default text-muted-foreground select-none">
                <div className={stage >= 0 ? "text-foreground" : undefined}>
                  •
                </div>
                <div className={stage >= 1 ? "text-foreground" : undefined}>
                  •
                </div>
                <div className={stage >= 2 ? "text-foreground" : undefined}>
                  •
                </div>
              </div>
              <div className="w-full inline-flex justify-end gap-1">
                {stage <= 1 && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
                {stage > 1 && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setStage(Math.max(1, stage - 1))}
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
                  {stage == 2
                    ? t("login.recovery.action.finish")
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
