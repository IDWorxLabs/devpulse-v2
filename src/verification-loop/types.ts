/** DevPulse V2 Verification Loop — types. */

export type VerificationStatus = 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED' | 'CONFLICT';

export type VerificationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface VerificationReview {
  verificationId: string;
  createdAt: number;
  subject: string;
  status: VerificationStatus;
  evidenceIds: string[];
  confidence: VerificationConfidence;
  findings: string[];
  warnings: string[];
  errors: string[];
}

export interface VerificationLoopState {
  loopId: string;
  reviewCount: number;
  warnings: string[];
  errors: string[];
}

export interface VerificationSummary {
  verificationId: string;
  subject: string;
  status: VerificationStatus;
  confidence: VerificationConfidence;
  summary: string;
  publishedAt: number;
}

export interface EvidenceVerificationSummary {
  evidenceId: string;
  valid: boolean;
  status: string;
  summary: string;
}

export interface QualityVerificationSummary {
  reviewId: string;
  verified: boolean;
  status: VerificationStatus;
  summary: string;
}

export interface VerificationLoopReport {
  ownerModule: string;
  totalReviews: number;
  verifiedCount: number;
  partialCount: number;
  unverifiedCount: number;
  conflictCount: number;
  latestVerification: VerificationReview | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export const LOOP_OWNER_MODULE = 'devpulse_v2_verification_loop_authority';
export const LOOP_PASS_TOKEN = 'DEVPULSE_V2_VERIFICATION_LOOP_FOUNDATION_V1_PASS';

export interface VerifyClaimInput {
  subject: string;
  evidenceIds: string[];
}

export interface EvidenceLinkResult {
  evidenceId: string;
  valid: boolean;
  status: string;
  reason: string;
}

export interface VerifySubjectResult {
  valid: boolean;
  subject: string;
  reason: string;
}
