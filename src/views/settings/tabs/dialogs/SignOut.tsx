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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function SignOut() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>
          <Button variant="link" className="cursor-pointer">
            {t("settings.account.signOut.title")}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-125 min-h-40 max-h-60 flex flex-col gap-4 p-0">
          <div className="flex flex-1 flex-col gap-4 px-6 pt-6">
            <DialogHeader>
              <DialogTitle>{t("settings.account.signOut.title")}</DialogTitle>
              <DialogDescription>
                {t("settings.account.signOut.description")}
              </DialogDescription>
            </DialogHeader>
          </div>
          <section className="mt-auto w-full flex items-center justify-end gap-1 border-t bg-muted/50 px-6 py-4">
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
              type="button"
              onClick={() => {
                logout();
                setLocation("/login");
                toast.success(t("settings.account.signOut.toast"));
              }}
            >
              {t("settings.account.signOut.action")}
            </Button>
          </section>
        </DialogContent>
      </form>
    </Dialog>
  );
}
