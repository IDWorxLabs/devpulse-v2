/**
 * Verification Reality — analyzer level types (Phase 24A.3).
 */

export type VerificationInventoryLevel = 'VERIFICATION_CLAIMED' | 'VERIFICATION_OBSERVED' | 'VERIFICATION_PROVEN';

export type RuntimeLinkLevel = 'RUNTIME_LINK_MISSING' | 'RUNTIME_LINK_PARTIAL' | 'RUNTIME_LINK_PROVEN';

export type BuildOutputLinkLevel =
  | 'BUILD_OUTPUT_LINK_MISSING'
  | 'BUILD_OUTPUT_LINK_PARTIAL'
  | 'BUILD_OUTPUT_LINK_PROVEN';

export type PreviewLinkLevel = 'PREVIEW_LINK_MISSING' | 'PREVIEW_LINK_PARTIAL' | 'PREVIEW_LINK_PROVEN';

export type EvidenceChainLevel = 'EVIDENCE_CHAIN_MISSING' | 'EVIDENCE_CHAIN_PARTIAL' | 'EVIDENCE_CHAIN_PROVEN';

export type VerificationEvidenceLevel = 'CLAIMED' | 'OBSERVED' | 'PROVEN';

export type EvidenceChainBreakPoint =
  | 'REQUIREMENT'
  | 'PLAN'
  | 'BUILD'
  | 'RUNTIME'
  | 'PREVIEW'
  | 'VERIFICATION'
  | 'NONE';
