/**
 * Autonomous Fixing — fix risk analysis.
 */

import type { FailureCategory, FixPlanInput, RepairCandidate } from './autonomous-fixing-types.js';
import type { RootCauseAnalysis } from './autonomous-fixing-types.js';

export function analyzeFixRisk(
  input: FixPlanInput,
  category: FailureCategory,
  rootCause: RootCauseAnalysis,
  repairs: RepairCandidate[],
): number {
  let risk = 20;

  if (input.criticalSubsystem) risk += 25;
  if (input.blastRadius === 'PLATFORM') risk += 30;
  else if (input.blastRadius === 'SYSTEM') risk += 20;
  else if (input.blastRadius === 'MODULE') risk += 10;

  if (input.trustScore < 40) risk += 15;
  else if (input.trustScore < 60) risk += 8;

  const verificationConfidence = input.verificationConfidence ?? 70;
  if (verificationConfidence < 50) risk += 12;

  const testingConfidence = input.testingConfidence ?? 70;
  if (testingConfidence < 50) risk += 10;

  if (category === 'WORLD2' || category === 'CLOUD' || category === 'TRUST') risk += 12;
  if (input.repeatFailures && input.repeatFailures > 2) risk += 10;

  const highImpactRepairs = repairs.filter((r) => r.estimatedImpact === 'HIGH').length;
  risk += highImpactRepairs * 8;

  if (rootCause.blastRadius === 'PLATFORM') risk += 10;

  return Math.min(100, Math.max(0, risk));
}
