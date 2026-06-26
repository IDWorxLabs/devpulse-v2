/**
 * ASE — failure router.
 */

import type { AseRouteDecision, AseRouteTarget, AseStageId } from './ase-types.js';

export function routeAseFailure(input: {
  stageId: AseStageId;
  failure: string;
  evidenceId: string | null;
}): AseRouteDecision {
  const lower = input.failure.toLowerCase();
  let destination: AseRouteTarget = 'AUTONOMOUS_DEBUGGING';
  let expectedReturn = 'Failed gate passes after targeted repair.';

  if (/capability evolution|unresolved capability|missing capability|csv export/i.test(lower)) {
    destination = 'MISSING_CAPABILITY_EVOLUTION';
    expectedReturn = 'Capability evolved, validated, and capability planning re-run passes.';
  } else if (/human review|payment|unsafe/i.test(lower)) {
    destination = 'HUMAN_REVIEW';
    expectedReturn = 'Human review completed with explicit approval evidence.';
  } else if (/execution trace|evidence unavailable|evidence incomplete/i.test(lower)) {
    destination = 'EVIDENCE_REGENERATION';
    expectedReturn = 'Missing evidence regenerated and validated.';
  } else if (/friction|usability|too many steps/i.test(lower) && !/block/i.test(lower)) {
    destination = 'CONTINUOUS_IMPROVEMENT';
    expectedReturn = 'Safe improvement applied and affected journey revalidated.';
  } else if (/dead button|handler|interaction proof|unreachable|layout/i.test(lower)) {
    destination = 'AUTONOMOUS_DEBUGGING';
    expectedReturn = 'Repair loop resolves handler binding and interaction proof re-runs pass.';
  } else if (/device profile|virtual device/i.test(lower)) {
    destination = 'AUTONOMOUS_DEBUGGING';
    expectedReturn = 'Device layout repair validated on affected profile.';
  } else if (/launch readiness|launch verdict/i.test(lower)) {
    destination = 'LAUNCH_READINESS_AUTHORITY';
    expectedReturn = 'Launch readiness evidence complete with LAUNCH_READY verdict.';
  } else if (/preview|live preview/i.test(lower)) {
    destination = 'LIVE_PREVIEW_GATE';
    expectedReturn = 'Live Preview Gate returns PREVIEW_UNLOCKED.';
  }

  return {
    readOnly: true,
    failure: input.failure,
    destination,
    reason: `Failure at ${input.stageId} routed to ${destination}.`,
    evidenceId: input.evidenceId,
    expectedReturnCondition: expectedReturn,
  };
}
