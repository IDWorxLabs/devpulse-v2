/**
 * Launch Manifest Analyzer — verify launch readiness traces through full chain.
 */

import type { AutonomousBuildExecutionProofReport, StageExecutionProof } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import type { LaunchManifestAssessment } from './connected-launch-readiness-proof-types.js';

export function analyzeLaunchManifest(input: {
  executionProof: AutonomousBuildExecutionProofReport | null;
  coreStageProofs?: StageExecutionProof[];
  verificationProof: VerificationExecutionProofReport | null;
  launchAssessmentId: string;
}): LaunchManifestAssessment {
  const stageProofs = input.executionProof?.stageProofs ?? input.coreStageProofs ?? [];
  const verificationRunId = input.verificationProof?.run.runId ?? null;
  const coreProven = stageProofs
    .filter((s) =>
      ['REQUIREMENTS', 'PLAN', 'BUILD', 'RUNTIME', 'PREVIEW', 'VERIFY'].includes(s.stage),
    )
    .every((s) => s.proofLevel === 'PROVEN');

  const executionLinkedFinal = coreProven;
  const verificationLinked = input.verificationProof?.verificationProofLevel === 'PROVEN';
  const launchLinked = Boolean(input.launchAssessmentId);

  const manifestExists = executionLinkedFinal && verificationLinked && launchLinked;
  const checks = [executionLinkedFinal, verificationLinked, launchLinked];
  const traceabilityScore = Math.round((checks.filter(Boolean).length / 3) * 100);

  return {
    readOnly: true,
    manifestExists,
    executionLinked: executionLinkedFinal,
    verificationLinked,
    launchLinked,
    traceabilityScore,
    launchAssessmentId: input.launchAssessmentId,
    verificationRunId,
  };
}
