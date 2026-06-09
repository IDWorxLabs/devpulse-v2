/**
 * DevPulse V2 Phase 16.2 — Preview Intelligence types.
 * Reasoning about preview readiness only — no browser launch, screenshots, or UI inspection.
 */

import type { PreviewCapabilityType, PreviewSession, PreviewTargetMetadata, PreviewTargetType } from '../live-preview-runtime/types.js';
import { TRACKED_PREVIEW_CAPABILITIES } from '../live-preview-runtime/types.js';

export const PREVIEW_INTELLIGENCE_PASS_TOKEN = 'PREVIEW_INTELLIGENCE_V1_PASS';
export const PREVIEW_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_preview_intelligence';

export type PreviewReadinessLevel =
  | 'NOT_READY'
  | 'PARTIALLY_READY'
  | 'READY_FOR_OBSERVATION'
  | 'READY_FOR_FUTURE_SELF_VISION'
  | 'BLOCKED'
  | 'UNKNOWN';

export type PreviewLimitationType =
  | 'NO_PREVIEW_URL'
  | 'NO_SCREEN_CAPTURE'
  | 'NO_INTERACTION_LAYER'
  | 'NO_SELF_VISION_RUNTIME'
  | 'NO_VISUAL_VERIFICATION'
  | 'UNKNOWN_TARGET_TYPE'
  | 'MOBILE_PREVIEW_REQUIRES_DESKTOP'
  | 'API_SERVICE_NOT_VISUAL'
  | 'BACKGROUND_RUNTIME_NOT_VISUAL'
  | 'WORKSPACE_NOT_READY'
  | 'MISSING_PREVIEW_SESSION'
  | 'MISSING_PREVIEW_TARGET';

export type ObservationItemType =
  | 'OBSERVE_RENDER_STATE'
  | 'OBSERVE_LAYOUT_STABILITY'
  | 'OBSERVE_INTERACTION_SURFACE'
  | 'OBSERVE_ERROR_BOUNDARIES'
  | 'OBSERVE_LOADING_STATE'
  | 'OBSERVE_NAVIGATION_STATE'
  | 'OBSERVE_VISUAL_REGRESSION_RISK'
  | 'OBSERVE_MOBILE_DESKTOP_COMPATIBILITY';

export const ALL_OBSERVATION_ITEMS: readonly ObservationItemType[] = [
  'OBSERVE_RENDER_STATE',
  'OBSERVE_LAYOUT_STABILITY',
  'OBSERVE_INTERACTION_SURFACE',
  'OBSERVE_ERROR_BOUNDARIES',
  'OBSERVE_LOADING_STATE',
  'OBSERVE_NAVIGATION_STATE',
  'OBSERVE_VISUAL_REGRESSION_RISK',
  'OBSERVE_MOBILE_DESKTOP_COMPATIBILITY',
] as const;

export const FORBIDDEN_PREVIEW_INTELLIGENCE_DUPLICATES = [
  'preview_executor',
  'live_preview_executor',
  'self_vision_engine',
  'visual_verification_engine',
  'ui_inspection_engine',
  'interaction_testing_engine',
  'runtime_brain',
  'preview_autonomous_operator',
] as const;

export const PREVIEW_INTELLIGENCE_QUESTION_SIGNALS = [
  'is this preview ready',
  'what preview limitations exist',
  'what can devpulse observe',
  'what should self vision look at',
  'self vision look at later',
  'why is preview not ready',
  'can this mobile app be previewed',
  'what preview capabilities are missing',
  'preview intelligence',
  'preview readiness',
  'preview limitations',
  'observation plan',
  'self vision preparation',
] as const;

export interface PreviewCapabilitySummary {
  capability: PreviewCapabilityType;
  available: boolean;
  missing: boolean;
  futureRequired: boolean;
  blockedReason: string | null;
}

export interface PreviewLimitationRecord {
  limitation: PreviewLimitationType;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PreviewObservationPlanItem {
  observation: ObservationItemType;
  priority: number;
  rationale: string;
  deferred: boolean;
}

export interface PreviewIntelligenceReport {
  previewIntelligenceId: string;
  previewSessionId: string | null;
  projectId: string;
  workspaceId: string;
  targetType: PreviewTargetType;
  readinessLevel: PreviewReadinessLevel;
  readinessScore: number;
  capabilitySummary: PreviewCapabilitySummary[];
  limitations: PreviewLimitationRecord[];
  observationPlan: PreviewObservationPlanItem[];
  blockedReasons: string[];
  warnings: string[];
  createdAt: number;
  intelligenceOnly: true;
}

export interface PreviewIntelligenceDiagnostics {
  previewIntelligenceActive: boolean;
  intelligenceReportCount: number;
  blockedIntelligenceCount: number;
  readyForObservationCount: number;
  lastQuery: string | null;
  lastReadinessLevel: PreviewReadinessLevel | null;
}

export interface AnalyzePreviewIntelligenceInput {
  query?: string;
  previewSession?: PreviewSession | null;
  previewTarget?: PreviewTargetMetadata | null;
  projectId?: string;
  workspaceId?: string;
  targetName?: string;
  targetType?: PreviewTargetType;
  previewUrl?: string | null;
  projectExists?: boolean;
  workspaceExists?: boolean;
  workspaceReady?: boolean;
  ownershipValid?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface AnalyzePreviewIntelligenceResult {
  previewIntelligenceReport: PreviewIntelligenceReport;
  diagnostics: PreviewIntelligenceDiagnostics;
  responseText: string;
}

export function isPreviewIntelligenceQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return PREVIEW_INTELLIGENCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isPreviewIntelligenceAdvisoryQuestion(question: string): boolean {
  return isPreviewIntelligenceQuestion(question);
}

export function isDuplicatePreviewIntelligenceQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_PREVIEW_INTELLIGENCE_DUPLICATES.some((d) => lower.includes(d));
}

export { TRACKED_PREVIEW_CAPABILITIES };
