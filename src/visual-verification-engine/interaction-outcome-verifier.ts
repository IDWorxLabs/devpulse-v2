/**

 * Interaction outcome verifier — verifies interaction completion and observed outcomes.

 */



import type { InteractionTestingReport } from '../interaction-testing-engine/types.js';

import type { VerificationResult, VerificationTarget } from './types.js';



let interactionCounter = 0;



export function resetInteractionOutcomeVerifierCounterForTests(): void {

  interactionCounter = 0;

}



export function verifyInteractionOutcomes(

  targets: VerificationTarget[],

  interactionReport: InteractionTestingReport | null,

): VerificationResult[] {

  if (!interactionReport) return [];

  let interactionTargets = targets.filter((t) => t.targetType === 'INTERACTION_TARGET');

  if (interactionTargets.length === 0 && interactionReport.interactionResults.length > 0) {
    interactionTargets = interactionReport.interactionResults.slice(0, 8).map((result, index) => ({
      targetId: `vtarget-int-${(index + 1).toString().padStart(3, '0')}`,
      targetType: 'INTERACTION_TARGET' as const,
      targetName: result.interactionId,
      description: `Interaction outcome: ${result.target} — ${result.observedOutcome}`,
      verificationOnly: true as const,
    }));
  }

  if (interactionTargets.length === 0) return [];



  const results: VerificationResult[] = [];

  const resultMap = new Map(

    interactionReport.interactionResults.map((r) => [r.interactionId, r]),

  );



  for (const target of interactionTargets) {

    interactionCounter += 1;

    const outcome = resultMap.get(target.targetName);

    const issueClassifications: string[] = [];



    if (!outcome) {

      issueClassifications.push('interaction-outcome-unavailable');

    } else if (outcome.observedOutcome.toLowerCase().includes('blocked')) {

      issueClassifications.push('interaction-blocked');

    } else if (outcome.observedOutcome.toLowerCase().includes('unavailable')) {

      issueClassifications.push('interaction-unavailable');

    }



    const status =

      issueClassifications.length === 0

        ? 'VERIFIED'

        : issueClassifications.includes('interaction-blocked')

          ? 'VERIFICATION_BLOCKED'

          : 'PARTIALLY_VERIFIED';



    results.push({

      resultId: `vint-${interactionCounter.toString().padStart(3, '0')}`,

      targetId: target.targetId,

      targetType: 'INTERACTION_TARGET',

      status,

      observedState: outcome?.observedOutcome ?? 'interaction outcome not observed',

      expectedState: 'interaction completed with observed outcome recorded',

      issueClassifications,

      verificationOnly: true,

    });

  }



  return results;

}


