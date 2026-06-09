/**

 * Verification evidence builder — creates evidence records from verification results.

 */



import type { SelfVisionSession } from '../self-vision-runtime/types.js';

import type {

  VerificationEvidence,

  VerificationEvidenceType,

  VerificationResult,

} from './types.js';



let evidenceCounter = 0;



export function resetVerificationEvidenceCounterForTests(): void {

  evidenceCounter = 0;

}



function nextEvidenceId(): string {

  evidenceCounter += 1;

  return `vevid-${evidenceCounter.toString().padStart(3, '0')}`;

}



function evidenceTypeForResult(targetType: string): VerificationEvidenceType {

  switch (targetType) {

    case 'LAYOUT_TARGET':

      return 'LAYOUT_EVIDENCE';

    case 'NAVIGATION_TARGET':

      return 'NAVIGATION_EVIDENCE';

    case 'LOADING_TARGET':

    case 'ERROR_STATE_TARGET':

      return 'LOADING_EVIDENCE';

    case 'RESPONSIVE_TARGET':

      return 'RESPONSIVE_EVIDENCE';

    case 'INTERACTION_TARGET':

      return 'INTERACTION_EVIDENCE';

    default:

      return 'LAYOUT_EVIDENCE';

  }

}



export function buildVerificationEvidence(

  results: VerificationResult[],

  session: SelfVisionSession | null,

): VerificationEvidence[] {

  const evidence: VerificationEvidence[] = [];



  for (const result of results) {

    evidence.push({

      evidenceId: nextEvidenceId(),

      evidenceType: evidenceTypeForResult(result.targetType),

      source: `verification-result:${result.resultId}`,

      summary: `${result.targetType} — ${result.status}`,

      detail: `Observed: ${result.observedState}; Expected: ${result.expectedState}; Issues: ${result.issueClassifications.join(', ') || 'none'}`,

      verificationOnly: true,

    });

  }



  if (session) {

    evidence.push({

      evidenceId: nextEvidenceId(),

      evidenceType: 'SELF_VISION_EVIDENCE',

      source: `self-vision-session:${session.selfVisionSessionId}`,

      summary: `Self vision session ${session.observationState}`,

      detail: `Capture plan items: ${session.capturePlan.length}; Capabilities: ${session.observationCapabilities.length}`,

      verificationOnly: true,

    });

  }



  return evidence;

}


