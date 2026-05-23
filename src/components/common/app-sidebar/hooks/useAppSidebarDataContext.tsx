import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useChat } from "@/features/chat";
import { useAppSidebarData } from "./useAppSidebarData";

type AppSidebarDataContextValue = ReturnType<typeof useAppSidebarData>;

const AppSidebarDataContext = createContext<AppSidebarDataContextValue | null>(
  null,
);

type AppSidebarDataProviderProps = {
  children: ReactNode;
};

export function AppSidebarDataProvider({
  children,
}: AppSidebarDataProviderProps) {
  const { isAuthenticated, authFetch } = useAuth();
  const { openDirectChat } = useChat();

  const value = useAppSidebarData({
    isAuthenticated,
    authFetch,
    openDirectChat,
  });

  return (
    <AppSidebarDataContext.Provider value={value}>
      {children}
    </AppSidebarDataContext.Provider>
  );
}

export function useAppSidebarDataContext() {
  const context = useContext(AppSidebarDataContext);
  if (!context) {
    throw new Error(
      "useAppSidebarDataContext must be used within AppSidebarDataProvider",
    );
  }
  return context;
}
