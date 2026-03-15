import { API_BASE_URL } from "@/config";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { readErrorMessage } from "./conversationErrors";
import type {
  AccountMe,
  MarkSeenResponse,
  MessageItem,
} from "./conversationTypes";

type UseConversationDataParams = {
  conversationId?: string;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  t: TFunction;
  language: string;
  isWsConnected: boolean;
  setIsWsConnected: (next: boolean) => void;
};

export function useConversationData({
  conversationId,
  authFetch,
  t,
  language,
  isWsConnected,
  setIsWsConnected,
}: UseConversationDataParams) {
  const MESSAGE_PAGE_SIZE = 20;
  const DISCONNECTED_REFRESH_MS = 45_000;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const markSeenInFlightRef = useRef(false);
  const pendingMarkSeenConversationIdRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef<string | undefined>(undefined);

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

  const formatMessageDate = useCallback(
    (dateString: string) => {
      return new Date(dateString).toLocaleDateString(language, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    [language],
  );

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

    void load();

    return () => {
      disposed = true;
    };
  }, [
    MESSAGE_PAGE_SIZE,
    conversationId,
    fetchMessagesPage,
    markConversationSeen,
    mergeMessages,
    setIsWsConnected,
    t,
  ]);

  useEffect(() => {
    if (!conversationId || isWsConnected) return;

    const interval = window.setInterval(() => {
      void refreshLatestMessages().catch(() => null);
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

  const onScroll = useCallback(() => {
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
    void loadOlderMessages().catch(() => null);
  }, [conversationId, isNearBottom, loadOlderMessages, markConversationSeen]);

  return {
    messages,
    setMessages,
    isLoading,
    isLoadingMore,
    myUserId,
    formatMessageDate,
    onScroll,
    scrollContainerRef,
    bottomRef,
    shouldAutoScrollRef,
    isNearBottom,
    markConversationSeen,
    mergeMessages,
    replaceMessageById,
  };
}
