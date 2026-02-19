import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { API_BASE_URL } from "@/config";
import {
  clearStoredTokens,
  getStoredTokens,
  setStoredTokens,
  type StoredTokens,
} from "@/auth/tokenStorage";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type RegisterRequest = {
  username: string;
  password: string;
  email?: string;
  fullName: string;
};

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
  authFetch: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {}
  return `Request failed (${res.status})`;
}

function resolveApiUrl(key: string) {
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  if (key.startsWith("/")) return `${API_BASE_URL}${key}`;
  return `${API_BASE_URL}/${key}`;
}

function resolveWsUrl(path: string, accessToken: string) {
  const wsUrl = new URL(resolveApiUrl(path).replace("/api", ""));
  wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
  wsUrl.searchParams.set("token", accessToken);
  return wsUrl.toString();
}

const HEARTBEAT_ENDPOINT = "/ws/ping";
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_RECONNECT_MS = 5_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialTokens = getStoredTokens();
  const [tokens, setTokens] = useState<StoredTokens>(initialTokens);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const persistTokens = useCallback((next: StoredTokens) => {
    setTokens(next);
    setStoredTokens(next);
  }, []);

  const logout = useCallback(() => {
    setTokens({ accessToken: null, refreshToken: null });
    clearStoredTokens();
  }, []);

  const loginMutation = useSWRMutation<
    TokenResponse,
    Error,
    string,
    { username: string; password: string }
  >(`${API_BASE_URL}/auth/login`, async (url, { arg }) => {
    const body = new URLSearchParams();
    body.set("username", arg.username);
    body.set("password", arg.password);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (res.status == 422) throw new Error("login.fillInput");
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return (await res.json()) as TokenResponse;
  });

  const registerMutation = useSWRMutation<
    unknown,
    Error,
    string,
    RegisterRequest
  >(`${API_BASE_URL}/auth/register`, async (url, { arg }) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: arg.username,
        password: arg.password,
        email: arg.email || null,
        full_name: arg.fullName,
      }),
    });

    if (res.status == 422 && !res.statusText)
      throw new Error("register.fillInput");
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return res.json();
  });

  const refreshMutation = useSWRMutation<
    TokenResponse,
    Error,
    string,
    { refreshToken: string }
  >(`${API_BASE_URL}/auth/refresh`, async (url, { arg }) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: arg.refreshToken }),
    });

    if (!res.ok) throw new Error(await readErrorMessage(res));
    return (await res.json()) as TokenResponse;
  });

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await loginMutation.trigger({ username, password });
      persistTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
    },
    [loginMutation, persistTokens],
  );

  const register = useCallback(
    async (req: RegisterRequest) => {
      await registerMutation.trigger(req);
      await login(req.username, req.password);
    },
    [login, registerMutation],
  );

  const refreshAccessToken = useCallback(async () => {
    const currentRefresh = tokens.refreshToken;
    if (!currentRefresh) return null;

    if (!refreshInFlight.current) {
      refreshInFlight.current = (async () => {
        try {
          const data = await refreshMutation.trigger({
            refreshToken: currentRefresh,
          });
          persistTokens({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          });
          return data.access_token;
        } catch {
          logout();
          return null;
        }
      })().finally(() => {
        refreshInFlight.current = null;
      });
    }

    return refreshInFlight.current;
  }, [logout, persistTokens, refreshMutation, tokens.refreshToken]);

  useEffect(() => {
    const heartbeatAccessToken = tokens.accessToken;
    if (!heartbeatAccessToken) return;

    let socket: WebSocket | null = null;
    let pingIntervalId: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const clearPingInterval = () => {
      if (pingIntervalId) {
        clearInterval(pingIntervalId);
        pingIntervalId = null;
      }
    };

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
      }
    };

    const connect = () => {
      if (disposed) return;

      socket = new WebSocket(
        resolveWsUrl(HEARTBEAT_ENDPOINT, heartbeatAccessToken),
      );

      socket.onopen = () => {
        clearPingInterval();
        socket?.send("ping");
        pingIntervalId = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, HEARTBEAT_INTERVAL_MS);
      };

      socket.onmessage = () => {};

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = (event) => {
        clearPingInterval();

        if (disposed) return;
        if (event.code === 1008) {
          logout();
          return;
        }

        clearReconnectTimeout();
        reconnectTimeoutId = setTimeout(connect, HEARTBEAT_RECONNECT_MS);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearPingInterval();
      clearReconnectTimeout();
      if (
        socket &&
        (socket.readyState === WebSocket.CONNECTING ||
          socket.readyState === WebSocket.OPEN)
      ) {
        socket.close();
      }
    };
  }, [logout, tokens.accessToken]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (tokens.accessToken)
        headers.set("Authorization", `Bearer ${tokens.accessToken}`);

      const doFetch = (hdrs: Headers) =>
        fetch(input, {
          ...init,
          headers: hdrs,
        });

      let res = await doFetch(headers);
      if (res.status !== 401) return res;

      const nextAccess = await refreshAccessToken();
      if (!nextAccess) return res;

      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set("Authorization", `Bearer ${nextAccess}`);

      res = await doFetch(retryHeaders);
      return res;
    },
    [refreshAccessToken, tokens.accessToken],
  );

  const swrFetcher = useCallback(
    async (key: string) => {
      const res = await authFetch(resolveApiUrl(key));
      if (!res.ok) throw new Error(await readErrorMessage(res));
      return res.json();
    },
    [authFetch],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: Boolean(tokens.accessToken),
      login,
      register,
      logout,
      authFetch,
    }),
    [
      authFetch,
      login,
      logout,
      register,
      tokens.accessToken,
      tokens.refreshToken,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      <SWRConfig value={{ fetcher: swrFetcher }}>{children}</SWRConfig>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
