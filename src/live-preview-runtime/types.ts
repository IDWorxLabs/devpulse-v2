/**
 * DevPulse V2 Phase 16.1 — Live Preview Runtime types.
 * Preview target/session management only — no UI inspection, screenshots, or browser launch.
 */

export const LIVE_PREVIEW_RUNTIME_PASS_TOKEN = 'LIVE_PREVIEW_RUNTIME_V1_PASS';
export const LIVE_PREVIEW_RUNTIME_OWNER_MODULE = 'devpulse_v2_live_preview_runtime';

export type PreviewTargetType =
  | 'WEB_APP'
  | 'MOBILE_APP'
  | 'DESKTOP_APP'
  | 'API_SERVICE'
  | 'BACKGROUND_RUNTIME'
  | 'STATIC_PAGE'
  | 'UNKNOWN_TARGET';

export type PreviewState =
  | 'DISCOVERED'
  | 'REGISTERED'
  | 'WAITING_FOR_RUNTIME'
  | 'PREVIEW_READY'
  | 'PREVIEW_BLOCKED'
  | 'UNKNOWN';

export type PreviewCapabilityType =
  | 'LIVE_VIEW'
  | 'SCREEN_CAPTURE'
  | 'INTERACTION_TESTING'
  | 'SELF_VISION'
  | 'VISUAL_VERIFICATION'
  | 'SESSION_REPLAY';

export const TRACKED_PREVIEW_CAPABILITIES: readonly PreviewCapabilityType[] = [
  'LIVE_VIEW',
  'SCREEN_CAPTURE',
  'INTERACTION_TESTING',
  'SELF_VISION',
  'VISUAL_VERIFICATION',
  'SESSION_REPLAY',
] as const;

export const FORBIDDEN_LIVE_PREVIEW_DUPLICATES = [
  'preview_executor',
  'live_preview_executor',
  'self_vision_engine',
  'visual_verification_engine',
  'ui_inspection_engine',
  'interaction_testing_engine',
  'runtime_brain',
] as const;

export const LIVE_PREVIEW_QUESTION_SIGNALS = [
  'what preview targets exist',
  'show preview session',
  'can this project be previewed',
  'what preview capabilities exist',
  'why is preview blocked',
  'live preview',
  'preview runtime',
  'preview session',
  'preview target',
  'preview ready',
  'preview blocked',
] as const;

export interface PreviewTargetMetadata {
  targetId: string;
  targetName: string;
  targetType: PreviewTargetType;
  projectId: string;
  workspaceId: string;
  runtimeAssociation: string;
  ownerModule: string;
  previewUrl: string | null;
  registeredAt: number;
}

export interface PreviewSession {
  previewSessionId: string;
  projectId: string;
  workspaceId: string;
  previewTargetType: PreviewTargetType;
  previewTargetName: string;
  previewState: PreviewState;
  previewUrl: string | null;
  previewCapabilities: PreviewCapabilityType[];
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
}

export interface PreviewRuntimeReport {
  reportId: string;
  state: PreviewState;
  valid: boolean;
  summary: string;
  session: PreviewSession | null;
  gatesEvaluated: number;
  gatesPassed: number;
  managementOnly: true;
}

export interface PreviewRuntimeDiagnostics {
  previewRuntimeActive: boolean;
  previewSessionCount: number;
  registeredTargetCount: number;
  blockedPreviewCount: number;
  readyPreviewCount: number;
  lastQuery: string | null;
  lastState: PreviewState | null;
}

export interface PrepareLivePreviewRuntimeInput {
  query?: string;
  projectId: string;
  workspaceId: string;
  targetName: string;
  targetType: PreviewTargetType;
  previewUrl?: string | null;
  projectExists: boolean;
  workspaceExists: boolean;
  world1Protected: boolean;
  ownershipValid: boolean;
  forceDuplicateTarget?: boolean;
  forceDuplicateSession?: boolean;
}

export interface PrepareLivePreviewRuntimeResult {
  previewSession: PreviewSession | null;
  runtimeReport: PreviewRuntimeReport;
  diagnostics: PreviewRuntimeDiagnostics;
  responseText: string;
}

export function isLivePreviewQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return LIVE_PREVIEW_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isLivePreviewAdvisoryQuestion(question: string): boolean {
  return isLivePreviewQuestion(question);
}

export function isDuplicatePreviewExecutorQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('preview_executor') ||
    lower.includes('live_preview_executor') ||
    lower.includes('ui_inspection_engine')
  );
}

export function capabilitiesForTargetType(targetType: PreviewTargetType): PreviewCapabilityType[] {
  switch (targetType) {
    case 'WEB_APP':
    case 'STATIC_PAGE':
      return ['LIVE_VIEW', 'SCREEN_CAPTURE', 'INTERACTION_TESTING', 'VISUAL_VERIFICATION', 'SESSION_REPLAY'];
    case 'MOBILE_APP':
      return ['LIVE_VIEW', 'SCREEN_CAPTURE', 'INTERACTION_TESTING', 'SELF_VISION', 'VISUAL_VERIFICATION'];
    case 'DESKTOP_APP':
      return ['LIVE_VIEW', 'SCREEN_CAPTURE', 'INTERACTION_TESTING', 'SESSION_REPLAY'];
    case 'API_SERVICE':
      return ['LIVE_VIEW', 'SESSION_REPLAY'];
    case 'BACKGROUND_RUNTIME':
      return ['SESSION_REPLAY'];
    default:
      return ['LIVE_VIEW'];
  }
}
