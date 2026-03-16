import { useState } from "react";
import type { TFunction } from "i18next";
import { useConversationData } from "./useConversationData";
import { useConversationRealtime } from "./useConversationRealtime";
import { useConversationComposer } from "./useConversationComposer";

export type { MessageItem } from "../types";

type UseConversationLogicParams = {
  accessToken: string | null;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  conversationId?: string;
  t: TFunction;
  language: string;
};

export function useConversationLogic({
  accessToken,
  authFetch,
  conversationId,
  t,
  language,
}: UseConversationLogicParams) {
  const [isWsConnected, setIsWsConnected] = useState(false);

  const data = useConversationData({
    conversationId,
    authFetch,
    t,
    language,
    isWsConnected,
    setIsWsConnected,
  });

  useConversationRealtime({
    accessToken,
    conversationId,
    setIsWsConnected,
    scrollContainerRef: data.scrollContainerRef,
    isNearBottom: data.isNearBottom,
    mergeMessages: data.mergeMessages,
    replaceMessageById: data.replaceMessageById,
    setMessages: data.setMessages,
    markConversationSeen: data.markConversationSeen,
    shouldAutoScrollRef: data.shouldAutoScrollRef,
  });

  const composer = useConversationComposer({
    conversationId,
    authFetch,
    t,
    messages: data.messages,
    setMessages: data.setMessages,
    mergeMessages: data.mergeMessages,
    replaceMessageById: data.replaceMessageById,
    shouldAutoScrollRef: data.shouldAutoScrollRef,
  });

  return {
    messages: data.messages,
    messageText: composer.messageText,
    setMessageText: composer.setMessageText,
    replyTo: composer.replyTo,
    setReplyTo: composer.setReplyTo,
    editing: composer.editing,
    setEditing: composer.setEditing,
    isLoading: data.isLoading,
    isLoadingMore: data.isLoadingMore,
    isSending: composer.isSending,
    myUserId: data.myUserId,
    canSend: composer.canSend,
    textareaRef: composer.textareaRef,
    scrollContainerRef: data.scrollContainerRef,
    bottomRef: data.bottomRef,
    formatMessageDate: data.formatMessageDate,
    onSend: composer.onSend,
    onDelete: composer.onDelete,
    onReply: composer.onReply,
    onEdit: composer.onEdit,
    onScroll: data.onScroll,
  };
}
