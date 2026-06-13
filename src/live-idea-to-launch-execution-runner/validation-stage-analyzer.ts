/**
 * VALIDATION stage analyzer — UVL, verification, launch council, founder testing.
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { FounderTestLaunchReadinessReport } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import { STAGE_CONFIRM_THRESHOLD, STAGE_PARTIAL_THRESHOLD } from './live-idea-to-launch-execution-runner-registry.js';
import type {
  StageAnalysis,
  StageEvidenceEntry,
  StageEvidenceLevel,
} from './live-idea-to-launch-execution-runner-types.js';

function entry(
  label: string,
  detail: string,
  present: boolean,
  sourceAuthority: string,
): StageEvidenceEntry {
  return { readOnly: true, label, detail, present, sourceAuthority };
}

export function analyzeValidationStage(input: {
  verificationProof: VerificationExecutionProofReport | null;
  executionProof: AutonomousBuildExecutionProofReport | null;
  founderTest: FounderTestAssessment | null;
  launchReadiness: FounderTestLaunchReadinessReport | null;
  buildConfirmed: boolean;
}): StageAnalysis {
  const evidence: StageEvidenceEntry[] = [];
  const missingEvidence: string[] = [];
  const weakEvidence: string[] = [];
  const sources: string[] = [];
  let score = 0;

  if (!input.buildConfirmed) {
    missingEvidence.push('BUILD stage not confirmed — validation cannot be proven');
  }

  if (input.verificationProof) {
    sources.push('connected-verification-execution-proof');
    evidence.push(
      entry(
        'Verification proof level',
        input.verificationProof.verificationProofLevel,
        input.verificationProof.verificationProofLevel === 'PROVEN',
        'connected-verification-execution-proof',
      ),
      entry(
        'Verification run observed',
        String(input.verificationProof.run.runObserved),
        input.verificationProof.run.runObserved,
        'connected-verification-execution-proof',
      ),
      entry(
        'Verification evidence',
        input.verificationProof.evidence.evidenceState,
        input.verificationProof.evidence.evidenceObserved,
        'connected-verification-execution-proof',
      ),
      entry(
        'Verification linkage',
        String(input.verificationProof.linkage.verificationLinkageConnected),
        input.verificationProof.linkage.verificationLinkageConnected,
        'connected-verification-execution-proof',
      ),
    );
    if (input.verificationProof.verificationProofLevel === 'PROVEN') score += 45;
    else if (input.verificationProof.verificationProofLevel === 'PARTIAL') score += 25;
    else missingEvidence.push('Verification execution not proven');
    missingEvidence.push(...input.verificationProof.missingEvidence.slice(0, 3));
  } else {
    missingEvidence.push('Connected verification execution proof not assessed');
  }

  const verifyStage = input.executionProof?.stageProofs.find((s) => s.stage === 'VERIFY');
  if (verifyStage) {
    sources.push('autonomous-build-execution-proof');
    evidence.push(
      entry('Execution proof VERIFY stage', verifyStage.proofLevel, verifyStage.proofLevel === 'PROVEN', 'autonomous-build-execution-proof'),
    );
    if (verifyStage.proofLevel === 'PROVEN') score = Math.max(score, 90);
  }

  if (input.founderTest) {
    sources.push('founder-test-integration');
    const verify = input.founderTest.run.authorityResults.find((r) => r.authorityId === 'VERIFICATION_REALITY');
    evidence.push(
      entry(
        'Verification Reality authority',
        verify?.available ? `${verify.normalizedScore}/100` : 'unavailable',
        verify?.available ?? false,
        'founder-test-integration',
      ),
    );
    if (verify?.available && verify.normalizedScore >= STAGE_PARTIAL_THRESHOLD) score += 15;
  }

  if (input.launchReadiness) {
    sources.push('founder-test-launch-readiness');
    evidence.push(
      entry(
        'Launch Council summary',
        input.launchReadiness.launchCouncilSummary.slice(0, 80),
        input.launchReadiness.launchCouncilSummary.length > 0,
        'launch-council',
      ),
    );
    if (input.launchReadiness.topBlockers.length === 0) score += 10;
    else weakEvidence.push(`${input.launchReadiness.topBlockers.length} launch blocker(s) from founder test`);
  }

  score = Math.min(100, score);
  let evidenceLevel: StageEvidenceLevel = 'MISSING';
  if (!input.buildConfirmed) evidenceLevel = 'BLOCKED';
  else if (score >= STAGE_CONFIRM_THRESHOLD) evidenceLevel = 'CONFIRMED';
  else if (score >= STAGE_PARTIAL_THRESHOLD) evidenceLevel = 'PARTIAL';

  const confirmed =
    evidenceLevel === 'CONFIRMED' &&
    input.verificationProof?.verificationProofLevel === 'PROVEN' &&
    input.verificationProof.linkage.verificationLinkageConnected === true;

  return {
    readOnly: true,
    stage: 'VALIDATION',
    evidenceLevel,
    confirmed,
    score,
    sourceAuthorities: [...new Set(sources)],
    evidence,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 8),
    weakEvidence: [...new Set(weakEvidence)].slice(0, 6),
    recommendedFix: confirmed
      ? 'Validation confirmed — proceed to runtime activation proof.'
      : 'Run connected verification execution with evidence before runtime claims.',
  };
}
