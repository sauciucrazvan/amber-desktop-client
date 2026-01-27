import { API_BASE_URL } from "@/config";
import { useEffect, useMemo, useRef } from "react";

type PresenceStatus = {
  user_id: number;
  online: boolean;
};

type UsePresenceParams = {
  enabled: boolean;
  accessToken: string | null;
  userIds: number[];
  onStatuses: (statuses: Map<number, boolean>) => void;
};

function buildPresenceWsUrls(accessToken: string) {
  const apiUrl = new URL(API_BASE_URL);
  const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";

  const wsOrigin = new URL(apiUrl.origin);
  wsOrigin.protocol = wsProtocol;

  const apiPath = apiUrl.pathname.replace(/\/+$/, "");

  const candidates = new Set<string>();
  candidates.add(`${wsOrigin.toString().replace(/\/+$/, "")}/ws/presence`);
  if (apiPath && apiPath !== "/") {
    candidates.add(
      `${wsOrigin.toString().replace(/\/+$/, "")}${apiPath}/ws/presence`,
    );
  }

  return Array.from(candidates, (base) => {
    const url = new URL(base);
    url.searchParams.set("token", accessToken);
    return url.toString();
  });
}

function normalizeStatuses(input: unknown): Map<number, boolean> {
  const map = new Map<number, boolean>();

  if (Array.isArray(input)) {
    for (const item of input) {
      const userId = (item as PresenceStatus | null)?.user_id;
      const online = (item as PresenceStatus | null)?.online;
      if (typeof userId === "number" && typeof online === "boolean") {
        map.set(userId, online);
      }
    }
    return map;
  }

  if (input && typeof input === "object") {
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>,
    )) {
      const userId = Number(key);
      if (!Number.isFinite(userId)) continue;
      if (typeof value === "boolean") {
        map.set(userId, value);
      } else if (value && typeof value === "object") {
        const online = (value as { online?: unknown }).online;
        if (typeof online === "boolean") map.set(userId, online);
      }
    }
  }

  return map;
}

export function usePresence({
  enabled,
  accessToken,
  userIds,
  onStatuses,
}: UsePresenceParams) {
  const wsRef = useRef<WebSocket | null>(null);
  const intentionallyClosedRef = useRef(false);
  const reconnectAttemptRef = useRef(0);

  const userIdSignature = useMemo(() => {
    const unique = Array.from(new Set(userIds)).filter((id) =>
      Number.isFinite(id),
    );
    unique.sort((a, b) => a - b);
    return unique.join(",");
  }, [userIds]);

  useEffect(() => {
    if (!enabled || !accessToken) return;

    intentionallyClosedRef.current = false;

    let pingTimer: number | undefined;
    let reconnectTimer: number | undefined;

    const connect = () => {
      if (intentionallyClosedRef.current) return;

      const urls = buildPresenceWsUrls(accessToken);
      let urlIndex = 0;

      const connectOnce = () => {
        if (intentionallyClosedRef.current) return;

        const url = urls[urlIndex] ?? urls[0];
        const ws = new WebSocket(url);
        wsRef.current = ws;

        let opened = false;

        ws.onopen = () => {
          opened = true;
          reconnectAttemptRef.current = 0;

          // user should (hopefully) subscribe to the presence system
          if (userIdSignature.length > 0) {
            ws.send(
              JSON.stringify({
                type: "subscribe",
                user_ids: userIdSignature.split(",").map((x) => Number(x)),
              }),
            );
          }

          // heartbeat-like ping to keep the connection active
          pingTimer = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "ping" }));
            }
          }, 25_000);
        };

        ws.onmessage = (evt) => {
          let msg: any;
          try {
            msg = JSON.parse(String(evt.data));
          } catch {
            return;
          }

          const type = msg?.type;
          if (type === "snapshot") {
            const statuses = normalizeStatuses(msg?.statuses);
            if (statuses.size > 0) onStatuses(statuses);
          } else if (type === "update") {
            const userId = msg?.user_id;
            const online = msg?.online;
            if (typeof userId === "number" && typeof online === "boolean") {
              onStatuses(new Map([[userId, online]]));
            }
          }
        };

        ws.onclose = (evt) => {
          wsRef.current = null;
          if (pingTimer) window.clearInterval(pingTimer);
          if (intentionallyClosedRef.current) return;

          if (!opened && urlIndex < urls.length - 1) {
            urlIndex += 1;
            connectOnce();
            return;
          }

          // eslint-disable-next-line no-console
          console.debug("presence ws closed", {
            code: evt.code,
            reason: evt.reason,
            wasClean: evt.wasClean,
          });

          const attempt = reconnectAttemptRef.current++;
          const delay = Math.min(10_000, 500 * Math.pow(2, attempt));
          reconnectTimer = window.setTimeout(connect, delay);
        };

        ws.onerror = () => {};
      };

      connectOnce();
    };

    connect();

    return () => {
      intentionallyClosedRef.current = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (pingTimer) window.clearInterval(pingTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [accessToken, enabled, onStatuses, userIdSignature]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    if (ws.readyState !== WebSocket.OPEN) return;
    if (!enabled || !accessToken) return;

    ws.send(
      JSON.stringify({
        type: "subscribe",
        user_ids: userIdSignature.length
          ? userIdSignature.split(",").map((x) => Number(x))
          : [],
      }),
    );
  }, [accessToken, enabled, userIdSignature]);
}
