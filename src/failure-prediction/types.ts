/** DevPulse V2 Failure Prediction — risk awareness types (read-only, rule-based). */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PredictionStatus = 'ACTIVE' | 'RESOLVED' | 'EXPIRED';

export type PredictionConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PredictionRecord {
  predictionId: string;
  createdAt: number;
  sourceSystemId: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  confidence: PredictionConfidence;
  status: PredictionStatus;
  supportingEvidenceIds: string[];
  warnings: string[];
  errors: string[];
}

export interface PredictionSummary {
  totalPredictions: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  warnings: string[];
  errors: string[];
}

export interface FailurePredictionReport {
  ownerModule: string;
  predictionCount: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  confidenceLowCount: number;
  confidenceMediumCount: number;
  confidenceHighCount: number;
  evidenceCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface FailurePredictionAuthorityState {
  ownerModule: string;
  predictionCount: number;
  warnings: string[];
  errors: string[];
}

export const PREDICTION_OWNER_MODULE = 'devpulse_v2_failure_prediction_authority';
export const PREDICTION_PASS_TOKEN = 'DEVPULSE_V2_FAILURE_PREDICTION_FOUNDATION_V1_PASS';

export const REPEATED_VALIDATION_FAILURES_TITLE = 'Repeated Validation Failures';
export const REPEATED_MISSING_UI_TITLE = 'Repeated Missing UI Elements';
export const BROWSER_VERIFICATION_WARNS_TITLE = 'Repeated Browser Verification WARNs';
