/**
 * Verification Results Visibility — founder-facing test report model.
 */

export const VERIFICATION_RESULTS_VISIBILITY_PASS_TOKEN = 'VERIFICATION_RESULTS_VISIBILITY_PASS';
export const VERIFICATION_RESULTS_VISIBILITY_OWNER_MODULE = 'aidevengine_verification_results_visibility';

export type VerificationResultsState =
  | 'NO_VERIFICATION_RUN'
  | 'VERIFICATION_RUNNING'
  | 'VERIFICATION_PARTIAL'
  | 'VERIFICATION_BLOCKED'
  | 'VERIFICATION_FAILED'
  | 'VERIFICATION_WARNINGS'
  | 'VERIFICATION_READY'
  | 'VERIFICATION_LAUNCH_READY';

export type VerificationCheckStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'WARNING' | 'NOT_RUN';

export type FixPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationCategory =
  | 'Preview'
  | 'Running Application'
  | 'Project Memory'
  | 'Command Center'
  | 'Verification'
  | 'Build Output'
  | 'UX / Navigation'
  | 'Launch Readiness';

export interface VerificationBlockers {
  testing: boolean;
  demo: boolean;
  beta: boolean;
  launch: boolean;
}

export interface VerificationCheckResult {
  category: VerificationCategory;
  checkName: string;
  status: VerificationCheckStatus;
  meaning: string;
  evidence: string;
  recommendedAction: string;
  priority: FixPriority;
  blocks: VerificationBlockers;
}

export interface VerificationCategoryGroup {
  category: VerificationCategory;
  checks: VerificationCheckResult[];
  passCount: number;
  failCount: number;
  blockedCount: number;
  warningCount: number;
}

export interface VerificationFixItem {
  title: string;
  priority: FixPriority;
  blocksLabel: string;
  recommendedAction: string;
  evidence: string;
}

export interface VerificationResultsSummary {
  overallVerdict: string;
  readinessScore: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  warningCount: number;
  notRunCount: number;
  lastRunLabel: string | null;
  lastRunTimestamp: number | null;
}

export interface VerificationFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
  evidence?: string;
}

export interface VerificationResultsVisibilityAssessment {
  state: VerificationResultsState;
  stateLabel: string;
  summary: VerificationResultsSummary;
  categories: VerificationCategoryGroup[];
  fixesNext: VerificationFixItem[];
  betaReady: boolean;
  launchReady: boolean;
  reviewReady: boolean;
  betaReadyReason: string;
  launchReadyReason: string;
  operatorFeedEvents: VerificationFeedEvent[];
  stateExplicit: boolean;
  countsVisible: boolean;
  categoriesGrouped: boolean;
  evidencePresent: boolean;
  nextActionVisible: boolean;
  readinessExplained: boolean;
  optimisticReadiness: boolean;
}
