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
