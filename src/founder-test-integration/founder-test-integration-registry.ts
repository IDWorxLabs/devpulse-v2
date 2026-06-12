/**
 * Founder Test Integration — authority registry, weights, and thresholds.
 */

import type { FounderTestAuthorityId, FounderTestVerdict } from './founder-test-integration-types.js';

export const FOUNDER_TEST_INTEGRATION_PASS_TOKEN = 'FOUNDER_TEST_INTEGRATION_PASS';
export const FOUNDER_TEST_INTEGRATION_OWNER_MODULE = 'devpulse_founder_test_integration';
export const FOUNDER_TEST_INTEGRATION_PHASE = 'Phase 24F — One Button Founder Test Integration';
export const FOUNDER_TEST_INTEGRATION_REPORT_TITLE = 'FOUNDER_TEST_INTEGRATION_REPORT';
export const FOUNDER_TEST_CACHE_KEY_PREFIX = 'founder-test-integration-v1';
export const MAX_FOUNDER_TEST_HISTORY = 16;
export const MAX_FOUNDER_TEST_FINDINGS = 48;
export const MAX_FOUNDER_TEST_BLOCKERS = 24;
export const MAX_FOUNDER_TEST_WARNINGS = 32;
export const MAX_FOUNDER_TEST_RECOMMENDATIONS = 32;

export const FOUNDER_READY_MIN_SCORE = 85;
export const FOUNDER_READY_WITH_WARNINGS_MIN_SCORE = 70;
export const REQUIREMENT_REALITY_MIN_SCORE = 60;
export const FOUNDER_SIMULATION_PASS_MIN_SCORE = 70;
export const MAJOR_AUTHORITY_MIN_AVAILABLE = 7;

export const FOUNDER_TEST_VERDICTS: readonly FounderTestVerdict[] = [
  'FOUNDER_READY',
  'FOUNDER_READY_WITH_WARNINGS',
  'NOT_FOUNDER_READY',
  'BLOCKED',
  'INSUFFICIENT_EVIDENCE',
] as const;

export interface FounderTestAuthorityRegistration {
  authorityId: FounderTestAuthorityId;
  displayName: string;
  sourceModule: string;
  assessExport: string;
  scoreField: string;
  weight: number;
  category: string;
  major: boolean;
}

export const FOUNDER_TEST_AUTHORITY_REGISTRATIONS: readonly FounderTestAuthorityRegistration[] = [
  {
    authorityId: 'FOUNDER_REALITY',
    displayName: 'Founder Reality',
    sourceModule: 'end-to-end-founder-workflow-reality',
    assessExport: 'assessFounderWorkflowReality',
    scoreField: 'founderWorkflowRealityScore',
    weight: 15,
    category: 'WORKFLOW',
    major: true,
  },
  {
    authorityId: 'UI_REALITY',
    displayName: 'UI Reality',
    sourceModule: 'visual-quality-authority',
    assessExport: 'assessVisualQualityAuthority',
    scoreField: 'visualQualityScore',
    weight: 15,
    category: 'UI',
    major: true,
  },
  {
    authorityId: 'REQUIREMENT_REALITY',
    displayName: 'Requirement Reality',
    sourceModule: 'autonomous-builder-reality',
    assessExport: 'assessAutonomousBuilderReality',
    scoreField: 'builderRealityScore',
    weight: 15,
    category: 'REQUIREMENTS',
    major: true,
  },
  {
    authorityId: 'FOUNDER_SIMULATION',
    displayName: 'Founder Simulation',
    sourceModule: 'founder-interaction-simulation',
    assessExport: 'assessFounderInteractionSimulation',
    scoreField: 'interactionScore',
    weight: 15,
    category: 'SIMULATION',
    major: true,
  },
  {
    authorityId: 'EXECUTION_PROOF_EVOLUTION',
    displayName: 'Execution Proof Evolution',
    sourceModule: 'execution-proof-evolution',
    assessExport: 'assessExecutionProofEvolution',
    scoreField: 'executionProofScore',
    weight: 10,
    category: 'EXECUTION_PROOF',
    major: true,
  },
  {
    authorityId: 'LIVE_PREVIEW_REALITY',
    displayName: 'Live Preview Reality',
    sourceModule: 'live-preview-reality',
    assessExport: 'assessLivePreviewRealityAuthority',
    scoreField: 'livePreviewRealityScore',
    weight: 10,
    category: 'PREVIEW',
    major: true,
  },
  {
    authorityId: 'MOBILE_RUNTIME_REALITY',
    displayName: 'Mobile Runtime Reality',
    sourceModule: 'mobile-runtime-experience-reality',
    assessExport: 'assessMobileRuntimeExperienceReality',
    scoreField: 'mobileRuntimeExperienceScore',
    weight: 5,
    category: 'MOBILE',
    major: false,
  },
  {
    authorityId: 'VERIFICATION_REALITY',
    displayName: 'Verification Reality',
    sourceModule: 'verification-reality',
    assessExport: 'assessVerificationReality',
    scoreField: 'verificationRealityScore',
    weight: 10,
    category: 'VERIFICATION',
    major: true,
  },
  {
    authorityId: 'LAUNCH_COUNCIL',
    displayName: 'Launch Council',
    sourceModule: 'launch-council',
    assessExport: 'assessLaunchCouncil',
    scoreField: 'overallScore',
    weight: 5,
    category: 'LAUNCH',
    major: false,
  },
] as const;

export function getFounderTestAuthorityWeight(authorityId: FounderTestAuthorityId): number {
  return FOUNDER_TEST_AUTHORITY_REGISTRATIONS.find((entry) => entry.authorityId === authorityId)?.weight ?? 0;
}

export function listMajorFounderTestAuthorities(): FounderTestAuthorityRegistration[] {
  return FOUNDER_TEST_AUTHORITY_REGISTRATIONS.filter((entry) => entry.major);
}

export function normalizeAuthorityScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function isFounderTestVerdict(value: string): value is FounderTestVerdict {
  return (FOUNDER_TEST_VERDICTS as readonly string[]).includes(value);
}
