/**
 * Privacy Hardening — types and models.
 */

export const PRIVACY_HARDENING_PASS_TOKEN = 'PRIVACY_HARDENING_V1_PASS';
export const PRIVACY_HARDENING_OWNER_MODULE = 'devpulse_v2_privacy_hardening';
export const DEFAULT_MAX_PRIVACY_HARDENING_HISTORY_SIZE = 128;

export type PrivacyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PrivacyState =
  | 'PRIVATE'
  | 'ACCEPTABLE'
  | 'WATCH'
  | 'EXPOSED'
  | 'UNSAFE'
  | 'BLOCKED';

export interface PrivacyHardeningRecord {
  privacyId: string;
  projectId: string;
  workspaceId: string;
  riskLevel: PrivacyRiskLevel;
  state: PrivacyState;
  confidence: number;
  privacyScore: number;
  dataBoundaryScore: number;
  retentionScore: number;
  disclosureRiskScore: number;
  generatedAt: number;
}

export type PersonalDataSurfaceType =
  | 'user_prompts'
  | 'uploaded_files'
  | 'project_descriptions'
  | 'project_source_code'
  | 'logs'
  | 'reports'
  | 'notifications'
  | 'operator_feed_entries'
  | 'mobile_command_messages'
  | 'cloud_execution_metadata'
  | 'future_account_profile'
  | 'future_billing_package'
  | 'future_organization_team';

export interface PersonalDataSurfaceAnalysis {
  personalDataSurfaceScore: number;
  personalDataSurfaces: PersonalDataSurfaceType[];
  surfaceWarnings: string[];
  missingSignals: string[];
}

export interface ProjectDataBoundaryAnalysis {
  dataBoundaryScore: number;
  dataBoundaryRiskLevel: PrivacyRiskLevel;
  dataBoundaryWarnings: string[];
  dataBoundaryGaps: string[];
}

export interface RetentionRiskAnalysis {
  retentionScore: number;
  retentionRiskLevel: PrivacyRiskLevel;
  retentionWarnings: string[];
  retentionGaps: string[];
}

export type DisclosureChannelType =
  | 'uvl_reports'
  | 'validation_reports'
  | 'operator_feed'
  | 'notification_vault'
  | 'copied_reports'
  | 'exported_projects'
  | 'screenshots'
  | 'mobile_notifications'
  | 'logs'
  | 'error_messages'
  | 'debugging_output'
  | 'launch_demo_workflows'
  | 'support_debug_bundles';

export interface RedactedDisclosureFinding {
  channel: DisclosureChannelType;
  dataType: string;
  redactedPreview: string;
  severity: PrivacyRiskLevel;
  recommendation: string;
}

export interface DisclosureRiskAnalysis {
  disclosureRiskScore: number;
  disclosureRiskLevel: PrivacyRiskLevel;
  disclosureWarnings: string[];
  redactedDisclosureFindings: RedactedDisclosureFinding[];
}

export interface RedactionReadinessAnalysis {
  redactionReadinessScore: number;
  redactionGaps: string[];
  redactionWarnings: string[];
}

export interface ComplianceReadinessAnalysis {
  complianceReadinessScore: number;
  complianceGaps: string[];
  recommendedFutureDisclosures: string[];
}

export interface UnifiedPrivacyHardeningAuthority {
  authorityId: string;
  privacyScore: number;
  dataBoundaryScore: number;
  retentionScore: number;
  disclosureRiskScore: number;
  riskLevel: PrivacyRiskLevel;
  state: PrivacyState;
  confidence: number;
  createdAt: number;
}

export interface PrivacyHardeningEvaluation {
  privacyScore: number;
  dataBoundaryScore: number;
  retentionScore: number;
  disclosureRiskScore: number;
  state: PrivacyState;
  riskLevel: PrivacyRiskLevel;
  confidence: number;
  hardeningReadiness: number;
}

export interface PrivacyHardeningHistoryEntry {
  privacyId: string;
  privacyScore: number;
  state: PrivacyState;
  riskLevel: PrivacyRiskLevel;
  recordedAt: number;
}

