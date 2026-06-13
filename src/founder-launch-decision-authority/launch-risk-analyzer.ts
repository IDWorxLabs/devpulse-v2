/**
 * Launch risk analyzer — risk and confidence scoring from proof signals.
 */

import type {
  BlockerPriorityAnalysis,
  LaunchRiskSignalAnalysis,
  ProofChainSignalAnalysis,
} from './founder-launch-decision-authority-types.js';
import { HIGH_RISK_SCORE_THRESHOLD } from './founder-launch-decision-authority-registry.js';

export function analyzeLaunchRisk(input: {
  proofSignals: ProofChainSignalAnalysis;
  blockers: BlockerPriorityAnalysis;
  launchReadinessScore?: number;
  runtimeConfidenceScore?: number;
}): LaunchRiskSignalAnalysis {
  const riskSignals: string[] = [];
  let riskScore = 0;

  if (!input.proofSignals.runtimeProven) {
    riskScore += 30;
    riskSignals.push('Runtime activation not proven');
  }
  if (!input.proofSignals.launchReadinessProven) {
    riskScore += 25;
    riskSignals.push('Launch readiness not proven');
  }
  if (input.proofSignals.criticalBlockerCount > 0) {
    riskScore += 20 + input.proofSignals.criticalBlockerCount * 5;
    riskSignals.push(`${input.proofSignals.criticalBlockerCount} critical blocker(s) in proof chain`);
  }
  if (input.proofSignals.executionState !== 'LAUNCH_READY') {
    riskScore += 15;
    riskSignals.push(`Execution state is ${input.proofSignals.executionState}, not LAUNCH_READY`);
  }
  if (input.proofSignals.missingEvidence.length > 0) {
    riskScore += Math.min(20, input.proofSignals.missingEvidence.length * 4);
    riskSignals.push(`${input.proofSignals.missingEvidence.length} missing evidence item(s)`);
  }
  if (!input.proofSignals.buildMaterializationProven) {
    riskScore += 10;
    riskSignals.push('Build materialization not proven');
  }
  if (!input.proofSignals.validationProven) {
    riskScore += 8;
    riskSignals.push('Verification execution not proven');
  }
  if (input.blockers.criticalCount > 0) {
    riskScore += input.blockers.criticalCount * 8;
    riskSignals.push(`${input.blockers.criticalCount} prioritized critical blocker(s)`);
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  const runtimeConfidenceScore =
    input.runtimeConfidenceScore ??
    (input.proofSignals.runtimeProven ? 90 : input.proofSignals.signals.find((s) => s.signalId === 'runtime-activation')?.present ? 40 : 10);

  const launchReadinessScore =
    input.launchReadinessScore ??
    (input.proofSignals.launchReadinessProven ? 88 : input.proofSignals.signals.find((s) => s.signalId === 'launch-readiness-proof')?.present ? 45 : 15);

  let riskLevel: LaunchRiskSignalAnalysis['riskLevel'] = 'LOW';
  if (riskScore >= HIGH_RISK_SCORE_THRESHOLD) riskLevel = 'CRITICAL';
  else if (riskScore >= 55) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MEDIUM';

  return {
    readOnly: true,
    riskScore,
    riskLevel,
    riskSignals: [...new Set(riskSignals)].slice(0, 10),
    runtimeConfidenceScore: Math.min(100, Math.max(0, runtimeConfidenceScore)),
    launchReadinessScore: Math.min(100, Math.max(0, launchReadinessScore)),
  };
}
