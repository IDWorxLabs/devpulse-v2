/**
 * Founder Simulation Engine — orchestrator for full founder test simulation (V1).
 */

import { resetUploadStorageForTests } from '../upload-system/index.js';
import { mergeSystemIntegrationProofs } from './cross-system-proof-analyzer.js';
import { resetFounderJourneyCounterForTests, simulateFounderJourney } from './founder-journey-simulator.js';
import {
  getFounderSimulationResults,
  recordFounderSimulationResult,
  resetFounderSimulationHistoryForTests,
} from './founder-simulation-history.js';
import {
  buildFounderSimulationEngineReport,
  buildFounderSimulationEngineReportMarkdown,
} from './founder-simulation-report-builder.js';
import { MAX_FOUNDER_SIMULATION_RUNTIME_MS } from './founder-simulation-registry.js';
import { getFounderSimulationScenarios } from './simulation-scenario-library.js';
import { resetSimulationFailureCounterForTests } from './simulation-failure-analyzer.js';
import type {
  FounderReadinessCategory,
  FounderSimulationEngineReport,
  FounderSimulationResult,
  FounderSimulationRun,
  RunFounderSimulationInput,
} from './founder-simulation-types.js';

const progressLog: string[] = [];

export function resetFounderSimulationEngineModuleForTests(): void {
  resetFounderJourneyCounterForTests();
  resetSimulationFailureCounterForTests();
  resetFounderSimulationHistoryForTests();
  resetUploadStorageForTests();
  progressLog.length = 0;
}

export function getFounderSimulationProgressLog(): readonly string[] {
  return [...progressLog];
}

function mapAggregateCategory(score: number): FounderReadinessCategory {
  if (score >= 95) return 'READY_FOR_EXECUTION_GATE';
  if (score >= 85) return 'READY_FOR_BUILD_PLAN';
  if (score >= 70) return 'READY_FOR_PLANNING';
  if (score >= 40) return 'NEEDS_CLARIFICATION';
  return 'NOT_READY';
}

function buildRecommendations(results: readonly FounderSimulationResult[]): string[] {
  const recs = new Set<string>();
  for (const result of results) {
    for (const failure of result.failureAnalysis) {
      recs.add(failure.recommendedFix);
    }
    if (result.finalVerdict === 'NEEDS_CLARIFICATION') {
      recs.add('Improve intake clarity and resolve evidence conflicts before planning.');
    }
  }
  if (results.some((r) => r.finalVerdict === 'READY_FOR_BUILD_PLAN' || r.finalVerdict === 'READY_FOR_EXECUTION_GATE')) {
    recs.add('Strong scenarios reached build plan — validate execution gate before autonomous building.');
  }
  return [...recs].slice(0, 8);
}

export function runFounderSimulation(input: RunFounderSimulationInput = {}): FounderSimulationRun {
  const startedAt = Date.now();
  const scenarios = input.scenarios ?? getFounderSimulationScenarios();
  const log = (message: string) => {
    progressLog.push(message);
    input.progressLogger?.(message);
  };

  if (scenarios.length === 0) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'FOUNDER_SIMULATION_ENGINE_FAILED',
      results: [],
      report: null,
      failureReason: 'NO_SCENARIOS',
    };
  }

  const results: FounderSimulationResult[] = [];

  for (const scenario of scenarios) {
    if (Date.now() - startedAt > MAX_FOUNDER_SIMULATION_RUNTIME_MS) {
      log('Simulation runtime budget exceeded — stopping remaining scenarios');
      break;
    }
    const result = simulateFounderJourney({
      scenario,
      log,
      applyAlignmentRepair: input.applyAlignmentRepair ?? true,
    });
    results.push(result);
    if (!input.skipHistoryRecording) {
      recordFounderSimulationResult(result);
    }
  }

  if (results.length === 0) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'FOUNDER_SIMULATION_ENGINE_FAILED',
      results: [],
      report: null,
      failureReason: 'NO_RESULTS',
    };
  }

  const aggregateReadinessScore = Math.round(
    results.reduce((sum, r) => sum + r.readinessScore, 0) / results.length,
  );
  const systemIntegrationProof = mergeSystemIntegrationProofs(results.map((r) => r.systemIntegrationProof));
  const recommendations = buildRecommendations(results);
  const nextBestAction =
    results.find((r) => r.finalVerdict === 'NOT_READY')?.nextBestAction ??
    results.find((r) => r.finalVerdict === 'NEEDS_CLARIFICATION')?.nextBestAction ??
    results[0]?.nextBestAction ??
    'Review simulation report and confirm founder priorities.';

  const report = buildFounderSimulationEngineReport({
    results,
    aggregateReadinessScore,
    aggregateReadinessCategory: mapAggregateCategory(aggregateReadinessScore),
    systemIntegrationProof,
    recommendations,
    nextBestAction,
    alignmentImpacts: results
      .map((r) => r.alignmentImpact)
      .filter((impact): impact is NonNullable<typeof impact> => impact != null),
  });

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_SIMULATION_ENGINE_COMPLETE',
    results,
    report,
    failureReason: null,
  };
}

/** Simulates founder pressing "Run Founder Test" — one-button full journey. */
export function runFounderTestButtonSimulation(input: RunFounderSimulationInput = {}): FounderSimulationRun {
  logProgress('Founder Test button pressed — starting full readiness simulation');
  return runFounderSimulation(input);
}

function logProgress(message: string): void {
  progressLog.push(message);
}

export function buildFounderSimulationEngineArtifacts(input: {
  results?: readonly FounderSimulationResult[];
  report?: FounderSimulationEngineReport | null;
} = {}): { report: FounderSimulationEngineReport; markdown: string } {
  const storedResults = input.results ?? getFounderSimulationResults();
  const report =
    input.report ??
    buildFounderSimulationEngineReport({
      results: storedResults,
      aggregateReadinessScore:
        storedResults.length === 0
          ? 0
          : Math.round(storedResults.reduce((s, r) => s + r.readinessScore, 0) / storedResults.length),
      aggregateReadinessCategory:
        storedResults.length === 0
          ? 'NOT_READY'
          : mapAggregateCategory(
              Math.round(storedResults.reduce((s, r) => s + r.readinessScore, 0) / storedResults.length),
            ),
      systemIntegrationProof: mergeSystemIntegrationProofs(storedResults.map((r) => r.systemIntegrationProof)),
      recommendations: buildRecommendations(storedResults),
      nextBestAction: storedResults[0]?.nextBestAction ?? 'Run founder simulation.',
    });

  return {
    report,
    markdown: buildFounderSimulationEngineReportMarkdown(report),
  };
}
