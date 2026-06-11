/**

 * Launch Council Finalization — unified council position from authority evidence.

 */



import { createHash } from 'node:crypto';

import type { FounderTestV4ReportWithLaunchCouncil } from '../founder-testing-mode/founder-testing-v4-types.js';

import type {

  LaunchCouncilAuthorityResult,

  LaunchCouncilAuthorityStatus,

} from '../launch-council/launch-council-types.js';

import {

  LAUNCH_COUNCIL_FINALIZATION_CACHE_KEY_PREFIX,

  MAX_CONFLICTING_AUTHORITIES,

  MAX_FINALIZATION_FINDINGS,

  MAX_FINALIZATION_RECOMMENDATIONS,

  MAX_RISK_AUTHORITIES,

  MAX_STRONG_AUTHORITIES,

  MIN_PARTICIPATING_FOR_POSITION,

} from './launch-council-finalization-bounds.js';

import { recordLaunchCouncilFinalizationAssessment } from './launch-council-finalization-history.js';

import { buildLaunchCouncilFinalizationReportMarkdown } from './launch-council-finalization-report-builder.js';

import type {

  LaunchCouncilAgreementAnalysis,

  LaunchCouncilAuthorityClassification,

  LaunchCouncilFinalizationAssessment,

  LaunchCouncilFinalizationPosition,

} from './launch-council-finalization-types.js';



/** Deterministic launch-gate authority IDs — can block council READY position. */

export const LAUNCH_GATE_AUTHORITY_IDS: readonly string[] = [

  'founder-testing',

  'chat-intelligence-reality',

  'repository-typecheck-reality',

  'promise-fulfillment-authority',

  'trust-authority',

  'user-success-authority',

  'first-time-user-reality-authority',

  'customer-value-authority',

  'reality-proof-authority',

  'real-user-reality-authority',

  'adoption-prediction-authority',

  'launch-readiness-authority',

  'ui-reviewer-authority',

  'clarifying-question-intelligence',

] as const;



/** Deterministic advisory authority IDs — inform council but do not gate READY alone. */

export const ADVISORY_AUTHORITY_IDS: readonly string[] = [

  'skeptical-founder-simulator',

  'self-awareness-authority',

  'gap-detection-authority',

  'self-evolution-authority',

  'unknown-discovery-authority',

  'competitive-reality-authority',

] as const;



const CONTRADICTION_PAIR_IDS: readonly string[] = [

  'trust-authority',

  'reality-proof-authority',

  'user-success-authority',

  'customer-value-authority',

  'real-user-reality-authority',

  'adoption-prediction-authority',

] as const;



function clamp(n: number): number {

  return Math.max(0, Math.min(100, Math.round(n)));

}



function statusPolarity(status: LaunchCouncilAuthorityStatus): number {

  switch (status) {

    case 'PASS':

      return 1;

    case 'WARNING':

      return 0;

    case 'FAIL':

      return -1;

    default:

      return 0;

  }

}



function isLaunchGate(authorityId: string): boolean {

  return LAUNCH_GATE_AUTHORITY_IDS.includes(authorityId);

}



export function classifyLaunchCouncilAuthorities(

  authorityResults: LaunchCouncilAuthorityResult[],

): LaunchCouncilAuthorityClassification[] {

  return authorityResults.map((result) => ({

    authorityId: result.authorityId,

    authorityName: result.authorityName,

    role: isLaunchGate(result.authorityId) ? 'LAUNCH_GATE' : 'ADVISORY',

  }));

}



