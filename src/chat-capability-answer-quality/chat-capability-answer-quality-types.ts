/**
 * Phase 26.92 — Chat Capability Answer Quality types (V1).
 */

import type { OperationalEvidenceSnapshot } from '../chat-operational-self-knowledge/chat-operational-self-knowledge-types.js';

export type CapabilityAnswerScenarioId =
  | 'what-is-aidevengine'
  | 'who-built-you'
  | 'build-from-one-prompt'
  | 'what-can-you-do';

export interface CapabilityAnswerScenarioDefinition {
  readOnly: true;
  id: CapabilityAnswerScenarioId;
  stressScenarioId: string;
  prompt: string;
  requiredTopics: readonly string[];
}

export type CapabilityBoundaryLevel = 'PROVEN' | 'PARTIAL' | 'PLANNED';

export interface CapabilityAnswerDimensionScores {
  readOnly: true;
  identityClarity: number;
  capabilityAccuracy: number;
  honesty: number;
  completeness: number;
  usefulness: number;
  boundaryAwareness: number;
  overallCapabilityAnswerScore: number;
}

export interface CapabilityAnswerAudit {
  readOnly: true;
  scenarioId: CapabilityAnswerScenarioId;
  prompt: string;
  answer: string;
  passed: boolean;
  scores: CapabilityAnswerDimensionScores;
  missingTopics: string[];
  honestyViolations: string[];
  boundaryIssues: string[];
  failureClass: string | null;
}

export interface CapabilityAnswerRepairPlan {
  readOnly: true;
  scenarioId: CapabilityAnswerScenarioId;
  repairRequired: boolean;
  actions: readonly string[];
  missingTopics: readonly string[];
  reason: string | null;
}

export interface ChatCapabilityAnswerQualityReport {
  readOnly: true;
  qualityId: string;
  generatedAt: string;
  coreQuestion: string;
  audits: CapabilityAnswerAudit[];
  averageScore: number;
  allScenariosPassed: boolean;
  passToken: string | null;
}

export interface ChatCapabilityAnswerQualityAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'CHAT_CAPABILITY_ANSWER_QUALITY_COMPLETE';
  report: ChatCapabilityAnswerQualityReport;
}

export interface AssessChatCapabilityAnswerQualityInput {
  rootDir?: string;
  snapshot?: OperationalEvidenceSnapshot;
  answers?: Partial<Record<CapabilityAnswerScenarioId, string>>;
  skipHistoryRecording?: boolean;
}

export interface BuildRepairedCapabilityAnswerInput {
  scenarioId: CapabilityAnswerScenarioId;
  snapshot: OperationalEvidenceSnapshot;
  rootDir?: string;
  message?: string;
}
