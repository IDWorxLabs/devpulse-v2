/**
 * Phase 26.46 — Product readiness simulation runtime budget safeguards (V1).
 */

export const PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS =
  'PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS';

export const SIMULATION_SLOW_THRESHOLD_MS = 15_000;
export const SIMULATION_STALLED_THRESHOLD_MS = 45_000;
export const SIMULATION_BUDGET_MS = 60_000;
/** Soft warning when a single chat stress scenario exceeds this duration. */
export const CHAT_STRESS_SCENARIO_SOFT_WARNING_MS = 8_000;
/** Hard timeout — scenario must settle as TIMEOUT after this duration. */
export const CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS = 15_000;
/** Grace after hard timeout before Stage 2 pending stall is flagged. */
export const CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS = 2_000;
export const DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS = 12;
export const CHAT_STRESS_SCENARIOS_HARD_CAP = 60;

export type SimulationRuntimeHealth =
  | 'HEALTHY'
  | 'SIMULATION_SLOW'
  | 'SIMULATION_STALLED'
  | 'SIMULATION_BUDGET_EXCEEDED';

export interface SimulationBudgetSnapshot {
  readOnly: true;
  startedAtMs: number;
  elapsedMs: number;
  budgetMs: number;
  health: SimulationRuntimeHealth;
  reason: string | null;
  budgetExceeded: boolean;
}

export interface SimulationBudgetOptions {
  budgetMs?: number;
  slowThresholdMs?: number;
  stalledThresholdMs?: number;
  startedAtMs?: number;
}

export function resolveEffectiveChatStressMaxScenarios(
  requested: number | undefined,
  context: 'founder-test' | 'full' = 'founder-test',
): number {
  const registryCap = CHAT_STRESS_SCENARIOS_HARD_CAP;
  if (requested != null && requested > 0) {
    return Math.min(Math.max(1, Math.round(requested)), registryCap);
  }
  if (context === 'founder-test') {
    return DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS;
  }
  return registryCap;
}

export function createSimulationBudgetTracker(options: SimulationBudgetOptions = {}): {
  snapshot: (nowMs?: number) => SimulationBudgetSnapshot;
  isBudgetExceeded: (nowMs?: number) => boolean;
  remainingMs: (nowMs?: number) => number;
} {
  const startedAtMs = options.startedAtMs ?? Date.now();
  const budgetMs = options.budgetMs ?? SIMULATION_BUDGET_MS;
  const slowThresholdMs = options.slowThresholdMs ?? SIMULATION_SLOW_THRESHOLD_MS;
  const stalledThresholdMs = options.stalledThresholdMs ?? SIMULATION_STALLED_THRESHOLD_MS;

  function elapsedMs(nowMs = Date.now()): number {
    return Math.max(0, nowMs - startedAtMs);
  }

  function healthFor(nowMs = Date.now()): SimulationRuntimeHealth {
    const elapsed = elapsedMs(nowMs);
    if (elapsed >= budgetMs) return 'SIMULATION_BUDGET_EXCEEDED';
    if (elapsed >= stalledThresholdMs) return 'SIMULATION_STALLED';
    if (elapsed >= slowThresholdMs) return 'SIMULATION_SLOW';
    return 'HEALTHY';
  }

  return {
    snapshot(nowMs = Date.now()) {
      const elapsed = elapsedMs(nowMs);
      const health = healthFor(nowMs);
      const budgetExceeded = elapsed >= budgetMs;
      let reason: string | null = null;
      if (budgetExceeded) {
        reason = `Simulation budget exceeded after ${Math.round(elapsed / 1000)}s (limit ${Math.round(budgetMs / 1000)}s)`;
      } else if (health === 'SIMULATION_STALLED') {
        reason = `Simulation stalled — ${Math.round(elapsed / 1000)}s elapsed without completion`;
      } else if (health === 'SIMULATION_SLOW') {
        reason = `Simulation running slow — ${Math.round(elapsed / 1000)}s elapsed`;
      }
      return {
        readOnly: true,
        startedAtMs,
        elapsedMs: elapsed,
        budgetMs,
        health,
        reason,
        budgetExceeded,
      };
    },
    isBudgetExceeded(nowMs = Date.now()) {
      return elapsedMs(nowMs) >= budgetMs;
    },
    remainingMs(nowMs = Date.now()) {
      return Math.max(0, budgetMs - elapsedMs(nowMs));
    },
  };
}

export async function withScenarioTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