export function analyzeLaunchCouncilAgreement(

  authorityResults: LaunchCouncilAuthorityResult[],

): LaunchCouncilAgreementAnalysis {

  const participating = authorityResults.filter((result) => result.status !== 'NOT_RUN');

  const conflictingAuthorities: string[] = [];

  let contradictionCount = 0;



  for (let leftIndex = 0; leftIndex < participating.length; leftIndex += 1) {

    for (let rightIndex = leftIndex + 1; rightIndex < participating.length; rightIndex += 1) {

      const left = participating[leftIndex]!;

      const right = participating[rightIndex]!;

      const leftPolarity = statusPolarity(left.status);

      const rightPolarity = statusPolarity(right.status);

      const isKeyPair =

        CONTRADICTION_PAIR_IDS.includes(left.authorityId) &&

        CONTRADICTION_PAIR_IDS.includes(right.authorityId);

      const isContradiction = Math.abs(leftPolarity - rightPolarity) >= 2;



      if (isContradiction && (isKeyPair || left.launchBlocker !== right.launchBlocker)) {

        contradictionCount += 1;

        const label = `${left.authorityName} (${left.status}) vs ${right.authorityName} (${right.status})`;

        if (!conflictingAuthorities.includes(label)) {

          conflictingAuthorities.push(label);

        }

      }

    }

  }



  const notRunCount = authorityResults.filter((result) => result.status === 'NOT_RUN').length;

  const agreementScore = clamp(

    100 - contradictionCount * 10 - notRunCount * 3 - participating.filter((r) => r.launchBlocker).length * 4,

  );



  return {

    agreementScore,

    contradictionCount,

    conflictingAuthorities: conflictingAuthorities.slice(0, MAX_CONFLICTING_AUTHORITIES),

  };

}



function calculateCouncilScore(authorityResults: LaunchCouncilAuthorityResult[]): number {

  const participating = authorityResults.filter((result) => result.status !== 'NOT_RUN');

  if (participating.length === 0) return 0;

  const averageScore =

    participating.reduce((sum, result) => sum + result.score, 0) / participating.length;

  const blockerPenalty = participating.filter((result) => result.launchBlocker).length * 4;

  return clamp(averageScore - blockerPenalty);

}



function calculateCouncilConfidence(

  report: FounderTestV4ReportWithLaunchCouncil,

  agreement: LaunchCouncilAgreementAnalysis,

): number {

  const council = report.launchCouncil;

  const realityProof = report.realityProofAuthority.realityProofScore;

  const realUserEvidence = report.realUserRealityAuthority.noRealUserEvidence

    ? 25

    : clamp(50 + report.realUserRealityAuthority.realUserEvidenceCount * 5);

  const adoptionConfidence = report.adoptionPredictionAuthority.evidenceConfidenceScore;



  return clamp(

    agreement.agreementScore * 0.25 +

      realityProof * 0.2 +

      realUserEvidence * 0.2 +

      adoptionConfidence * 0.2 +

      council.confidenceScore * 0.15,

  );

}



function deriveHighestRiskAuthorities(authorityResults: LaunchCouncilAuthorityResult[]): string[] {

  return [...authorityResults]

    .filter((result) => result.status !== 'NOT_RUN')

    .sort((left, right) => {

      const leftRisk =

        100 -

        left.score +

        (left.launchBlocker ? 30 : 0) +

        (left.status === 'FAIL' ? 20 : left.status === 'WARNING' ? 10 : 0);

      const rightRisk =

        100 -

        right.score +

        (right.launchBlocker ? 30 : 0) +

        (right.status === 'FAIL' ? 20 : right.status === 'WARNING' ? 10 : 0);

      return rightRisk - leftRisk;

    })

    .slice(0, MAX_RISK_AUTHORITIES)

    .map((result) => result.authorityName);

}



function deriveStrongestAuthorities(authorityResults: LaunchCouncilAuthorityResult[]): string[] {

  return [...authorityResults]

    .filter((result) => result.status === 'PASS' && !result.launchBlocker)

    .sort((left, right) => right.score * (right.confidence / 100) - left.score * (left.confidence / 100))

    .slice(0, MAX_STRONG_AUTHORITIES)

    .map((result) => result.authorityName);

}



function collectLaunchBlockers(

  authorityResults: LaunchCouncilAuthorityResult[],

  classifications: LaunchCouncilAuthorityClassification[],

): string[] {

  const gateIds = new Set(

    classifications.filter((entry) => entry.role === 'LAUNCH_GATE').map((entry) => entry.authorityId),

  );

  return authorityResults

    .filter((result) => result.launchBlocker && gateIds.has(result.authorityId))

    .map((result) => `${result.authorityName} blocks launch readiness`)

    .slice(0, MAX_FINALIZATION_FINDINGS);

}



