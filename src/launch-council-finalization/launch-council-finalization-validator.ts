/**

 * Launch Council Finalization Validator — bounded integrity checks.

 */



import {

  ADVISORY_AUTHORITY_IDS,

  LAUNCH_GATE_AUTHORITY_IDS,

} from './launch-council-finalization-authority.js';

import { LAUNCH_COUNCIL_FINALIZATION_REPORT_TITLE } from './launch-council-finalization-bounds.js';

import type { LaunchCouncilFinalizationAssessment } from './launch-council-finalization-types.js';



export function validateAuthorityClassification(): { passed: boolean; detail: string } {

  const total = LAUNCH_GATE_AUTHORITY_IDS.length + ADVISORY_AUTHORITY_IDS.length;

  const overlap = LAUNCH_GATE_AUTHORITY_IDS.filter((id) => ADVISORY_AUTHORITY_IDS.includes(id));

  return {

    passed: total === 20 && overlap.length === 0,

    detail: `gates=${LAUNCH_GATE_AUTHORITY_IDS.length}; advisory=${ADVISORY_AUTHORITY_IDS.length}; overlap=${overlap.length}`,

  };

}



export function validateCouncilScoreRange(assessment: LaunchCouncilFinalizationAssessment): {

  passed: boolean;

  detail: string;

} {

  return {

    passed: assessment.councilScore >= 0 && assessment.councilScore <= 100,

    detail: String(assessment.councilScore),

  };

}



export function validateCouncilConfidenceRange(assessment: LaunchCouncilFinalizationAssessment): {

  passed: boolean;

  detail: string;

} {

  return {

    passed: assessment.councilConfidence >= 0 && assessment.councilConfidence <= 100,

    detail: String(assessment.councilConfidence),

  };

}



export function validateAgreementAnalysis(assessment: LaunchCouncilFinalizationAssessment): {

  passed: boolean;

  detail: string;

} {

  return {

    passed:

      assessment.agreementScore >= 0 &&

      assessment.agreementScore <= 100 &&

      assessment.contradictionCount >= 0 &&

      Array.isArray(assessment.conflictingAuthorities),

    detail: `agreement=${assessment.agreementScore}; contradictions=${assessment.contradictionCount}`,

  };

}



export function validateCouncilPositionDerivation(assessment: LaunchCouncilFinalizationAssessment): {

  passed: boolean;

  detail: string;

} {

  const validPositions = ['READY', 'READY_WITH_CAUTION', 'NOT_READY', 'BLOCKED', 'UNKNOWN'];

  const blockedPositionValid =

    assessment.councilPosition !== 'READY' ||

    (assessment.launchBlockers.length === 0 && assessment.blockingAuthorityCount === 0);

  return {

    passed: validPositions.includes(assessment.councilPosition) && blockedPositionValid,

    detail: `${assessment.councilPosition}; blockers=${assessment.launchBlockers.length}`,

  };

}



export function validateLaunchGateBlockingRule(assessment: LaunchCouncilFinalizationAssessment): {

  passed: boolean;

  detail: string;

} {

  if (assessment.launchBlockers.length > 0 && assessment.councilPosition === 'READY') {

    return { passed: false, detail: 'READY with launch blockers' };

  }

  if (assessment.launchBlockers.length > 0 && assessment.councilPosition === 'UNKNOWN') {

    return { passed: true, detail: 'UNKNOWN with blockers allowed when evidence insufficient' };

  }

  if (assessment.launchBlockers.length > 0) {

    return {

      passed: assessment.councilPosition === 'BLOCKED' || assessment.councilPosition === 'UNKNOWN',

      detail: `${assessment.councilPosition}`,

    };

  }

  return { passed: true, detail: 'no launch blockers' };

}



export function validateFinalizationDeterministicScoring(

  first: LaunchCouncilFinalizationAssessment,

  second: LaunchCouncilFinalizationAssessment,

): { passed: boolean; detail: string } {

  return {

    passed:

      first.councilScore === second.councilScore &&

      first.councilConfidence === second.councilConfidence &&

      first.councilPosition === second.councilPosition &&

      first.agreementScore === second.agreementScore &&

      first.cacheKey === second.cacheKey,

    detail: `${first.councilScore}/${second.councilScore}; ${first.councilPosition}/${second.councilPosition}`,

  };

}



export function validateFinalizationAdvisoryOnly(assessment: LaunchCouncilFinalizationAssessment): {

  passed: boolean;

  detail: string;

} {

  return {

    passed: assessment.readOnly === true && assessment.advisoryOnly === true,

    detail: String(assessment.advisoryOnly),

  };

}



export function validateFinalizationReportGeneration(markdown: string): { passed: boolean; detail: string } {

  return {

    passed:

      markdown.includes(`# ${LAUNCH_COUNCIL_FINALIZATION_REPORT_TITLE}`) &&

      markdown.includes('# Council Position') &&

      markdown.includes('# Authority Agreement Analysis') &&

      markdown.includes('# Council Conclusion'),

    detail: 'markdown sections',

  };

}



export function validateAuthorityAggregation(assessment: LaunchCouncilFinalizationAssessment): {

  passed: boolean;

  detail: string;

} {

  return {

    passed:

      assessment.authorityCount === assessment.authorityClassifications.length &&

      assessment.launchGateAuthorityCount + assessment.advisoryAuthorityCount === assessment.authorityCount,

    detail: `total=${assessment.authorityCount}; gates=${assessment.launchGateAuthorityCount}`,

  };

}



export function validateContradictionDetection(assessment: LaunchCouncilFinalizationAssessment): {

  passed: boolean;

  detail: string;

} {

  return {

    passed:

      assessment.contradictionCount === 0

        ? assessment.conflictingAuthorities.length === 0

        : assessment.conflictingAuthorities.length > 0,

    detail: `contradictions=${assessment.contradictionCount}; conflicts=${assessment.conflictingAuthorities.length}`,

  };

}


