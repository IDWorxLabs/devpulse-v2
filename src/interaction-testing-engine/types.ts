/**
 * DevPulse V2 Phase 16.5 — Interaction Testing Engine types.
 * Interaction simulation and outcome recording only — no correctness verdicts or quality scoring.
 */

import type { PreviewContextSnapshot, UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { SelfVisionSession } from '../self-vision-runtime/types.js';

export const INTERACTION_TESTING_ENGINE_PASS_TOKEN = 'INTERACTION_TESTING_ENGINE_V1_PASS';
export const INTERACTION_TESTING_ENGINE_OWNER_MODULE = 'devpulse_v2_interaction_testing_engine';

export type InteractionType =
  | 'BUTTON_INTERACTION'
  | 'NAVIGATION_INTERACTION'
  | 'FORM_INTERACTION'
  | 'WORKFLOW_INTERACTION'
  | 'MENU_INTERACTION'
  | 'TAB_INTERACTION'
  | 'ROUTE_INTERACTION';

export type InteractionState =
  | 'DISCOVERED'
  | 'PLANNED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'BLOCKED';

export const ALL_INTERACTION_TYPES: readonly InteractionType[] = [
  'BUTTON_INTERACTION',
  'NAVIGATION_INTERACTION',
  'FORM_INTERACTION',
  'WORKFLOW_INTERACTION',
  'MENU_INTERACTION',
  'TAB_INTERACTION',
  'ROUTE_INTERACTION',
] as const;

export const FORBIDDEN_INTERACTION_TESTING_DUPLICATES = [
  'visual_verification_engine',
  'preview_executor',
  'runtime_brain',
  'autonomous_ui_tester',
  'interaction_verdict_engine',
] as const;

export const INTERACTION_TESTING_QUESTION_SIGNALS = [
  'what interactions were tested',
  'what buttons were discovered',
  'what navigation paths were executed',
  'what workflow paths exist',
  'what interaction outcomes occurred',
  'why is interaction testing blocked',
  'interaction testing',
  'button testing',
  'navigation testing',
  'workflow testing',
  'interaction results',
  'interaction ready',
  'interaction blocked',
  'form interaction',
] as const;

export interface InteractionPlan {
  planId: string;
  interactionType: InteractionType;
  target: string;
  description: string;
  priority: number;
  planOnly: true;
}

export interface ExecutedInteraction {
  executionId: string;
  planId: string;
  interactionType: InteractionType;
  target: string;
  state: InteractionState;
  simulated: true;
}

export interface InteractionResult {
  interactionId: string;
  interactionType: InteractionType;
  target: string;
  startTime: number;
  endTime: number;
  observedOutcome: string;
  warnings: string[];
  noVerdict: true;
}

export interface InteractionTestingReport {
  interactionTestId: string;
  inspectionId: string | null;
  selfVisionSessionId: string | null;
  projectId: string;
  workspaceId: string;
  interactionState: InteractionState;
  interactionPlans: InteractionPlan[];
  executedInteractions: ExecutedInteraction[];
  interactionResults: InteractionResult[];
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
  testingOnly: true;
}

export interface InteractionTestingDiagnostics {
  interactionTestingActive: boolean;
  interactionTestCount: number;
  blockedInteractionCount: number;
  completedInteractionCount: number;
  lastQuery: string | null;
  lastState: InteractionState | null;
}

export interface ExecuteInteractionTestingInput {
  query?: string;
  inspectionReport?: UiInspectionReport | null;
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
  selfVisionSessionExists?: boolean;
  previewContextExists?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface ExecuteInteractionTestingResult {
  interactionTestingReport: InteractionTestingReport;
  diagnostics: InteractionTestingDiagnostics;
  responseText: string;
}

export function isInteractionTestingQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return INTERACTION_TESTING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isInteractionTestingAdvisoryQuestion(question: string): boolean {
  return isInteractionTestingQuestion(question);
}

export function isDuplicateInteractionTestingQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_INTERACTION_TESTING_DUPLICATES.some((d) => lower.includes(d));
}
