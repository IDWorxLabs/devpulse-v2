/**
 * Self Documentation — types and models.
 */

export const SELF_DOCUMENTATION_PASS_TOKEN = 'SELF_DOCUMENTATION_V1_PASS';
export const SELF_DOCUMENTATION_OWNER_MODULE = 'devpulse_v2_self_documentation';
export const DEFAULT_MAX_SELF_DOCUMENTATION_HISTORY_SIZE = 128;

export type DocumentationCompletenessLevel = 'MINIMAL' | 'PARTIAL' | 'SUBSTANTIAL' | 'COMPLETE';

export type DocumentationState =
  | 'DOCUMENTED'
  | 'PARTIALLY_DOCUMENTED'
  | 'NEEDS_DOCUMENTATION'
  | 'UNKNOWN';

export interface SelfDocumentationRecord {
  documentationId: string;
  projectId: string;
  workspaceId: string;
  completenessLevel: DocumentationCompletenessLevel;
  state: DocumentationState;
  confidence: number;
  documentationCoverageScore: number;
  capabilityCoverageScore: number;
  dependencyCoverageScore: number;
  generatedAt: number;
}

export interface CapabilityDocumentationAnalysis {
  capabilityCoverageScore: number;
  undocumentedCapabilities: string[];
  capabilityDocumentationWarnings: string[];
}

export interface ModuleDocumentationAnalysis {
  moduleCoverageScore: number;
  undocumentedModules: string[];
  moduleDocumentationWarnings: string[];
}

export interface DependencyDocumentationAnalysis {
  dependencyCoverageScore: number;
  undocumentedDependencies: string[];
  dependencyWarnings: string[];
}

export interface AuthorityChainDocumentationAnalysis {
  authorityCoverageScore: number;
  undocumentedAuthorityChains: string[];
  authorityWarnings: string[];
}

export interface ValidationDocumentationAnalysis {
  validationCoverageScore: number;
  undocumentedValidators: string[];
  validationWarnings: string[];
}

export interface UnifiedSelfDocumentationAuthority {
  authorityId: string;
  documentationCoverageScore: number;
  capabilityCoverageScore: number;
  moduleCoverageScore: number;
  dependencyCoverageScore: number;
  authorityCoverageScore: number;
  validationCoverageScore: number;
  completenessLevel: DocumentationCompletenessLevel;
  state: DocumentationState;
  confidence: number;
  createdAt: number;
}

export interface SelfDocumentationEvaluation {
  documentationCoverageScore: number;
  capabilityCoverageScore: number;
  moduleCoverageScore: number;
  dependencyCoverageScore: number;
  authorityCoverageScore: number;
  validationCoverageScore: number;
  completenessLevel: DocumentationCompletenessLevel;
  state: DocumentationState;
  confidence: number;
  documentationReadiness: number;
}

export interface SelfDocumentationHistoryEntry {
  documentationId: string;
  documentationCoverageScore: number;
  state: DocumentationState;
  completenessLevel: DocumentationCompletenessLevel;
  recordedAt: number;
}

export interface SelfDocumentationReport {
  documentationCoverageScore: number;
  capabilityCoverageScore: number;
  moduleCoverageScore: number;
  dependencyCoverageScore: number;
  authorityCoverageScore: number;
  validationCoverageScore: number;
  completenessLevel: DocumentationCompletenessLevel;
  state: DocumentationState;
  confidence: number;
  undocumentedCapabilities: string[];
  undocumentedModules: string[];
  undocumentedDependencies: string[];
  undocumentedAuthorityChains: string[];
  undocumentedValidators: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: SelfDocumentationEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface SelfDocumentationInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  undocumentedCapabilityIds?: string[];
  missingCapabilityLabels?: boolean;
  missingCapabilityPhases?: boolean;
  missingCapabilityAliases?: boolean;
  undocumentedModuleDomains?: string[];
  missingModuleExports?: boolean;
  missingModulePurpose?: boolean;
  missingModuleOwnership?: boolean;
  undocumentedDependencies?: string[];
  missingAuthorityChainMapping?: boolean;
  undocumentedAuthorityChains?: string[];
  undocumentedValidators?: string[];
  missingPassTokens?: boolean;
  missingCheckpointDocs?: boolean;
  missingUvlRegistrationDocs?: boolean;
  missingStressValidationDocs?: boolean;
  governanceBlocked?: boolean;
}

export interface SelfDocumentationResult {
  record: SelfDocumentationRecord;
  report: SelfDocumentationReport;
}

export interface SelfDocumentationRuntimeReport {
  capabilityAnalysisCount: number;
  moduleAnalysisCount: number;
  dependencyAnalysisCount: number;
  authorityAnalysisCount: number;
  validationAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const SELF_DOCUMENTATION_QUESTION_SIGNALS = [
  'self documentation',
  'documentation',
  'capability documentation',
  'module documentation',
  'dependency documentation',
  'authority documentation',
  'validation documentation',
] as const;

export function isSelfDocumentationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return SELF_DOCUMENTATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveDocumentationCompletenessLevel(score: number): DocumentationCompletenessLevel {
  if (score >= 90) return 'COMPLETE';
  if (score >= 70) return 'SUBSTANTIAL';
  if (score >= 45) return 'PARTIAL';
  return 'MINIMAL';
}

export function resolveDocumentationState(
  score: number,
  blocked?: boolean,
): DocumentationState {
  if (blocked === true) return 'UNKNOWN';
  if (score >= 85) return 'DOCUMENTED';
  if (score >= 65) return 'PARTIALLY_DOCUMENTED';
  if (score >= 35) return 'NEEDS_DOCUMENTATION';
  return 'UNKNOWN';
}
