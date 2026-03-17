import VerifyAccount from "@/views/dialogs/VerifyAccount";
import type { TFunction } from "i18next";

type VerifyNoticeProps = {
  t: TFunction;
  className?: string;
};

export default function VerifyNotice({ t, className }: VerifyNoticeProps) {
  return (
    <div className={className ?? "rounded-md border bg-muted/40 px-3 py-2"}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {t(
            "account.verify.notice",
            "Verify your account to unlock full features.",
          )}
        </p>
        <VerifyAccount trigger_type={"button"} />
      </div>
    </div>
  );
}
