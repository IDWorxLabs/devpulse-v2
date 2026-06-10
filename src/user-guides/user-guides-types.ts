/**
 * User Guides — types and models.
 */

export const USER_GUIDES_PASS_TOKEN = 'USER_GUIDES_V1_PASS';
export const USER_GUIDES_OWNER_MODULE = 'devpulse_v2_user_guides';
export const DEFAULT_MAX_USER_GUIDES_HISTORY_SIZE = 128;

export type UserGuideCompletenessLevel = 'MINIMAL' | 'PARTIAL' | 'SUBSTANTIAL' | 'COMPLETE';

export type UserGuideState =
  | 'READY'
  | 'PARTIAL'
  | 'INCOMPLETE'
  | 'UNKNOWN';

export interface UserGuideRecord {
  guideId: string;
  projectId: string;
  workspaceId: string;
  completenessLevel: UserGuideCompletenessLevel;
  state: UserGuideState;
  confidence: number;
  userCoverageScore: number;
  onboardingCoverageScore: number;
  workflowCoverageScore: number;
  generatedAt: number;
}

export interface OnboardingGuideAnalysis {
  onboardingCoverageScore: number;
  undocumentedOnboardingAreas: string[];
  onboardingWarnings: string[];
}

export interface WorkflowGuideAnalysis {
  workflowCoverageScore: number;
  undocumentedWorkflows: string[];
  workflowWarnings: string[];
}

export interface FeatureDiscoveryGuideAnalysis {
  featureCoverageScore: number;
  undocumentedFeatures: string[];
  featureWarnings: string[];
}

export interface SafetyGuideAnalysis {
  safetyCoverageScore: number;
  undocumentedSafetyAreas: string[];
  safetyWarnings: string[];
}

export interface ResultsInterpretationGuideAnalysis {
  interpretationCoverageScore: number;
  undocumentedResultAreas: string[];
  interpretationWarnings: string[];
}

export interface UnifiedUserGuidesAuthority {
  authorityId: string;
  userCoverageScore: number;
  onboardingCoverageScore: number;
  workflowCoverageScore: number;
  featureCoverageScore: number;
  safetyCoverageScore: number;
  interpretationCoverageScore: number;
  completenessLevel: UserGuideCompletenessLevel;
  state: UserGuideState;
  confidence: number;
  createdAt: number;
}

export interface UserGuidesEvaluation {
  userCoverageScore: number;
  onboardingCoverageScore: number;
  workflowCoverageScore: number;
  featureCoverageScore: number;
  safetyCoverageScore: number;
  interpretationCoverageScore: number;
  completenessLevel: UserGuideCompletenessLevel;
  state: UserGuideState;
  confidence: number;
  guideReadiness: number;
}

export interface UserGuidesHistoryEntry {
  guideId: string;
  userCoverageScore: number;
  state: UserGuideState;
  completenessLevel: UserGuideCompletenessLevel;
  recordedAt: number;
}

export interface UserGuidesReport {
  userCoverageScore: number;
  onboardingCoverageScore: number;
  workflowCoverageScore: number;
  featureCoverageScore: number;
  safetyCoverageScore: number;
  interpretationCoverageScore: number;
  completenessLevel: UserGuideCompletenessLevel;
  state: UserGuideState;
  confidence: number;
  onboardingGuidance: string[];
  workflowGuidance: string[];
  featureGuidance: string[];
  safetyGuidance: string[];
  interpretationGuidance: string[];
  undocumentedAreas: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: UserGuidesEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface UserGuidesInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  undocumentedOnboardingAreas?: string[];
  missingFirstLaunchGuidance?: boolean;
  missingProjectCreationGuidance?: boolean;
  missingChatGuidance?: boolean;
  missingNavigationGuidance?: boolean;
  missingNotificationGuidance?: boolean;
  missingVerificationGuidance?: boolean;
  missingReportGuidance?: boolean;
  missingMobileUsageGuidance?: boolean;
  undocumentedWorkflows?: string[];
  missingProjectManagementWorkflow?: boolean;
  missingWorld2WorkflowGuidance?: boolean;
  missingMonitoringWorkflowGuidance?: boolean;
  missingTrustWorkflowGuidance?: boolean;
  undocumentedFeatures?: string[];
  missingCapabilityDiscoveryGuidance?: boolean;
  missingFindPanelGuidance?: boolean;
  missingMobileFeatureGuidance?: boolean;
  missingCloudFeatureGuidance?: boolean;
  undocumentedSafetyAreas?: string[];
  missingSafeUsageGuidance?: boolean;
  missingTrustAwarenessGuidance?: boolean;
  missingPrivacyAwarenessGuidance?: boolean;
  missingSecurityAwarenessGuidance?: boolean;
  missingMobileControlAwareness?: boolean;
  undocumentedResultAreas?: string[];
  missingTrustScoreInterpretation?: boolean;
  missingVerificationResultInterpretation?: boolean;
  missingHardeningScoreInterpretation?: boolean;
  missingCheckpointInterpretation?: boolean;
  governanceBlocked?: boolean;
}

export interface UserGuidesResult {
  record: UserGuideRecord;
  report: UserGuidesReport;
}

export interface UserGuidesRuntimeReport {
  onboardingAnalysisCount: number;
  workflowAnalysisCount: number;
  featureAnalysisCount: number;
  safetyAnalysisCount: number;
  interpretationAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const USER_GUIDES_QUESTION_SIGNALS = [
  'user guides',
  'user documentation',
  'onboarding guide',
  'workflow guide',
  'safety guide',
  'feature guide',
  'results guide',
] as const;

export function isUserGuidesQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return USER_GUIDES_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveUserGuideCompletenessLevel(score: number): UserGuideCompletenessLevel {
  if (score >= 90) return 'COMPLETE';
  if (score >= 70) return 'SUBSTANTIAL';
  if (score >= 45) return 'PARTIAL';
  return 'MINIMAL';
}

export function resolveUserGuideState(score: number, blocked?: boolean): UserGuideState {
  if (blocked === true) return 'UNKNOWN';
  if (score >= 85) return 'READY';
  if (score >= 65) return 'PARTIAL';
  if (score >= 35) return 'INCOMPLETE';
  return 'UNKNOWN';
}
