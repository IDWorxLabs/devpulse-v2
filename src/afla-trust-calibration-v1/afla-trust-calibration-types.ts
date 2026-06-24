/**
 * AFLA Trust Calibration V1 — types.
 */

import type {
  AutonomousFounderLaunchAssessment,
  FounderLaunchVerdict,
  LaunchDecisionExplainability,
} from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';

export interface VerdictStabilityReport {
  readOnly: true;
  runCount: number;
  verdicts: readonly FounderLaunchVerdict[];
  scores: readonly number[];
  founderConfidences: readonly number[];
  verdictStable: boolean;
  scoreVariance: number;
  confidenceVariance: number;
  scoreStable: boolean;
  confidenceStable: boolean;
  stabilityFlags: readonly string[];
}

export interface FalsePositiveFinding {
  readOnly: true;
  findingId: string;
  summary: string;
  evidenceSource: string;
  severity: 'CRITICAL' | 'HIGH';
}

export interface FalseNegativeFinding {
  readOnly: true;
  findingId: string;
  summary: string;
  evidenceSignal: string;
}

export interface ConfidenceCalibrationReport {
  readOnly: true;
  founderConfidence: number;
  evidenceQualityScore: number;
  verificationConfidence: number;
  confidenceGap: number;
  inflated: boolean;
  tooConservative: boolean;
  aligned: boolean;
}

export interface ReviewerAlignmentReport {
  readOnly: true;
  scores: Readonly<Record<string, number>>;
  minScore: number;
  maxScore: number;
  divergence: number;
  extremeDisagreement: boolean;
  divergenceExplanation: string | null;
}

export interface AflaTrustCalibrationHistoryEntry {
  readOnly: true;
  runId: string;
  profile: string;
  productName: string;
  aflaTrustScore: number;
  verdictQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  falsePositiveCount: number;
  falseNegativeCount: number;
  timestamp: string;
}

export interface AflaTrustCalibrationAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Autonomous Founder Launch Authority';
  profile: string;
  productName: string;
  productPrompt: string;
  aflaTrustScore: number;
  falsePositiveCount: number;
  falseNegativeCount: number;
  falsePositives: readonly FalsePositiveFinding[];
  falseNegatives: readonly FalseNegativeFinding[];
  verdictStability: VerdictStabilityReport;
  confidenceCalibration: ConfidenceCalibrationReport;
  reviewerAlignment: ReviewerAlignmentReport;
  launchDecisionExplainability: LaunchDecisionExplainability;
  assessment: AutonomousFounderLaunchAssessment;
  generatedAt: string;
}

export interface AssessAflaTrustCalibrationInput {
  profile?: string;
  productPrompt?: string;
  assessment?: AutonomousFounderLaunchAssessment;
}
