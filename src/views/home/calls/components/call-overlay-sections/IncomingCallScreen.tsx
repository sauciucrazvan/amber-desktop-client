import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Phone, PhoneOff } from "lucide-react";
import { PeerHeader } from "./PeerHeader";
import type { IncomingCallScreenProps } from "./types";

export function IncomingCallScreen({
  peerDisplayName,
  peerFallback,
  peerOnline,
  incomingBadge,
  incomingFromLabel,
  declineLabel,
  answerLabel,
  onDecline,
  onAnswer,
}: IncomingCallScreenProps) {
  return (
    <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3 text-center">
          <Badge className="mx-auto" variant="default">
            {incomingBadge}
          </Badge>
          <PeerHeader
            peerDisplayName={peerDisplayName}
            peerFallback={peerFallback}
            peerOnline={peerOnline}
          />
        </CardHeader>

        <CardContent className="text-center text-sm text-muted-foreground">
          {incomingFromLabel}
        </CardContent>

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
