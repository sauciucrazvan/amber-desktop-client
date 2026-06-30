import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { formatHHmm } from "@/lib/utils";
import {
  Check,
  CheckCheck,
  Pencil,
  Reply,
  Trash2,
  ChevronRight,
  FileText,
  FileArchive,
  FileCode,
  File as FileIcon,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { MessageItem, MessageReactionDetails } from "../types";
import MessageEditHistoryDialog from "./MessageEditHistoryDialog";
import EmojiPanel from "./EmojiPanel";

const LOG_SUFFIX_BY_EVENT: Record<string, string> = {
  initiated: " started a call",
  accepted: " accepted the call",
  rejected: " rejected the call",
  finished: " finished the call",
};

function extractActorFromLegacyCallLogText(text: string, eventName: string) {
  const suffix = LOG_SUFFIX_BY_EVENT[eventName];
  if (!suffix) return "";
  if (!text.endsWith(suffix)) return "";

  const actor = text.slice(0, text.length - suffix.length).trim();
  return actor;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(contentType?: string) {
  const type = contentType?.toLowerCase() || "";
  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("tar") ||
    type.includes("gzip")
  ) {
    return <FileArchive className="h-8 w-8 text-amber-500 shrink-0" />;
  }
  if (
    type.includes("text") ||
    type.includes("pdf") ||
    type.includes("document") ||
    type.includes("sheet")
  ) {
    return <FileText className="h-8 w-8 text-blue-500 shrink-0" />;
  }
  if (
    type.includes("javascript") ||
    type.includes("json") ||
    type.includes("html") ||
    type.includes("css")
  ) {
    return <FileCode className="h-8 w-8 text-emerald-500 shrink-0" />;
  }
  return <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />;
}

interface Props {
  myUserId: number | null;
  message: MessageItem;
  otherUserName?: string;
  onScrollToMessage?: (messageId: string) => void;

  delete_func: (id: string) => void;
  reply_func: (id: string) => void;
  edit_func: (id: string) => void;
  add_reaction_func?: (emoji: string) => void;
  remove_reaction_func?: (emoji: string) => void;
}

export default function ChatBubble({
  myUserId,
  message,
  otherUserName,
  onScrollToMessage,
  delete_func,
  reply_func,
  edit_func,
  add_reaction_func,
  remove_reaction_func,
}: Props) {
  const { t } = useTranslation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const isMine = myUserId !== null && message.sender_id === myUserId;
  const text = message.content?.text ?? "";

  const isTextMessage = message.type === "text";
  const isLogMessage = message.type === "log";
  const isFileMessage = message.type === "file";

  const fileUrl = message.content?.url ?? "";
  const fileName = message.content?.filename ?? "file";
  const fileType = message.content?.content_type ?? "";
  const fileSize = message.content?.size;
  const isImageFile = fileType.startsWith("image/");

  const logEvent =
    typeof message.content?.event === "string" ? message.content.event : "";
  const logEventName = logEvent.startsWith("call.")
    ? logEvent.slice("call.".length)
    : logEvent;

  const actorFromPayload =
    typeof message.content?.actor_display_name === "string"
      ? message.content.actor_display_name.trim()
      : "";
  const actorFromLegacyText = extractActorFromLegacyCallLogText(
    text,
    logEventName,
  );
  const logActor = actorFromPayload || actorFromLegacyText;
  const actorUserId =
    typeof message.content?.actor_user_id === "number"
      ? message.content.actor_user_id
      : message.sender_id;
  const isViewerActor = myUserId !== null && actorUserId === myUserId;
  const otherDisplayName = otherUserName?.trim() || t("calls.unknown");

  const supportsActorInterpolation =
    logEventName === "initiated" ||
    logEventName === "accepted" ||
    logEventName === "rejected" ||
    logEventName === "finished";

  const logText =
    isLogMessage && logEventName
      ? logEventName === "missed"
        ? isViewerActor
          ? t("calls.logs.missedNoAnswer", {
              actor: otherDisplayName,
              defaultValue: text,
            })
          : t("calls.logs.missedFrom", {
              actor: logActor || otherDisplayName,
              defaultValue: text,
            })
        : supportsActorInterpolation && logActor
          ? t(`calls.logs.${logEventName}WithActor`, {
              actor: logActor,
              defaultValue: text,
            })
          : t(`calls.logs.${logEventName}`, { defaultValue: text })
      : text;

  const reactionDetails: MessageReactionDetails[] = message.reaction_details
    ? message.reaction_details
    : Object.entries(message.reactions ?? {}).map(([emoji, count]) => ({
        emoji,
        count,
        user_ids: [],
      }));

  const closeReactionMenus = () => {
    setEmojiPickerOpen(false);
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );
  };

  return (
    <div
      key={message.id}
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
    >
      {isLogMessage && (
        <div className="flex w-full justify-center">
          <div className="flex max-w-[90%] items-center gap-2 rounded-full border border-dashed bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="max-w-full text-center">{logText}</span>
            <span className="shrink-0 text-[10px] opacity-80">
              {formatHHmm(new Date(message.created_at))}
            </span>
          </div>
        </div>
      )}

      {(isTextMessage || isFileMessage) && (
        <ContextMenu key={message.id}>
          <ContextMenuTrigger
            className={`flex min-w-0 flex-col text-sm max-w-[75%] rounded-md border px-3 py-2 ${isMine ? "bg-muted" : "bg-background"}`}
          >
            {message.content.reply_to && (
              <button
                type="button"
                onClick={() =>
                  onScrollToMessage?.(message.content.reply_to!.id)
                }
                className="w-full bg-primary/5 border-l-2 p-2 rounded-sm mb-1 whitespace-pre-wrap break-all wrap-anywhere text-left hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  {message.content.reply_to.sender_id === myUserId
                    ? t("conversations.you")
                    : otherUserName}
                </p>
                <p className="text-sm">
                  {message.content.reply_to.type === "file"
                    ? `📎 ${message.content.reply_to.content.filename || "File"}`
                    : message.content.reply_to.content.text}
                </p>
              </button>
            )}

            <div className="flex flex-col min-w-0 w-full gap-1">
              {isFileMessage && (
                <div className="mb-1 max-w-full min-w-[240px]">
                  {isImageFile ? (
                    <div className="relative rounded overflow-hidden border bg-black/5 max-h-[320px] flex items-center justify-center">
                      <img
                        src={fileUrl}
                        alt={fileName}
                        className="object-contain max-w-full max-h-[320px] w-auto h-auto"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-background/50 backdrop-blur-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        {getFileIcon(fileType)}
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate text-sm text-foreground">
                            {fileName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatBytes(fileSize)}
                          </span>
                        </div>
                      </div>
                      <a
                        href={fileUrl}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {isTextMessage && (
                <div className="min-w-0 whitespace-pre-wrap break-all wrap-anywhere select-text">
                  {text}
                </div>
              )}

              <div className="mt-1 self-end inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                {isTextMessage && (
                  <MessageEditHistoryDialog
                    editedAt={message.edited_at}
                    history={message.content?.history}
                  />
                )}

                {formatHHmm(new Date(message.created_at))}

                {message.seen ? (
                  <CheckCheck size="16" className="text-blue-400" />
                ) : (
                  <Check size="16" />
                )}
              </div>
            </div>

            {reactionDetails.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {reactionDetails.map((reaction) => {
                  const hasReacted =
                    myUserId !== null && reaction.user_ids.includes(myUserId);
                  const reactionTooltip = hasReacted
                    ? t("conversations.reactions.remove")
                    : t("conversations.reactions.add");

                  return (
                    <Tooltip key={reaction.emoji}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors cursor-pointer ${
                            hasReacted
                              ? "border-primary/40 bg-primary/10"
                              : "border-border bg-secondary hover:bg-muted"
                          }`}
                          onClick={() => {
                            if (hasReacted) {
                              remove_reaction_func?.(reaction.emoji);
                              return;
                            }
                            add_reaction_func?.(reaction.emoji);
                          }}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-muted-foreground">
                            {reaction.count}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{reactionTooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </ContextMenuTrigger>
          <ContextMenuContent className="max-w-xs">
            <ContextMenuGroup>
              <div className="flex items-center gap-1 px-2 py-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xl hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => {
                        add_reaction_func?.("👍");
                        closeReactionMenus();
                      }}
                    >
                      👍
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("conversations.reactions.quick.like")}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xl hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => {
                        add_reaction_func?.("❤️");
                        closeReactionMenus();
                      }}
                    >
                      ❤️
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("conversations.reactions.quick.love")}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xl hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => {
                        add_reaction_func?.("😊");
                        closeReactionMenus();
                      }}
                    >
                      😊
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("conversations.reactions.quick.smile")}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xl hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => {
                        add_reaction_func?.("😂");
                        closeReactionMenus();
                      }}
                    >
                      😂
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("conversations.reactions.quick.laugh")}</p>
                  </TooltipContent>
                </Tooltip>
                <EmojiPanel
                  onEmojiSelect={(emoji) => {
                    add_reaction_func?.(emoji);
                    closeReactionMenus();
                  }}
                  open={emojiPickerOpen}
                  onOpenChange={setEmojiPickerOpen}
                  triggerTooltip={t("conversations.reactions.more")}
                  customTrigger={
                    <button
                      type="button"
                      className="ml-1 p-1 text-muted-foreground hover:bg-muted rounded transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  }
                />
              </div>

              <ContextMenuSeparator />

              <ContextMenuItem
                className="cursor-pointer"
                onClick={() => reply_func(message.id)}
              >
                <Reply /> {t("conversations.actions.reply")}
              </ContextMenuItem>

              {isMine && (
                <>
                  {isTextMessage && (
                    <ContextMenuItem
                      className="cursor-pointer"
                      onClick={() => edit_func(message.id)}
                    >
                      <Pencil /> {t("conversations.actions.edit")}
                    </ContextMenuItem>
                  )}

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 /> {t("conversations.actions.delete")}
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      )}

      {confirmingDelete && (
        <ConfirmationDialog
          open={true}
          title={t("conversations.deleteMessage.confirm.title")}
          description={t("conversations.deleteMessage.confirm.description")}
          onConfirm={() => delete_func(message.id)}
          confirmText={t("common.delete")}
          isDestructive
          onOpenChange={(isOpen) => {
            if (!isOpen) setConfirmingDelete(false);
          }}
        />
      )}
    </div>
  );
}
