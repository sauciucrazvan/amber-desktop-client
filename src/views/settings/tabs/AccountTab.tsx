import { useAuth } from "@/auth/AuthContext";
import { Separator } from "@/components/ui/separator";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import UserAvatar from "@/components/common/user-avatar";
import {
  ChevronRight,
  LogOut,
  Shield,
  ShieldBan,
  Trash2,
  UserCog,
} from "lucide-react";
import RequestData from "./dialogs/RequestData";
import SignOut from "./dialogs/SignOut";
import DeleteAccount from "./dialogs/DeleteAccount";
import ManageAccountData from "./dialogs/ManageAccountData";
import BlockedAccounts from "@/views/dialogs/BlockedAccounts";

type AccountMe = {
  username: string;
  full_name?: string | null;
  email?: string | null;
  verified?: boolean | null;
};

export default function AccountTab() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const {
    data: account,
    error,
    isLoading,
  } = useSWR<AccountMe>(isAuthenticated ? "/account/me" : null);

  if (!isAuthenticated) return <>Unauthorized.</>;

  const displayName = error
    ? "Failed to load"
    : isLoading
      ? "Loading..."
      : (account?.full_name ?? "");

  const username = error
    ? ""
    : isLoading
      ? ""
      : account?.username
        ? `@${account.username}`
        : "";

  const rowClassName =
    "group w-full min-w-0 cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary/70";

  return (
    <div className="space-y-3">
      <Separator />

      <section className="overflow-hidden rounded-xl border border-border/60 bg-card/70 p-1.5 shadow-sm">
        <div className="flex flex-row items-center justify-between gap-2 rounded-lg px-2.5 py-2">
          <div className="min-w-0 flex flex-row items-center gap-2.5">
            <UserAvatar
              full_name={account?.full_name}
              username={account?.username}
              size="md"
            />
            <div className="min-w-0 flex flex-col justify-start items-start gap-0">
              <h3 className="truncate text-sm leading-tight">{displayName}</h3>
              <p className="truncate text-muted-foreground text-xs text-start">
                {username}
              </p>
            </div>
          </div>

          <ManageAccountData>
            <div className="group cursor-pointer inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground">
              <UserCog className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {t("settings.account.manage.short_title", "Manage")}
              </span>
            </div>
          </ManageAccountData>
        </div>

        <Separator className="my-1" />

        <div>
          <RequestData>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.data.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </RequestData>

          {account?.verified && (
            <>
              <Separator className="my-1" />

              <BlockedAccounts>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <ShieldBan className="h-3.5 w-3.5" />
                    </div>
                    <p className="truncate text-xs font-medium">
                      {t("contacts.blocked.trigger")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </BlockedAccounts>
            </>
          )}

          <Separator className="my-1" />

          <SignOut>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.signOut.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </SignOut>

          <Separator className="my-1" />

          <DeleteAccount>
            <div className="group w-full min-w-0 cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary/70">
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-red-500/10 text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.delete.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </DeleteAccount>
        </div>
      </section>
    </div>
  );
}
