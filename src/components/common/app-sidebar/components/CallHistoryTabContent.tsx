import ErrorBox from "@/components/common/error-box";
import UserAvatar from "@/components/common/user-avatar";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Phone, Video } from "lucide-react";
import type { TFunction } from "i18next";
import type { CallHistoryItem, ContactListItem } from "../types";

type CallHistoryTabContentProps = {
  t: TFunction;
  callHistory: CallHistoryItem[];
  callHistoryError: unknown;
  isCallHistoryLoading: boolean;
  openingChatUserId: number | null;
  onOpenDirectChat: (contact: ContactListItem["user"]) => Promise<void>;
};

function formatDuration(totalSeconds?: number) {
  const seconds = Math.max(0, totalSeconds ?? 0);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function formatRelativeTime(dateValue?: string | null) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

export default function CallHistoryTabContent({
  t,
  callHistory,
  callHistoryError,
  isCallHistoryLoading,
  openingChatUserId,
  onOpenDirectChat,
}: CallHistoryTabContentProps) {
  if (isCallHistoryLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pt-4 shrink-0">
        <h2 className="text-lg font-semibold">
          {t("calls.history.title", "Call history")}
        </h2>
      </div>

      <SidebarGroup className="flex-1 min-h-0 pt-2">
        <SidebarMenu className="flex-1 min-h-0 overflow-y-auto pr-1">
          {callHistoryError ? (
            <SidebarMenuItem>
              <ErrorBox>
                {t(
                  "calls.history.failedLoading",
                  "Failed loading call history",
                )}
              </ErrorBox>
            </SidebarMenuItem>
          ) : callHistory.length > 0 ? (
            callHistory.map((call) => {
              const relativeTimeLabel = formatRelativeTime(
                call.started_at || call.ended_at,
              );
              const isMissed =
                call.status === "missed" ||
                call.end_reason === "missed" ||
                call.end_reason === "timeout" ||
                call.end_reason === "failed" ||
                call.status === "failed";

              return (
                <SidebarMenuItem key={call.call_id}>
                  <button
                    type="button"
                    className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/40 transition cursor-pointer"
                    onClick={() =>
                      onOpenDirectChat({
                        id: call.peer.id,
                        username: call.peer.username,
                        full_name: call.peer.display_name || call.peer.username,
                        avatar_url: call.peer.avatar_url,
                        online: undefined,
                      })
                    }
                    aria-busy={openingChatUserId === call.peer.id}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        full_name={call.peer.display_name || call.peer.username}
                        username={call.peer.username}
                        avatarUrl={call.peer.avatar_url}
                        size="sm"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {call.peer.display_name || call.peer.username}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                            {call.call_mode === "audio" ? (
                              <Phone className="size-3.5" />
                            ) : (
                              <Video className="size-3.5" />
                            )}
                          </span>
                        </div>

                        <div className="mt-0.5 flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
                          <span
                            className={`capitalize ${isMissed ? "text-red-400 font-medium" : ""}`}
                          >
                            {call.status.replace(/_/g, " ")}
                          </span>
                          <span>
                            {relativeTimeLabel && relativeTimeLabel} {" • "}
                            {formatDuration(call.duration_seconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </SidebarMenuItem>
              );
            })
          ) : (
            <SidebarMenuItem>
              <span className="mx-1 px-1 text-xs text-muted-foreground">
                {t("calls.history.empty", "No calls yet")}
              </span>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
