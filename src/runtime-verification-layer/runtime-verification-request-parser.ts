/**
 * Runtime verification request parser.
 */

import type { RuntimeVerificationRequest } from './runtime-verification-types.js';

let requestCounter = 0;

function nextRequestId(): string {
  requestCounter += 1;
  return `vreq-${requestCounter.toString().padStart(4, '0')}`;
}

export function resetVerificationRequestCounterForTests(): void {
  requestCounter = 0;
}

export function parseVerificationRequest(query: string): RuntimeVerificationRequest {
  const lower = query.toLowerCase().trim();
  let title = 'Runtime Verification Request';
  let goal = 'Verify Phase 14 runtime chain plans without executing any runtime actions';
  let outcome = 'Verification report with evidence, gaps, trust assessment, and score — advisory only';

  if (lower.includes('runtime chain verified') || lower.includes('is the runtime chain verified')) {
    title = 'Runtime Chain Verification';
    goal = 'Assess whether the Phase 14 runtime chain satisfies verification requirements';
    outcome = 'Chain verification report with score, evidence, and gaps';
  } else if (lower.includes('verification evidence') || lower.includes('what verification exists')) {
    title = 'Verification Evidence';
    goal = 'Inventory evidence supporting runtime chain verification';
    outcome = 'Evidence inventory — no execution performed';
  } else if (lower.includes('verification gaps') || lower.includes('what prevents verification')) {
    title = 'Verification Gaps';
    goal = 'Identify gaps preventing full runtime chain verification';
    outcome = 'Gap inventory with severity — advisory only';
  } else if (lower.includes('verification score')) {
    title = 'Verification Score';
    goal = 'Calculate composite verification score for runtime chain';
    outcome = 'Verification score with confidence — simulation only';
  } else if (lower.includes('trust assessment') || lower.includes('how trustworthy')) {
    title = 'Trust Assessment';
    goal = 'Assess trustworthiness of the Phase 14 runtime chain';
    outcome = 'Trust assessment with factors — no runtime actions';
  } else if (lower.includes('verified next') || lower.includes('should be verified next')) {
    title = 'Next Verification Action';
    goal = 'Recommend what should be verified next in the runtime chain';
    outcome = 'Recommended next verification action — advisory only';
  } else if (lower.includes('verification report')) {
    title = 'Runtime Verification Report';
    goal = 'Compose full verification report across all Phase 14 runtimes';
    outcome = 'Complete report linked to execution, build, generation, testing, and auto-fix plans';
  }

  return {
    requestId: nextRequestId(),
    query,
    title,
    goal,
    requestedOutcome: outcome,
    sourceSystem: 'runtime_verification_layer',
    verificationOnly: true,
  };
}
