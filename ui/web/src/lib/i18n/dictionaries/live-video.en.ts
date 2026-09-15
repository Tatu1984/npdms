/**
 * Phase 03 — live CCTV through the Edge Agent: the live wall, players,
 * Edge Agent settings and purpose-logged live viewing.
 * Mounted as `liveVideo` in en.ts.
 */
export const liveVideoEn = {
  status: {
    ONLINE: "Live",
    CONNECTING: "Waiting for Edge Agent",
    STOPPED: "Stream stopped",
    OFFLINE: "Offline",
    notEnabled: "Live streaming off",
  },
  statusHint: {
    ONLINE: "Video is arriving from the Edge Agent.",
    CONNECTING: "The Edge Agent has connected, but no video has arrived yet.",
    STOPPED: "The Edge Agent has stopped sending video.",
    OFFLINE: "Nothing has been received from the Edge Agent.",
  },
  player: {
    idle: "Paused",
    loading: "Connecting…",
    error: "Stream unavailable",
    unsupported: "This browser cannot play live video",
  },

  tabLive: "Live wall",
  wallTitle: "Live wall",
  wallDesc:
    "Cameras whose Edge Agent pushes video to the platform. Only tiles on screen play; hidden tiles cost nothing.",
  mediaNotConfigured: "Live video storage is not configured",
  noLiveCameras: "No camera streams live yet",
  noLiveCamerasHint:
    "An SHO enables live streaming on a camera in the register and pastes the settings into the Edge Agent at the site.",
  startViewing: "Start live viewing",
  stopViewing: "Stop viewing",
  pauseAll: "Pause all",
  resumeAll: "Resume",
  watchLive: "Watch live",
  openFocus: "Open",
  lastVideo: "Last video {when}",
  noVideoYet: "No video received yet",
  capped: "One viewing session covers at most {n} cameras; the rest are not included.",

  purposeTitle: "Purpose of live viewing",
  purposeDesc:
    "Live video is watched under a stated purpose. It is recorded once in the purpose log for this viewing session, with the cameras it covers — not for every segment. The session ends after {idle} minutes without playback, and after {max} hours at most.",
  purposeLabel: "Purpose",
  purposePlaceholder: "e.g. Monitoring Esplanade crossing after a reported chain snatching",
  purposeCameras: "Cameras in this session: {codes}",
  sessionActive: "Viewing under purpose: {purpose}",
  sessionEnded: "The viewing session has ended. Start again with a stated purpose.",
  rankRequired: "Watching live video needs the rank of ASI or above.",
  maskedRankRequired:
    "Flagged for masking. Masking is not applied to live video, so only an SHO or above may watch it live.",
  notInSession: "Not in this viewing session",
  includeNew: "Include {n} more",

  sectionTitle: "Live streaming (Edge Agent)",
  notEnabledBody:
    "Live video reaches the platform only through an Edge Agent on the camera's network. Streaming is not enabled for this camera.",
  enable: "Enable live streaming",
  enableTitle: "Enable live streaming for {code}?",
  enableDesc:
    "Issues an Ingest URL, a token and a Camera ID for the Edge Agent at the site. The token is shown once.",
  rotate: "Rotate token",
  rotateTitle: "Rotate the Edge Agent token?",
  rotateDesc:
    "The current token stops working immediately. The Edge Agent must be given the new token before this camera can stream again.",
  disable: "Turn off live streaming",
  disableTitle: "Turn off live streaming for {code}?",
  disableDesc:
    "The token is revoked, open viewing sessions end and the stored live video is deleted. The Camera ID is kept if streaming is enabled again.",
  disableReason: "Reason (recorded in the audit trail)",
  disabled: "Live streaming turned off",
  cameraIdField: "Camera ID (stream key)",
  enabledSince: "Enabled {when}",
  tokenRotatedAt: "Token rotated {when}",

  edgeTitle: "Edge Agent settings for {code}",
  edgeWarning:
    "Copy the token now — it is shown only once and cannot be recovered. If it is lost, rotate the token to issue a new one.",
  edgeSteps:
    "In the Edge Agent, paste the Ingest URL into Portal Connection. Add the camera with this Camera ID (also as its Stream key), this token and the camera's local RTSP address, then start it. The agent needs outbound HTTPS only.",
  ingestUrl: "Ingest URL",
  token: "Token",
  cameraId: "Camera ID",
  publishUrl: "Publish URL (the agent builds this)",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Could not copy — select the text instead",
  done: "Done — the token is copied",
  closeWithoutCopy: "The token will not be shown again. Close anyway?",

  registerStreaming: "Enable live streaming through the Edge Agent",
  registerStreamingHint: "The Edge Agent settings are shown once the camera is registered.",
  colLive: "Live",
  accessLive: "Live viewing",
  liveCameras: "{n} cameras",
  statStreaming: "Streaming enabled",
};
