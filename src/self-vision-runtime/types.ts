/**
 * DevPulse V2 Phase 16.3 — Self Vision Runtime types.
 * Visual observation session runtime only — no layout inspection, screenshot analysis, or interaction testing.
 */

import type { PreviewTargetType } from '../live-preview-runtime/types.js';

export const SELF_VISION_RUNTIME_PASS_TOKEN = 'SELF_VISION_RUNTIME_V1_PASS';
export const SELF_VISION_RUNTIME_OWNER_MODULE = 'devpulse_v2_self_vision_runtime';

export type ObservationState =
  | 'DISCOVERED'
  | 'PLANNED'
  | 'WAITING_FOR_CAPTURE'
  | 'READY_FOR_OBSERVATION'
  | 'OBSERVATION_BLOCKED'
  | 'UNKNOWN';

export type CapturePlanType =
  | 'INITIAL_RENDER_CAPTURE'
  | 'LOADING_STATE_CAPTURE'
  | 'ERROR_STATE_CAPTURE'
  | 'POST_ACTION_CAPTURE'
  | 'MANUAL_CAPTURE'
  | 'TIMELINE_CAPTURE';

export type ObservationCapabilityType =
  | 'SCREEN_CAPTURE'
  | 'VIDEO_CAPTURE'
  | 'TIMELINE_CAPTURE'
  | 'SESSION_REPLAY_LINK'
  | 'UI_INSPECTION'
  | 'INTERACTION_TESTING'
  | 'VISUAL_VERIFICATION';

export type ObservationTargetType =
  | 'RENDER_SURFACE'
  | 'LAYOUT_SURFACE'
  | 'NAVIGATION_SURFACE'
  | 'INTERACTION_SURFACE'
  | 'ERROR_SURFACE'
  | 'LOADING_SURFACE'
  | 'RESPONSIVE_SURFACE';

export const ALL_CAPTURE_PLAN_TYPES: readonly CapturePlanType[] = [
  'INITIAL_RENDER_CAPTURE',
  'LOADING_STATE_CAPTURE',
  'ERROR_STATE_CAPTURE',
  'POST_ACTION_CAPTURE',
  'MANUAL_CAPTURE',
  'TIMELINE_CAPTURE',
] as const;

export const TRACKED_OBSERVATION_CAPABILITIES: readonly ObservationCapabilityType[] = [
  'SCREEN_CAPTURE',
  'VIDEO_CAPTURE',
  'TIMELINE_CAPTURE',
  'SESSION_REPLAY_LINK',
  'UI_INSPECTION',
  'INTERACTION_TESTING',
  'VISUAL_VERIFICATION',
] as const;

export const ALL_OBSERVATION_TARGETS: readonly ObservationTargetType[] = [
  'RENDER_SURFACE',
  'LAYOUT_SURFACE',
  'NAVIGATION_SURFACE',
  'INTERACTION_SURFACE',
  'ERROR_SURFACE',
  'LOADING_SURFACE',
  'RESPONSIVE_SURFACE',
] as const;

export const FORBIDDEN_SELF_VISION_RUNTIME_DUPLICATES = [
  'ui_inspection_engine',
  'visual_verification_engine',
  'interaction_testing_engine',
  'preview_executor',
  'runtime_brain',
  'autonomous_ui_tester',
  'self_vision_engine',
] as const;

export const SELF_VISION_RUNTIME_QUESTION_SIGNALS = [
  'can self vision observe',
  'show self vision session',
  'what observation targets exist',
  'what capture plan exists',
  'why is self vision blocked',
  'self vision runtime',
  'self vision session',
  'observation session',
  'observation targets',
  'capture plan',
  'vision ready',
  'self vision blocked',
] as const;

export interface CapturePlanItem {
  captureType: CapturePlanType;
  priority: number;
  rationale: string;
  deferred: true;
}

export interface ObservationTargetItem {
  target: ObservationTargetType;
  priority: number;
  rationale: string;
  plannedOnly: true;
}

export interface SelfVisionSession {
  selfVisionSessionId: string;
  previewSessionId: string;
  projectId: string;
  workspaceId: string;
  targetType: PreviewTargetType;
  observationState: ObservationState;
  capturePlan: CapturePlanItem[];
  observationCapabilities: ObservationCapabilityType[];
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
}

export interface SelfVisionRuntimeReport {
  reportId: string;
  state: ObservationState;
  valid: boolean;
  summary: string;
  session: SelfVisionSession | null;
  observationTargets: ObservationTargetItem[];
  gatesEvaluated: number;
  gatesPassed: number;
  runtimeOnly: true;
}

export interface SelfVisionRuntimeDiagnostics {
  selfVisionRuntimeActive: boolean;
  selfVisionSessionCount: number;
  blockedObservationCount: number;
  readyObservationCount: number;
  lastQuery: string | null;
  lastState: ObservationState | null;
}

export interface PrepareSelfVisionRuntimeInput {
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
  previewSessionExists?: boolean;
  previewTargetExists?: boolean;
  forceDuplicateSession?: boolean;
  suppressPreviewBootstrap?: boolean;
}

export interface PrepareSelfVisionRuntimeResult {
  selfVisionSession: SelfVisionSession | null;
  runtimeReport: SelfVisionRuntimeReport;
  diagnostics: SelfVisionRuntimeDiagnostics;
  responseText: string;
}

export function isSelfVisionRuntimeQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  if (lower.includes('self vision preparation') || lower.includes('self vision look at later')) {
    return false;
  }
  return SELF_VISION_RUNTIME_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isSelfVisionRuntimeAdvisoryQuestion(question: string): boolean {
  return isSelfVisionRuntimeQuestion(question);
}

export function isDuplicateSelfVisionRuntimeQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_SELF_VISION_RUNTIME_DUPLICATES.some((d) => lower.includes(d));
}

export function capabilitiesForTargetType(targetType: PreviewTargetType): ObservationCapabilityType[] {
  switch (targetType) {
    case 'WEB_APP':
    case 'STATIC_PAGE':
      return ['SCREEN_CAPTURE', 'VIDEO_CAPTURE', 'TIMELINE_CAPTURE', 'SESSION_REPLAY_LINK', 'UI_INSPECTION', 'INTERACTION_TESTING', 'VISUAL_VERIFICATION'];
    case 'MOBILE_APP':
      return ['SCREEN_CAPTURE', 'VIDEO_CAPTURE', 'TIMELINE_CAPTURE', 'SESSION_REPLAY_LINK', 'VISUAL_VERIFICATION'];
    case 'DESKTOP_APP':
      return ['SCREEN_CAPTURE', 'VIDEO_CAPTURE', 'TIMELINE_CAPTURE', 'SESSION_REPLAY_LINK', 'INTERACTION_TESTING'];
    case 'API_SERVICE':
    case 'BACKGROUND_RUNTIME':
      return ['TIMELINE_CAPTURE', 'SESSION_REPLAY_LINK'];
    default:
      return ['SCREEN_CAPTURE'];
  }
}
