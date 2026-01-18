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
import { BadgeAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

interface VerifyAccountProps {
  trigger_type: "button" | "text";
}

export default function VerifyAccount({ trigger_type }: VerifyAccountProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [code, setCode] = useState("");

  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();
  const { mutate } = useSWRConfig();

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      switch (stage) {
        case 0: {
          const res = await fetch(API_BASE_URL + "/auth/verify/request", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            if (res.status === 429) {
              throw new Error("common.errors.too_many_requests");
            }

            const detail = data?.detail;
            throw new Error(detail);
          }

          toast.success(t("register.verify.email_sent"));
          setStage(1);
          break;
        }
        case 1: {
          const res = await fetch(API_BASE_URL + "/auth/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              verify_code: code,
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

          toast.success(t("register.verify.success"));

          setStage(0);
          setCode("");
          setOpen(false);

          await mutate("/account/me");
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

  const triggerButton =
    trigger_type == "button" ? (
      <Button variant="ghost" className="cursor-pointer text-yellow-500 h-full">
        <BadgeAlert />
      </Button>
    ) : (
      <a className="cursor-pointer hover:underline">
        <b>{t("register.verify.verify_now")}</b>
      </a>
    );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>

        <DialogContent className="sm:max-w-125 min-h-25 max-h-100 flex flex-col items-start justify-start">
          <DialogHeader>
            <DialogTitle>{t("register.verify.title")}</DialogTitle>
            <DialogDescription>
              {t("register.verify.description")}
            </DialogDescription>
          </DialogHeader>
          {/* content */}
          {stage == 1 && (
            <>
              <Label>{t("login.recovery.code")}</Label>
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
            </div>
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
                <>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setStage(Math.max(0, stage - 1))}
                  >
                    {t("register.verify.action.back")}
                  </Button>
                </>
              )}
              <Button
                variant="default"
                className="cursor-pointer"
                disabled={isSubmitting}
                type="button"
                onClick={onSubmit}
              >
                {stage == 1
                  ? t("register.verify.action.finish")
                  : t("register.verify.action.next")}
              </Button>
            </div>
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}