function deriveCouncilPosition(input: {

  authorityResults: LaunchCouncilAuthorityResult[];

  councilScore: number;

  agreementScore: number;

  launchGateBlockers: LaunchCouncilAuthorityResult[];

  participatingCount: number;

  gateParticipatingCount: number;

  councilReadinessState: string;

}): LaunchCouncilFinalizationPosition {

  if (

    input.participatingCount < MIN_PARTICIPATING_FOR_POSITION ||

    input.gateParticipatingCount < 3

  ) {

    return 'UNKNOWN';

  }



  if (input.launchGateBlockers.length > 0) {

    return 'BLOCKED';

  }



  if (input.councilReadinessState === 'BLOCKED') {

    return 'BLOCKED';

  }



  if (input.councilScore < 40 || input.councilReadinessState === 'CAUTION' && input.councilScore < 50) {

    return 'NOT_READY';

  }



  if (

    input.councilReadinessState === 'READY' &&

    input.councilScore >= 65 &&

    input.agreementScore >= 60

  ) {

    return 'READY';

  }



  if (input.councilScore >= 55 && input.agreementScore >= 45) {

    return 'READY_WITH_CAUTION';

  }



  if (input.councilScore >= 45) {

    return 'READY_WITH_CAUTION';

  }



  return 'NOT_READY';

}



function buildCouncilReasoning(input: {

  councilPosition: LaunchCouncilFinalizationPosition;

  strongestAuthorities: string[];

  highestRiskAuthorities: string[];

  launchBlockers: string[];

  agreement: LaunchCouncilAgreementAnalysis;

  report: FounderTestV4ReportWithLaunchCouncil;

  councilScore: number;

  councilConfidence: number;

}): string[] {

  const reasoning: string[] = [];



  switch (input.councilPosition) {

    case 'READY':

      reasoning.push(

        `Council position READY because participating authorities align (${input.agreement.agreementScore}/100 agreement) with council score ${input.councilScore}/100.`,

      );

      break;

    case 'READY_WITH_CAUTION':

      reasoning.push(

        `Council position READY_WITH_CAUTION because evidence is mixed: council score ${input.councilScore}/100, confidence ${input.councilConfidence}/100.`,

      );

      break;

    case 'NOT_READY':

      reasoning.push(

        `Council position NOT_READY because aggregate readiness is weak (score ${input.councilScore}/100) despite no active launch-gate blockers.`,

      );

      break;

    case 'BLOCKED':

      reasoning.push(

        `Council position BLOCKED because ${input.launchBlockers.length} launch-gate authority(ies) report blocksLaunchReadiness.`,

      );

      break;

    case 'UNKNOWN':

      reasoning.push(

        'Council position UNKNOWN because insufficient participating authority evidence exists for a unified interpretation.',

      );

      break;

  }



  if (input.strongestAuthorities.length > 0) {

    reasoning.push(`Strongest authorities: ${input.strongestAuthorities.slice(0, 3).join(', ')}.`);

  }

  if (input.highestRiskAuthorities.length > 0) {

    reasoning.push(`Highest risk authorities: ${input.highestRiskAuthorities.slice(0, 3).join(', ')}.`);

  }

  if (input.report.realUserRealityAuthority.noRealUserEvidence) {

    reasoning.push('Real User evidence limited — council confidence reduced accordingly.');

  }

  if (input.report.adoptionPredictionAuthority.evidenceConfidenceScore < 50) {

    reasoning.push('Adoption prediction evidence confidence is moderate — retention predictions are not facts.');

  }

  if (input.agreement.contradictionCount > 0) {

    reasoning.push(

      `${input.agreement.contradictionCount} authority contradiction(s) detected — review conflicting signals before interpreting council position as certainty.`,

    );

  }



  return reasoning.slice(0, MAX_FINALIZATION_FINDINGS);

}



function buildRecommendations(input: {

  councilPosition: LaunchCouncilFinalizationPosition;

  launchBlockers: string[];

  highestRiskAuthorities: string[];

  report: FounderTestV4ReportWithLaunchCouncil;

}): string[] {

  const recommendations: string[] = [];



  if (input.councilPosition === 'BLOCKED') {

    recommendations.push('Resolve launch-gate blockers before treating any council signal as launch-ready.');

    for (const blocker of input.launchBlockers.slice(0, 3)) {

      recommendations.push(`Address blocker: ${blocker}`);

    }

  }



  if (input.councilPosition === 'READY_WITH_CAUTION') {

    recommendations.push('Proceed only with explicit caution — strengthen weak authorities before broad launch.');

  }



  if (input.report.realUserRealityAuthority.noRealUserEvidence) {

    recommendations.push('Collect real-user evidence before interpreting council confidence as high.');

  }



  if (input.highestRiskAuthorities.length > 0) {

    recommendations.push(`Prioritize risk reduction in: ${input.highestRiskAuthorities.slice(0, 3).join(', ')}.`);

  }



  recommendations.push('Authorities provide evidence. Launch Council provides understanding — not a launch verdict.');



  return [...new Set(recommendations)].slice(0, MAX_FINALIZATION_RECOMMENDATIONS);

}



