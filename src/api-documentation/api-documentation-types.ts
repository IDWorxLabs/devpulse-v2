/**
 * API Documentation — types and models.
 */

export const API_DOCUMENTATION_PASS_TOKEN = 'API_DOCUMENTATION_V1_PASS';
export const API_DOCUMENTATION_OWNER_MODULE = 'devpulse_v2_api_documentation';
export const DEFAULT_MAX_API_DOCUMENTATION_HISTORY_SIZE = 128;

export type ApiCoverageLevel = 'MINIMAL' | 'PARTIAL' | 'SUBSTANTIAL' | 'COMPLETE';

export type ApiDocumentationState =
  | 'DOCUMENTED'
  | 'PARTIALLY_DOCUMENTED'
  | 'NEEDS_DOCUMENTATION'
  | 'UNKNOWN';

export interface ApiDocumentationRecord {
  documentationId: string;
  projectId: string;
  workspaceId: string;
  coverageLevel: ApiCoverageLevel;
  state: ApiDocumentationState;
  confidence: number;
  apiCoverageScore: number;
  interfaceCoverageScore: number;
  integrationCoverageScore: number;
  generatedAt: number;
}

export interface ApiSurfaceAnalysis {
  apiCoverageScore: number;
  undocumentedApis: string[];
  apiWarnings: string[];
}

export interface InterfaceDocumentationAnalysis {
  interfaceCoverageScore: number;
  undocumentedInterfaces: string[];
  interfaceWarnings: string[];
}

export interface ContractDocumentationAnalysis {
  contractCoverageScore: number;
  undocumentedContracts: string[];
  contractWarnings: string[];
}

export interface IntegrationApiAnalysis {
  integrationCoverageScore: number;
  undocumentedIntegrations: string[];
  integrationWarnings: string[];
}

export interface CommandSurfaceAnalysis {
  commandCoverageScore: number;
  undocumentedCommands: string[];
  commandWarnings: string[];
}

export interface UnifiedApiDocumentationAuthority {
  authorityId: string;
  apiCoverageScore: number;
  interfaceCoverageScore: number;
  contractCoverageScore: number;
  integrationCoverageScore: number;
  commandCoverageScore: number;
  coverageLevel: ApiCoverageLevel;
  state: ApiDocumentationState;
  confidence: number;
  createdAt: number;
}

export interface ApiDocumentationEvaluation {
  apiCoverageScore: number;
  interfaceCoverageScore: number;
  contractCoverageScore: number;
  integrationCoverageScore: number;
  commandCoverageScore: number;
  coverageLevel: ApiCoverageLevel;
  state: ApiDocumentationState;
  confidence: number;
  documentationReadiness: number;
}

export interface ApiDocumentationHistoryEntry {
  documentationId: string;
  apiCoverageScore: number;
  state: ApiDocumentationState;
  coverageLevel: ApiCoverageLevel;
  recordedAt: number;
}

export interface ApiDocumentationReport {
  apiCoverageScore: number;
  interfaceCoverageScore: number;
  contractCoverageScore: number;
  integrationCoverageScore: number;
  commandCoverageScore: number;
  coverageLevel: ApiCoverageLevel;
  state: ApiDocumentationState;
  confidence: number;
  apiCoverage: string[];
  interfaceCoverage: string[];
  contractCoverage: string[];
  integrationCoverage: string[];
  commandCoverage: string[];
  undocumentedApis: string[];
  undocumentedInterfaces: string[];
  undocumentedContracts: string[];
  undocumentedIntegrations: string[];
  undocumentedCommands: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: ApiDocumentationEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ApiDocumentationInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  undocumentedApis?: string[];
  missingPublicApiGuidance?: boolean;
  missingInternalApiGuidance?: boolean;
  missingServiceApiGuidance?: boolean;
  missingOrchestrationApiGuidance?: boolean;
  missingVerificationApiGuidance?: boolean;
  missingGovernanceApiGuidance?: boolean;
  missingDocumentationApiGuidance?: boolean;
  undocumentedInterfaces?: string[];
  missingPublicInterfaceGuidance?: boolean;
  missingModuleInterfaceGuidance?: boolean;
  missingServiceInterfaceGuidance?: boolean;
  missingAuthorityInterfaceGuidance?: boolean;
  missingValidationInterfaceGuidance?: boolean;
  undocumentedContracts?: string[];
  missingInputContractGuidance?: boolean;
  missingOutputContractGuidance?: boolean;
  missingTypeContractGuidance?: boolean;
  missingAuthorityContractGuidance?: boolean;
  missingValidationContractGuidance?: boolean;
  undocumentedIntegrations?: string[];
  missingRegistryIntegrationGuidance?: boolean;
  missingUvlIntegrationGuidance?: boolean;
  missingGovernanceIntegrationGuidance?: boolean;
  missingWorld2IntegrationGuidance?: boolean;
  missingMobileIntegrationGuidance?: boolean;
  missingCloudIntegrationGuidance?: boolean;
  missingNotificationIntegrationGuidance?: boolean;
  undocumentedCommands?: string[];
  missingValidationCommandGuidance?: boolean;
  missingOrchestrationCommandGuidance?: boolean;
  missingReportingCommandGuidance?: boolean;
  missingGovernanceCommandGuidance?: boolean;
  missingDocumentationCommandGuidance?: boolean;
  governanceBlocked?: boolean;
}

export interface ApiDocumentationResult {
  record: ApiDocumentationRecord;
  report: ApiDocumentationReport;
}

export interface ApiDocumentationRuntimeReport {
  apiSurfaceAnalysisCount: number;
  interfaceAnalysisCount: number;
  contractAnalysisCount: number;
  integrationAnalysisCount: number;
  commandAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const API_DOCUMENTATION_QUESTION_SIGNALS = [
  'api documentation',
  'api docs',
  'api surface',
  'interface documentation',
  'contract documentation',
  'integration apis',
  'command documentation',
] as const;

export function isApiDocumentationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return API_DOCUMENTATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveApiCoverageLevel(score: number): ApiCoverageLevel {
  if (score >= 90) return 'COMPLETE';
  if (score >= 70) return 'SUBSTANTIAL';
  if (score >= 45) return 'PARTIAL';
  return 'MINIMAL';
}

export function resolveApiDocumentationState(score: number, blocked?: boolean): ApiDocumentationState {
  if (blocked === true) return 'UNKNOWN';
  if (score >= 85) return 'DOCUMENTED';
  if (score >= 65) return 'PARTIALLY_DOCUMENTED';
  if (score >= 35) return 'NEEDS_DOCUMENTATION';
  return 'UNKNOWN';
}
