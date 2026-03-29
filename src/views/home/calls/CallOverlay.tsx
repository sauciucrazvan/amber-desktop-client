import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/common/user-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RotateCcw,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCalls } from "./CallContext";

type SinkableMediaElement = HTMLMediaElement & {
  setSinkId?: (deviceId: string) => Promise<void>;
};

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CallOverlay() {
  const { t } = useTranslation();

  const {
    screen,
    peer,
    localStream,
    remoteStream,
    remoteVideoEnabled,
    cameraEnabled,
    microphoneEnabled,
    isMobileDevice,
    canSwitchCamera,
    audioOutputs,
    selectedAudioOutputId,
    callDurationSeconds,
    lastEndReason,
    cancelOutgoingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    selectAudioOutput,
    dismissOverlay,
  } = useCalls();

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const peerDisplayName =
    peer?.displayName || peer?.username || t("calls.unknown");
  const peerFallback = peer?.username || t("calls.unknown");

  useEffect(() => {
    const node = remoteVideoRef.current;
    if (!node) return;

    node.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    const node = localVideoRef.current;
    if (!node) return;

    node.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    const node = remoteVideoRef.current as SinkableMediaElement | null;
    if (!node?.setSinkId || !selectedAudioOutputId) return;

    void node.setSinkId(selectedAudioOutputId).catch(() => {
      return;
    });
  }, [selectedAudioOutputId]);

  const endedTitle = useMemo(() => {
    if (screen === "rejected") return t("calls.status.rejected");

    if (lastEndReason === "missed") return t("calls.status.missed");
    if (lastEndReason === "failed") return t("calls.status.failed");

    return t("calls.status.ended");
  }, [lastEndReason, screen, t]);

  if (screen === "idle") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100">
      {screen === "outgoing" && (
        <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
          <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
            <CardHeader className="space-y-3 text-center">
              <Badge variant="secondary" className="mx-auto">
                {t("calls.badge.outgoing")}
              </Badge>
              <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 text-left">
                <UserAvatar
                  full_name={peerDisplayName}
                  username={peerFallback}
                  isOnline={peer?.online}
                  size="md"
                />
                <div className="min-w-0">
                  <CardTitle className="truncate text-base font-semibold">
                    {peerDisplayName}
                  </CardTitle>
                  <CardDescription className="truncate">
                    @{peerFallback}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="text-center text-sm text-muted-foreground">
              {t("calls.outgoing.waiting")}
            </CardContent>

            <CardFooter className="justify-center pt-0">
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={cancelOutgoingCall}
              >
                <PhoneOff /> {t("calls.actions.cancelCall")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {screen === "incoming" && (
        <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
          <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
            <CardHeader className="space-y-3 text-center">
              <Badge className="mx-auto" variant="default">
                {t("calls.badge.incoming")}
              </Badge>
              <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 text-left">
                <UserAvatar
                  full_name={peerDisplayName}
                  username={peerFallback}
                  isOnline={peer?.online}
                  size="md"
                />
                <div className="min-w-0">
                  <CardTitle className="truncate text-base font-semibold">
                    {peerDisplayName}
                  </CardTitle>
                  <CardDescription className="truncate">
                    @{peerFallback}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="text-center text-sm text-muted-foreground">
              {t("calls.incoming.fromUser", { user: `@${peerFallback}` })}
            </CardContent>

            <CardFooter className="justify-center gap-3 pt-0">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={rejectIncomingCall}
              >
                <PhoneOff /> {t("calls.actions.decline")}
              </Button>
              <Button
                className="cursor-pointer"
                onClick={() => {
                  void acceptIncomingCall();
                }}
              >
                <Phone /> {t("calls.actions.answer")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {screen === "in-progress" && (
        <div className="h-full bg-black/70 backdrop-blur-sm">
          <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden bg-neutral-950 text-neutral-100">
            <div className="absolute left-0 right-0 top-4 z-10 flex items-center justify-center">
              <div className="rounded-full bg-black/60 px-4 py-1 text-sm text-neutral-200">
                {formatDuration(callDurationSeconds)}
              </div>
            </div>

            <div className="absolute inset-0 bg-neutral-900">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  {t("calls.inProgress.waitingRemoteVideo")}
                </div>
              )}
              {!remoteVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black text-neutral-300">
                  {t("calls.inProgress.cameraOff")}
                </div>
              )}
            </div>

            <div className="absolute right-4 top-4 z-10 h-36 w-24 overflow-hidden rounded-xl border border-white/20 bg-black/70 sm:h-44 sm:w-32">
              {localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    "h-full w-full object-cover transition-opacity",
                    cameraEnabled ? "opacity-100" : "opacity-20",
                  )}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                  {t("calls.inProgress.noCamera")}
                </div>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/70 p-4">
              <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2">
                <Button
                  variant={microphoneEnabled ? "secondary" : "outline"}
                  className="cursor-pointer rounded-full"
                  onClick={toggleMicrophone}
                >
                  {microphoneEnabled ? <Mic /> : <MicOff />}
                  {microphoneEnabled
                    ? t("calls.actions.mute")
                    : t("calls.actions.unmute")}
                </Button>

                <Button
                  variant={cameraEnabled ? "secondary" : "outline"}
                  className="cursor-pointer rounded-full"
                  onClick={toggleCamera}
                >
                  {cameraEnabled ? <Video /> : <VideoOff />}
                  {cameraEnabled
                    ? t("calls.actions.cameraOn")
                    : t("calls.actions.cameraOff")}
                </Button>

                {isMobileDevice && canSwitchCamera && (
                  <Button
                    variant="secondary"
                    className="cursor-pointer rounded-full"
                    onClick={() => {
                      void switchCamera();
                    }}
                  >
                    <RotateCcw /> {t("calls.actions.switchCamera")}
                  </Button>
                )}

                {audioOutputs.length > 0 && (
                  <label className="flex items-center gap-2 rounded-full bg-neutral-800 px-3 py-2 text-xs text-neutral-200">
                    {t("calls.inProgress.speaker")}
                    <select
                      className="max-w-48 rounded bg-neutral-900 px-2 py-1 text-xs"
                      value={selectedAudioOutputId}
                      onChange={(event) =>
                        selectAudioOutput(event.target.value)
                      }
                    >
                      {audioOutputs.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <Button
                  variant="destructive"
                  className="cursor-pointer rounded-full"
                  onClick={endCall}
                >
                  <PhoneOff /> {t("calls.actions.endCall")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(screen === "rejected" || screen === "ended") && (
        <div className="flex h-full items-center justify-center bg-black/50 p-4 backdrop-blur-sm text-foreground">
          <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
            <CardHeader className="space-y-3 text-center">
              <Badge
                className="mx-auto"
                variant={screen === "rejected" ? "destructive" : "secondary"}
              >
                {endedTitle}
              </Badge>
              <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 text-left">
                <UserAvatar
                  full_name={peerDisplayName}
                  username={peerFallback}
                  isOnline={peer?.online}
                  size="md"
                />
                <div className="min-w-0">
                  <CardTitle className="truncate text-base font-semibold">
                    {peerDisplayName}
                  </CardTitle>
                  <CardDescription className="truncate">
                    @{peerFallback}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="text-center text-sm text-muted-foreground">
              {t("calls.ended.duration", {
                duration: formatDuration(callDurationSeconds),
              })}
            </CardContent>

            <CardFooter className="justify-center pt-0">
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={dismissOverlay}
              >
                {t("calls.actions.close")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
