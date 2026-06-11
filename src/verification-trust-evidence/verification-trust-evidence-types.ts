/**
 * Verification Trust & Evidence Clarity — types.
 */

import type { VerificationResultsVisibilityAssessment } from '../verification-results-visibility/verification-results-visibility-types.js';

export type VerificationTrustStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL' | 'NOT_RUN';

export type VerificationTrustConfidence = 'High' | 'Medium' | 'Low';

export interface VerificationTrustSummary {
  status: VerificationTrustStatus;
  statusExplanation: string;
  confidence: VerificationTrustConfidence;
  confidenceExplanation: string;
  timestampLabel: string | null;
  durationLabel: string | null;
  checksExecuted: number;
  checksPassed: number;
  checksFailed: number;
  checksSkipped: number;
}

export interface VerificationTrustFinding {
  id: string;
  area: string;
  whatWasChecked: string;
  evidenceFound: string;
  whyPassed: string | null;
  whyFailed: string | null;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'WARNING' | 'NOT_RUN';
}

export interface VerificationTrustScenarioResult {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
}

export interface VerificationTrustEvidenceAssessment {
  trustScore: number;
  summary: VerificationTrustSummary;
  majorFindings: VerificationTrustFinding[];
  scopeChecked: string[];
  scopeNotChecked: string[];
  founderGuidance: string[];
  scenarios: VerificationTrustScenarioResult[];
  strengths: string[];
  weaknesses: string[];
  trustPass: boolean;
  evidenceClarityPass: boolean;
  scopeClarityPass: boolean;
  nextStepsPass: boolean;
  explainabilityPass: boolean;
  blackBoxRisk: boolean;
}

export interface VerificationTrustShellSources {
  appJs: string;
  html: string;
}

export interface AssessVerificationTrustEvidenceInput {
  verificationResults: VerificationResultsVisibilityAssessment;
  shellSources: VerificationTrustShellSources;
  durationMs?: number | null;
}

export interface VerificationTrustEvidenceVisibility {
  score: number;
  trustScore: number;
  trustPass: boolean;
  evidenceClarityPass: boolean;
  scopeClarityPass: boolean;
  nextStepsPass: boolean;
  explainabilityPass: boolean;
  blackBoxDetected: boolean;
  scenarioPassCount: number;
  findingCount: number;
}
