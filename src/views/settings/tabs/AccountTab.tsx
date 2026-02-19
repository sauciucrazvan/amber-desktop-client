import { useAuth } from "@/auth/AuthContext";
import { Separator } from "@/components/ui/separator";
import useSWR from "swr";
import ChangeName from "./dialogs/ChangeName";
import HiddenComponent from "@/components/ui/hidden-component";
import ChangePassword from "./dialogs/ChangePassword";
import ChangeEmail from "./dialogs/ChangeEmail";
import SignOut from "./dialogs/SignOut";
import DeleteAccount from "./dialogs/DeleteAccount";
import RequestData from "./dialogs/RequestData";
import VerifyAccount from "@/views/dialogs/VerifyAccount";
import { useTranslation } from "react-i18next";
import { BadgeAlert } from "lucide-react";
import BlockedAccounts from "@/views/dialogs/BlockedAccounts";
import UserAvatar from "@/components/common/user-avatar";

type AccountMe = {
  username: string;
  full_name?: string | null;
  email?: string | null;
  verified?: boolean | null;
};

export default function AccountTab() {
  const { isAuthenticated } = useAuth();
  const {
    data: account,
    error,
    isLoading,
  } = useSWR<AccountMe>(isAuthenticated ? "/account/me" : null);

  if (!isAuthenticated) return <>Unauthorized.</>;

  const { t } = useTranslation();

  return (
    <>
      <Separator />

      <section className="py-4 flex flex-col justify-center items-center gap-2 rounded-md p-2 transition ease-in-out duration-300">
        <UserAvatar
          full_name={account?.full_name}
          username={account?.username}
          size="lg"
        />
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
          <div className="text-muted-foreground text-xs">
            {error ? (
              ""
            ) : isLoading ? (
              ""
            ) : account?.email ? (
              <HiddenComponent text={account?.email} />
            ) : (
              ""
            )}
          </div>
        </div>
      </section>

      <section className="w-full inline-flex items-start justify-center gap-1">
        <div className="flex flex-col items-start">
          <ChangeName />
          <ChangeEmail />
          <ChangePassword />
        </div>
        <div className="flex flex-col items-end">
          <RequestData />
          <SignOut />
          <DeleteAccount />
        </div>
      </section>

      {!account?.verified && (
        <section className="text-yellow-500 mt-2 w-full inline-flex items-center justify-center gap-1">
          <BadgeAlert />
          <p>{t("register.verify.not_verified")}</p>
          <VerifyAccount trigger_type={"text"} />
        </section>
      )}
      {account?.verified && (
        <section className="w-full inline-flex items-center justify-center">
          <BlockedAccounts />
        </section>
      )}
    </>
  );
}
