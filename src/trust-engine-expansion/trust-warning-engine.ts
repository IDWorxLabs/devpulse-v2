/**
 * Trust warning engine — creates trust warnings from factor scores.
 * Warnings only. No auto-fix.
 */

import type { TrustAssessmentInput, TrustFactorScore, TrustLevel, TrustRiskLevel } from './types.js';
import { isRiskFactor } from './trust-signal-engine.js';

export function trustWarningsKey(warnings: string[]): string {
  return warnings.slice().sort().join('|');
}

export function createTrustWarnings(
  input: TrustAssessmentInput,
  score: number,
  level: TrustLevel,
  riskLevel: TrustRiskLevel,
  factors: TrustFactorScore[],
  blocked: boolean,
): string[] {
  if (blocked) {
    return ['Trust assessment blocked — no trust warnings generated'];
  }

  const warnings: string[] = [];

  if (level === 'VERY_LOW' || level === 'LOW') {
    warnings.push(`Trust level ${level} (${score}/100) — founder review recommended before relying on this result`);
  }

  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    warnings.push(`Trust risk level ${riskLevel} — elevated risk signals detected`);
  }

  const evidenceFactor = factors.find((f) => f.factorType === 'EVIDENCE_QUALITY');
  if (!evidenceFactor || evidenceFactor.sourceSignalCount === 0) {
    warnings.push('Evidence quality signals missing or weak — trust score may be incomplete');
  }

  const verificationFactor = factors.find((f) => f.factorType === 'VERIFICATION_STRENGTH');
  if (!verificationFactor) {
    warnings.push('Verification strength signals absent — verification system truth not replaced by trust engine');
  }

  for (const factor of factors) {
    if (isRiskFactor(factor.factorType) && factor.factorScore >= 5) {
      warnings.push(`${factor.factorType.replace(/_/g, ' ').toLowerCase()} elevated — ${factor.factorReason}`);
    }
  }

  if (input.governanceSignals?.some((s) => s.toLowerCase().includes('fail'))) {
    warnings.push('Governance alignment signals indicate failure — trust reduced');
  }

  if (warnings.length === 0) {
    warnings.push(`Trust assessment for ${input.assessmentTarget} from ${input.assessmentSource} — no critical warnings`);
  }

  warnings.push('Trust aggregation only — verification, evidence, and completion systems remain source of truth');

  return warnings;
}

export function countCriticalWarnings(warnings: string[]): number {
  return warnings.filter((w) => w.toLowerCase().includes('critical') || w.toLowerCase().includes('missing')).length;
}
