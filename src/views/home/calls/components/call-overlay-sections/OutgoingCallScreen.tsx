import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { PhoneCall, PhoneOff } from "lucide-react";
import type { OutgoingCallScreenProps } from "./types";
import UserAvatar from "@/components/common/user-avatar";

export function OutgoingCallScreen({
  peerDisplayName,
  peerFallback,
  peerAvatar,
  waitingLabel,
  cancelLabel,
  onCancel,
}: OutgoingCallScreenProps) {
  return (
    <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
      <Card className="w-full max-w-xs border-border/80 bg-card/95 shadow-xl backdrop-blur">
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

        <CardFooter className="justify-center pt-0">
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={onCancel}
          >
            <PhoneOff /> {cancelLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
