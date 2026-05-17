import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import type { EndedCallScreenProps } from "./types";
import { PhoneOff, Timer } from "lucide-react";
import UserAvatar from "@/components/common/user-avatar";

export function EndedCallScreen({
  peerDisplayName,
  peerFallback,
  peerAvatar,
  endedTitle,
  durationLabel,
  isRejected,
  closeLabel,
  onClose,
}: EndedCallScreenProps) {
  return (
    <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
      <Card className="w-full max-w-xs border-border/80 bg-card/95 shadow-xl backdrop-blur">
        <CardHeader className="flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center justify-center gap-0">
            <h1 className="text-lg font-semibold">{peerDisplayName}</h1>
            <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
              {isRejected ? (
                <>
                  <PhoneOff size="12" /> {endedTitle}
                </>
              ) : (
                <>
                  <Timer size="12" /> {durationLabel}
                </>
              )}
            </div>
          </div>

          <UserAvatar
            full_name={peerDisplayName}
            username={peerFallback}
            avatarUrl={peerAvatar}
            size="xxl"
          ></UserAvatar>
        </CardHeader>

        <CardFooter className="justify-center pt-0">
          <Button
            variant="secondary"
            className="cursor-pointer"
            onClick={onClose}
          >
            {closeLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
