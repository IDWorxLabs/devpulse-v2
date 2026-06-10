/**
 * Founder Acceptance Framework — types and models.
 * Framework only. No acceptance validation, UI mutation, or execution.
 */

export const FOUNDER_ACCEPTANCE_FRAMEWORK_PASS_TOKEN = 'FOUNDER_ACCEPTANCE_FRAMEWORK_V1_PASS';
export const FOUNDER_ACCEPTANCE_FRAMEWORK_PASS = 'FOUNDER_ACCEPTANCE_FRAMEWORK_PASS';
export const FOUNDER_ACCEPTANCE_OWNER_MODULE = 'devpulse_v2_founder_acceptance_framework';
export const DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE = 128;
export const MAX_CRITERIA_PER_GROUP = 16;
export const MAX_CATEGORIES = 12;

export const DIMENSION_REGISTRY_PASS = 'DIMENSION_REGISTRY_PASS';
export const CRITERIA_REGISTRY_PASS = 'CRITERIA_REGISTRY_PASS';
export const CATEGORY_REGISTRY_PASS = 'CATEGORY_REGISTRY_PASS';
export const EVIDENCE_MODEL_PASS = 'EVIDENCE_MODEL_PASS';
export const SCORING_MODEL_PASS = 'SCORING_MODEL_PASS';
export const REPORT_MODEL_PASS = 'REPORT_MODEL_PASS';
export const AUTHORITY_PASS = 'AUTHORITY_PASS';
export const ROADMAP_PASS = 'ROADMAP_PASS';

export type FounderAcceptanceDimensionId =
  | 'FOUNDER_CLARITY'
  | 'FOUNDER_CONFIDENCE'
  | 'FOUNDER_PRODUCTIVITY'
  | 'FOUNDER_TRUST'
  | 'FOUNDER_CONTROL'
  | 'FOUNDER_VISIBILITY'
  | 'FOUNDER_UNDERSTANDING'
  | 'FOUNDER_RELIABILITY'
  | 'FOUNDER_CONTINUITY'
  | 'FOUNDER_ACCEPTANCE';

export type CriteriaGroupId =
  | 'CLARITY_CRITERIA'
  | 'CONFIDENCE_CRITERIA'
  | 'TRUST_CRITERIA'
  | 'PRODUCTIVITY_CRITERIA'
  | 'CONTROL_CRITERIA'
  | 'RELIABILITY_CRITERIA'
  | 'UNDERSTANDING_CRITERIA'
  | 'CONTINUITY_CRITERIA'
  | 'VISIBILITY_CRITERIA';

export type AcceptanceCategoryId =
  | 'WORKFLOW_ACCEPTANCE'
  | 'TRUST_ACCEPTANCE'
  | 'PRODUCT_ACCEPTANCE'
  | 'PRODUCTIVITY_ACCEPTANCE'
  | 'RELIABILITY_ACCEPTANCE'
  | 'VISIBILITY_ACCEPTANCE'
  | 'LAUNCH_ACCEPTANCE';

export type FutureEvidenceSourceId =
  | 'PRODUCT_REALITY_VERIFICATION'
  | 'FOUNDER_WORKFLOW_VALIDATION'
  | 'FOUNDER_CONFIDENCE_ENGINE'
  | 'FOUNDER_TRUST_VALIDATION'
  | 'FOUNDER_PRODUCTIVITY_VALIDATION'
  | 'FOUNDER_FRICTION_DETECTOR'
  | 'FOUNDER_READINESS_AUTHORITY'
  | 'FUTURE_FOUNDER_REPORTS';

export type FrameworkCompleteness = 'FRAMEWORK_COMPLETE' | 'FRAMEWORK_INCOMPLETE';

export interface FounderAcceptanceDimension {
  dimensionId: FounderAcceptanceDimensionId;
  dimensionName: string;
  description: string;
  evaluationIntent: string;
  futureDependencies: string[];
}

export interface DimensionRegistry {
  dimensions: FounderAcceptanceDimension[];
  passToken: typeof DIMENSION_REGISTRY_PASS;
}

export interface AcceptanceCriterion {
  criterionId: string;
  title: string;
  description: string;
  weight: number;
  dimension: FounderAcceptanceDimensionId;
  groupId: CriteriaGroupId;
}

export interface CriteriaGroup {
  groupId: CriteriaGroupId;
  groupName: string;
  criteria: AcceptanceCriterion[];
}

export interface CriteriaRegistry {
  groups: CriteriaGroup[];
  totalCriteria: number;
  passToken: typeof CRITERIA_REGISTRY_PASS;
}

export interface FounderAcceptanceCategory {
  categoryId: AcceptanceCategoryId;
  categoryName: string;
  acceptanceCriteria: string[];
  relatedDimensions: FounderAcceptanceDimensionId[];
}

