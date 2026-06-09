/**
 * Verification trust analyzer — trust assessment without executing runtime actions.
 */

import type { VerificationEvidence, VerificationGap, VerificationTrustAssessment } from './runtime-verification-types.js';

let assessmentCounter = 0;

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `vtrust-${assessmentCounter.toString().padStart(4, '0')}`;
}

export function resetVerificationTrustCounterForTests(): void {
  assessmentCounter = 0;
}

export function analyzeVerificationTrust(
  score: number,
  evidence: VerificationEvidence[],
  gaps: VerificationGap[],
): VerificationTrustAssessment {
  const satisfied = evidence.filter((e) => e.satisfied).length;
  const criticalGaps = gaps.filter((g) => g.severity === 'CRITICAL').length;

  const factors: string[] = [
    `${satisfied}/${evidence.length} evidence items satisfied`,
    `Verification score: ${score}/100`,
    `${criticalGaps} critical gaps identified`,
    'Execution remains blocked — executionAllowed false required',
    'All Phase 14 runtimes remain simulation/proposal-only',
    'No file writes or command execution in verification layer',
  ];

  let trustLevel: VerificationTrustAssessment['trustLevel'] = 'LOW';
  if (score >= 70 && criticalGaps <= 1) trustLevel = 'HIGH';
  else if (score >= 50 && criticalGaps <= 3) trustLevel = 'MEDIUM';

  const summary =
    trustLevel === 'HIGH'
      ? 'Runtime chain structurally trustworthy for Phase 14 advisory verification — future execution gates still required'
      : trustLevel === 'MEDIUM'
        ? 'Runtime chain partially trustworthy — gaps remain before future governed runtime'
        : 'Runtime chain trust is low — significant verification gaps or unsatisfied evidence';

  return {
    assessmentId: nextAssessmentId(),
    trustLevel,
    factors,
    summary,
    verificationOnly: true,
  };
}
