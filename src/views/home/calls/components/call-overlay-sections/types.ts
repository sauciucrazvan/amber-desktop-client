import type { AudioOutputDevice } from "../../types";
import type { CallMode } from "../../types";

export type PeerHeaderProps = {
  peerDisplayName: string;
  peerFallback: string;
  peerOnline?: boolean;
};

export type OutgoingCallScreenProps = PeerHeaderProps & {
  outgoingBadge: string;
  waitingLabel: string;
  cancelLabel: string;
  onCancel: () => void;
};

export type IncomingCallScreenProps = PeerHeaderProps & {
  incomingBadgeLabel: string;
  incomingCallMode: CallMode | null;
  declineLabel: string;
  answerLabel: string;
  onDecline: () => void;
  onAnswer: () => void;
};

export type InProgressCallScreenProps = {
  peerFallback: string;
  callDurationSeconds: number;
  remoteStream: MediaStream | null;
  remoteVideoEnabled: boolean;
  localStream: MediaStream | null;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  isMobileDevice: boolean;
  canSwitchCamera: boolean;
  audioOutputs: AudioOutputDevice[];
  selectedAudioOutputId: string;
  waitingRemoteVideoLabel: string;
  cameraOffLabel: string;
  noCameraLabel: string;
  muteLabel: string;
  unmuteLabel: string;
  cameraOnLabel: string;
  cameraOffActionLabel: string;
  switchCameraLabel: string;
  speakerLabel: string;
  endCallLabel: string;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  onSelectAudioOutput: (deviceId: string) => void;
  onEndCall: () => void;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  localVideoRef: React.RefObject<HTMLVideoElement>;
};

export type EndedCallScreenProps = PeerHeaderProps & {
  endedTitle: string;
  durationLabel: string;
  isRejected: boolean;
  closeLabel: string;
  onClose: () => void;
};
