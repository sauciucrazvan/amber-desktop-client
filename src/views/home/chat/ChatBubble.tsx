import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { formatHHmm } from "@/lib/utils";
import { Check, CheckCheck, Reply, Trash2 } from "lucide-react";

interface Props {
  myUserId: number | null;
  message: {
    id: string;
    sender_id: number;
    content: {
      text?: string | undefined;
      reply_to: {
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
}

export default function ChatBubble({ myUserId, message, delete_func }: Props) {
  const isMine = myUserId !== null && message.sender_id === myUserId;
  const text = message.content?.text ?? "";

  return (
    <div
      key={message.id}
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
    >
      <ContextMenu key={message.id}>
        <ContextMenuTrigger
          className={`flex flex-col max-w-[75%] rounded-md border px-3 py-2 text-sm
  ${isMine ? "bg-muted" : "bg-background"}`}
        >
          <div className="wrap-break-word select-text">{text}</div>

          <div className="mt-1 self-end inline-flex items-center gap-0.5 text-xs text-muted-foreground">
            {formatHHmm(new Date(message.created_at))}
            {message.seen ? (
              <CheckCheck size="16" className="text-blue-400" />
            ) : (
              <Check size="16" />
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuGroup>
            <ContextMenuItem className="cursor-pointer">
              <Reply /> Reply
            </ContextMenuItem>
            {isMine && (
              <ContextMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={() => delete_func(message.id)}
              >
                <Trash2 /> Delete
              </ContextMenuItem>
            )}
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
