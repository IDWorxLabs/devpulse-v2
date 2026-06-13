/**
 * Launch Claim vs Reality Analyzer — prevent launch readiness inflation.
 */

import type {
  AutonomousBuildExecutionProofReport,
  StageExecutionProof,
} from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import type {
  ClaimRealityAssessment,
  ClaimRealityViolation,
  LaunchReadinessFixture,
} from './connected-launch-readiness-proof-types.js';

export function analyzeLaunchClaimReality(input: {
  executionProof: AutonomousBuildExecutionProofReport | null;
  coreStageProofs?: StageExecutionProof[];
  verificationProof: VerificationExecutionProofReport | null;
  coreChainConnected?: boolean;
  fixture?: LaunchReadinessFixture;
}): ClaimRealityAssessment {
  const violations: ClaimRealityViolation[] = [
    ...(input.fixture?.forceClaimViolations ?? []),
  ];

  const chainConnected =
    input.executionProof?.chainConnected ?? input.coreChainConnected ?? false;
  const firstBroken =
    input.executionProof?.firstBrokenStage ?? null;

  if (input.executionProof && !chainConnected) {
    violations.push({
      readOnly: true,
      violationId: 'claim-launch-ready-chain-broken',
      severity: 'CRITICAL',
      claim: 'Launch-ready with connected idea-to-launch proof',
      reality: `Execution chain broken at ${firstBroken ?? 'unknown'}`,
      sourceAuthority: 'connected-launch-readiness-proof',
    });
  } else if (input.coreChainConnected === false) {
    violations.push({
      readOnly: true,
      violationId: 'claim-launch-ready-chain-broken',
      severity: 'CRITICAL',
      claim: 'Launch-ready with connected idea-to-launch proof',
      reality: 'Core execution chain not connected through VERIFY',
      sourceAuthority: 'connected-launch-readiness-proof',
    });
  }

  const stageProofs = input.executionProof?.stageProofs ?? input.coreStageProofs ?? [];
  const buildStage = stageProofs.find((s) => s.stage === 'BUILD');
  if (buildStage?.proofLevel === 'PROVEN' && buildStage.sourceAuthority !== 'connected-build-execution') {
    violations.push({
      readOnly: true,
      violationId: 'claim-build-without-materialization',
      severity: 'HIGH',
      claim: 'Autonomous build proven',
      reality: 'BUILD stage not backed by materialization authority',
      sourceAuthority: 'connected-launch-readiness-proof',
    });
  }

  if (
    input.verificationProof &&
    input.verificationProof.verificationProofLevel === 'NOT_PROVEN' &&
    input.verificationProof.readiness.readinessState !== 'VERIFICATION_NOT_RUN'
  ) {
    violations.push({
      readOnly: true,
      violationId: 'claim-verification-complete',
      severity: 'CRITICAL',
      claim: 'Verification complete',
      reality: 'Verification execution not proven with evidence',
      sourceAuthority: 'connected-verification-execution-proof',
    });
  }

  const criticalViolations = violations.filter((v) => v.severity === 'CRITICAL').length;
  const score = Math.max(0, 100 - violations.length * 15 - criticalViolations * 20);

  return {
    readOnly: true,
    violations,
    criticalViolations,
    score,
  };
}

export function hasCriticalClaimViolations(assessment: ClaimRealityAssessment): boolean {
  return assessment.criticalViolations > 0;
}
