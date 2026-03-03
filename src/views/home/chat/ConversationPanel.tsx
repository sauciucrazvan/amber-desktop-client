import { useAuth } from "@/auth/AuthContext";
import { API_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "@/components/common/user-avatar";
import UserProfile from "@/views/dialogs/UserProfile";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCheck, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useChat } from "./ChatContext";
import { formatHHmm } from "@/lib/utils";

type MessageItem = {
  id: string;
  conversation_id: string;
  sender_id: number;
  type: string;
  content: { text?: string };
  created_at: string;
  edited_at: string | null;
  seen: boolean;
};

type AccountMe = {
  id?: number;
};

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}

export default function ConversationPanel() {
  const { authFetch } = useAuth();
  const { activeChat, closeChat } = useChat();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const conversationId = activeChat?.conversation.id;

  const isNearBottom = useCallback((node: HTMLDivElement | null) => {
    if (!node) return true;
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    return distanceFromBottom < 80;
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    const res = await authFetch(
      `${API_BASE_URL}/chats/${conversationId}/messages?limit=50`,
    );

    if (!res.ok) throw new Error(await readErrorMessage(res));

    const data = (await res.json()) as MessageItem[];
    shouldAutoScrollRef.current = isNearBottom(scrollContainerRef.current);
    setMessages(data);
  }, [authFetch, conversationId, isNearBottom]);

  useEffect(() => {
    if (!conversationId) return;

    let disposed = false;

    const load = async () => {
      setIsLoading(true);
      try {
        await fetchMessages();
      } catch (e) {
        if (!disposed) {
          toast.error(
            e instanceof Error
              ? t(e.message)
              : t("conversations.failed_loading"),
          );
        }
      } finally {
        if (!disposed) setIsLoading(false);
      }
    };

    load();

    const interval = window.setInterval(() => {
      fetchMessages().catch(() => null);
    }, 4000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;

    authFetch(`${API_BASE_URL}/account/me`)
      .then(async (res) => {
        if (!res.ok) return;
        const me = (await res.json()) as AccountMe;
        if (typeof me.id === "number") setMyUserId(me.id);
      })
      .catch(() => null);
  }, [authFetch, conversationId]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [conversationId]);

  const canSend = useMemo(
    () => messageText.trim().length > 0 && !isSending,
    [isSending, messageText],
  );

  const onSend = async () => {
    if (!conversationId || !canSend) return;

    setIsSending(true);
    shouldAutoScrollRef.current = true;
    try {
      const payload = { text: messageText.trim() };
      const res = await authFetch(
        `${API_BASE_URL}/chats/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error(await readErrorMessage(res));

      setMessageText("");
      await fetchMessages();
    } catch (e) {
      toast.error(
        e instanceof Error ? t(e.message) : t("conversations.failed_sending"),
      );
    } finally {
      setIsSending(false);
    }
  };

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
        onScroll={() => {
          shouldAutoScrollRef.current = isNearBottom(
            scrollContainerRef.current,
          );
        }}
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
            {messages.map((message) => {
              const isMine =
                myUserId !== null && message.sender_id === myUserId;
              const text = message.content?.text ?? "";

              return (
                <div
                  key={message.id}
                  className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex flex-col max-w-[75%] rounded-md border px-3 py-2 text-sm
  ${isMine ? "bg-muted" : "bg-background"}`}
                  >
                    <div className="wrap-break-word">{text}</div>

                    <div className="mt-1 self-end inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      {formatHHmm(new Date(message.created_at))}
                      {message.seen ? (
                        <CheckCheck size="16" className="text-blue-400" />
                      ) : (
                        <Check size="16" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t overflow-hidden">
        <div className="flex min-w-0 items-center gap-2 px-4 pt-2.5 pb-0">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={t("conversations.type_message")}
            className="min-h-8 max-h-10 min-w-0 max-w-full flex-1 resize-none field-sizing-fixed overflow-x-hidden wrap-break-word"
            onKeyDown={(e) => {
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
            {isSending ? <Spinner /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </section>
  );
}
