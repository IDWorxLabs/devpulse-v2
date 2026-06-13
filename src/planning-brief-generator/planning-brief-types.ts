/**
 * Planning Brief Generator — foundation types (V1).
 * Read-only planning preparation — no architecture or code generation.
 */

import type { PlanningGateAnalysis } from '../planning-gate-authority/planning-gate-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type {
  FounderContextSnapshot,
  ProjectVaultIntakeSnapshot,
  UnifiedIntakeAnalysis,
} from '../unified-intake-intelligence/unified-intake-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';
import type { VoiceNotesAnalysis } from '../voice-notes-intelligence/voice-notes-types.js';

export type PlatformTarget =
  | 'WEB'
  | 'MOBILE'
  | 'DESKTOP'
  | 'TABLET'
  | 'IOS'
  | 'ANDROID'
  | 'IPAD'
  | 'ANDROID_TABLET';

export type PlanningBriefQuality = 'INSUFFICIENT' | 'PARTIAL' | 'COMPLETE' | 'HIGH_CONFIDENCE';

export type PlanningBriefReadiness = 'NOT_READY' | 'DRAFT_READY' | 'PLANNING_READY';

export interface PlanningBriefProjectSummary {
  readOnly: true;
  productName: string | null;
  productType: string;
  objective: string;
  targetUsers: readonly string[];
}

export interface PlanningBriefScreenItem {
  readOnly: true;
  screenId: string;
  name: string;
  evidence: readonly string[];
}

export interface PlanningBriefWorkflowItem {
  readOnly: true;
  workflowId: string;
  name: string;
  evidence: readonly string[];
}

export interface PlanningBriefGapItem {
  readOnly: true;
  gapId: string;
  category: 'MISSING_REQUIREMENT' | 'UNRESOLVED_CONFLICT' | 'CLARIFICATION_REQUEST';
  description: string;
  evidence: readonly string[];
}

export interface PlanningBrief {
  readOnly: true;
  briefId: string;
  generatedAt: string;
  projectSummary: PlanningBriefProjectSummary;
  platformTargets: readonly PlatformTarget[];
  screenInventory: readonly PlanningBriefScreenItem[];
  workflowInventory: readonly PlanningBriefWorkflowItem[];
  userRoles: readonly string[];
  businessRules: readonly string[];
  integrations: readonly string[];
  knownGaps: readonly PlanningBriefGapItem[];
  planningBriefConfidence: number;
  planningBriefQuality: PlanningBriefQuality;
  planningBriefReadiness: PlanningBriefReadiness;
  evidenceSources: readonly string[];
}

export interface PlanningBriefHistoryEntry {
  briefId: string;
  timestamp: string;
  planningBriefConfidence: number;
  planningBriefQuality: PlanningBriefQuality;
  planningBriefReadiness: PlanningBriefReadiness;
  screenCount: number;
  workflowCount: number;
}

export interface PlanningBriefGeneratorReport {
  readOnly: true;
  generatedAt: string;
  totalBriefs: number;
  latestBrief: PlanningBrief | null;
  historySummary: {
    totalBriefs: number;
    averageConfidence: number;
    planningReadyCount: number;
    highConfidenceCount: number;
  };
}

export interface GeneratePlanningBriefInput {
  planningGateAnalysis: PlanningGateAnalysis | null;
  unifiedIntakeAnalysis?: UnifiedIntakeAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  voiceNotesAnalysis?: VoiceNotesAnalysis | null;
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
  founderContext?: FounderContextSnapshot | null;
  projectVaultContext?: ProjectVaultIntakeSnapshot | null;
  skipHistoryRecording?: boolean;
}

export interface PlanningBriefGeneration {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'PLANNING_BRIEF_GENERATOR_COMPLETE' | 'PLANNING_BRIEF_GENERATOR_FAILED';
  planningBrief: PlanningBrief | null;
  failureReason: string | null;
}

export interface PlanningBriefEvidenceBundle {
  readOnly: true;
  sources: readonly string[];
  screens: readonly string[];
  workflows: readonly string[];
  userRoles: readonly string[];
  businessRules: readonly string[];
  integrations: readonly string[];
  platforms: readonly string[];
  productType: string;
  productName: string | null;
  objective: string;
  targetUsers: readonly string[];
}
