/**
 * Promise Fulfillment Validator — bounded integrity checks.
 */

import { PROMISE_FULFILLMENT_BLOCK_SCORE, PROMISE_SCORE_CONTRADICTED } from './promise-fulfillment-bounds.js';
import { assertPromiseRegistryIntegrity, listRegisteredPromises } from './promise-fulfillment-registry.js';
import type { PromiseAssessment, PromiseFulfillmentAssessment } from './promise-fulfillment-types.js';

const ALLOWED_EVIDENCE_PREFIXES = [
  'Founder Testing:',
  'Chat Intelligence Reality:',
  'Repository Typecheck Reality:',
  'Skeptical Founder Simulator:',
] as const;

export function validatePromiseRegistry(): { passed: boolean; detail: string } {
  const passed = assertPromiseRegistryIntegrity();
  return { passed, detail: `count=${listRegisteredPromises().length}` };
}

export function validatePromiseEvidenceMapping(assessments: PromiseAssessment[]): { passed: boolean; detail: string } {
  const evidenceLines = assessments.flatMap((assessment) => [
    ...assessment.supportingEvidence,
    ...assessment.contradictoryEvidence,
  ]);
  if (evidenceLines.length === 0) {
    return { passed: true, detail: 'no evidence lines' };
  }
  const invalid = evidenceLines.filter(
    (line) => !ALLOWED_EVIDENCE_PREFIXES.some((prefix) => line.startsWith(prefix)),
  );
  return {
    passed: invalid.length === 0,
    detail: invalid.length ? invalid[0] ?? 'invalid evidence' : `lines=${evidenceLines.length}`,
  };
}

export function validatePromiseFulfillmentScoring(assessment: PromiseFulfillmentAssessment): {
  passed: boolean;
  detail: string;
} {
  const expectedScore = Math.round(
    assessment.promiseAssessments.reduce((sum, item) => {
      switch (item.status) {
        case 'FULFILLED':
          return sum + 100;
        case 'PARTIALLY_FULFILLED':
          return sum + 65;
        case 'UNPROVEN':
          return sum + 40;
        case 'CONTRADICTED':
          return sum + PROMISE_SCORE_CONTRADICTED;
      }
    }, 0) / Math.max(1, assessment.promiseAssessments.length),
  );
  return {
    passed: assessment.fulfillmentScore === expectedScore,
    detail: `actual=${assessment.fulfillmentScore}; expected=${expectedScore}`,
  };
}

export function validatePromiseContradictionDetection(assessment: PromiseFulfillmentAssessment): {
  passed: boolean;
  detail: string;
} {
  const expected = assessment.promiseAssessments.filter((item) => item.status === 'CONTRADICTED').length;
  return {
    passed: assessment.contradictedCount === expected,
    detail: `count=${assessment.contradictedCount}`,
  };
}

export function validatePromiseLaunchBlocking(assessment: PromiseFulfillmentAssessment): {
  passed: boolean;
  detail: string;
} {
  const shouldBlock = assessment.contradictedCount > 0 || assessment.fulfillmentScore < PROMISE_FULFILLMENT_BLOCK_SCORE;
  return {
    passed: assessment.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${assessment.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}

export function validatePromiseDeterministicScoring(
  first: PromiseFulfillmentAssessment,
  second: PromiseFulfillmentAssessment,
): { passed: boolean; detail: string } {
  const firstDigest = first.promiseAssessments
    .map((item) => `${item.promiseId}:${item.status}:${item.confidence}`)
    .join('|');
  const secondDigest = second.promiseAssessments
    .map((item) => `${item.promiseId}:${item.status}:${item.confidence}`)
    .join('|');
  return {
    passed: firstDigest === secondDigest && first.fulfillmentScore === second.fulfillmentScore,
    detail: firstDigest,
  };
}
