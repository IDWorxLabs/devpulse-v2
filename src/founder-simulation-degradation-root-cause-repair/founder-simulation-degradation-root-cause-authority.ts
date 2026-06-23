/**
 * Phase 27.02 — Founder Simulation Degradation Root Cause authority (V1).
 * Read-only diagnostic orchestrator. No nested validators.
 */

import { createHash } from 'node:crypto';
import { getFounderTestRuntimeStatus } from '../founder-test-runtime-monitor/index.js';
import {
  mergeAuthorityProfiles,
  profileAuthorityRuntimeFromTrace,
} from './authority-runtime-profiler.js';
import {
  classifyDegradationRootCauses,
  resolveWarningCompletionAuthority,
} from './degradation-root-cause-classifier.js';
import { planDegradationRepair } from './degradation-repair-planner.js';
import {
  FOUNDER_SIMULATION_DEGRADATION_CACHE_KEY_PREFIX,
  FOUNDER_SIMULATION_DEGRADATION_CORE_QUESTION,
  FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS,
} from './founder-simulation-degradation-root-cause-registry.js';
import {
  recordFounderSimulationDegradationReport,
  resetFounderSimulationDegradationHistoryForTests,
} from './founder-simulation-degradation-history.js';
import {
  detectSimulationDegradationSignals,
  isDegradedSimulation,
} from './simulation-degradation-detector.js';
import {
  profileFounderSimulationStages,
  resolveTotalSimulationRuntimeMs,
} from './founder-simulation-stage-profiler.js';
import { profileSubstepRuntime } from './substep-runtime-profiler.js';
import type {
  AssessFounderSimulationDegradationRootCauseInput,
  FounderSimulationDegradationRootCauseAssessment,
  FounderSimulationDegradationRootCauseReport,
} from './founder-simulation-degradation-root-cause-types.js';

let investigationCounter = 0;

export function resetFounderSimulationDegradationRootCauseCounterForTests(): void {
  investigationCounter = 0;
}

export function resetFounderSimulationDegradationRootCauseModuleForTests(): void {
  resetFounderSimulationDegradationRootCauseCounterForTests();
  resetFounderSimulationDegradationHistoryForTests();
}

function nextInvestigationId(): string {
  investigationCounter += 1;
  return `founder-simulation-degradation-${investigationCounter}-${Date.now()}`;
}

function stableCacheKey(investigationId: string, passed: boolean): string {
  const digest = createHash('sha256')
    .update([FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS, investigationId, String(passed)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_SIMULATION_DEGRADATION_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessFounderSimulationDegradationRootCause(
  input: AssessFounderSimulationDegradationRootCauseInput = {},
): FounderSimulationDegradationRootCauseAssessment {
  const investigationId = nextInvestigationId();
  const generatedAt = new Date().toISOString();
  const snapshot = input.runtimeSnapshot ?? getFounderTestRuntimeStatus();
  const runId = input.runId ?? snapshot.runId;

  const totalSimulationRuntimeMs = resolveTotalSimulationRuntimeMs({
    snapshot,
    simulationElapsedMs: input.simulationElapsedMs,
  });

  const stageProfiles = profileFounderSimulationStages({
    snapshot,
    runId,
    totalRuntimeMs: totalSimulationRuntimeMs,
  });

  const traceProfiles = profileAuthorityRuntimeFromTrace({
    traceEvents: snapshot.traceEvents,
    runId,
    totalRuntimeMs: totalSimulationRuntimeMs,
  });

  const authorityProfiles = mergeAuthorityProfiles(
    stageProfiles,
    traceProfiles,
    totalSimulationRuntimeMs,
  );

  const substepProfiles = profileSubstepRuntime({
    traceEvents: snapshot.traceEvents,
    totalRuntimeMs: totalSimulationRuntimeMs,
  });

  const degradationSignals = detectSimulationDegradationSignals({
    snapshot,
    completionEventId: input.completionEventId ?? null,
    degraded: input.degraded,
    budgetExceeded: input.budgetExceeded,
    errorMessage: input.errorMessage ?? null,
    payloadGuardDegraded: input.payloadGuardDegraded,
    simulationElapsedMs: input.simulationElapsedMs,
  });

  const degraded = isDegradedSimulation({
    completionEventId: input.completionEventId ?? null,
    degraded: input.degraded,
    signals: degradationSignals,
  });

  const slowestAuthority = authorityProfiles[0] ?? null;
  const slowestSubstep = substepProfiles[0] ?? null;
  const warningCompletionAuthority = resolveWarningCompletionAuthority(degradationSignals);

  const findings = classifyDegradationRootCauses({
    signals: degradationSignals,
    slowestAuthority,
    slowestSubstep,
    warningCompletionAuthority,
    totalRuntimeMs: totalSimulationRuntimeMs,
  });

  const repairPlan = planDegradationRepair({
    findings,
    slowestAuthority,
    slowestSubstep,
    warningCompletionAuthority,
    totalRuntimeMs: totalSimulationRuntimeMs,
  });

  const timelineCaptured =
    authorityProfiles.length > 0 &&
    substepProfiles.length >= 0 &&
    Boolean(snapshot.traceEvents.length || snapshot.stages.some((s) => s.durationMs));

  const pass =
    timelineCaptured &&
    slowestAuthority !== null &&
    findings.length > 0 &&
    Boolean(repairPlan.primaryBottleneckAuthority || repairPlan.warningCompletionAuthority);

  const report: FounderSimulationDegradationRootCauseReport = {
    readOnly: true,
    investigationId,
    generatedAt,
    coreQuestion: FOUNDER_SIMULATION_DEGRADATION_CORE_QUESTION,
    runId,
    completionEventId: input.completionEventId ?? null,
    degraded,
    totalSimulationRuntimeMs,
    authorityProfiles,
    substepProfiles,
    degradationSignals,
    findings,
    repairPlan,
    slowestAuthority,
    slowestSubstep,
    timelineCaptured,
    passToken: pass ? FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_REPAIR_PASS : null,
  };

  if (!input.skipHistoryRecording) {
    recordFounderSimulationDegradationReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_SIMULATION_DEGRADATION_ROOT_CAUSE_COMPLETE',
    report,
    cacheKey: stableCacheKey(investigationId, pass),
  };
}

export function applyFounderSimulationDegradationRootCauseSync(input: {
  runtimeSnapshot?: AssessFounderSimulationDegradationRootCauseInput['runtimeSnapshot'];
  simulationElapsedMs?: number;
  completionEventId?: AssessFounderSimulationDegradationRootCauseInput['completionEventId'];
  degraded?: boolean;
  budgetExceeded?: boolean;
  errorMessage?: string | null;
  payloadGuardDegraded?: boolean;
  runId?: string | null;
  skipHistoryRecording?: boolean;
}): {
  readOnly: true;
  assessment: FounderSimulationDegradationRootCauseAssessment;
} {
  const assessment = assessFounderSimulationDegradationRootCause({
    runtimeSnapshot: input.runtimeSnapshot,
    simulationElapsedMs: input.simulationElapsedMs,
    completionEventId: input.completionEventId,
    degraded: input.degraded,
    budgetExceeded: input.budgetExceeded,
    errorMessage: input.errorMessage,
    payloadGuardDegraded: input.payloadGuardDegraded,
    runId: input.runId,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });

  return { readOnly: true, assessment };
}
