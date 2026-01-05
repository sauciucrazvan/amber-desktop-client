import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Shield, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocation } from "wouter";

type AccountMe = {
  username: string;
  full_name?: string | null;
  email?: string | null;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const initials = (first + last).toUpperCase();
  return initials || "?";
}

export default function AccountTab() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const { isAuthenticated, logout } = useAuth();
  const {
    data: account,
    error,
    isLoading,
  } = useSWR<AccountMe>(isAuthenticated ? "/account/me" : null);

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Separator />

      <section className="py-4 flex flex-col justify-center items-center gap-2 rounded-md p-2 transition ease-in-out duration-300">
        <Avatar className="w-12 h-12 text-xl">
          <AvatarFallback>
            {account?.full_name
              ? initialsFromName(String(account.full_name))
              : account?.username
              ? initialsFromName(account.username)
              : isLoading
              ? "…"
              : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-0">
          <h3 className="text-md leading-tight">
            {error
              ? "Failed to load"
              : isLoading
              ? "Loading…"
              : (account?.full_name ?? "") || ""}{" "}
            (
            {error
              ? ""
              : isLoading
              ? ""
              : account?.username
              ? `@${account.username}`
              : ""}
            )
          </h3>
          <p className="text-muted-foreground text-xs">
            {error
              ? ""
              : isLoading
              ? ""
              : account?.email
              ? `${account.email}`
              : ""}
          </p>
        </div>
      </section>

      <Separator />

      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-md text-primary">
            {t("settings.account.signOut.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.account.signOut.description")}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer hover:text-white/80 w-[30%]"
          onClick={() => {
            logout();
            setLocation("/login");
            toast.success(t("settings.account.signOut.toast"));
          }}
        >
          <LogOut /> {t("settings.account.signOut.action")}
        </Button>
      </div>

      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-md text-primary">
            {t("settings.account.delete.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.account.delete.description")}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer hover:text-white/80 w-[30%]"
          onClick={() => {
            logout();
            setLocation("/login");
            toast.success(t("settings.account.delete.toast"));
          }}
        >
          <Trash /> {t("settings.account.delete.action")}
        </Button>
      </div>

      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-md text-primary">
            {t("settings.account.data.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.account.data.description")}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer hover:text-white/80 w-[30%]"
          onClick={() => {}}
        >
          <Shield /> {t("settings.account.data.action")}
        </Button>
      </div>
    </>
  );
}