export interface PrivacyHardeningReport {
  privacyScore: number;
  dataBoundaryScore: number;
  retentionScore: number;
  disclosureRiskScore: number;
  riskLevel: PrivacyRiskLevel;
  state: PrivacyState;
  confidence: number;
  personalDataSurfaces: PersonalDataSurfaceType[];
  dataBoundaryGaps: string[];
  retentionGaps: string[];
  disclosureWarnings: string[];
  redactionGaps: string[];
  complianceReadinessGaps: string[];
  redactedFindings: RedactedDisclosureFinding[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: PrivacyHardeningEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface PrivacyHardeningInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  scanContent?: string[];
  scanPaths?: string[];
  userPromptSurfaceRisk?: boolean;
  uploadedFileSurfaceRisk?: boolean;
  projectDescriptionSurfaceRisk?: boolean;
  projectSourceCodeSurfaceRisk?: boolean;
  logSurfaceRisk?: boolean;
  reportSurfaceRisk?: boolean;
  notificationSurfaceRisk?: boolean;
  operatorFeedSurfaceRisk?: boolean;
  mobileCommandSurfaceRisk?: boolean;
  cloudMetadataSurfaceRisk?: boolean;
  futureAccountProfileSurfaceRisk?: boolean;
  futureBillingPackageSurfaceRisk?: boolean;
  futureOrganizationSurfaceRisk?: boolean;
  projectOwnershipBoundaryWeak?: boolean;
  workspaceBoundaryWeak?: boolean;
  generatedProjectBoundaryWeak?: boolean;
  importedProjectBoundaryWeak?: boolean;
  exportedProjectBoundaryWeak?: boolean;
  world1World2DataSeparationWeak?: boolean;
  disposableWorkspaceSeparationWeak?: boolean;
  cloudWorkerDataBoundaryWeak?: boolean;
  mobileCommandDataBoundaryWeak?: boolean;
  futureTenantDataBoundaryMissing?: boolean;
  futureOrganizationBoundaryMissing?: boolean;
  promptRetentionRisk?: boolean;
  reportRetentionRisk?: boolean;
  logRetentionRisk?: boolean;
  notificationRetentionRisk?: boolean;
  operatorFeedRetentionRisk?: boolean;
  validationOutputRetentionRisk?: boolean;
  uploadedFileRetentionRisk?: boolean;
  generatedArtifactRetentionRisk?: boolean;
  cloudMetadataRetentionRisk?: boolean;
  mobileCommandHistoryRetentionRisk?: boolean;
  futureAccountDataRetentionRisk?: boolean;
  futureBillingDataRetentionRisk?: boolean;
  uvlReportDisclosureRisk?: boolean;
  validationReportDisclosureRisk?: boolean;
  operatorFeedDisclosureRisk?: boolean;
  notificationVaultDisclosureRisk?: boolean;
  copiedReportDisclosureRisk?: boolean;
  exportedProjectDisclosureRisk?: boolean;
  screenshotDisclosureRisk?: boolean;
  mobileNotificationDisclosureRisk?: boolean;
  logDisclosureRisk?: boolean;
  errorMessageDisclosureRisk?: boolean;
  debugOutputDisclosureRisk?: boolean;
  launchDemoDisclosureRisk?: boolean;
  supportBundleDisclosureRisk?: boolean;
  missingSecretRedaction?: boolean;
  missingPersonalDataRedaction?: boolean;
  missingPromptRedaction?: boolean;
  missingReportRedaction?: boolean;
  missingLogRedaction?: boolean;
  missingNotificationRedaction?: boolean;
  missingCopiedReportRedaction?: boolean;
  missingScreenshotRedaction?: boolean;
  missingSupportBundleRedaction?: boolean;
  missingMobileNotificationRedaction?: boolean;
  missingPrivacyPolicyReadiness?: boolean;
  missingDataCollectionDisclosure?: boolean;
  missingAppStorePrivacyLabels?: boolean;
  missingPlayStoreDataSafety?: boolean;
  missingAccountDeletionWorkflow?: boolean;
  missingDataExportWorkflow?: boolean;
  missingDataDeletionWorkflow?: boolean;
  missingUserConsentModel?: boolean;
  missingAnalyticsDisclosure?: boolean;
  missingCrashReportingDisclosure?: boolean;
  missingAiUsageDisclosure?: boolean;
  missingCloudProcessingDisclosure?: boolean;
  missingBillingPaymentDisclosure?: boolean;
  reliabilityScore?: number;
  performanceScore?: number;
  securityScore?: number;
  trustScore?: number;
  governanceBlocked?: boolean;
}

export interface PrivacyHardeningResult {
  record: PrivacyHardeningRecord;
  report: PrivacyHardeningReport;
}

export interface PrivacyHardeningRuntimeReport {
  personalDataSurfaceAnalysisCount: number;
  dataBoundaryAnalysisCount: number;
  retentionAnalysisCount: number;
  disclosureAnalysisCount: number;
  redactionReadinessAnalysisCount: number;
  complianceReadinessAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const PRIVACY_HARDENING_QUESTION_SIGNALS = [
  'privacy hardening',
  'privacy',
  'personal data',
  'data boundaries',
  'retention risk',
  'disclosure risk',
  'redaction readiness',
  'compliance readiness',
] as const;

export function isPrivacyHardeningQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return PRIVACY_HARDENING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolvePrivacyRiskLevel(score: number): PrivacyRiskLevel {
  if (score >= 81) return 'LOW';
  if (score >= 61) return 'MEDIUM';
  if (score >= 31) return 'HIGH';
  return 'CRITICAL';
}

export function resolvePrivacyState(score: number, blocked?: boolean): PrivacyState {
  if (blocked === true) return 'BLOCKED';
  if (score >= 90) return 'PRIVATE';
  if (score >= 75) return 'ACCEPTABLE';
  if (score >= 60) return 'WATCH';
  if (score >= 45) return 'EXPOSED';
  if (score >= 25) return 'UNSAFE';
  return 'BLOCKED';
}

export function redactPrivateData(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '****';
  return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
}
