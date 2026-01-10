import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocation } from "wouter";
import ChangeName from "./dialogs/ChangeName";
import HiddenComponent from "@/components/ui/hidden-component";

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
            {error ? (
              ""
            ) : isLoading ? (
              ""
            ) : account?.email ? (
              <HiddenComponent text={account?.email} />
            ) : (
              ""
            )}
          </p>
        </div>
      </section>

      <section className="w-full inline-flex items-start justify-center gap-1">
        <div className="flex flex-col items-start">
          <ChangeName />

          <Button variant="link" className="cursor-pointer" onClick={() => {}}>
            {t("settings.account.email.title")}
          </Button>

          <Button variant="link" className="cursor-pointer" onClick={() => {}}>
            {t("settings.account.password.title")}
          </Button>
        </div>
        <div className="flex flex-col items-end">
          <Button variant="link" className="cursor-pointer" onClick={() => {}}>
            {t("settings.account.data.title")}
          </Button>

          <Button
            variant="link"
            className="cursor-pointer"
            onClick={() => {
              logout();
              setLocation("/login");
              toast.success(t("settings.account.signOut.toast"));
            }}
          >
            {t("settings.account.signOut.title")}
          </Button>

          <Button
            variant="link"
            className="cursor-pointer"
            onClick={() => {
              logout();
              setLocation("/login");
              toast.success(t("settings.account.delete.toast"));
            }}
          >
            {t("settings.account.delete.title")}
          </Button>
        </div>
      </section>

      {/* 
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
      </div> */}
    </>
  );
}
