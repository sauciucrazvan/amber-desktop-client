import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Video,
  VideoOff,
} from "lucide-react";
import { formatDuration } from "../../utils";
import type { InProgressCallScreenProps } from "./types";

export function InProgressCallScreen({
  peerFallback,
  callDurationSeconds,
  remoteStream,
  remoteVideoEnabled,
  localStream,
  cameraEnabled,
  microphoneEnabled,
  isMobileDevice,
  canSwitchCamera,
  audioOutputs,
  selectedAudioOutputId,
  waitingRemoteVideoLabel,
  cameraOffLabel,
  noCameraLabel,
  muteLabel,
  unmuteLabel,
  cameraOnLabel,
  cameraOffActionLabel,
  switchCameraLabel,
  speakerLabel,
  endCallLabel,
  onToggleMicrophone,
  onToggleCamera,
  onSwitchCamera,
  onSelectAudioOutput,
  onEndCall,
  remoteVideoRef,
  localVideoRef,
}: InProgressCallScreenProps) {
  return (
    <div className="h-full bg-black/70 backdrop-blur-sm">
      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden bg-neutral-950 text-neutral-100">
        <div className="absolute left-0 right-0 top-4 z-10 flex items-center justify-center gap-1">
          <div className="rounded-full bg-black/60 px-4 py-1 text-sm text-neutral-200">
            @{peerFallback}
          </div>

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
              {waitingRemoteVideoLabel}
            </div>
          )}
          {!remoteVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-neutral-300">
              {cameraOffLabel}
            </div>
          )}
        </div>

        {cameraEnabled && (
          <div className="absolute right-4 top-4 z-10 h-36 w-24 overflow-hidden rounded-xl border border-white/20 bg-black/70 sm:h-44 sm:w-32">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                {noCameraLabel}
              </div>
            )}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/70 p-4">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2">
            <Button
              variant={microphoneEnabled ? "secondary" : "outline"}
              className="cursor-pointer rounded-full"
              onClick={onToggleMicrophone}
            >
              {microphoneEnabled ? <Mic /> : <MicOff />}
              {microphoneEnabled ? muteLabel : unmuteLabel}
            </Button>

            <Button
              variant={cameraEnabled ? "secondary" : "outline"}
              className="cursor-pointer rounded-full"
              onClick={onToggleCamera}
            >
              {cameraEnabled ? <Video /> : <VideoOff />}
              {cameraEnabled ? cameraOnLabel : cameraOffActionLabel}
            </Button>

            {isMobileDevice && canSwitchCamera && (
              <Button
                variant="secondary"
                className="cursor-pointer rounded-full"
                onClick={onSwitchCamera}
              >
                <RotateCcw /> {switchCameraLabel}
              </Button>
            )}

            {audioOutputs.length > 0 && (
              <label className="flex items-center gap-2 rounded-full bg-neutral-800 px-3 py-2 text-xs text-neutral-200">
                {speakerLabel}
                <select
                  className="max-w-48 rounded bg-neutral-900 px-2 py-1 text-xs"
                  value={selectedAudioOutputId}
                  onChange={(event) => onSelectAudioOutput(event.target.value)}
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
              onClick={onEndCall}
            >
              <PhoneOff /> {endCallLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
