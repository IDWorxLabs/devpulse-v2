/**
 * Multi Project Verification — risk analysis.
 */

import type { ProjectVerificationEvidence, ProjectVerificationInput } from './multi-project-verification-types.js';
import { getCachedRisk, setCachedRisk } from './project-verification-cache.js';

export function calculateProjectVerificationRisk(
  input: ProjectVerificationInput,
  evidence: ProjectVerificationEvidence,
): number {
  const cached = getCachedRisk(input.projectId);
  if (cached !== undefined) return cached;

  let risk = 15;

  if (input.criticalSubsystem) risk += 20;
  if ((input.unresolvedIssues ?? 0) > 0) risk += Math.min(25, input.unresolvedIssues! * 5);
  if (input.testResultStatus === 'SIMULATED_FAIL') risk += 18;

  if ((input.trustScore ?? 70) < 40) risk += 20;
  else if ((input.trustScore ?? 70) < 60) risk += 10;

  if ((input.verificationConfidence ?? 70) < 45) risk += 12;
  if ((input.testingConfidence ?? 70) < 45) risk += 10;

  risk += evidence.missingEvidence.length * 4;

  if (input.isolationOk === false) risk += 22;
  if (input.projectState === 'FAILED') risk += 25;
  if (input.projectState === 'PAUSED') risk += 8;

  const result = Math.min(100, Math.max(0, Math.round(risk)));
  setCachedRisk(input.projectId, result);
  return result;
}
