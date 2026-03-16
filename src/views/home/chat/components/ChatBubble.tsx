import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { formatHHmm } from "@/lib/utils";
import { t } from "i18next";
import { Check, CheckCheck, Pencil, Reply, Trash2 } from "lucide-react";

interface Props {
  myUserId: number | null;
  message: {
    id: string;
    sender_id: number;
    content: {
      text?: string | undefined;
      reply_to?: {
        id: string;
        sender_id: number;
        content: {
          text?: string | undefined;
        };
        created_at: string;
      };
    };
    created_at: string;
    edited_at: string | null;
    seen: boolean;
  };

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
  const isMine = myUserId !== null && message.sender_id === myUserId;
  const text = message.content?.text ?? "";

  return (
    <div
      key={message.id}
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
    >
      <ContextMenu key={message.id}>
        <ContextMenuTrigger
          className={`flex min-w-0 max-w-[75%] flex-col rounded-md border px-3 py-2 text-sm
  ${isMine ? "bg-muted" : "bg-background"}`}
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
              {message.edited_at && <p className="mr-0.5">Edited</p>}

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
              <Reply /> Reply
            </ContextMenuItem>

            {isMine && (
              <>
                <ContextMenuItem
                  className="cursor-pointer"
                  onClick={() => edit_func(message.id)}
                >
                  <Pencil /> Edit
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => delete_func(message.id)}
                >
                  <Trash2 /> Delete
                </ContextMenuItem>
              </>
            )}
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
