/**
 * DevPulse V2 Phase 16.6 — Visual Verification Engine types.
 * Visual outcome verification only — no UI modification, interaction execution, or repairs.
 */

import type { InteractionTestingReport } from '../interaction-testing-engine/types.js';
import type { PreviewContextSnapshot, UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { SelfVisionSession } from '../self-vision-runtime/types.js';

export const VISUAL_VERIFICATION_ENGINE_PASS_TOKEN = 'VISUAL_VERIFICATION_ENGINE_V1_PASS';
export const VISUAL_VERIFICATION_ENGINE_OWNER_MODULE = 'devpulse_v2_visual_verification_engine';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'VERIFICATION_REQUIRED'
  | 'VERIFICATION_BLOCKED'
  | 'FAILED_VERIFICATION';

export type VerificationTargetType =
  | 'LAYOUT_TARGET'
  | 'NAVIGATION_TARGET'
  | 'LOADING_TARGET'
  | 'RESPONSIVE_TARGET'
  | 'INTERACTION_TARGET'
  | 'ERROR_STATE_TARGET';

export type VerificationEvidenceType =
  | 'LAYOUT_EVIDENCE'
  | 'NAVIGATION_EVIDENCE'
  | 'LOADING_EVIDENCE'
  | 'RESPONSIVE_EVIDENCE'
  | 'INTERACTION_EVIDENCE'
  | 'SELF_VISION_EVIDENCE';

export type VerificationRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type VerificationProgressState =
  | 'DISCOVERED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'FAILED_VERIFICATION'
  | 'VERIFICATION_BLOCKED';

export const ALL_VERIFICATION_TARGET_TYPES: readonly VerificationTargetType[] = [
  'LAYOUT_TARGET',
  'NAVIGATION_TARGET',
  'LOADING_TARGET',
  'RESPONSIVE_TARGET',
  'INTERACTION_TARGET',
  'ERROR_STATE_TARGET',
] as const;

export const ALL_VERIFICATION_STATUSES: readonly VerificationStatus[] = [
  'VERIFIED',
  'PARTIALLY_VERIFIED',
  'VERIFICATION_REQUIRED',
  'VERIFICATION_BLOCKED',
  'FAILED_VERIFICATION',
] as const;

export const FORBIDDEN_VISUAL_VERIFICATION_DUPLICATES = [
  'preview_executor',
  'runtime_brain',
  'autonomous_ui_tester',
  'autonomous_ui_repair_engine',
  'visual_auto_fix_engine',
] as const;

export const VISUAL_VERIFICATION_QUESTION_SIGNALS = [
  'what verification passed',
  'what verification failed',
  'what evidence exists',
  'what visual issues exist',
  'what interaction outcomes were verified',
  'why is verification blocked',
  'visual verification',
  'verification results',
  'verification evidence',
  'verification risks',
  'verification ready',
  'verification failed',
  'layout verification',
  'navigation verification',
  'loading verification',
  'responsive verification',
] as const;

export interface VerificationTarget {
  targetId: string;
  targetType: VerificationTargetType;
  targetName: string;
  description: string;
  verificationOnly: true;
}

export interface VerificationResult {
  resultId: string;
  targetId: string;
  targetType: VerificationTargetType;
  status: VerificationStatus;
  observedState: string;
  expectedState: string;
  issueClassifications: string[];
  verificationOnly: true;
}

export interface VerificationEvidence {
  evidenceId: string;
  evidenceType: VerificationEvidenceType;
  source: string;
  summary: string;
  detail: string;
  verificationOnly: true;
}

export interface VerificationRisk {
  riskId: string;
  level: VerificationRiskLevel;
  category: string;
  description: string;
  relatedTargetId: string | null;
}

export interface VisualVerificationReport {
  verificationId: string;
  inspectionId: string | null;
  interactionTestId: string | null;
  selfVisionSessionId: string | null;
  projectId: string;
  workspaceId: string;
  verificationStatus: VerificationStatus;
  verificationTargets: VerificationTarget[];
  verificationResults: VerificationResult[];
  verificationEvidence: VerificationEvidence[];
  verificationRisks: VerificationRisk[];
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
  verificationOnly: true;
}

export interface VisualVerificationDiagnostics {
  visualVerificationActive: boolean;
  verificationTargetCount: number;
  verifiedCount: number;
  blockedVerificationCount: number;
  lastQuery: string | null;
  lastStatus: VerificationStatus | null;
}

export interface VerifyVisualOutcomeInput {
  query?: string;
  inspectionReport?: UiInspectionReport | null;
  interactionTestingReport?: InteractionTestingReport | null;
  selfVisionSession?: SelfVisionSession | null;
  previewContext?: PreviewContextSnapshot | null;
  projectId?: string;
  workspaceId?: string;
  targetName?: string;
  projectExists?: boolean;
  workspaceExists?: boolean;
  world1Protected?: boolean;
  ownershipValid?: boolean;
  inspectionReportExists?: boolean;
  interactionReportExists?: boolean;
  selfVisionSessionExists?: boolean;
  previewContextExists?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface VerifyVisualOutcomeResult {
  visualVerificationReport: VisualVerificationReport;
  diagnostics: VisualVerificationDiagnostics;
  responseText: string;
}

export function isVisualVerificationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return VISUAL_VERIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isVisualVerificationAdvisoryQuestion(question: string): boolean {
  return isVisualVerificationQuestion(question);
}

export function isDuplicateVisualVerificationQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_VISUAL_VERIFICATION_DUPLICATES.some((d) => lower.includes(d));
}
