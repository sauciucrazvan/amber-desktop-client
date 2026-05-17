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
    <CardHeader className="flex flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center gap-0">
        <h1 className="text-lg font-semibold">{peerDisplayName}</h1>
        <div className="inline-flex items-center gap-1 text-muted-foreground text-sm animate-pulse">
          <PhoneCall size="12" /> {waitingLabel}
        </div>
      </div>

      <UserAvatar
        full_name={peerDisplayName}
        username={peerFallback}
        avatarUrl={peerAvatar}
        size="xxl"
      ></UserAvatar>
    </CardHeader>
  );
}
