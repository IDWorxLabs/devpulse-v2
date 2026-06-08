/** DevPulse V2 Intent Architecture — types. */

export type IntentType =
  | 'QUESTION'
  | 'BUILD_REQUEST'
  | 'ANALYSIS_REQUEST'
  | 'PROJECT_REQUEST'
  | 'INFORMATION_REQUEST'
  | 'UNKNOWN';

export type IntentConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface IntentRecord {
  intentId: string;
  createdAt: number;
  rawInput: string;
  normalizedInput: string;
  intentType: IntentType;
  confidence: IntentConfidence;
  extractedGoals: string[];
  extractedConstraints: string[];
  warnings: string[];
  errors: string[];
}

export interface IntentArchitectureState {
  architectureId: string;
  intentCount: number;
  warnings: string[];
  errors: string[];
}

export interface IntentSummary {
  intentId: string;
  intentType: IntentType;
  confidence: IntentConfidence;
  summary: string;
  publishedAt: number;
}

export interface IntentArchitectureReport {
  ownerModule: string;
  totalIntents: number;
  intentTypeCounts: Partial<Record<IntentType, number>>;
  latestIntent: IntentRecord | null;
  confidenceSummary: string;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const INTENT_OWNER_MODULE = 'devpulse_v2_intent_architecture_authority';
export const INTENT_PASS_TOKEN = 'DEVPULSE_V2_INTENT_ARCHITECTURE_FOUNDATION_V1_PASS';
