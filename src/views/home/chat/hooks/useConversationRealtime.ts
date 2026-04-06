import { WS_BASE_URL } from "@/config";
import { useEffect, useRef } from "react";
import type { MessageItem } from "../types";

const WS_RECONNECT_BASE_MS = 1_000;
const WS_RECONNECT_MAX_MS = 15_000;

type UseConversationRealtimeParams = {
  accessToken: string | null;
  conversationId?: string;
  myUserId: number | null;
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
  noteReadCursorSynced?: (lastSeenSeq: number) => void;
  shouldAutoScrollRef: React.MutableRefObject<boolean>;
  onMessageActivity?: () => void;
};

export function useConversationRealtime({
  accessToken,
  conversationId,
  myUserId,
  setIsWsConnected,
  scrollContainerRef,
  isNearBottom,
  mergeMessages,
  replaceMessageById,
  setMessages,
  markConversationSeen,
  noteReadCursorSynced,
  shouldAutoScrollRef,
  onMessageActivity,
}: UseConversationRealtimeParams) {
  const isNearBottomRef = useRef(isNearBottom);
  const mergeMessagesRef = useRef(mergeMessages);
  const replaceMessageByIdRef = useRef(replaceMessageById);
  const markConversationSeenRef = useRef(markConversationSeen);
  const noteReadCursorSyncedRef = useRef(noteReadCursorSynced);
  const myUserIdRef = useRef(myUserId);
  const onMessageActivityRef = useRef(onMessageActivity);

  useEffect(() => {
    isNearBottomRef.current = isNearBottom;
    mergeMessagesRef.current = mergeMessages;
    replaceMessageByIdRef.current = replaceMessageById;
    markConversationSeenRef.current = markConversationSeen;
    noteReadCursorSyncedRef.current = noteReadCursorSynced;
    myUserIdRef.current = myUserId;
    onMessageActivityRef.current = onMessageActivity;
  }, [
    isNearBottom,
    mergeMessages,
    replaceMessageById,
    markConversationSeen,
    noteReadCursorSynced,
    myUserId,
    onMessageActivity,
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
          message_ids?: string[];
          reader_id?: number;
          last_seen_seq?: number;
        };
      };

      if (!eventData.event || eventData.conversation_id !== conversationId) {
        return;
      }

      if (eventData.event === "message.created") {
        const incomingMessage = eventData.payload?.message;
        if (!incomingMessage) return;
        shouldAutoScrollRef.current = isNearBottomRef.current(
          scrollContainerRef.current,
        );
        setMessages((current) =>
          mergeMessagesRef.current(current, [incomingMessage]),
        );
        onMessageActivityRef.current?.();

        if (
          document.visibilityState === "visible" &&
          isNearBottomRef.current(scrollContainerRef.current)
        ) {
          void markConversationSeenRef.current(conversationId);
        }
        return;
      }

      if (eventData.event === "message.edited") {
        const editedMessage = eventData.payload?.message;
        if (!editedMessage) return;
        setMessages((current) =>
          replaceMessageByIdRef.current(current, editedMessage),
        );
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
        return;
      }

      if (eventData.event === "conversation.read_cursor.updated") {
        const readerId = eventData.payload?.reader_id;
        const lastSeenSeq = eventData.payload?.last_seen_seq;
        if (typeof readerId !== "number" || typeof lastSeenSeq !== "number") {
          return;
        }

        if (myUserIdRef.current !== null && readerId === myUserIdRef.current) {
          noteReadCursorSyncedRef.current?.(lastSeenSeq);
        }

        setMessages((current) =>
          current.map((message) => {
            if (message.seq > lastSeenSeq) return message;
            if (message.sender_id === readerId) return message;
            if (message.seen) return message;
            return {
              ...message,
              seen: true,
            };
          }),
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

      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (socket.readyState !== WebSocket.CLOSED) {
          socket.close();
        }

        socket = null;
      }

      let nextSocket: WebSocket;
      try {
        const wsUrl = new URL(`${WS_BASE_URL}/ping`);
        wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
        if (accessToken) wsUrl.searchParams.set("token", accessToken);
        nextSocket = new WebSocket(wsUrl.toString());
      } catch {
        setIsWsConnected(false);
        scheduleReconnect();
        return;
      }

      socket = nextSocket;

      nextSocket.onopen = () => {
        if (socket !== nextSocket) return;
        reconnectAttempts = 0;
        setIsWsConnected(true);
      };

      nextSocket.onmessage = (event) => {
        if (socket !== nextSocket) return;
        if (typeof event.data !== "string") return;
        try {
          const parsed = JSON.parse(event.data) as unknown;
          handleIncomingEvent(parsed);
        } catch {
          return;
        }
      };

      nextSocket.onerror = () => {
        if (socket !== nextSocket) return;
      };

      nextSocket.onclose = () => {
        if (socket !== nextSocket) return;
        setIsWsConnected(false);
        if (disposed) return;
        socket = null;
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;
      setIsWsConnected(false);
      clearReconnectTimeout();

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (socket.readyState !== WebSocket.CLOSED) {
          socket.close();
        }

        socket = null;
      }
    };
  }, [
    conversationId,
    accessToken,
    setIsWsConnected,
    shouldAutoScrollRef,
    scrollContainerRef,
    setMessages,
  ]);
}
