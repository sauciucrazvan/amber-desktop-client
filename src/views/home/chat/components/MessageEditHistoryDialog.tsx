import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { MessageItem } from "../types";

type Props = {
  editedAt: string | null;
  history?: MessageItem["content"]["history"];
};

export default function MessageEditHistoryDialog({ editedAt, history }: Props) {
  const { t, i18n } = useTranslation();

  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  if (!editedAt) return null;

  const entries = Array.isArray(history) ? [...history].reverse() : [];

  const formatHistoryDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    try {
      return new Intl.DateTimeFormat(i18n.language, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
        timeZoneName: "short",
      }).format(parsed);
    } catch {
      return parsed.toLocaleString(i18n.language);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <a
          type="button"
          className="mr-0.5 cursor-pointer hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          {t("conversations.edited")}
        </a>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden sm:max-w-125 p-0"
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6 gap-4">
          <DialogHeader>
            <DialogTitle>{t("conversations.history.title")}</DialogTitle>
            <DialogDescription>
              {t("conversations.history.description")}
            </DialogDescription>
          </DialogHeader>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("conversations.history.empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, index) => (
                <div
                  key={`${entry?.date ?? "unknown"}-${index}`}
                  className="rounded-md border bg-muted/30 p-3"
                >
                  <div className="mb-1 text-xs text-muted-foreground">
                    {formatHistoryDate(entry?.date)}
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-all wrap-anywhere select-text">
                    {entry?.text || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
