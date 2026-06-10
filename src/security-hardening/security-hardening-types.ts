/**
 * Security Hardening — types and models.
 */

export const SECURITY_HARDENING_PASS_TOKEN = 'SECURITY_HARDENING_V1_PASS';
export const SECURITY_HARDENING_OWNER_MODULE = 'devpulse_v2_security_hardening';
export const DEFAULT_MAX_SECURITY_HARDENING_HISTORY_SIZE = 128;

export type SecurityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityState =
  | 'SECURE'
  | 'ACCEPTABLE'
  | 'WATCH'
  | 'EXPOSED'
  | 'UNSAFE'
  | 'BLOCKED';

export interface SecurityHardeningRecord {
  securityId: string;
  projectId: string;
  workspaceId: string;
  riskLevel: SecurityRiskLevel;
  state: SecurityState;
  confidence: number;
  securityScore: number;
  boundaryScore: number;
  isolationScore: number;
  exposureScore: number;
  generatedAt: number;
}

export interface SecurityBoundaryAnalysis {
  boundaryScore: number;
  boundaryRiskLevel: SecurityRiskLevel;
  boundaryWarnings: string[];
  missingBoundaries: string[];
}

export type SecretExposureType =
  | 'api_key'
  | 'token'
  | 'private_key'
  | 'access_secret'
  | 'signing_secret'
  | 'cloud_credential'
  | 'webhook_secret'
  | 'database_url'
  | 'payment_secret'
  | 'mobile_signing_credential';

export interface RedactedExposureFinding {
  filePath: string;
  riskType: SecretExposureType;
  redactedPreview: string;
  severity: SecurityRiskLevel;
  recommendation: string;
}

export interface SecretExposureAnalysis {
  exposureScore: number;
  exposureRiskLevel: SecurityRiskLevel;
  exposureWarnings: string[];
  redactedFindings: RedactedExposureFinding[];
}

export type UnsafeCapabilityType =
  | 'file_modification'
  | 'project_mutation'
  | 'workspace_mutation'
  | 'build_execution'
  | 'deployment'
  | 'cloud_execution'
  | 'autonomous_fix'
  | 'autonomous_completion'
  | 'world2_execution'
  | 'mobile_command_execution'
  | 'billing_package_changes'
  | 'user_account_mutation'
  | 'external_network_operations';

export interface UnsafeCapabilityDetection {
  unsafeCapabilities: UnsafeCapabilityType[];
  unsafeCapabilityScore: number;
  gatingWarnings: string[];
}

export interface AccessControlReadinessAnalysis {
  accessControlReadinessScore: number;
  accessControlGaps: string[];
  recommendedFutureControls: string[];
}

export interface WorkspaceIsolationAnalysis {
  isolationScore: number;
  isolationRiskLevel: SecurityRiskLevel;
  isolationWarnings: string[];
  isolationGaps: string[];
}

export interface UnifiedSecurityHardeningAuthority {
  authorityId: string;
  securityScore: number;
  boundaryScore: number;
  isolationScore: number;
  exposureScore: number;
  riskLevel: SecurityRiskLevel;
  state: SecurityState;
  confidence: number;
  createdAt: number;
}

export interface SecurityHardeningEvaluation {
  securityScore: number;
  boundaryScore: number;
  isolationScore: number;
  exposureScore: number;
  state: SecurityState;
  riskLevel: SecurityRiskLevel;
  confidence: number;
  hardeningReadiness: number;
}

export interface SecurityHardeningHistoryEntry {
  securityId: string;
  securityScore: number;
  state: SecurityState;
  riskLevel: SecurityRiskLevel;
  recordedAt: number;
}

