/** DevPulse V2 Trust Engine — types. */

export type TrustStatus = 'PASS' | 'WARN' | 'FAIL';

export type TrustConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type TrustEvidenceSource =
  | 'BROWSER_VERIFICATION'
  | 'CHAT_AUTHORITY'
  | 'INLINE_OPERATOR_FEED'
  | 'SHELL_AUTHORITY'
  | 'TASK_GOVERNOR'
  | 'FOUNDATION_ENFORCEMENT';

export interface TrustCheck {
  checkId: string;
  name: string;
  status: TrustStatus;
  reason: string;
  evidenceIds: string[];
}

export interface TrustEvidence {
  evidenceId: string;
  source: TrustEvidenceSource;
  summary: string;
  capturedAt: number;
}

export interface TrustResult {
  trustId: string;
  createdAt: number;
  status: TrustStatus;
  trustScore: number;
  confidence: TrustConfidence;
  checks: TrustCheck[];
  evidence: TrustEvidence[];
  warnings: string[];
  errors: string[];
}

export interface TrustEngineReport {
  trustId: string;
  trustScore: number;
  confidence: TrustConfidence;
  passCount: number;
  warnCount: number;
  failCount: number;
  evidenceCount: number;
  highestRisk: string;
  recommendation: string;
  summary: string;
}

export const TRUST_OWNER_MODULE = 'devpulse_v2_trust_engine_authority';
export const TRUST_PASS_TOKEN = 'DEVPULSE_V2_TRUST_ENGINE_FOUNDATION_V1_PASS';

export const TRUST_CHECK_COUNT = 10;
