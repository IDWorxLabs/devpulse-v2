/**
 * AFLA Trust Calibration V1 — false negative detection.
 */

import type { AutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';
import type { FalseNegativeFinding } from './afla-trust-calibration-types.js';

function isBlockedVerdict(verdict: AutonomousFounderLaunchAssessment['verdict']): boolean {
  return verdict === 'NOT_LAUNCH_READY' || verdict === 'NEEDS_HUMAN_REVIEW';
}

export function detectFalseNegatives(assessment: AutonomousFounderLaunchAssessment): FalseNegativeFinding[] {
  if (!isBlockedVerdict(assessment.verdict)) return [];

  const { evidence, scores } = assessment;
  const findings: FalseNegativeFinding[] = [];
  let counter = 0;

  const coreSources = [
    evidence.buildReality,
    evidence.blueprintStructure,
    evidence.blueprintVisual,
    evidence.featureReality,
    evidence.universalFeatureContract,
    evidence.engineeringReality,
  ];

  const allCorePassed = coreSources.every((source) => source.available && source.passed);
  const noCriticalBlockers = coreSources.every((source) => source.blockers.length === 0);
  const highVerification =
    (evidence.verificationHub?.verificationConfidenceScore ?? 0) >= 75 &&
    !evidence.verificationHub?.incompleteVerification;
  const requirementsClear = !evidence.requirementDiscovery?.poorlyUnderstood;
  const highScore = scores.overallFounderScore >= 80;

  if (!allCorePassed || !noCriticalBlockers) return [];

  const add = (summary: string, evidenceSignal: string): void => {
    counter += 1;
    findings.push({
      readOnly: true,
      findingId: `fn-${counter}`,
      summary,
      evidenceSignal,
    });
  };

  if (highScore && highVerification && requirementsClear) {
    add(
      'All authorities pass with high verification confidence but launch blocked',
      `Overall score ${scores.overallFounderScore}/100, verification confidence ${evidence.verificationHub?.verificationConfidenceScore ?? 0}/100`,
    );
  }

  if (highScore && evidence.missingPrerequisites.length === 0 && assessment.verdict === 'NOT_LAUNCH_READY') {
    add('Healthy evidence chain with no missing prerequisites but launch blocked', 'Evidence chain healthy');
  }

  return findings;
}

export function countFalseNegatives(assessment: AutonomousFounderLaunchAssessment): number {
  return detectFalseNegatives(assessment).length;
}
