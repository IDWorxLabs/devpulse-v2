/**
 * Architecture Documentation — types and models.
 */

export const ARCHITECTURE_DOCUMENTATION_PASS_TOKEN = 'ARCHITECTURE_DOCUMENTATION_V1_PASS';
export const ARCHITECTURE_DOCUMENTATION_OWNER_MODULE = 'devpulse_v2_architecture_documentation';
export const DEFAULT_MAX_ARCHITECTURE_DOCUMENTATION_HISTORY_SIZE = 128;

export type ArchitectureCoverageLevel = 'MINIMAL' | 'PARTIAL' | 'SUBSTANTIAL' | 'COMPLETE';

export type ArchitectureDocumentationState =
  | 'DOCUMENTED'
  | 'PARTIALLY_DOCUMENTED'
  | 'NEEDS_DOCUMENTATION'
  | 'UNKNOWN';

export interface ArchitectureDocumentationRecord {
  documentationId: string;
  projectId: string;
  workspaceId: string;
  coverageLevel: ArchitectureCoverageLevel;
  state: ArchitectureDocumentationState;
  confidence: number;
  architectureCoverageScore: number;
  dependencyCoverageScore: number;
  integrationCoverageScore: number;
  generatedAt: number;
}

export interface DomainArchitectureAnalysis {
  domainCoverageScore: number;
  undocumentedDomains: string[];
  domainWarnings: string[];
}

export interface DependencyGraphAnalysis {
  dependencyCoverageScore: number;
  undocumentedDependencies: string[];
  dependencyWarnings: string[];
}

export interface IntegrationPointAnalysis {
  integrationCoverageScore: number;
  undocumentedIntegrations: string[];
  integrationWarnings: string[];
}

export interface ArchitectureBoundaryAnalysis {
  boundaryCoverageScore: number;
  undocumentedBoundaries: string[];
  boundaryWarnings: string[];
}

export interface AuthorityChainArchitectureAnalysis {
  authorityCoverageScore: number;
  undocumentedAuthorityChains: string[];
  authorityWarnings: string[];
}

export interface UnifiedArchitectureDocumentationAuthority {
  authorityId: string;
  architectureCoverageScore: number;
  dependencyCoverageScore: number;
  integrationCoverageScore: number;
  boundaryCoverageScore: number;
  authorityCoverageScore: number;
  coverageLevel: ArchitectureCoverageLevel;
  state: ArchitectureDocumentationState;
  confidence: number;
  createdAt: number;
}

export interface ArchitectureDocumentationEvaluation {
  architectureCoverageScore: number;
  dependencyCoverageScore: number;
  integrationCoverageScore: number;
  boundaryCoverageScore: number;
  authorityCoverageScore: number;
  coverageLevel: ArchitectureCoverageLevel;
  state: ArchitectureDocumentationState;
  confidence: number;
  documentationReadiness: number;
}

export interface ArchitectureDocumentationHistoryEntry {
  documentationId: string;
  architectureCoverageScore: number;
  state: ArchitectureDocumentationState;
  coverageLevel: ArchitectureCoverageLevel;
  recordedAt: number;
}

export interface ArchitectureDocumentationReport {
  architectureCoverageScore: number;
  dependencyCoverageScore: number;
  integrationCoverageScore: number;
  boundaryCoverageScore: number;
  authorityCoverageScore: number;
  coverageLevel: ArchitectureCoverageLevel;
  state: ArchitectureDocumentationState;
  confidence: number;
  domainCoverage: string[];
  dependencyCoverage: string[];
  integrationCoverage: string[];
  boundaryCoverage: string[];
  authorityCoverage: string[];
  undocumentedDomains: string[];
  undocumentedDependencies: string[];
  undocumentedIntegrations: string[];
  undocumentedBoundaries: string[];
  undocumentedAuthorityChains: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: ArchitectureDocumentationEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ArchitectureDocumentationInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  undocumentedDomains?: string[];
  missingFoundationDomainGuidance?: boolean;
  missingOwnershipDomainGuidance?: boolean;
  missingCapabilityDomainGuidance?: boolean;
  missingPhaseDomainGuidance?: boolean;
  missingDocumentationDomainGuidance?: boolean;
  undocumentedDependencies?: string[];
  missingModuleDependencyGuidance?: boolean;
  missingCapabilityDependencyGuidance?: boolean;
  missingAuthorityChainDependencyGuidance?: boolean;
  missingValidationDependencyGuidance?: boolean;
  missingCheckpointDependencyGuidance?: boolean;
  undocumentedIntegrations?: string[];
  missingRegistryIntegrationGuidance?: boolean;
  missingUvlIntegrationGuidance?: boolean;
  missingValidationIntegrationGuidance?: boolean;
  missingGovernanceIntegrationGuidance?: boolean;
  missingWorld2IntegrationGuidance?: boolean;
  missingMobileIntegrationGuidance?: boolean;
  missingCloudIntegrationGuidance?: boolean;
  undocumentedBoundaries?: string[];
  missingReadOnlyBoundaryGuidance?: boolean;
  missingExecutionBoundaryGuidance?: boolean;
  missingGovernanceBoundaryGuidance?: boolean;
  missingTrustBoundaryGuidance?: boolean;
  missingWorld1BoundaryGuidance?: boolean;
  missingWorld2BoundaryGuidance?: boolean;
  missingCloudBoundaryGuidance?: boolean;
  missingMobileBoundaryGuidance?: boolean;
  undocumentedAuthorityChains?: string[];
  missingTrustEngineChainGuidance?: boolean;
  missingProductHardeningChainGuidance?: boolean;
  missingDocumentationChainGuidance?: boolean;
  missingGovernanceChainGuidance?: boolean;
  missingVerificationChainGuidance?: boolean;
  missingWorld2ChainGuidance?: boolean;
  governanceBlocked?: boolean;
}

export interface ArchitectureDocumentationResult {
  record: ArchitectureDocumentationRecord;
  report: ArchitectureDocumentationReport;
}

export interface ArchitectureDocumentationRuntimeReport {
  domainAnalysisCount: number;
  dependencyAnalysisCount: number;
  integrationAnalysisCount: number;
  boundaryAnalysisCount: number;
  authorityAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const ARCHITECTURE_DOCUMENTATION_QUESTION_SIGNALS = [
  'architecture documentation',
  'architecture',
  'domain architecture',
  'dependency graph',
  'integration points',
  'architecture boundaries',
  'authority architecture',
] as const;

export function isArchitectureDocumentationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return ARCHITECTURE_DOCUMENTATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveArchitectureCoverageLevel(score: number): ArchitectureCoverageLevel {
  if (score >= 90) return 'COMPLETE';
  if (score >= 70) return 'SUBSTANTIAL';
  if (score >= 45) return 'PARTIAL';
  return 'MINIMAL';
}

export function resolveArchitectureDocumentationState(
  score: number,
  blocked?: boolean,
): ArchitectureDocumentationState {
  if (blocked === true) return 'UNKNOWN';
  if (score >= 85) return 'DOCUMENTED';
  if (score >= 65) return 'PARTIALLY_DOCUMENTED';
  if (score >= 35) return 'NEEDS_DOCUMENTATION';
  return 'UNKNOWN';
}
