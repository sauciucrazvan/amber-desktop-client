import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config";
import { UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function AddContact() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [submittedUsername, setSubmittedUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();

  const onSubmit = async () => {
    const requestedUsername = username.trim();

    setError(null);
    setIsSubmitting(true);
    setSubmittedUsername(requestedUsername);

    try {
      if (requestedUsername === "") {
        return;
      }

      const res = await fetch(API_BASE_URL + "/account/contacts/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: requestedUsername,
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

      setOpen(false);
      toast.success(
        t("contacts.requested").replace("{{user}}", requestedUsername),
      );
      setUsername("");
      setSubmittedUsername("");
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
        <DialogTrigger asChild>
          <Button
            size="icon-lg"
            variant="outline"
            className="cursor-pointer h-full"
          >
            <UserRoundPlus />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-125 min-h-25 max-h-100 flex flex-col items-start justify-start">
          <DialogHeader>
            <DialogTitle>{t("contacts.add.title")}</DialogTitle>
            <DialogDescription>
              {t("contacts.add.description")}
            </DialogDescription>
          </DialogHeader>
          {/* content */}
          <Field>
            <ButtonGroup>
              <Input
                placeholder={t("contacts.add.username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isSubmitting) {
                    onSubmit();
                  }
                }}
              />
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={isSubmitting}
                onClick={onSubmit}
              >
                {t("contacts.add.action")}
              </Button>
            </ButtonGroup>
          </Field>

          {error && (
            <p className="text-red-500">
              <Trans i18nKey={error} values={{ user: submittedUsername }} />
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
