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
        <DialogContent className="sm:max-w-125 min-h-40 max-h-40 flex flex-col items-start justify-start">
          <DialogHeader>
            <DialogTitle>{t("settings.account.signOut.title")}</DialogTitle>
            <DialogDescription>
              {t("settings.account.signOut.description")}
            </DialogDescription>
          </DialogHeader>
          {/* content */}
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
              type="button"
              onClick={() => {
                logout();
                setLocation("/login");
                toast.success(t("settings.account.signOut.toast"));
              }}
            >
              {t("settings.account.signOut.action")}
            </Button>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
