/**
 * Strategic Capability Audit V4 — capability question assessor.
 */

import type {
  StrategicCapabilityQuestion,
  StrategicQuestionAnswer,
} from './strategic-capability-audit-v4-types.js';
import type { StrategicEvidenceSnapshot } from './strategic-evidence-collector.js';

function answer(score: number): StrategicQuestionAnswer {
  if (score >= 90) return 'PROVEN';
  if (score >= 60) return 'PARTIAL';
  return 'NOT_PROVEN';
}

export function assessCapabilityQuestions(
  evidence: StrategicEvidenceSnapshot,
): StrategicCapabilityQuestion[] {
  const suite = evidence.uvl.suiteCoverage;
  const required = suite.categoriesRequired;

  const buildScore = suite.buildCoverage >= required ? 100 : Math.round((suite.buildCoverage / required) * 100);
  const verifyScore = evidence.uvl.uvlVerificationExecutionComplete
    ? 100
    : Math.round((suite.verificationCoverage / required) * 100);
  const launchScore =
    suite.aflaReviewCoverage >= required && evidence.productionReadiness.proven
      ? 100
      : suite.aflaReviewCoverage >= required
        ? 85
        : Math.round((suite.aflaReviewCoverage / required) * 70);

  const evolveScore =
    (evidence.selfEvolutionProven ? 50 : 0) +
    (evidence.failureEscalationProven ? 30 : 0) +
    (evidence.canonicalOwnershipProven ? 20 : 0);

  const multiProjectScore = evidence.multiProjectProven ? 100 : evidence.world2Proven ? 60 : 30;

  const continuousScore =
    (evidence.evidenceFreshnessProven ? 35 : 0) +
    (evidence.failureEscalationProven ? 35 : 0) +
    (evidence.freshness && evidence.freshness.overallScore >= 80 ? 30 : evidence.freshness ? 15 : 0);

  const factoryScore = Math.round(
    (buildScore +
      verifyScore +
      launchScore +
      evolveScore +
      multiProjectScore +
      continuousScore +
      (evidence.pipelineIntegration.integrationComplete ? 100 : 50) +
      (evidence.mobileProven ? 90 : 40)) /
      8,
  );

  return [
    {
      question: 'Can AiDevEngine build software?',
      answer: answer(buildScore),
      evidence: `Real Build Execution V1.1: ${suite.buildCoverage}/${required} build coverage, preview ${suite.previewCoverage}/${required}.`,
      score: buildScore,
    },
    {
      question: 'Can AiDevEngine verify software?',
      answer: answer(verifyScore),
      evidence: evidence.uvl.uvlVerificationExecutionComplete
        ? `UVL Verification Execution V1 PASS: ${evidence.uvl.uvlVerifiedCount}/${required} verified, ${suite.verificationConfidenceScore}/100 confidence.`
        : `UVL verification incomplete: ${suite.verificationCoverage}/${required}.`,
      score: verifyScore,
    },
    {
      question: 'Can AiDevEngine launch software?',
      answer: answer(launchScore),
      evidence: `AFLA review ${suite.aflaReviewCoverage}/${required}; production readiness ${evidence.productionReadiness.proven ? 'PROVEN' : 'unproven'}.`,
      score: launchScore,
    },
    {
      question: 'Can AiDevEngine evolve software?',
      answer: answer(evolveScore),
      evidence: `Self-Evolution ${evidence.selfEvolutionProven ? 'PROVEN' : 'partial'}; failure escalation ${evidence.failureEscalationProven ? 'PROVEN' : 'partial'}; ownership ${evidence.canonicalOwnershipProven ? 'PROVEN' : 'partial'}.`,
      score: evolveScore,
    },
    {
      question: 'Can AiDevEngine manage multiple projects?',
      answer: answer(multiProjectScore),
      evidence: evidence.multiProjectProven
        ? 'Multi-Project Concurrent Execution V1 PASS: 5/5 concurrent projects with isolation.'
        : evidence.world2Proven
          ? 'World2 proven; concurrent execution not yet proven at scale.'
          : 'Multi-project foundation partial; concurrent execution unproven.',
      score: multiProjectScore,
    },
    {
      question: 'Can AiDevEngine operate continuously?',
      answer: answer(continuousScore),
      evidence: `Evidence freshness ${evidence.evidenceFreshnessProven ? 'governed' : 'ungoverned'}; failure escalation ${evidence.failureEscalationProven ? 'PROVEN' : 'partial'}; freshness score ${evidence.freshness?.overallScore ?? 0}/100.`,
      score: continuousScore,
    },
    {
      question: 'Can AiDevEngine operate as a software factory?',
      answer: answer(factoryScore),
      evidence: `Composite factory score ${factoryScore}/100 across build, verify, launch, evolve, multi-project, continuous operation, pipeline integration, and mobile.`,
      score: factoryScore,
    },
  ];
}
