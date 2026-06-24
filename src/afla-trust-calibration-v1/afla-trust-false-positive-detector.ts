/**
 * AFLA Trust Calibration V1 — false positive detection.
 */

import type { AutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-authority-types.js';
import type { FalsePositiveFinding } from './afla-trust-calibration-types.js';

function isLaunchApproved(verdict: AutonomousFounderLaunchAssessment['verdict']): boolean {
  return verdict === 'LAUNCH_READY' || verdict === 'LAUNCH_READY_WITH_WARNINGS';
}

export function detectFalsePositives(assessment: AutonomousFounderLaunchAssessment): FalsePositiveFinding[] {
  if (!isLaunchApproved(assessment.verdict)) return [];

  const findings: FalsePositiveFinding[] = [];
  let counter = 0;

  const add = (summary: string, evidenceSource: string, severity: FalsePositiveFinding['severity']): void => {
    counter += 1;
    findings.push({
      readOnly: true,
      findingId: `fp-${counter}`,
      summary,
      evidenceSource,
      severity,
    });
  };

  const { evidence } = assessment;

  if (evidence.featureReality.available && !evidence.featureReality.passed) {
    add('Failed Feature Reality while verdict approves launch', 'Feature Reality', 'CRITICAL');
  }
  if (evidence.engineeringReality.available && !evidence.engineeringReality.passed) {
    add('Failed Engineering Reality while verdict approves launch', 'Engineering Reality', 'CRITICAL');
  }
  if (evidence.blueprintVisual.available && !evidence.blueprintVisual.passed) {
    add('Failed Blueprint Visual while verdict approves launch', 'Blueprint Visual', 'HIGH');
  }
  if (evidence.verificationHub?.incompleteVerification) {
    add('Critical verification gap while verdict approves launch', 'Verification Hub', 'CRITICAL');
  }
  if (evidence.requirementDiscovery?.poorlyUnderstood) {
    add('Critical requirement gap while verdict approves launch', 'Requirement Discovery', 'CRITICAL');
  }

  for (const source of [
    evidence.buildReality,
    evidence.blueprintStructure,
    evidence.universalFeatureContract,
  ]) {
    if (source.available && source.blockers.length > 0) {
      add(`Unresolved blocker in ${source.sourceName}`, source.sourceName, 'HIGH');
    }
  }

  if (evidence.missingPrerequisites.length > 0) {
    add('Missing prerequisites while verdict approves launch', 'Evidence Chain', 'CRITICAL');
  }

  return findings;
}

export function countFalsePositives(assessment: AutonomousFounderLaunchAssessment): number {
  return detectFalsePositives(assessment).length;
}
