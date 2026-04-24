import { useAuth } from "@/auth/AuthContext";
import { useAccount } from "@/account/AccountContext";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import UserAvatar from "@/components/common/user-avatar";
import {
  BadgeAlert,
  ChevronRight,
  LogOut,
  Shield,
  ShieldBan,
  UserCog,
} from "lucide-react";
import RequestData from "./dialogs/RequestData";
import SignOut from "./dialogs/SignOut";
import ManageAccountData from "./dialogs/ManageAccountData";
import BlockedAccounts from "@/views/dialogs/BlockedAccounts";
import VerifyAccount from "@/views/dialogs/VerifyAccount";

export default function AccountTab() {
  const { isAuthenticated } = useAuth();
  const { account, error, isLoading } = useAccount();
  const { t } = useTranslation();

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
              avatarUrl={account?.avatar_url}
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

        <div>
          {account?.verified === false && (
            <>
              <Separator className="my-1" />

              <VerifyAccount>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <BadgeAlert className="h-3.5 w-3.5" />
                    </div>
                    <p className="truncate text-xs font-medium">
                      {t("register.verify.verify_now")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </VerifyAccount>
            </>
          )}

          {account?.verified && (
            <>
              <Separator className="my-1" />

              <BlockedAccounts>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
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
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
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

          <RequestData>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.data.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </RequestData>
        </div>
      </section>
    </div>
  );
}