export interface CategoryRegistry {
  categories: FounderAcceptanceCategory[];
  passToken: typeof CATEGORY_REGISTRY_PASS;
}

export interface FounderAcceptanceEvidenceSlot {
  sourceId: FutureEvidenceSourceId;
  sourceName: string;
  description: string;
  evidenceTypes: string[];
  futurePhase: string;
  available: boolean;
}

export interface FounderAcceptanceEvidenceModel {
  evidenceSlots: FounderAcceptanceEvidenceSlot[];
  passToken: typeof EVIDENCE_MODEL_PASS;
}

export interface DimensionScoreSlot {
  dimensionId: FounderAcceptanceDimensionId;
  scorePlaceholder: null;
  weight: number;
}

export interface CategoryScoreSlot {
  categoryId: AcceptanceCategoryId;
  scorePlaceholder: null;
  weight: number;
}

export interface FounderAcceptanceScoreModel {
  dimensionScoreSlots: DimensionScoreSlot[];
  categoryScoreSlots: CategoryScoreSlot[];
  overallScorePlaceholder: null;
  weightingStrategy: 'DIMENSION_WEIGHTED' | 'CATEGORY_WEIGHTED' | 'BLENDED';
  supportsFutureInputs: boolean;
  passToken: typeof SCORING_MODEL_PASS;
}

export interface FounderAcceptanceReportModel {
  supportsSummary: boolean;
  supportsDimensions: boolean;
  supportsCriteria: boolean;
  supportsCategories: boolean;
  supportsEvidence: boolean;
  supportsScores: boolean;
  supportsRecommendations: boolean;
  supportsFutureVerdicts: boolean;
  futureVerdictPlaceholders: string[];
  sectionOrder: string[];
  passToken: typeof REPORT_MODEL_PASS;
}

export interface FutureIntegrationPhase {
  phaseId: string;
  phaseNumber: number;
  moduleName: string;
  integrationTarget: string;
  description: string;
}

export interface FounderAcceptanceFutureRoadmap {
  futurePhases: FutureIntegrationPhase[];
  passToken: typeof ROADMAP_PASS;
}

export interface FounderAcceptanceFrameworkAuthority {
  authorityId: string;
  dimensions: DimensionRegistry;
  criteria: CriteriaRegistry;
  categories: CategoryRegistry;
  evidenceModel: FounderAcceptanceEvidenceModel;
  scoreModel: FounderAcceptanceScoreModel;
  reportModel: FounderAcceptanceReportModel;
  futureRoadmap: FounderAcceptanceFutureRoadmap;
  frameworkVersion: string;
  createdAt: number;
  passToken: typeof AUTHORITY_PASS;
}

export interface FounderAcceptanceFramework {
  frameworkId: string;
  authority: FounderAcceptanceFrameworkAuthority;
  dimensionCount: number;
  criteriaCount: number;
  categoryCount: number;
  evidenceSlotCount: number;
  frameworkComplete: boolean;
  generatedAt: number;
}

export interface FounderAcceptanceFrameworkResult {
  resultId: string;
  frameworkCompleteness: FrameworkCompleteness;
  dimensionCount: number;
  criteriaCount: number;
  categoryCount: number;
  evidenceSlotCount: number;
  frameworkVerdict: string;
  confidence: number;
}

export interface FounderAcceptanceRecord {
  recordId: string;
  projectId: string;
  workspaceId: string;
  frameworkCompleteness: FrameworkCompleteness;
  dimensionCount: number;
  criteriaCount: number;
  confidence: number;
  generatedAt: number;
}

export interface FounderAcceptanceFrameworkInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
}

export interface FounderAcceptanceFrameworkBundle {
  framework: FounderAcceptanceFramework;
  authority: FounderAcceptanceFrameworkAuthority;
  result: FounderAcceptanceFrameworkResult;
  record: FounderAcceptanceRecord;
}

export interface FounderAcceptanceRuntimeReport {
  dimensionRegistryBuilds: number;
  criteriaRegistryBuilds: number;
  categoryBuilds: number;
  evidenceModelBuilds: number;
  scoringModelBuilds: number;
  reportModelBuilds: number;
  roadmapBuilds: number;
  authorityBuilds: number;
  frameworkBuilds: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
  sourceTextCacheHits: number;
}

export const FOUNDER_ACCEPTANCE_QUESTION_SIGNALS = [
  'founder acceptance',
  'acceptance framework',
  'founder acceptable',
  'operational acceptance',
  'founder clarity criteria',
] as const;

export function isFounderAcceptanceFrameworkQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_ACCEPTANCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function clampWeight(weight: number): number {
  return Math.max(0, Math.min(100, Math.round(weight)));
}
