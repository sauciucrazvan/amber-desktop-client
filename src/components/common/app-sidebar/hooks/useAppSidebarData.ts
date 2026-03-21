import { API_BASE_URL } from "@/config";
import {
  PRESENCE_EVENT_NAME,
  type PresenceEventPayload,
} from "@/auth/AuthContext";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type {
  AccountMe,
  ContactListItem,
  DirectConversationSummary,
} from "../types";

type UseAppSidebarDataParams = {
  isAuthenticated: boolean;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
  openDirectChat: (target: ContactListItem["user"]) => Promise<void>;
};

export function useAppSidebarData({
  isAuthenticated,
  authFetch,
  openDirectChat,
}: UseAppSidebarDataParams) {
  const { data: account, isLoading: isAccountLoading } = useSWR<AccountMe>(
    isAuthenticated ? "/account/me" : null,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const {
    data: contactsFromApi,
    error: contactsError,
    isLoading: isContactsLoading,
  } = useSWR<ContactListItem[]>(isAuthenticated ? "/contacts/list" : null, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const [contactsState, setContactsState] = useState<ContactListItem[]>([]);

  useEffect(() => {
    setContactsState(contactsFromApi ?? []);
  }, [contactsFromApi]);

  useEffect(() => {
    const onPresence = (event: Event) => {
      const customEvent = event as CustomEvent<PresenceEventPayload>;
      const detail = customEvent.detail;
      if (!detail || detail.type !== "presence") return;

      setContactsState((current) => {
        let changed = false;

        const next = current.map((contact) => {
          if (contact.user.username !== detail.username) return contact;
          if (contact.user.online === detail.online) return contact;

          changed = true;
          return {
            ...contact,
            user: {
              ...contact.user,
              online: detail.online,
            },
          };
        });

        return changed ? next : current;
      });
    };

    window.addEventListener(PRESENCE_EVENT_NAME, onPresence as EventListener);

    return () => {
      window.removeEventListener(
        PRESENCE_EVENT_NAME,
        onPresence as EventListener,
      );
    };
  }, []);

  const contacts = useMemo(() => contactsState, [contactsState]);

  const stableContactIds = Array.from(
    new Set((contacts ?? []).map((contact) => contact.user.id)),
  ).sort((a, b) => a - b);
  const contactIdsKey = stableContactIds.join(",");

  const { data: conversationUnseenCountByUserId } = useSWR<
    Record<number, number>
  >(
    isAuthenticated && contactIdsKey
      ? `contacts-unseen-count:${contactIdsKey}`
      : null,
    async () => {
      if (stableContactIds.length === 0) return {};

      const results = await Promise.all(
        stableContactIds.map(async (userId) => {
          try {
            const res = await authFetch(
              `${API_BASE_URL}/chats/direct/${userId}`,
              {
                method: "POST",
              },
            );

            if (!res.ok) return [userId, 0] as const;

            const data = (await res.json()) as DirectConversationSummary;
            return [userId, Math.max(0, data.notifications ?? 0)] as const;
          } catch {
            return [userId, 0] as const;
          }
        }),
      );

      return Object.fromEntries(results);
    },
    {
      refreshInterval: 5000,
      dedupingInterval: 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    },
  );

  const { data: contactRequests, error: contactRequestsError } = useSWR<
    Array<{ user: { id: number }; created_at: string }>
  >(isAuthenticated ? "/contacts/requests" : null, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const requestCount = contactRequestsError
    ? 0
    : (contactRequests?.length ?? 0);

  const showVerifyAccount = account?.verified === false;

  const handleOpenDirectChat = async (contact: ContactListItem["user"]) => {
    try {
      await openDirectChat(contact);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed opening chat");
    }
  };

  return {
    account,
    isAccountLoading,
    contacts,
    contactsError,
    isContactsLoading,
    conversationUnseenCountByUserId,
    requestCount,
    showVerifyAccount,
    handleOpenDirectChat,
  };
}
