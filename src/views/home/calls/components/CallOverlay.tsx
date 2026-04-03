import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  EndedCallScreen,
  IncomingCallScreen,
  InProgressCallScreen,
  OutgoingCallScreen,
} from "./CallOverlaySections.tsx";
import { useCalls } from "../context/CallContext";
import { useCallMediaElements } from "../hooks/useCallMediaElements";
import { formatDuration } from "../utils";

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

  useCallMediaElements({
    remoteVideoRef,
    localVideoRef,
    remoteStream,
    localStream,
    selectedAudioOutputId,
  });

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
        <OutgoingCallScreen
          peerDisplayName={peerDisplayName}
          peerFallback={peerFallback}
          peerOnline={peer?.online}
          outgoingBadge={t("calls.badge.outgoing")}
          waitingLabel={t("calls.outgoing.waiting")}
          cancelLabel={t("calls.actions.cancelCall")}
          onCancel={cancelOutgoingCall}
        />
      )}

      {screen === "incoming" && (
        <IncomingCallScreen
          peerDisplayName={peerDisplayName}
          peerFallback={peerFallback}
          peerOnline={peer?.online}
          incomingBadge={t("calls.badge.incoming")}
          incomingFromLabel={t("calls.incoming.fromUser", {
            user: `@${peerFallback}`,
          })}
          declineLabel={t("calls.actions.decline")}
          answerLabel={t("calls.actions.answer")}
          onDecline={rejectIncomingCall}
          onAnswer={() => {
            void acceptIncomingCall();
          }}
        />
      )}

      {screen === "in-progress" && (
        <InProgressCallScreen
          peerFallback={peerFallback}
          callDurationSeconds={callDurationSeconds}
          remoteStream={remoteStream}
          remoteVideoEnabled={remoteVideoEnabled}
          localStream={localStream}
          cameraEnabled={cameraEnabled}
          microphoneEnabled={microphoneEnabled}
          isMobileDevice={isMobileDevice}
          canSwitchCamera={canSwitchCamera}
          audioOutputs={audioOutputs}
          selectedAudioOutputId={selectedAudioOutputId}
          waitingRemoteVideoLabel={t("calls.inProgress.waitingRemoteVideo")}
          cameraOffLabel={t("calls.inProgress.cameraOff")}
          noCameraLabel={t("calls.inProgress.noCamera")}
          muteLabel={t("calls.actions.mute")}
          unmuteLabel={t("calls.actions.unmute")}
          cameraOnLabel={t("calls.actions.cameraOn")}
          cameraOffActionLabel={t("calls.actions.cameraOff")}
          switchCameraLabel={t("calls.actions.switchCamera")}
          speakerLabel={t("calls.inProgress.speaker")}
          endCallLabel={t("calls.actions.endCall")}
          onToggleMicrophone={toggleMicrophone}
          onToggleCamera={toggleCamera}
          onSwitchCamera={() => {
            void switchCamera();
          }}
          onSelectAudioOutput={selectAudioOutput}
          onEndCall={endCall}
          remoteVideoRef={remoteVideoRef}
          localVideoRef={localVideoRef}
        />
      )}

      {(screen === "rejected" || screen === "ended") && (
        <EndedCallScreen
          peerDisplayName={peerDisplayName}
          peerFallback={peerFallback}
          peerOnline={peer?.online}
          endedTitle={endedTitle}
          durationLabel={t("calls.ended.duration", {
            duration: formatDuration(callDurationSeconds),
          })}
          isRejected={screen === "rejected"}
          closeLabel={t("calls.actions.close")}
          onClose={dismissOverlay}
        />
      )}
    </div>
  );
}
