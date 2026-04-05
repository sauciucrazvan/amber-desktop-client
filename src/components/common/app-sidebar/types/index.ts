export type AccountMe = {
  username: string;
  full_name?: string | null;
  verified?: boolean | null;
};

export type ContactListItem = {
  user: {
    id: number;
    username: string;
    full_name: string;
    online?: boolean;
  };
  created_at: string;
};

export type DirectConversationSummary = {
  id: string;
  type: string;
  direct_pair?: string | null;
  created_at: string;
  notifications?: number;
};

export type CallHistoryItem = {
  call_id: string;
  status: string;
  call_mode: "audio" | "video";
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number;
  end_reason?: string | null;
  peer: {
    id: number;
    username: string;
    display_name?: string;
  };
};
