/**
 * Phase 26.3.1 — Identity foundation types (product memory, not user memory).
 */

export const IDENTITY_FOUNDATION_VERSION = '26.3.1';

export interface LegacyProductIdentity {
  readOnly: true;
  previousName: string;
  currentName: string;
  reason: string;
}

export interface IdentityProfile {
  readOnly: true;
  version: string;
  name: string;
  description: string;
  purpose: string;
  role: string;
  createdBy: string;
  company: string;
  productFamily: string;
  mission: string;
  currentMaturity: string;
  knownStrengths: string[];
  knownLimitations: string[];
  legacyIdentity: LegacyProductIdentity;
}

export interface IdentityFoundationSnapshot {
  readOnly: true;
  profile: IdentityProfile;
  loadedAt: number;
}
