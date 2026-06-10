/**
 * Autonomous Fixing — root cause analysis.
 */

import type { FailureCategory, FixPlanInput, RootCauseAnalysis } from './autonomous-fixing-types.js';

const CATEGORY_CAUSES: Record<FailureCategory, string[]> = {
  ROUTING: ['missing route registration', 'canonical mismatch', 'duplicate route'],
  TRUST: ['trust threshold violation', 'confidence collapse', 'recovery requirement'],
  WORLD2: ['workspace isolation issue', 'autonomous boundary violation'],
  CLOUD: ['cloud runtime contract mismatch', 'worker endpoint safety gap'],
  VERIFICATION: ['verification plan mismatch', 'integration readiness gap'],
  TEST: ['failing test suite', 'insufficient coverage'],
  TYPECHECK: ['type boundary violation', 'missing type export'],
  BUILD: ['build strategy inconsistency', 'plan corruption'],
  BRAIN: ['capability routing mismatch', 'context need gap'],
  RUNTIME: ['startup safety violation', 'runtime contract breach'],
  UNKNOWN: ['insufficient failure context', 'ambiguous subsystem signal'],
};

export function analyzeRootCause(
  input: FixPlanInput,
  category: FailureCategory,
): RootCauseAnalysis {
  const probableCauses = [...(CATEGORY_CAUSES[category] ?? CATEGORY_CAUSES.UNKNOWN)];

  if (input.failureSignals.length > 0) {
    probableCauses.unshift(`signal: ${input.failureSignals[0]}`);
  }

  let confidence = 50;
  confidence += Math.min(25, input.failureSignals.length * 8);
  if (category !== 'UNKNOWN') confidence += 15;
  if (input.repeatFailures && input.repeatFailures > 2) confidence += 10;
  confidence = Math.min(95, confidence);

  const affectedSystems = [
    ...(input.subsystemTouched ?? []),
    category.toLowerCase(),
  ];

  const blastRadius = input.blastRadius ?? (input.criticalSubsystem ? 'PLATFORM' : 'MODULE');

  return {
    probableCauses: probableCauses.slice(0, 5),
    confidence,
    affectedSystems: [...new Set(affectedSystems)],
    blastRadius,
  };
}
