/**
 * Requirement Completeness Intelligence — foundation types (V1).
 * Read-only pre-planning completeness gate — no code generation or execution.
 */

export type CompletenessCategory = 'INSUFFICIENT' | 'PARTIAL' | 'READY_WITH_GAPS' | 'READY';

export type ProjectRequirementReadiness =
  | 'NOT_READY'
  | 'NEEDS_CLARIFICATION'
  | 'READY_WITH_GAPS'
  | 'READY_FOR_PLANNING';

export type RequirementRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnalysisDomain =
  | 'UI_REQUIREMENTS'
  | 'BUSINESS_LOGIC'
  | 'AUTHENTICATION'
  | 'DATA_MODEL'
  | 'NOTIFICATIONS'
  | 'INTEGRATIONS'
  | 'PLATFORM_TARGETS';

export type QuestionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TypedRequirementsInput {
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

export interface ProjectVaultFactSnapshot {
  readOnly: true;
  label: string;
  value: string;
  source: string;
}

export interface ProjectVaultContextSnapshot {
  readOnly: true;
  projectName: string | null;
  facts: readonly ProjectVaultFactSnapshot[];
}

export interface ConsolidatedRequirementEvidence {
  readOnly: true;
  sources: readonly string[];
  screens: readonly string[];
  userRoles: readonly string[];
  workflows: readonly string[];
  businessRules: readonly string[];
  integrations: readonly string[];
  notifications: readonly string[];
  authentication: readonly string[];
  dataEntities: readonly string[];
  platformTargets: readonly string[];
  inferredFlows: readonly string[];
  visualComponents: readonly string[];
  productType: string | null;
}

export interface DomainAnalysisResult {
  readOnly: true;
  domain: AnalysisDomain;
  score: number;
  covered: readonly string[];
  gaps: readonly string[];
  evidence: readonly string[];
}

export interface RequirementGap {
  readOnly: true;
  domain: AnalysisDomain;
  gapId: string;
  description: string;
  severity: RequirementRiskLevel;
  evidence: readonly string[];
}

export interface CompletenessClarifyingQuestion {
  readOnly: true;
  question: string;
  category: AnalysisDomain | 'SCOPE';
  priority: QuestionPriority;
  evidence: readonly string[];
}

export interface RequirementCompletenessAnalysis {
  readOnly: true;
  analysisId: string;
  analyzedAt: string;
  evidence: ConsolidatedRequirementEvidence;
  domainResults: readonly DomainAnalysisResult[];
  completenessScore: number;
  completenessCategory: CompletenessCategory;
  readinessScore: number;
  projectRequirementReadiness: ProjectRequirementReadiness;
  missingRequirements: readonly RequirementGap[];
  riskLevel: RequirementRiskLevel;
  confidenceScore: number;
  clarifyingQuestions: readonly CompletenessClarifyingQuestion[];
  safeToProceed: boolean;
}

export interface RequirementCompletenessHistoryEntry {
  analysisId: string;
  timestamp: string;
  completenessScore: number;
  readinessScore: number;
  projectRequirementReadiness: ProjectRequirementReadiness;
  riskLevel: RequirementRiskLevel;
  safeToProceed: boolean;
}

export interface RequirementCompletenessIntelligenceReport {
  readOnly: true;
  generatedAt: string;
  totalAnalyses: number;
  latestAnalysis: RequirementCompletenessAnalysis | null;
  historySummary: {
    totalAnalyses: number;
    averageCompletenessScore: number;
    averageReadinessScore: number;
    readyForPlanningCount: number;
  };
}

export interface AssessRequirementCompletenessInput {
  typedRequirements?: TypedRequirementsInput | null;
  voiceNotesAnalysis?: import('../voice-notes-intelligence/voice-notes-types.js').VoiceNotesAnalysis | null;
  visualReferenceAnalysis?: import('../visual-reference-intelligence/visual-reference-types.js').VisualReferenceAnalysis | null;
  projectVaultContext?: ProjectVaultContextSnapshot | null;
  /** Test fixture to inject partial evidence without upstream modules. */
  requirementEvidenceFixture?: Partial<ConsolidatedRequirementEvidence> | null;
  skipHistoryRecording?: boolean;
}

export interface RequirementCompletenessAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState:
    | 'REQUIREMENT_COMPLETENESS_INTELLIGENCE_COMPLETE'
    | 'REQUIREMENT_COMPLETENESS_INTELLIGENCE_FAILED';
  analysis: RequirementCompletenessAnalysis | null;
  failureReason: string | null;
}
