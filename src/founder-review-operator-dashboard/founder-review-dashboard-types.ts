/**
 * Founder Review Operator Dashboard V1 — types.
 * Read-only visibility layer — does not perform reviews or launch decisions.
 */

import type {
  AutonomousFounderLaunchAssessment,
  FounderLaunchUserPhase,
  FounderLaunchVerdict,
  FounderReviewerRole,
} from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';

export const FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_PASS_TOKEN =
  'FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_PASS';

export const FOUNDER_REVIEW_OPERATOR_DASHBOARD_OWNER_MODULE =
  'aidevengine_founder_review_operator_dashboard';

export const MAX_FOUNDER_REVIEW_HISTORY = 25;

export type EvidenceChainStatus = 'PASS' | 'FAIL' | 'RUNNING' | 'WAITING';

export type LaunchReadinessPhaseLabel =
  | 'Building'
  | 'Testing'
  | 'Fixing Issues'
  | 'Final Launch Review'
  | 'Launch Ready'
  | 'Launch Blocked';

export type ReviewTrendDirection = 'UP' | 'DOWN' | 'STABLE' | 'UNKNOWN';

export interface EvidenceChainRow {
  id: string;
  label: string;
  status: EvidenceChainStatus;
  score: number;
  blockers: readonly string[];
  warnings: readonly string[];
}

export interface ReviewerPanelRow {
  role: FounderReviewerRole;
  title: string;
  score: number;
  findings: readonly string[];
  risks: readonly string[];
  founderConfidence?: number;
}

export interface LaunchBlockersPanel {
  criticalBlockers: readonly string[];
  warnings: readonly string[];
  recommendations: readonly string[];
}

export interface AutoFixPanel {
  autofixActive: boolean;
  queue: readonly string[];
  resolvedIssues: readonly string[];
  remainingIssues: readonly string[];
  retryCount: number;
  maxRetries: number;
  remediationPlanId: string | null;
}

export interface FounderVerdictCard {
  verdict: FounderLaunchVerdict | 'WAITING';
  founderConfidence: number;
  reasoningSummary: string;
  blocksLaunch: boolean;
  blocksLaunchReason: string | null;
}

export interface FounderReviewHistoryEntry {
  reviewId: string;
  profile: string;
  productName: string;
  generatedAt: string;
  overallScore: number;
  verdict: FounderLaunchVerdict | 'WAITING';
  userPhase: FounderLaunchUserPhase;
}

export interface FounderReviewDashboardPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: string;
  profile: string;
  productName: string;
  launchReadiness: {
    overallScore: number;
    currentPhase: LaunchReadinessPhaseLabel;
    userPhase: FounderLaunchUserPhase | 'WAITING';
    userLabel: string;
  };
  evidenceChain: readonly EvidenceChainRow[];
  reviewerPanel: readonly ReviewerPanelRow[];
  scoreBreakdown: {
    engineering: number;
    qa: number;
    ux: number;
    product: number;
    launch: number;
    founder: number;
    overall: number;
  };
  blockers: LaunchBlockersPanel;
  autoFix: AutoFixPanel;
  founderVerdict: FounderVerdictCard;
  history: readonly FounderReviewHistoryEntry[];
  trendDirection: ReviewTrendDirection;
  assessmentAvailable: boolean;
  copyReportText: string;
  sourceAssessment: Pick<
    AutonomousFounderLaunchAssessment,
    'verdict' | 'generatedAt' | 'productName' | 'contractId'
  > | null;
}
