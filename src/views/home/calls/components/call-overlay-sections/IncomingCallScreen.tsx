import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { CircleHelp, Phone, PhoneCall, PhoneOff, Video } from "lucide-react";
import type { IncomingCallScreenProps } from "./types";
import UserAvatar from "@/components/common/user-avatar";

export function IncomingCallScreen({
  peerDisplayName,
  peerFallback,
  peerOnline,
  peerAvatar,
  incomingBadgeLabel,
  incomingCallMode,
  declineLabel,
  answerLabel,
  onDecline,
  onAnswer,
}: IncomingCallScreenProps) {
  const BadgeIcon =
    incomingCallMode === "audio"
      ? PhoneCall
      : incomingCallMode === "video"
        ? Video
        : CircleHelp;

  return (
    <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
      <Card className="w-full max-w-xs border-border/80 bg-card/95 shadow-xl backdrop-blur">
        <CardHeader className="flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center justify-center gap-0">
            <h1 className="text-lg font-semibold">{peerDisplayName}</h1>
            <div className="inline-flex items-center gap-1 text-muted-foreground text-sm animate-pulse">
              <BadgeIcon className="h-3.5 w-3.5" />
              {incomingBadgeLabel}
            </div>
          </div>

          <UserAvatar
            full_name={peerDisplayName}
            username={peerFallback}
            avatarUrl={peerAvatar}
            size="xxl"
          ></UserAvatar>
        </CardHeader>

        <CardFooter className="justify-center gap-3 pt-0">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onDecline}
          >
            <PhoneOff /> {declineLabel}
          </Button>
          <Button className="cursor-pointer" onClick={onAnswer}>
            <Phone /> {answerLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
