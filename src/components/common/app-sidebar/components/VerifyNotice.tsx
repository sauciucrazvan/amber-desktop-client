import VerifyAccount from "@/views/dialogs/VerifyAccount";
import { BadgeAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function VerifyNotice() {
  const { t } = useTranslation();

  return (
    <div className="bg-sidebar text-sm flex items-center gap-1">
      <p className="text-muted-foreground">
        {t(
          "account.verify.notice",
          "Verify your account to unlock full features.",
        )}
      </p>
      <VerifyAccount>
        <a className="cursor-pointer text-yellow-500 hover:underline hover:text-yellow-600 transition ease-in-out duration-300">
          {t("account.verify.now")}
        </a>
      </VerifyAccount>
    </div>
  );
}
