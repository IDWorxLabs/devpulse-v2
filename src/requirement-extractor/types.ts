/** DevPulse V2 Requirement Extractor — types. */

export type RequirementCategory =
  | 'FEATURE'
  | 'CONSTRAINT'
  | 'PLATFORM'
  | 'USER_TYPE'
  | 'RISK'
  | 'SUCCESS_CRITERIA';

export type RequirementConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RequirementRecord {
  requirementId: string;
  createdAt: number;
  category: RequirementCategory;
  value: string;
  confidence: RequirementConfidence;
  sourceRequestId: string;
  warnings: string[];
  errors: string[];
}

export interface RequirementExtractionResult {
  extractionId: string;
  requestId: string;
  requirements: RequirementRecord[];
  warnings: string[];
  errors: string[];
}

export interface RequirementExtractorState {
  extractorId: string;
  extractionCount: number;
  warnings: string[];
  errors: string[];
}

export interface RequirementSummary {
  extractionId: string;
  requestId: string;
  requirementCount: number;
  summary: string;
  publishedAt: number;
}

export interface RequirementExtractorReport {
  ownerModule: string;
  totalExtractions: number;
  requirementCount: number;
  featureCount: number;
  constraintCount: number;
  platformCount: number;
  riskCount: number;
  latestExtraction: RequirementExtractionResult | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const EXTRACTOR_OWNER_MODULE = 'devpulse_v2_requirement_extractor_authority';
export const EXTRACTOR_PASS_TOKEN = 'DEVPULSE_V2_REQUIREMENT_EXTRACTOR_FOUNDATION_V1_PASS';

export interface ExtractRequirementsInput {
  requestId: string;
  userInput: string;
}

export interface RequirementDuplicateContext {
  brainSummaries: string[];
  vaultCapabilities: string[];
}

export const DUPLICATE_RISK_PREFIX = 'DUPLICATE_RISK';