function stableCacheKey(report: FounderTestV4ReportWithLaunchCouncil): string {

  const council = report.launchCouncil;

  const digest = createHash('sha256')

    .update(

      [

        council.cacheKey,

        council.overallScore,

        council.confidenceScore,

        council.launchBlockerCount,

        council.readinessState,

        report.adoptionPredictionAuthority.evidenceConfidenceScore,

        report.realUserRealityAuthority.realUserEvidenceCount,

      ].join('|'),

    )

    .digest('hex')

    .slice(0, 16);

  return `${LAUNCH_COUNCIL_FINALIZATION_CACHE_KEY_PREFIX}:${digest}`;

}



export function assessLaunchCouncilFinalization(

  report: FounderTestV4ReportWithLaunchCouncil,

): LaunchCouncilFinalizationAssessment {

  const authorityResults = report.launchCouncil.authorityResults;

  const classifications = classifyLaunchCouncilAuthorities(authorityResults);

  const agreement = analyzeLaunchCouncilAgreement(authorityResults);

  const councilScore = calculateCouncilScore(authorityResults);

  const councilConfidence = calculateCouncilConfidence(report, agreement);

  const launchGateResults = authorityResults.filter((result) => isLaunchGate(result.authorityId));

  const launchGateBlockers = launchGateResults.filter((result) => result.launchBlocker);

  const participating = authorityResults.filter((result) => result.status !== 'NOT_RUN');

  const gateParticipating = launchGateResults.filter((result) => result.status !== 'NOT_RUN');

  const launchBlockers = collectLaunchBlockers(authorityResults, classifications);

  const highestRiskAuthorities = deriveHighestRiskAuthorities(authorityResults);

  const strongestAuthorities = deriveStrongestAuthorities(authorityResults);



  const councilPosition = deriveCouncilPosition({

    authorityResults,

    councilScore,

    agreementScore: agreement.agreementScore,

    launchGateBlockers,

    participatingCount: participating.length,

    gateParticipatingCount: gateParticipating.length,

    councilReadinessState: report.launchCouncil.readinessState,

  });



  const councilReasoning = buildCouncilReasoning({

    councilPosition,

    strongestAuthorities,

    highestRiskAuthorities,

    launchBlockers,

    agreement,

    report,

    councilScore,

    councilConfidence,

  });



  const recommendations = buildRecommendations({

    councilPosition,

    launchBlockers,

    highestRiskAuthorities,

    report,

  });



  const assessment: LaunchCouncilFinalizationAssessment = {

    readOnly: true,

    advisoryOnly: true,

    councilScore,

    councilConfidence,

    authorityCount: authorityResults.length,

    blockingAuthorityCount: authorityResults.filter((result) => result.launchBlocker).length,

    advisoryAuthorityCount: classifications.filter((entry) => entry.role === 'ADVISORY').length,

    launchGateAuthorityCount: classifications.filter((entry) => entry.role === 'LAUNCH_GATE').length,

    agreementScore: agreement.agreementScore,

    contradictionCount: agreement.contradictionCount,

    conflictingAuthorities: agreement.conflictingAuthorities,

    highestRiskAuthorities,

    strongestAuthorities,

    councilPosition,

    councilReasoning,

    launchBlockers,

    recommendations,

    authorityClassifications: classifications,

    cacheKey: stableCacheKey(report),

  };



  recordLaunchCouncilFinalizationAssessment(assessment);

  return assessment;

}



export function buildLaunchCouncilFinalizationArtifacts(

  report: FounderTestV4ReportWithLaunchCouncil,

): {

  launchCouncilFinalization: LaunchCouncilFinalizationAssessment;

  launchCouncilFinalizationReportMarkdown: string;

} {

  const launchCouncilFinalization = assessLaunchCouncilFinalization(report);

  const launchCouncilFinalizationReportMarkdown =

    buildLaunchCouncilFinalizationReportMarkdown(launchCouncilFinalization, report);

  return { launchCouncilFinalization, launchCouncilFinalizationReportMarkdown };

}