export interface SecurityHardeningReport {
  securityScore: number;
  boundaryScore: number;
  isolationScore: number;
  exposureScore: number;
  riskLevel: SecurityRiskLevel;
  state: SecurityState;
  confidence: number;
  unsafeCapabilities: UnsafeCapabilityType[];
  boundaryWarnings: string[];
  isolationWarnings: string[];
  redactedExposureFindings: RedactedExposureFinding[];
  accessControlGaps: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: SecurityHardeningEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface SecurityHardeningInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  founderApprovalBoundaryWeak?: boolean;
  governanceBoundaryWeak?: boolean;
  executionBoundaryWeak?: boolean;
  verificationBoundaryWeak?: boolean;
  deploymentBoundaryWeak?: boolean;
  cloudControlBoundaryWeak?: boolean;
  world2IsolationBoundaryWeak?: boolean;
  mobileCommandBoundaryWeak?: boolean;
  projectWorkspaceBoundaryWeak?: boolean;
  futureUserAccountBoundaryMissing?: boolean;
  futurePackagePlanBoundaryMissing?: boolean;
  secretScanContent?: string[];
  secretScanPaths?: string[];
  unsafeFileModification?: boolean;
  unsafeProjectMutation?: boolean;
  unsafeWorkspaceMutation?: boolean;
  unsafeBuildExecution?: boolean;
  unsafeDeployment?: boolean;
  unsafeCloudExecution?: boolean;
  unsafeAutonomousFix?: boolean;
  unsafeAutonomousCompletion?: boolean;
  unsafeWorld2Execution?: boolean;
  unsafeMobileCommandExecution?: boolean;
  unsafeBillingPackageChanges?: boolean;
  unsafeUserAccountMutation?: boolean;
  unsafeExternalNetwork?: boolean;
  missingUserIdentityBoundary?: boolean;
  missingFounderIdentityBoundary?: boolean;
  missingRoleBoundary?: boolean;
  missingPermissionModel?: boolean;
  missingPackageEntitlementModel?: boolean;
  missingCloudUsageQuota?: boolean;
  missingOrganizationBoundary?: boolean;
  missingProjectOwnershipBoundary?: boolean;
  missingWorkspaceIsolationBoundary?: boolean;
  missingAuditTrailBoundary?: boolean;
  stableDisposableWorkspaceMixRisk?: boolean;
  world1World2SeparationWeak?: boolean;
  founderAutonomousModeMixRisk?: boolean;
  projectOwnershipBoundaryWeak?: boolean;
  cloudWorkerBoundaryWeak?: boolean;
  generatedProjectBoundaryWeak?: boolean;
  rollbackBoundaryWeak?: boolean;
  filesystemMutationBoundaryWeak?: boolean;
  futureUserTenantBoundaryMissing?: boolean;
  reliabilityScore?: number;
  performanceScore?: number;
  trustScore?: number;
  governanceBlocked?: boolean;
}

export interface SecurityHardeningResult {
  record: SecurityHardeningRecord;
  report: SecurityHardeningReport;
}

export interface SecurityHardeningRuntimeReport {
  boundaryAnalysisCount: number;
  exposureAnalysisCount: number;
  unsafeCapabilityDetectionCount: number;
  accessControlAnalysisCount: number;
  isolationAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const SECURITY_HARDENING_QUESTION_SIGNALS = [
  'security hardening',
  'security',
  'security boundaries',
  'secret exposure',
  'unsafe capabilities',
  'workspace isolation',
  'access control readiness',
] as const;

export function isSecurityHardeningQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return SECURITY_HARDENING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveSecurityRiskLevel(score: number): SecurityRiskLevel {
  if (score >= 81) return 'LOW';
  if (score >= 61) return 'MEDIUM';
  if (score >= 31) return 'HIGH';
  return 'CRITICAL';
}

export function resolveSecurityState(score: number, blocked?: boolean): SecurityState {
  if (blocked === true) return 'BLOCKED';
  if (score >= 90) return 'SECURE';
  if (score >= 75) return 'ACCEPTABLE';
  if (score >= 60) return 'WATCH';
  if (score >= 45) return 'EXPOSED';
  if (score >= 25) return 'UNSAFE';
  return 'BLOCKED';
}

export function redactSecretValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '****';
  return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
}
