import UserAvatar from "@/components/common/user-avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { PeerHeaderProps } from "./types";

export function PeerHeader({
  peerDisplayName,
  peerFallback,
  peerOnline,
  peerAvatar,
}: PeerHeaderProps) {
  return (
    <div className="mx-auto flex flex-col w-full max-w-xs items-center justify-center gap-3 text-left">
      <div className="min-w-0">
        <CardTitle className="truncate text-base font-semibold">
          {peerDisplayName}
        </CardTitle>
      </div>
      <UserAvatar
        full_name={peerDisplayName}
        username={peerFallback}
        isOnline={peerOnline}
        avatarUrl={peerAvatar}
        size="xl"
      />
    </div>
  );
}
