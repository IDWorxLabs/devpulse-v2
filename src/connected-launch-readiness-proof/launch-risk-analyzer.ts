/**
 * Launch Risk Analyzer — assess overall launch risk from blockers and simulations.
 */

import type { LaunchBlockerAssessment } from './connected-launch-readiness-proof-types.js';
import type { LaunchRiskAssessment, LaunchRiskLevel } from './connected-launch-readiness-proof-types.js';
import type { LaunchSimulationAssessment } from './connected-launch-readiness-proof-types.js';

export function analyzeLaunchRisk(input: {
  blockers: LaunchBlockerAssessment;
  simulation: LaunchSimulationAssessment;
  executionChainConnected: boolean;
}): LaunchRiskAssessment {
  const riskFactors: string[] = [];

  if (!input.executionChainConnected) {
    riskFactors.push('Execution chain not fully connected');
  }
  if (input.blockers.criticalCount > 0) {
    riskFactors.push(`${input.blockers.criticalCount} critical launch blocker(s)`);
  }
  if (input.blockers.highCount > 0) {
    riskFactors.push(`${input.blockers.highCount} high-severity blocker(s)`);
  }
  if (input.simulation.simulationScore < 70) {
    riskFactors.push(`Simulation score ${input.simulation.simulationScore}/100 below launch threshold`);
  }
  riskFactors.push(...input.simulation.topFailures.slice(0, 3));

  let riskLevel: LaunchRiskLevel = 'LOW';
  if (input.blockers.criticalCount > 0 || !input.executionChainConnected) {
    riskLevel = 'CRITICAL';
  } else if (input.blockers.highCount > 0 || input.simulation.simulationScore < 60) {
    riskLevel = 'HIGH';
  } else if (input.blockers.mediumCount > 0 || input.simulation.simulationScore < 80) {
    riskLevel = 'MEDIUM';
  }

  return {
    readOnly: true,
    riskLevel,
    riskFactors,
    confidence: riskFactors.length === 0 ? 90 : Math.max(40, 90 - riskFactors.length * 10),
  };
}
