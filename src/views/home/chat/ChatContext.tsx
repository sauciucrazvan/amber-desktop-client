import { API_BASE_URL } from "@/config";
import { useAuth } from "@/auth/AuthContext";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type DirectConversation = {
  id: string;
  type: string;
  direct_pair: string;
  created_at: string;
};

export type ActiveChat = {
  conversation: DirectConversation;
  otherUser: {
    id: number;
    username: string;
    full_name: string;
    online?: boolean;
  };
};

type ChatContextValue = {
  activeChat: ActiveChat | null;
  openingChatUserId: number | null;
  openDirectChat: (target: ActiveChat["otherUser"]) => Promise<void>;
  closeChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { authFetch } = useAuth();
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [openingChatUserId, setOpeningChatUserId] = useState<number | null>(
    null,
  );

  const openDirectChat = useCallback(
    async (target: ActiveChat["otherUser"]) => {
      setOpeningChatUserId(target.id);
      try {
        const res = await authFetch(
          `${API_BASE_URL}/chats/direct/${target.id}`,
          {
            method: "POST",
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));

        const conversation = (await res.json()) as DirectConversation;
        setActiveChat({
          conversation,
          otherUser: target,
        });
      } finally {
        setOpeningChatUserId(null);
      }
    },
    [authFetch],
  );

  const closeChat = useCallback(() => setActiveChat(null), []);

  const value = useMemo<ChatContextValue>(
    () => ({
      activeChat,
      openingChatUserId,
      openDirectChat,
      closeChat,
    }),
    [activeChat, closeChat, openDirectChat, openingChatUserId],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
