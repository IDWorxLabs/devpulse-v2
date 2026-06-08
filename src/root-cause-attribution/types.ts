/** DevPulse V2 Root Cause Attribution — diagnostic reasoning types (read-only). */

export type AttributionConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type CauseCategory =
  | 'UI_VISIBILITY'
  | 'CLICKABILITY'
  | 'VERIFICATION'
  | 'DEPENDENCY'
  | 'CONFIGURATION'
  | 'TIMING'
  | 'UNKNOWN';

export interface AttributionRecord {
  attributionId: string;
  createdAt: number;
  title: string;
  description: string;
  category: CauseCategory;
  confidence: AttributionConfidence;
  supportingEvidenceIds: string[];
  supportingPredictionIds: string[];
  warnings: string[];
  errors: string[];
}

export interface AttributionSummary {
  attributionCount: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  warnings: string[];
  errors: string[];
}

export interface CauseCandidate {
  candidateId: string;
  category: CauseCategory;
  title: string;
  description: string;
  signalCount: number;
  supportingEvidenceIds: string[];
  supportingPredictionIds: string[];
  warnings: string[];
  errors: string[];
}

export interface RootCauseAttributionReport {
  ownerModule: string;
  attributionCount: number;
  categoryCounts: Partial<Record<CauseCategory, number>>;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  supportingEvidenceCount: number;
  supportingPredictionCount: number;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface RootCauseAttributionAuthorityState {
  ownerModule: string;
  attributionCount: number;
  candidateCount: number;
  warnings: string[];
  errors: string[];
}

export const ATTRIBUTION_OWNER_MODULE = 'devpulse_v2_root_cause_attribution_authority';
export const ATTRIBUTION_PASS_TOKEN = 'DEVPULSE_V2_ROOT_CAUSE_ATTRIBUTION_FOUNDATION_V1_PASS';

export const CLICKABILITY_ATTRIBUTION_TITLE = 'Likely Clickability Failure';
export const UI_VISIBILITY_ATTRIBUTION_TITLE = 'Likely UI Visibility Failure';
export const VERIFICATION_ATTRIBUTION_TITLE = 'Likely Verification Failure';
