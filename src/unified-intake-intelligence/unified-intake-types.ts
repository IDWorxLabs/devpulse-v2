/**
 * Unified Intake Intelligence — foundation types (V1).
 * Read-only multi-source project understanding — no code generation or execution.
 */

import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { StoredUploadRecord } from '../upload-system/upload-system-types.js';
import type { VisualReferenceAnalysis } from '../visual-reference-intelligence/visual-reference-types.js';
import type { VoiceNotesAnalysis } from '../voice-notes-intelligence/voice-notes-types.js';

export type ApplicationType =
  | 'SAAS_PLATFORM'
  | 'MARKETPLACE'
  | 'SOCIAL_NETWORK'
  | 'INTERNAL_TOOL'
  | 'MOBILE_APP'
  | 'AI_PRODUCT'
  | 'E_COMMERCE_PLATFORM'
  | 'WEB_APP'
  | 'UNKNOWN';

export type IntakeReadiness =
  | 'INSUFFICIENT_INPUT'
  | 'PARTIAL_UNDERSTANDING'
  | 'HIGH_CONFIDENCE_UNDERSTANDING'
  | 'READY_FOR_PLANNING';

export type IntakeReadinessCategory =
  | 'INSUFFICIENT_INPUT'
  | 'PARTIAL_UNDERSTANDING'
  | 'HIGH_CONFIDENCE_UNDERSTANDING'
  | 'READY_FOR_PLANNING';

export type EvidenceConflictType =
  | 'PLATFORM_CONFLICT'
  | 'PRODUCT_TYPE_CONFLICT'
  | 'USER_ROLE_CONFLICT'
  | 'INTEGRATION_CONFLICT'
  | 'WORKFLOW_CONFLICT';

export type IntakeSourceId =
  | 'TYPED_PROMPT'
  | 'VOICE_NOTES_INTELLIGENCE'
  | 'VISUAL_REFERENCE_INTELLIGENCE'
  | 'REQUIREMENT_COMPLETENESS_INTELLIGENCE'
  | 'UPLOAD_SYSTEM'
  | 'PROJECT_VAULT_CONTEXT'
  | 'FOUNDER_CONTEXT'
  | 'CUSTOM_SOURCE';

export interface TypedPromptInput {
  readOnly?: true;
  rawPrompt?: string | null;
  screens?: readonly string[] | null;
  userRoles?: readonly string[] | null;
  workflows?: readonly string[] | null;
  businessRules?: readonly string[] | null;
  integrations?: readonly string[] | null;
  notifications?: readonly string[] | null;
  authentication?: readonly string[] | null;
  dataEntities?: readonly string[] | null;
  platformTargets?: readonly string[] | null;
}

export interface ProjectVaultIntakeSnapshot {
  readOnly: true;
  projectName: string | null;
  facts: readonly { label: string; value: string; source: string }[];
}

export interface FounderContextSnapshot {
  readOnly: true;
  founderGoal: string | null;
  businessObjective: string | null;
  targetUsers: readonly string[];
  constraints: readonly string[];
  priorities: readonly string[];
}

export interface UploadIntakeSnapshot {
  readOnly: true;
  acceptedUploads: number;
  imageUploads: number;
  documentUploads: number;
  videoUploads: number;
  recentFilenames: readonly string[];
}

export interface PluggableIntakeSource {
  readOnly: true;
  sourceId: string;
  sourceLabel: string;
  platformTargets?: readonly string[];
  screens?: readonly string[];
  workflows?: readonly string[];
  userRoles?: readonly string[];
  integrations?: readonly string[];
  businessRules?: readonly string[];
  dataEntities?: readonly string[];
  productTypeHint?: string | null;
}

export interface ConsolidatedIntakeEvidence {
  readOnly: true;
  activeSources: readonly IntakeSourceId[];
  typedPromptExcerpt: string | null;
  platforms: readonly string[];
  screens: readonly string[];
  workflows: readonly string[];
  userRoles: readonly string[];
  integrations: readonly string[];
  notifications: readonly string[];
  authentication: readonly string[];
  dataEntities: readonly string[];
  businessRules: readonly string[];
  visualComponents: readonly string[];
  inferredFlows: readonly string[];
  uploadSummary: UploadIntakeSnapshot | null;
  founderContext: FounderContextSnapshot | null;
  sourceCount: number;
  evidenceItemCount: number;
}

export interface ProjectIntentAnalysis {
  readOnly: true;
  applicationType: ApplicationType;
  platformTargets: readonly string[];
  primaryPurpose: string;
  targetUsers: readonly string[];
  businessObjective: string;
  confidence: number;
  evidence: readonly string[];
}

export interface UnifiedProjectUnderstanding {
  readOnly: true;
  productType: ApplicationType;
  platforms: readonly string[];
  workflows: readonly string[];
  screens: readonly string[];
  userRoles: readonly string[];
  entities: readonly string[];
  integrations: readonly string[];
  businessRules: readonly string[];
  confidence: number;
  evidenceSources: readonly IntakeSourceId[];
}

export interface EvidenceConflict {
  readOnly: true;
  conflictType: EvidenceConflictType;
  description: string;
  conflictingEvidence: readonly string[];
  confidence: number;
  recommendedClarification: string;
}

export interface IntakeGap {
  readOnly: true;
  gapId: string;
  category: 'WORKFLOW' | 'SCREEN' | 'ROLE' | 'INTEGRATION' | 'BUSINESS_LOGIC';
  description: string;
  evidence: readonly string[];
}

export interface IntakeRecommendation {
  readOnly: true;
  recommendationId: string;
  title: string;
  rationale: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: readonly string[];
}

export interface UnifiedIntakeAnalysis {
  readOnly: true;
  analysisId: string;
  analyzedAt: string;
  evidence: ConsolidatedIntakeEvidence;
  projectIntent: ProjectIntentAnalysis;
  projectUnderstanding: UnifiedProjectUnderstanding;
  evidenceConflicts: readonly EvidenceConflict[];
  intakeGaps: readonly IntakeGap[];
  unifiedIntakeConfidence: number;
  intakeReadinessScore: number;
  intakeReadinessCategory: IntakeReadinessCategory;
  intakeReadiness: IntakeReadiness;
  intakeRecommendations: readonly IntakeRecommendation[];
}

export interface UnifiedIntakeHistoryEntry {
  analysisId: string;
  timestamp: string;
  applicationType: ApplicationType;
  unifiedIntakeConfidence: number;
  intakeReadiness: IntakeReadiness;
  conflictCount: number;
  gapCount: number;
}

export interface UnifiedIntakeIntelligenceReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: UnifiedIntakeAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    averageConfidence: number;
    averageReadinessScore: number;
    readyForPlanningCount: number;
  };
}

export interface AssessUnifiedIntakeInput {
  typedPrompt?: TypedPromptInput | null;
  voiceNotesAnalysis?: VoiceNotesAnalysis | null;
  visualReferenceAnalysis?: VisualReferenceAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  uploadRecords?: readonly StoredUploadRecord[] | null;
  projectVaultContext?: ProjectVaultIntakeSnapshot | null;
  founderContext?: FounderContextSnapshot | null;
  pluggableSources?: readonly PluggableIntakeSource[] | null;
  skipHistoryRecording?: boolean;
}

export interface UnifiedIntakeAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'UNIFIED_INTAKE_INTELLIGENCE_COMPLETE' | 'UNIFIED_INTAKE_INTELLIGENCE_FAILED';
  analysis: UnifiedIntakeAnalysis | null;
  failureReason: string | null;
}
