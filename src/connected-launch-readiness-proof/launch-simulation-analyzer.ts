/**
 * Launch Simulation Analyzer — aggregate simulated real-world readiness.
 */

import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ProductReadinessReport } from '../founder-test-product-readiness/product-readiness-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { LaunchSimulationAssessment } from './connected-launch-readiness-proof-types.js';

export function analyzeLaunchSimulation(input: {
  productReadiness: ProductReadinessReport | null;
  chatStress: ChatStressSimulationReport | null;
  founderTest: FounderTestAssessment | null;
}): LaunchSimulationAssessment {
  const scores: number[] = [];
  const topFailures: string[] = [];
  let coverage = 0;

  if (input.productReadiness) {
    scores.push(input.productReadiness.readinessScore);
    coverage += 1;
    if (input.productReadiness.launchBlocked) {
      topFailures.push(
        `Product readiness: ${input.productReadiness.verdict} (${input.productReadiness.readinessScore}/100)`,
      );
    }
    topFailures.push(...input.productReadiness.selfEvolution.topMissingCapabilities.slice(0, 2));
  }

  if (input.chatStress) {
    scores.push(input.chatStress.overallScore);
    coverage += 1;
    if (input.chatStress.chatBlocksLaunchReadiness) {
      topFailures.push(`Chat stress: ${input.chatStress.failedCount} failed scenarios`);
    }
  }

  if (input.founderTest) {
    scores.push(input.founderTest.score.overall);
    coverage += 1;
    const weak = input.founderTest.run.authorityResults.filter((r) => r.normalizedScore < 70);
    for (const w of weak.slice(0, 2)) {
      topFailures.push(`${w.displayName}: ${w.normalizedScore}/100`);
    }
  }

  const simulationScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    readOnly: true,
    simulationCoverage: coverage,
    simulationScore,
    topFailures: topFailures.slice(0, 6),
    confidence: coverage >= 2 ? 85 : coverage === 1 ? 60 : 0,
  };
}
