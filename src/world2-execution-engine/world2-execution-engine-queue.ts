/**
 * World 2 Execution Engine — bounded step queue.
 * No recursive runs, no unbounded loops.
 */

import {
  MAX_QUEUED_STEPS,
  MAX_RUN_DURATION_MS,
  MAX_SIMULATED_STEPS,
} from './world2-execution-engine-registry.js';
import type {
  World2ExecutionQueueSnapshot,
  World2ExecutionStep,
} from './world2-execution-engine-types.js';

const activeRunIds = new Set<string>();

export function resetWorld2ExecutionEngineQueueForTests(): void {
  activeRunIds.clear();
}

export function registerEngineRun(engineRunId: string): boolean {
  if (activeRunIds.has(engineRunId)) {
    return false;
  }
  activeRunIds.add(engineRunId);
  return true;
}

export function unregisterEngineRun(engineRunId: string): void {
  activeRunIds.delete(engineRunId);
}

export function isRecursiveRunBlocked(engineRunId: string): boolean {
  return activeRunIds.has(engineRunId);
}

export function enqueueWorld2ExecutionSteps(
  engineRunId: string,
  steps: World2ExecutionStep[],
): { steps: World2ExecutionStep[]; truncated: boolean } {
  registerEngineRun(engineRunId);

  const capped = steps.slice(0, MAX_QUEUED_STEPS);
  return {
    steps: capped,
    truncated: steps.length > MAX_QUEUED_STEPS,
  };
}

export function countSimulatedSteps(steps: World2ExecutionStep[]): number {
  return steps.filter((step) => step.status === 'SIMULATED' || step.status === 'COMPLETED_DRY_RUN')
    .length;
}

export function enforceSimulatedStepCap(steps: World2ExecutionStep[]): {
  steps: World2ExecutionStep[];
  capped: boolean;
} {
  let simulated = 0;
  const out: World2ExecutionStep[] = [];

  for (const step of steps) {
    const isSimulated =
      step.status === 'SIMULATED' || step.status === 'COMPLETED_DRY_RUN';
    if (isSimulated) {
      simulated += 1;
      if (simulated > MAX_SIMULATED_STEPS) {
        out.push({ ...step, status: 'SKIPPED' });
        continue;
      }
    }
    out.push(step);
  }

  return { steps: out, capped: simulated > MAX_SIMULATED_STEPS };
}

export function buildWorld2ExecutionQueueSnapshot(
  steps: World2ExecutionStep[],
): World2ExecutionQueueSnapshot {
  return {
    readOnly: true,
    queuedStepCount: steps.filter((s) => s.status === 'QUEUED' || s.status === 'READY').length,
    simulatedStepCount: countSimulatedSteps(steps),
    maxQueuedSteps: MAX_QUEUED_STEPS,
    maxSimulatedSteps: MAX_SIMULATED_STEPS,
    maxRunDurationMs: MAX_RUN_DURATION_MS,
    recursiveRunBlocked: true,
  };
}
