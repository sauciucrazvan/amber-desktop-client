import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { formatHHmm } from "@/lib/utils";
import { Check, CheckCheck, Pencil, Reply, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MessageItem } from "../types";
import MessageEditHistoryDialog from "./MessageEditHistoryDialog";

interface Props {
  myUserId: number | null;
  message: MessageItem;

  delete_func: (id: string) => void;
  reply_func: (id: string) => void;
  edit_func: (id: string) => void;
}

export default function ChatBubble({
  myUserId,
  message,
  delete_func,
  reply_func,
  edit_func,
}: Props) {
  const { t } = useTranslation();

  const isMine = myUserId !== null && message.sender_id === myUserId;
  const text = message.content?.text ?? "";

  const isTextMessage = message.type === "text";
  const isLogMessage = message.type === "log";

  return (
    <div
      key={message.id}
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
    >
      {isLogMessage && (
        <div className="flex w-full justify-center">
          <div className="flex max-w-[90%] items-center gap-2 rounded-full border border-dashed bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="max-w-full text-center">{text}</span>
            <span className="shrink-0 text-[10px] opacity-80">
              {formatHHmm(new Date(message.created_at))}
            </span>
          </div>
        </div>
      )}

      {isTextMessage && (
        <ContextMenu key={message.id}>
          <ContextMenuTrigger
            className={`flex min-w-0 flex-col text-sm max-w-[75%] rounded-md border px-3 py-2 ${isMine ? "bg-muted" : "bg-background"}`}
          >
            {message.content.reply_to && (
              <div className="bg-primary/5 border-l-2 p-2 rounded-sm mb-1 whitespace-pre-wrap break-all wrap-anywhere">
                {message.content.reply_to.sender_id == myUserId && (
                  <p className="text-muted-foreground">
                    {t("conversations.you")}
                  </p>
                )}
                {message.content.reply_to.content.text}
              </div>
            )}

            <div className="inline-flex min-w-0 items-center gap-1">
              <div className="min-w-0 whitespace-pre-wrap break-all wrap-anywhere select-text">
                {text}
              </div>

              <div className="mt-1 self-end inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <MessageEditHistoryDialog
                  editedAt={message.edited_at}
                  history={message.content?.history}
                />

                {formatHHmm(new Date(message.created_at))}

                {message.seen ? (
                  <CheckCheck size="16" className="text-blue-400" />
                ) : (
                  <Check size="16" />
                )}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="max-w-xs">
            <ContextMenuGroup>
              <ContextMenuItem
                className="cursor-pointer"
                onClick={() => reply_func(message.id)}
              >
                <Reply /> {t("conversations.actions.reply")}
              </ContextMenuItem>

              {isMine && (
                <>
                  <ContextMenuItem
                    className="cursor-pointer"
                    onClick={() => edit_func(message.id)}
                  >
                    <Pencil /> {t("conversations.actions.edit")}
                  </ContextMenuItem>

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => delete_func(message.id)}
                  >
                    <Trash2 /> {t("conversations.actions.delete")}
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      )}
    </div>
  );
}
