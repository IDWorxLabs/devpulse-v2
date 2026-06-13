/**
 * Launch Readiness Analyzer — determine actual launch readiness state.
 */

import type {
  LaunchAcceptanceAssessment,
  LaunchBlockerAssessment,
  LaunchReadinessAssessment,
  LaunchReadinessFixture,
  LaunchReadinessState,
  LaunchSimulationAssessment,
} from './connected-launch-readiness-proof-types.js';
import { isAcceptanceRejected } from './launch-acceptance-analyzer.js';
import { hasCriticalBlockers } from './launch-blocker-analyzer.js';
import { hasCriticalClaimViolations } from './launch-claim-reality-analyzer.js';
import type { ClaimRealityAssessment } from './connected-launch-readiness-proof-types.js';

export function analyzeLaunchReadiness(input: {
  executionChainConnected: boolean;
  verificationProven: boolean;
  blockers: LaunchBlockerAssessment;
  acceptance: LaunchAcceptanceAssessment;
  simulation: LaunchSimulationAssessment;
  claimReality: ClaimRealityAssessment;
  fixture?: LaunchReadinessFixture;
}): LaunchReadinessAssessment {
  if (input.fixture?.forceReadinessState) {
    return {
      readOnly: true,
      readinessState: input.fixture.forceReadinessState,
      readinessScore: input.fixture.forceReadinessState === 'READY' ? 92 : 55,
      confidence: 85,
    };
  }

  if (
    !input.executionChainConnected ||
    !input.verificationProven ||
    hasCriticalBlockers(input.blockers) ||
    hasCriticalClaimViolations(input.claimReality) ||
    isAcceptanceRejected(input.acceptance.acceptanceState)
  ) {
    const blocked =
      isAcceptanceRejected(input.acceptance.acceptanceState) ||
      hasCriticalBlockers(input.blockers);
    return {
      readOnly: true,
      readinessState: blocked ? 'BLOCKED' : 'NOT_READY',
      readinessScore: Math.min(input.simulation.simulationScore, 50),
      confidence: 80,
    };
  }

  const hasWarnings =
    input.blockers.highCount > 0 ||
    input.acceptance.acceptanceState === 'CONDITIONAL' ||
    input.simulation.simulationScore < 85;

  let readinessState: LaunchReadinessState = 'READY';
  if (hasWarnings) readinessState = 'READY_WITH_WARNINGS';

  const readinessScore = Math.round(
    (input.simulation.simulationScore + (input.verificationProven ? 100 : 0)) / 2,
  );

  return {
    readOnly: true,
    readinessState,
    readinessScore,
    confidence: readinessState === 'READY' ? 90 : 75,
  };
}

export function isLaunchReadyState(state: LaunchReadinessState): boolean {
  return state === 'READY' || state === 'READY_WITH_WARNINGS';
}
