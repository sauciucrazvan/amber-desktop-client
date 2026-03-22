import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "@/components/common/user-avatar";
import UserProfile from "@/views/dialogs/UserProfile";
import { Edit2, Reply, Send, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChat } from "../context/ChatContext";
import ChatBubble from "./ChatBubble";
import { useConversationLogic } from "../hooks/useConversationLogic";

export default function ConversationPanel() {
  const { accessToken, authFetch } = useAuth();
  const { activeChat, closeChat } = useChat();
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

  if (!activeChat) return null;

  return (
    <section className="flex h-[calc(100%-3rem)] w-full flex-col pt-4">
      <div className="border-b">
        <div className="mb-1 flex items-center justify-between px-4 pb-2">
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
        ) : (
          <div className="flex flex-col gap-2 py-1">
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
                <div key={message.id}>
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
