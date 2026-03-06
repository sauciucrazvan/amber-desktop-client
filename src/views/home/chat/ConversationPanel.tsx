import { useAuth } from "@/auth/AuthContext";
import { API_BASE_URL, WS_BASE_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "@/components/common/user-avatar";
import UserProfile from "@/views/dialogs/UserProfile";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit2, Reply, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useChat } from "./ChatContext";
import ChatBubble from "./ChatBubble";

type MessageItem = {
  id: string;
  conversation_id: string;
  sender_id: number;
  type: string;
  content: {
    text?: string;
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

type AccountMe = {
  id?: number;
};

type MarkSeenResponse = {
  conversation_id: string;
  reader_id: number;
  seen_message_ids: string[];
  updated: number;
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
  const MESSAGE_PAGE_SIZE = 20;
  const WS_RECONNECT_BASE_MS = 1_000;
  const WS_RECONNECT_MAX_MS = 15_000;
  const DISCONNECTED_REFRESH_MS = 45_000;

  const { accessToken, authFetch } = useAuth();
  const { activeChat, closeChat } = useChat();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
  const [editing, setEditing] = useState<MessageItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const markSeenInFlightRef = useRef(false);
  const pendingMarkSeenConversationIdRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef<string | undefined>(undefined);

  const conversationId = activeChat?.conversation.id;

  useEffect(() => {
    activeConversationIdRef.current = conversationId;
    pendingMarkSeenConversationIdRef.current = null;
    markSeenInFlightRef.current = false;
  }, [conversationId]);

  const isNearBottom = useCallback((node: HTMLDivElement | null) => {
    if (!node) return true;
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    return distanceFromBottom < 80;
  }, []);

  const sortMessages = useCallback((items: MessageItem[]) => {
    return [...items].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, []);

  const mergeMessages = useCallback(
    (current: MessageItem[], incoming: MessageItem[]) => {
      const byId = new Map(current.map((message) => [message.id, message]));
      incoming.forEach((message) => {
        byId.set(message.id, message);
      });

      return sortMessages(Array.from(byId.values()));
    },
    [sortMessages],
  );

  const replaceMessageById = useCallback(
    (current: MessageItem[], next: MessageItem) => {
      const index = current.findIndex((message) => message.id === next.id);
      if (index === -1) return current;

      const updated = [...current];
      updated[index] = next;
      return sortMessages(updated);
    },
    [sortMessages],
  );

  const resolveWsPingUrl = useCallback(() => {
    const wsUrl = new URL(`${WS_BASE_URL}/ping`);
    wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
    if (accessToken) wsUrl.searchParams.set("token", accessToken);
    return wsUrl.toString();
  }, [accessToken]);

  const fetchMessagesPage = useCallback(
    async (before?: string) => {
      if (!conversationId) return [] as MessageItem[];

      const params = new URLSearchParams({ limit: String(MESSAGE_PAGE_SIZE) });
      if (before) params.set("before", before);

      const res = await authFetch(
        `${API_BASE_URL}/chats/${conversationId}/messages?${params.toString()}`,
      );

      if (!res.ok) throw new Error(await readErrorMessage(res));

      return (await res.json()) as MessageItem[];
    },
    [MESSAGE_PAGE_SIZE, authFetch, conversationId],
  );

  const refreshLatestMessages = useCallback(async () => {
    if (!conversationId) return;

    const data = await fetchMessagesPage();
    shouldAutoScrollRef.current = isNearBottom(scrollContainerRef.current);
    setMessages((current) => mergeMessages(current, data));
    if (data.length < MESSAGE_PAGE_SIZE) setHasMoreMessages(false);
  }, [
    MESSAGE_PAGE_SIZE,
    conversationId,
    fetchMessagesPage,
    isNearBottom,
    mergeMessages,
  ]);

  const fallbackMarkSeenViaMessagesFetch = useCallback(
    async (targetConversationId: string) => {
      const params = new URLSearchParams({ limit: String(MESSAGE_PAGE_SIZE) });
      const res = await authFetch(
        `${API_BASE_URL}/chats/${targetConversationId}/messages?${params.toString()}`,
      );

      if (!res.ok) return;

      const latest = (await res.json()) as MessageItem[];
      if (activeConversationIdRef.current !== targetConversationId) return;

      setMessages((current) => mergeMessages(current, latest));
    },
    [MESSAGE_PAGE_SIZE, authFetch, mergeMessages],
  );

  const markConversationSeen = useCallback(
    async (targetConversationId: string) => {
      if (!targetConversationId) return;

      if (markSeenInFlightRef.current) {
        pendingMarkSeenConversationIdRef.current = targetConversationId;
        return;
      }

      markSeenInFlightRef.current = true;
      try {
        const res = await authFetch(
          `${API_BASE_URL}/chats/${targetConversationId}/seen`,
          {
            method: "POST",
          },
        );

        if (!res.ok) {
          if (res.status === 404 || res.status === 405 || res.status === 501) {
            await fallbackMarkSeenViaMessagesFetch(targetConversationId);
          }
          return;
        }

        const data = (await res.json()) as MarkSeenResponse;
        if (activeConversationIdRef.current !== targetConversationId) return;
        if (data.conversation_id !== targetConversationId) return;

        const seenIds = new Set(data.seen_message_ids ?? []);
        if (seenIds.size === 0) return;

        setMessages((current) =>
          current.map((message) =>
            seenIds.has(message.id)
              ? {
                  ...message,
                  seen: true,
                }
              : message,
          ),
        );
      } finally {
        markSeenInFlightRef.current = false;

        const pendingConversationId = pendingMarkSeenConversationIdRef.current;
        if (
          pendingConversationId &&
          pendingConversationId === activeConversationIdRef.current
        ) {
          pendingMarkSeenConversationIdRef.current = null;
          void markConversationSeen(pendingConversationId);
        }
      }
    },
    [authFetch, fallbackMarkSeenViaMessagesFetch],
  );

  const isActivelyViewingConversation = useCallback(() => {
    return (
      document.visibilityState === "visible" &&
      isNearBottom(scrollContainerRef.current)
    );
  }, [isNearBottom]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingMoreRef.current || !hasMoreMessages) return;

    const oldestMessage = messages[0];
    if (!oldestMessage?.created_at) {
      setHasMoreMessages(false);
      return;
    }

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    const container = scrollContainerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;

    try {
      const older = await fetchMessagesPage(oldestMessage.created_at);
      setMessages((current) => mergeMessages(current, older));
      if (older.length < MESSAGE_PAGE_SIZE) setHasMoreMessages(false);

      window.requestAnimationFrame(() => {
        const currentContainer = scrollContainerRef.current;
        if (!currentContainer) return;

        const nextHeight = currentContainer.scrollHeight;
        currentContainer.scrollTop += nextHeight - previousHeight;
      });
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [
    MESSAGE_PAGE_SIZE,
    conversationId,
    fetchMessagesPage,
    hasMoreMessages,
    mergeMessages,
    messages,
  ]);

  useEffect(() => {
    if (!conversationId) return;

    let disposed = false;

    setMessages([]);
    setHasMoreMessages(true);
    setIsWsConnected(false);

    setReplyTo((current) =>
      current && current.conversation_id !== conversationId ? null : current,
    );

    const load = async () => {
      setIsLoading(true);
      try {
        const firstPage = await fetchMessagesPage();
        setMessages((current) => mergeMessages(current, firstPage));
        setHasMoreMessages(firstPage.length === MESSAGE_PAGE_SIZE);
        await markConversationSeen(conversationId);
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

    return () => {
      disposed = true;
    };
  }, [
    MESSAGE_PAGE_SIZE,
    conversationId,
    fetchMessagesPage,
    markConversationSeen,
    mergeMessages,
    t,
  ]);

  useEffect(() => {
    if (!conversationId) return;

    let disposed = false;
    let reconnectAttempts = 0;
    let socket: WebSocket | null = null;
    let reconnectTimeoutId: number | null = null;

    const clearReconnectTimeout = () => {
      if (!reconnectTimeoutId) return;
      window.clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    };

    const handleIncomingEvent = (raw: unknown) => {
      if (!raw || typeof raw !== "object") return;

      const eventData = raw as {
        event?: string;
        conversation_id?: string;
        payload?: {
          message?: MessageItem;
          message_id?: string;
          deleted_by?: number;
          reader_id?: number;
          message_ids?: string[];
        };
      };

      if (!eventData.event || eventData.conversation_id !== conversationId) {
        return;
      }

      if (eventData.event === "message.created") {
        const incomingMessage = eventData.payload?.message;
        if (!incomingMessage) return;
        shouldAutoScrollRef.current = isNearBottom(scrollContainerRef.current);
        setMessages((current) => mergeMessages(current, [incomingMessage]));

        if (isActivelyViewingConversation()) {
          void markConversationSeen(conversationId);
        }
        return;
      }

      if (eventData.event === "message.edited") {
        const editedMessage = eventData.payload?.message;
        if (!editedMessage) return;
        setMessages((current) => replaceMessageById(current, editedMessage));
        return;
      }

      if (eventData.event === "message.deleted") {
        const deletedId = eventData.payload?.message_id;
        if (!deletedId) return;
        setMessages((current) =>
          current.filter((message) => message.id !== deletedId),
        );
        return;
      }

      if (eventData.event === "messages.seen") {
        const seenMessageIds = new Set(eventData.payload?.message_ids ?? []);
        if (seenMessageIds.size === 0) return;

        setMessages((current) =>
          current.map((message) =>
            seenMessageIds.has(message.id)
              ? {
                  ...message,
                  seen: true,
                }
              : message,
          ),
        );
      }
    };

    const scheduleReconnect = () => {
      if (disposed) return;

      const delay = Math.min(
        WS_RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts),
        WS_RECONNECT_MAX_MS,
      );
      reconnectAttempts += 1;

      clearReconnectTimeout();
      reconnectTimeoutId = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (disposed) return;

      try {
        socket = new WebSocket(resolveWsPingUrl());
      } catch {
        setIsWsConnected(false);
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        reconnectAttempts = 0;
        setIsWsConnected(true);
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        try {
          const parsed = JSON.parse(event.data) as unknown;
          handleIncomingEvent(parsed);
        } catch {
          return;
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        setIsWsConnected(false);
        if (disposed) return;
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;
      setIsWsConnected(false);
      clearReconnectTimeout();
      if (
        socket &&
        (socket.readyState === WebSocket.CONNECTING ||
          socket.readyState === WebSocket.OPEN)
      ) {
        socket.close();
      }
    };
  }, [
    conversationId,
    isActivelyViewingConversation,
    isNearBottom,
    markConversationSeen,
    mergeMessages,
    replaceMessageById,
    resolveWsPingUrl,
    WS_RECONNECT_BASE_MS,
    WS_RECONNECT_MAX_MS,
  ]);

  useEffect(() => {
    if (!conversationId || isWsConnected) return;

    const interval = window.setInterval(() => {
      refreshLatestMessages().catch(() => null);
    }, DISCONNECTED_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    DISCONNECTED_REFRESH_MS,
    conversationId,
    isWsConnected,
    refreshLatestMessages,
  ]);

  useEffect(() => {
    if (!conversationId) return;

    const onVisibilityChange = () => {
      if (!isActivelyViewingConversation()) return;
      void markConversationSeen(conversationId);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [conversationId, isActivelyViewingConversation, markConversationSeen]);

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

  useEffect(() => {
    if (!replyTo) return;
    const timeoutId = window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [replyTo]);

  const canSend = useMemo(
    () => messageText.trim().length > 0 && !isSending,
    [isSending, messageText],
  );

  const onSend = async () => {
    if (!conversationId || !canSend) return;

    setIsSending(true);
    shouldAutoScrollRef.current = true;
    try {
      if (replyTo) {
        const payload = { message_id: replyTo.id, text: messageText.trim() };
        const res = await authFetch(
          `${API_BASE_URL}/chats/${conversationId}/reply`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));
        const createdMessage = (await res.json()) as MessageItem;
        setMessages((current) => mergeMessages(current, [createdMessage]));
      } else if (editing) {
        const payload = { message_id: editing.id, text: messageText.trim() };
        const res = await authFetch(
          `${API_BASE_URL}/chats/${conversationId}/messages`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));
        const editedMessage = (await res.json()) as MessageItem;
        setMessages((current) => replaceMessageById(current, editedMessage));
      } else {
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
        const createdMessage = (await res.json()) as MessageItem;
        setMessages((current) => mergeMessages(current, [createdMessage]));
      }

      setMessageText("");
    } catch (e) {
      toast.error(
        e instanceof Error ? t(e.message) : t("conversations.failed_sending"),
      );
    } finally {
      setIsSending(false);
      setReplyTo(null);
      setEditing(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!conversationId) return;

    shouldAutoScrollRef.current = true;
    try {
      const payload = { message_id: id };
      const res = await authFetch(
        `${API_BASE_URL}/chats/${conversationId}/messages`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error(await readErrorMessage(res));
      else {
        toast.success(t("conversations.deleted_message"));
      }

      setMessages((current) => current.filter((message) => message.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? t(e.message) : t("common.error"));
    }
  };

  const onReply = (id: string) => {
    if (!conversationId) return;
    setEditing(null);
    setReplyTo(messages.find((message) => message.id === id) ?? null);
  };

  const onEdit = (id: string) => {
    if (!conversationId) return;
    setReplyTo(null);
    const messageToEdit = messages.find((message) => message.id === id) ?? null;
    setEditing(messageToEdit);
    setMessageText(messageToEdit?.content.text ?? "");

    window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }, 0);
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
          const nearBottom = isNearBottom(scrollContainerRef.current);
          shouldAutoScrollRef.current = nearBottom;

          if (
            conversationId &&
            nearBottom &&
            document.visibilityState === "visible"
          ) {
            void markConversationSeen(conversationId);
          }

          const container = scrollContainerRef.current;
          if (!container || container.scrollTop > 60) return;
          loadOlderMessages().catch(() => null);
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
            {isLoadingMore ? (
              <div className="flex justify-center py-2 text-muted-foreground">
                <Spinner />
              </div>
            ) : null}
            {messages.map((message) => {
              return (
                <ChatBubble
                  key={message.id}
                  myUserId={myUserId}
                  message={message}
                  edit_func={() => onEdit(message.id)}
                  reply_func={() => onReply(message.id)}
                  delete_func={() => onDelete(message.id)}
                />
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
              onClick={() => setEditing(null)}
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
              onClick={() => setReplyTo(null)}
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
