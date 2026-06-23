/**
 * Launch Blocker Board V1 — founder-facing launch readiness classification.
 * Read-only aggregation; no new scoring engines or repair authorities.
 */

import type { FounderTestLaunchReadinessReport } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { FounderSimulationDegradationRootCauseAssessment } from '../founder-simulation-degradation-root-cause-repair/founder-simulation-degradation-root-cause-types.js';

export type LaunchBlockerBucket =
  | 'REAL_PRODUCT_GAP'
  | 'CLAIM_WORDING_GAP'
  | 'UI_UX_GAP'
  | 'FOUNDER_TEST_NOISE';

export type LaunchBlockerSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type LaunchBlockerDisposition = 'KEEP' | 'DEFER' | 'IGNORE';

export type LaunchBlockerLaunchImpact = 'BLOCKS_LAUNCH' | 'DELAYS_LAUNCH' | 'TRUST_RISK' | 'NONE';

export interface LaunchBlockerBoardEntry {
  readOnly: true;
  blockerId: string;
  blockerName: string;
  bucket: LaunchBlockerBucket;
  severity: LaunchBlockerSeverity;
  userImpact: string;
  fixRequired: string;
  launchImpact: LaunchBlockerLaunchImpact;
  disposition: LaunchBlockerDisposition;
  sourceAuthority: string;
  rank: number;
}

export interface LaunchBlockerBoardReport {
  readOnly: true;
  advisoryOnly: true;
  boardId: string;
  generatedAt: string;
  runId: string;
  coreQuestion: string;
  strategyResetRule: string;
  launchReadinessVerdict: string;
  founderReadinessScore: number;
  bucketCounts: Record<LaunchBlockerBucket, number>;
  topLaunchBlockers: LaunchBlockerBoardEntry[];
  allBlockers: LaunchBlockerBoardEntry[];
  productGapCount: number;
  testingNoiseCount: number;
  passToken: string | null;
}

export interface LaunchBlockerBoardAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'LAUNCH_BLOCKER_BOARD_COMPLETE';
  report: LaunchBlockerBoardReport;
}

export interface BuildLaunchBlockerBoardInput {
  launchReadiness: FounderTestLaunchReadinessReport;
  runId?: string;
  simulationElapsedMs?: number | null;
  simulationDegraded?: boolean;
  simulationDiagnosticMarkdown?: string | null;
  degradationAssessment?: FounderSimulationDegradationRootCauseAssessment | null;
  unifiedLaunchBlockers?: readonly string[];
  skipHistoryRecording?: boolean;
}

export interface LaunchBlockerBoardArtifacts {
  launchBlockerBoardAssessment: LaunchBlockerBoardAssessment;
  launchBlockerBoardReportMarkdown: string;
}
