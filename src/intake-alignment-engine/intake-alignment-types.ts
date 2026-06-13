/**
 * Intake Alignment Engine — foundation types (V1).
 * Read-only multi-source evidence alignment repair.
 */

import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { UnifiedIntakeAnalysis, EvidenceConflict, FounderContextSnapshot } from '../unified-intake-intelligence/unified-intake-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';
import type { VoiceNotesAnalysis } from '../voice-notes-intelligence/voice-notes-types.js';

export type AlignmentCategory =
  | 'CONFLICTED'
  | 'PARTIAL_ALIGNMENT'
  | 'HIGH_ALIGNMENT'
  | 'STRONG_ALIGNMENT';

export type ConflictClassification = 'REAL_CONFLICT' | 'FALSE_CONFLICT';

export type NormalizedPlatform =
  | 'WEB'
  | 'MOBILE'
  | 'TABLET'
  | 'DESKTOP'
  | 'MULTI_PLATFORM';

export type NormalizedRole =
  | 'END_USER'
  | 'TRANSPORT_OPERATOR'
  | 'ADMIN'
  | 'VENDOR'
  | 'CUSTOMER'
  | 'OPERATOR'
  | 'UNKNOWN';

export interface NormalizedConcept {
  readOnly: true;
  canonical: string;
  original: string;
  source: string;
  category: 'ROLE' | 'PLATFORM' | 'WORKFLOW' | 'PRODUCT';
}

export interface SemanticAgreementItem {
  readOnly: true;
  agreementId: string;
  dimension: 'PRODUCT_INTENT' | 'PLATFORM' | 'ROLE' | 'WORKFLOW' | 'MEANING';
  description: string;
  sources: readonly string[];
  confidence: number;
}

export interface ClassifiedConflict {
  readOnly: true;
  conflictId: string;
  originalConflict: EvidenceConflict;
  classification: ConflictClassification;
  reason: string;
  evidence: readonly string[];
}

export interface PlatformAlignmentResult {
  readOnly: true;
  platforms: readonly NormalizedPlatform[];
  truePlatformConflict: boolean;
  alignmentScore: number;
  evidence: readonly string[];
}

export interface RoleAlignmentResult {
  readOnly: true;
  normalizedRoles: readonly NormalizedRole[];
  roleAlignmentScore: number;
  highRoleAlignment: boolean;
  evidence: readonly string[];
}

export interface WorkflowAlignmentResult {
  readOnly: true;
  workflows: readonly string[];
  workflowAlignmentScore: number;
  evidence: readonly string[];
}

export interface AlignmentRecommendation {
  readOnly: true;
  recommendationId: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  rationale: string;
  evidence: readonly string[];
}

export interface IntakeAlignmentAnalysis {
  readOnly: true;
  analysisId: string;
  analyzedAt: string;
  alignmentScore: number;
  alignmentCategory: AlignmentCategory;
  alignedConfidence: number;
  platformAlignment: PlatformAlignmentResult;
  roleAlignment: RoleAlignmentResult;
  workflowAlignment: WorkflowAlignmentResult;
  semanticAgreements: readonly SemanticAgreementItem[];
  classifiedConflicts: readonly ClassifiedConflict[];
  realConflictCount: number;
  falseConflictCount: number;
  alignmentRecommendations: readonly AlignmentRecommendation[];
  evidenceSources: readonly string[];
}

export interface IntakeAlignmentHistoryEntry {
  analysisId: string;
  timestamp: string;
  alignmentScore: number;
  alignmentCategory: AlignmentCategory;
  alignedConfidence: number;
  falseConflictCount: number;
}

export interface IntakeAlignmentReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: IntakeAlignmentAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    averageAlignmentScore: number;
    averageAlignedConfidence: number;
    strongAlignmentCount: number;
  };
}

export interface AssessIntakeAlignmentInput {
  unifiedIntakeAnalysis?: UnifiedIntakeAnalysis | null;
  voiceNotesAnalysis?: VoiceNotesAnalysis | null;
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  typedPrompt?: string | null;
  founderContext?: FounderContextSnapshot | null;
  skipHistoryRecording?: boolean;
}

export interface IntakeAlignmentAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'INTAKE_ALIGNMENT_ENGINE_COMPLETE' | 'INTAKE_ALIGNMENT_ENGINE_FAILED';
  analysis: IntakeAlignmentAnalysis | null;
  failureReason: string | null;
}

export interface SimulationAlignmentImpact {
  readOnly: true;
  scenarioType: string;
  readinessBeforeRepair: number;
  readinessAfterRepair: number;
  confidenceBeforeRepair: number;
  confidenceAfterRepair: number;
  falseConflictsRepaired: number;
  realConflictsRetained: number;
  gateDecisionBefore: string | null;
  gateDecisionAfter: string | null;
}

export interface AlignmentEvidenceBundle {
  readOnly: true;
  sources: readonly string[];
  typedPrompt: string;
  platforms: readonly string[];
  roles: readonly string[];
  workflows: readonly string[];
  productType: string;
  conflicts: readonly EvidenceConflict[];
  intakeConfidence: number;
}
