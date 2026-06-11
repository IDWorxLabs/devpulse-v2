/**
 * Change Intelligence Visibility — founder-facing project evolution model.
 */

export const CHANGE_INTELLIGENCE_VISIBILITY_PASS_TOKEN = 'CHANGE_INTELLIGENCE_VISIBILITY_PASS';
export const CHANGE_INTELLIGENCE_VISIBILITY_OWNER_MODULE = 'aidevengine_change_intelligence_visibility';

export type ChangeCategory =
  | 'Project Changes'
  | 'Build Changes'
  | 'Verification Changes'
  | 'Readiness Changes'
  | 'Risk Changes';

export type ChangeSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ChangeDirection = 'IMPROVED' | 'REGRESSED' | 'NEW' | 'UNCHANGED';

export interface ChangeIntelligenceSnapshot {
  capturedAt: number;
  label: string;
  previewState: string;
  runningAppState: string;
  verificationState: string;
  readinessScore: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  warningCount: number;
  betaReady: boolean;
  launchReady: boolean;
  projectFactCount: number;
  projectCount: number;
  launchReadinessScore: number;
  topRiskCount: number;
}

export interface ChangeEvent {
  category: ChangeCategory;
  title: string;
  description: string;
  severity: ChangeSeverity;
  direction: ChangeDirection;
  evidence: string;
  occurredAt: number;
  reviewPriority: number;
}

export interface ChangeTimelineEntry {
  timeLabel: string;
  occurredAt: number;
  summary: string;
  direction: ChangeDirection;
  evidence: string;
}

export interface ChangeImpactSummary {
  improvementCount: number;
  regressionCount: number;
  newCount: number;
  informationalCount: number;
  unchangedCount: number;
}

export interface ChangeFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
  evidence?: string;
}

export interface ChangeIntelligenceVisibilityAssessment {
  hasSufficientHistory: boolean;
  historyCount: number;
  insufficientHistoryReason: string | null;
  recentChanges: ChangeEvent[];
  regressions: ChangeEvent[];
  improvements: ChangeEvent[];
  impactSummary: ChangeImpactSummary;
  recommendedReviewOrder: string[];
  timeline: ChangeTimelineEntry[];
  readinessMovementExplanation: string | null;
  scoreMovementExplanation: string | null;
  operatorFeedEvents: ChangeFeedEvent[];
  historyExists: boolean;
  improvementsVisible: boolean;
  regressionsVisible: boolean;
  readinessExplained: boolean;
  scoreExplained: boolean;
  timelineUnderstandable: boolean;
  recommendationsPrioritized: boolean;
}
