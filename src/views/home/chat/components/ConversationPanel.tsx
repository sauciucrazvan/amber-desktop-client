import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "@/components/common/user-avatar";
import UserProfile from "@/views/dialogs/UserProfile";
import { useCalls } from "@/views/home/calls";
import { Edit2, Phone, Reply, Send, Video, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useChat } from "../context/ChatContext";
import ChatBubble from "./ChatBubble";
import { useConversationLogic } from "../hooks/useConversationLogic";
import type { MessageItem } from "../types";

type ConversationRow =
  | {
      type: "date";
      key: string;
      date: string;
    }
  | {
      type: "message";
      key: string;
      message: MessageItem;
    };

export default function ConversationPanel() {
  const { accessToken, authFetch } = useAuth();
  const { activeChat, closeChat } = useChat();
  const { startCall, screen } = useCalls();
  const { t, i18n } = useTranslation();

  const conversationId = activeChat?.conversation.id;
  const {
    messages,
    messageText,
    setMessageText,
    replyTo,
    setReplyTo,
    editing,
    setEditing,
    isLoading,
    isLoadingMore,
    myUserId,
    canSend,
    textareaRef,
    scrollContainerRef,
    bottomRef,
    formatMessageDate,
    onSend,
    onDelete,
    onReply,
    onEdit,
    onScroll,
  } = useConversationLogic({
    accessToken,
    authFetch,
    conversationId,
    peerUserId: activeChat?.otherUser.id,
    t,
    language: i18n.language,
  });

  const cancelComposerModes = useCallback(() => {
    setEditing(null);
    setReplyTo(null);
    setMessageText("");
  }, [setEditing, setReplyTo, setMessageText]);

  useEffect(() => {
    if (!editing && !replyTo) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      cancelComposerModes();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cancelComposerModes, editing, replyTo]);

  const VIRTUALIZE_MESSAGES_THRESHOLD = 120;
  const shouldVirtualize = messages.length >= VIRTUALIZE_MESSAGES_THRESHOLD;

  const rows = useMemo<ConversationRow[]>(() => {
    const nextRows: ConversationRow[] = [];
    let previousDate: string | null = null;

    for (const message of messages) {
      const currentDate = formatMessageDate(message.created_at);
      if (currentDate !== previousDate) {
        nextRows.push({
          type: "date",
          key: `date-${currentDate}-${message.id}`,
          date: currentDate,
        });
      }

      nextRows.push({
        type: "message",
        key: message.id,
        message,
      });

      previousDate = currentDate;
    }

    return nextRows;
  }, [formatMessageDate, messages]);

  const messageRowIndexById = useMemo(() => {
    const indexMap = new Map<string, number>();
    rows.forEach((row, index) => {
      if (row.type !== "message") return;
      indexMap.set(row.message.id, index);
    });
    return indexMap;
  }, [rows]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => (rows[index]?.type === "date" ? 34 : 88),
    overscan: 10,
  });

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const rowIndex = messageRowIndexById.get(messageId);
      if (rowIndex === undefined) return;

      if (shouldVirtualize) {
        rowVirtualizer.scrollToIndex(rowIndex, {
          align: "center",
        });

        window.requestAnimationFrame(() => {
          const element = document.getElementById(`message-${messageId}`);
          if (!element) return;
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
        return;
      }

      const element = document.getElementById(`message-${messageId}`);
      if (!element) return;
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    [messageRowIndexById, rowVirtualizer, shouldVirtualize],
  );

  if (!activeChat) return null;

  return (
    <section className="flex h-[calc(100%-3rem)] w-full flex-col pt-4">
      <div className="border-b">
        <div className="mb-1 flex items-center justify-between px-4 pb-2">
          <div className="flex min-w-0 items-center gap-2">
            <UserProfile
              username={activeChat.otherUser.username}
              trigger={
                <button
                  type="button"
                  className="min-w-0 inline-flex items-center gap-2 rounded-md px-1 py-1 text-left transition-colors cursor-pointer"
                >
                  <UserAvatar
                    full_name={activeChat.otherUser.full_name}
                    username={activeChat.otherUser.username}
                    isOnline={activeChat.otherUser.online}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">
                      {activeChat.otherUser.full_name}
                    </h2>
                    <p className="truncate text-xs text-muted-foreground">
                      @{activeChat.otherUser.username}
                    </p>
                  </div>
                </button>
              }
            />
          </div>

          <div className="inline-flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={() => {
                if (!activeChat) return;
                void startCall(
                  {
                    id: activeChat.otherUser.id,
                    username: activeChat.otherUser.username,
                    full_name: activeChat.otherUser.full_name,
                    online: activeChat.otherUser.online,
                  },
                  "audio",
                );
              }}
              disabled={screen !== "idle" || !activeChat.otherUser.online}
              title={
                activeChat.otherUser.online
                  ? t("calls.actions.startAudio")
                  : t("calls.actions.contactOffline")
              }
            >
              <Phone className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={() => {
                if (!activeChat) return;
                void startCall(
                  {
                    id: activeChat.otherUser.id,
                    username: activeChat.otherUser.username,
                    full_name: activeChat.otherUser.full_name,
                    online: activeChat.otherUser.online,
                  },
                  "video",
                );
              }}
              disabled={screen !== "idle" || !activeChat.otherUser.online}
              title={
                activeChat.otherUser.online
                  ? t("calls.actions.startVideo")
                  : t("calls.actions.contactOffline")
              }
            >
              <Video className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={closeChat}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4"
        onScroll={onScroll}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("conversations.no_messages")}
          </div>
        ) : shouldVirtualize ? (
          <div className="relative w-full py-1" style={{ minHeight: "100%" }}>
            {isLoadingMore ? (
              <div className="flex justify-center py-2 text-muted-foreground">
                <Spinner />
              </div>
            ) : null}

            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;

                return (
                  <div
                    key={row.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className={`absolute left-0 top-0 w-full ${row.type === "message" ? "pb-2" : ""}`}
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                    id={
                      row.type === "message"
                        ? `message-${row.message.id}`
                        : undefined
                    }
                  >
                    {row.type === "date" ? (
                      <div className="flex items-center gap-3 py-2">
                        <div className="flex-1 h-px bg-border" />
                        <div className="text-xs text-muted-foreground px-2">
                          {row.date}
                        </div>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    ) : (
                      <ChatBubble
                        myUserId={myUserId}
                        message={row.message}
                        otherUserName={activeChat.otherUser.full_name}
                        onScrollToMessage={scrollToMessage}
                        edit_func={() => onEdit(row.message.id)}
                        reply_func={() => onReply(row.message.id)}
                        delete_func={() => onDelete(row.message.id)}
                      />
                    )}
                  </div>
                );
              })}
              <div
                ref={bottomRef}
                className="absolute left-0 h-px w-full"
                style={{ top: `${rowVirtualizer.getTotalSize()}px` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-full flex-col justify-end gap-2 py-1">
            {isLoadingMore ? (
              <div className="flex justify-center py-2 text-muted-foreground">
                <Spinner />
              </div>
            ) : null}
            {messages.map((message, index) => {
              const currentDate = formatMessageDate(message.created_at);
              const previousDate =
                index > 0
                  ? formatMessageDate(messages[index - 1].created_at)
                  : null;
              const showDateSeparator = currentDate !== previousDate;

              return (
                <div key={message.id} id={`message-${message.id}`}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-border" />
                      <div className="text-xs text-muted-foreground px-2">
                        {currentDate}
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <ChatBubble
                    myUserId={myUserId}
                    message={message}
                    otherUserName={activeChat.otherUser.full_name}
                    onScrollToMessage={scrollToMessage}
                    edit_func={() => onEdit(message.id)}
                    reply_func={() => onReply(message.id)}
                    delete_func={() => onDelete(message.id)}
                  />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t overflow-hidden">
        {editing && (
          <div className="w-full inline-flex justify-between items-center gap-2 px-4 pt-2.5 pb-0">
            <div className="inline-flex items-center gap-1 wrap-normal truncate">
              <Edit2 size="16" className="text-muted-foreground" />{" "}
              {editing.content.text}
            </div>
            <Button
              variant={"ghost"}
              className="cursor-pointer"
              onClick={cancelComposerModes}
            >
              <X />
            </Button>
          </div>
        )}
        {replyTo && (
          <div className="w-full inline-flex justify-between items-center gap-2 px-4 pt-2.5 pb-0">
            <div className="inline-flex items-center gap-1 wrap-normal truncate">
              <Reply className="text-muted-foreground" /> {replyTo.content.text}
            </div>
            <Button
              variant={"ghost"}
              className="cursor-pointer"
              onClick={cancelComposerModes}
            >
              <X />
            </Button>
          </div>
        )}
        <div className="flex min-w-0 items-center gap-2 px-4 pt-2.5 pb-0">
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={t("conversations.type_message")}
            className="min-h-8 max-h-10 min-w-0 max-w-full flex-1 resize-none field-sizing-fixed overflow-x-hidden wrap-break-word"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                cancelComposerModes();
                return;
              }

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            onClick={onSend}
            disabled={!canSend}
            aria-label={t("conversations.send_message")}
            className="shrink-0 cursor-pointer"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
