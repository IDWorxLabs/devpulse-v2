/**
 * AiDevEngine Founder Testing Mode V3 — report types.
 */

import type { FounderPreferenceModel } from './founder-preference-model.js';
import type { FounderTestV2Report } from './founder-testing-v2-types.js';
import type { FounderTestIssue } from './founder-testing-types.js';

export type FrustrationRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConfusionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TrustEventType = 'GAIN' | 'LOSS';

export type FounderTestV3Verdict =
  | 'NOT_READY_FOR_USERS'
  | 'READY_FOR_INTERNAL_TESTING'
  | 'READY_FOR_LIMITED_BETA'
  | 'READY_FOR_PUBLIC_BETA'
  | 'READY_FOR_LAUNCH';

export interface HumanPersonaSimulation {
  personaId: string;
  label: string;
  questions: string[];
  satisfactionScore: number;
  trustDelta: number;
  findings: string[];
}

export interface CuriosityPathResult {
  pathLabel: string;
  steps: string[];
  contextRecoveryScore: number;
  understandabilityMaintained: boolean;
  issues: string[];
}

export interface MistakePromptResult {
  prompt: string;
  recovered: boolean;
  guidesUser: boolean;
  followUpQuality: number;
  responsePreview: string;
  issues: string[];
}

export interface PatienceAssessment {
  screen: string;
  frustrationRisk: FrustrationRiskLevel;
  hasLoadingTimeout: boolean;
  hasProgressFeedback: boolean;
  hasExplanation: boolean;
  detail: string;
}

export interface TrustEvent {
  type: TrustEventType;
  source: string;
  reason: string;
  magnitude: number;
}

export interface GoalCompletionResult {
  goalId: string;
  label: string;
  stepsRequired: number;
  confusionPoints: string[];
  deadEnds: string[];
  trustLossEvents: string[];
  completionLikelihood: number;
  goalSuccessScore: number;
}

export interface HumanConfusionFinding {
  topic: string;
  severity: ConfusionSeverity;
  detail: string;
}

export interface LaunchReadinessSignals {
  humanSuccessRate: number;
  trustScore: number;
  confusionScore: number;
  goalCompletionScore: number;
  founderApprovalScore: number;
  customerApprovalScore: number;
  launchReadinessScore: number;
}

export interface FounderTestV3Report {
  reportId: string;
  generatedAt: number;
  durationMs: number;
  readOnly: true;
  mode: 'founder-testing-v3';
  v2: FounderTestV2Report;
  founderPreferenceModel: FounderPreferenceModel;
  personaSimulations: HumanPersonaSimulation[];
  curiosityPaths: CuriosityPathResult[];
  mistakeResults: MistakePromptResult[];
  patienceAssessments: PatienceAssessment[];
  trustEvents: TrustEvent[];
  trustScore: number;
  goalResults: GoalCompletionResult[];
  confusionFindings: HumanConfusionFinding[];
  launchReadiness: LaunchReadinessSignals;
  topFrustrationRisks: string[];
  topTrustLossRisks: string[];
  verdict: FounderTestV3Verdict;
  issues: FounderTestIssue[];
  recommendedFixOrder: string[];
  copyPasteFixPrompts: string[];
  reportMarkdown: string;
}

export interface RunFounderTestingModeV3Input {
  rootDir?: string;
  validatorScripts?: string[];
  liveResults?: import('./founder-testing-types.js').LiveScreenResultInput[];
  liveSection?: string;
}
