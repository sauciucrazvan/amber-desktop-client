import { WS_BASE_URL } from "@/config";
import { useCallback, useEffect } from "react";
import type { MessageItem } from "../types";

type UseConversationRealtimeParams = {
  accessToken: string | null;
  conversationId?: string;
  setIsWsConnected: (next: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isNearBottom: (node: HTMLDivElement | null) => boolean;
  mergeMessages: (
    current: MessageItem[],
    incoming: MessageItem[],
  ) => MessageItem[];
  replaceMessageById: (
    current: MessageItem[],
    next: MessageItem,
  ) => MessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  markConversationSeen: (targetConversationId: string) => Promise<void>;
  shouldAutoScrollRef: React.MutableRefObject<boolean>;
};

export function useConversationRealtime({
  accessToken,
  conversationId,
  setIsWsConnected,
  scrollContainerRef,
  isNearBottom,
  mergeMessages,
  replaceMessageById,
  setMessages,
  markConversationSeen,
  shouldAutoScrollRef,
}: UseConversationRealtimeParams) {
  const WS_RECONNECT_BASE_MS = 1_000;
  const WS_RECONNECT_MAX_MS = 15_000;

  const resolveWsPingUrl = useCallback(() => {
    const wsUrl = new URL(`${WS_BASE_URL}/ping`);
    wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
    if (accessToken) wsUrl.searchParams.set("token", accessToken);
    return wsUrl.toString();
  }, [accessToken]);

  const isActivelyViewingConversation = useCallback(() => {
    return (
      document.visibilityState === "visible" &&
      isNearBottom(scrollContainerRef.current)
    );
  }, [isNearBottom, scrollContainerRef]);

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

      socket.onerror = () => {};

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
      if (socket && socket.readyState === WebSocket.OPEN) {
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
    setIsWsConnected,
    shouldAutoScrollRef,
    scrollContainerRef,
    setMessages,
    WS_RECONNECT_BASE_MS,
    WS_RECONNECT_MAX_MS,
  ]);
}
