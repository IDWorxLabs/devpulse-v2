/**
 * Chat Stress Completion Tracker — scenario lifecycle barrier for Stage 2 (V1).
 * Phase 26.54 — hard watchdog + idempotent settlement.
 * Phase 26.56 — watchdog runtime firing + health reconciliation.
 */

export const CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS =
  'CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS';

export const CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_V1_PASS =
  'CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_V1_PASS';

export const CAP_05_HARD_SETTLEMENT_ESCALATION_V1_PASS =
  'CAP_05_HARD_SETTLEMENT_ESCALATION_V1_PASS';

export const CHAT_STRESS_WATCHDOG_RUNTIME_FIRING_REPAIR_V1_PASS =
  'CHAT_STRESS_WATCHDOG_RUNTIME_FIRING_REPAIR_V1_PASS';

export const CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON = 'BATCH_FINALIZER_TIMEOUT';

export type ChatStressScenarioLifecycleState = 'PENDING' | 'RUNNING' | 'SETTLED';

export type ChatStressScenarioTerminalStatus =
  | 'PASSED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'SKIPPED_WITH_REASON'
  | 'SKIPPED_BUDGET'
  | 'ERROR';

export interface ChatStressCompletionSnapshot {
  readOnly: true;
  inProgress: boolean;
  aggregateComplete: boolean;
  startedCount: number;
  settledCount: number;
  pendingCount: number;
  lastScenarioId: string | null;
  pendingScenarioIds: string[];
  activeScenarioId: string | null;
  lastSettledScenarioId: string | null;
  timeoutScenarioIds: string[];
  failedScenarioIds: string[];
  pendingWithoutActiveWorkerScenarioIds: string[];
  chatStressWatchdogArmedScenarioIds: string[];
  chatStressWatchdogDeadlineByScenarioId: Readonly<Record<string, number>>;
  chatStressWatchdogOverdueScenarioIds: string[];
  chatStressMaxPendingElapsedMs: number;
}

interface ScenarioRecord {
  started: boolean;
  settled: boolean;
  terminalStatus: ChatStressScenarioTerminalStatus | null;
  lastUpdateTimeMs: number;
}

interface WatchdogRecord {
  armedAtMs: number;
  deadlineMs: number;
  hardTimeoutMs: number;
  timer: ReturnType<typeof setTimeout>;
  onArmed?: (scenarioId: string, deadlineMs: number) => void;
  onFired?: (scenarioId: string) => void;
  fired: boolean;
}

let totalScenarios = 0;
let aggregateComplete = false;
let lastScenarioId: string | null = null;
let activeScenarioId: string | null = null;
let lastSettledScenarioId: string | null = null;
let orderedScenarioIds: string[] = [];
const timeoutScenarioIds: string[] = [];
const failedScenarioIds: string[] = [];
const scenarios = new Map<string, ScenarioRecord>();
const watchdogRecords = new Map<string, WatchdogRecord>();
let healthSweepInterval: ReturnType<typeof setInterval> | null = null;
const postWatchdogHealthReconcilers: Array<(nowMs: number) => void> = [];

const WATCHDOG_HEALTH_SWEEP_MS = 500;

export function registerChatStressPostWatchdogHealthReconciler(
  reconciler: (nowMs: number) => void,
): () => void {
  postWatchdogHealthReconcilers.push(reconciler);
  return () => {
    const index = postWatchdogHealthReconcilers.indexOf(reconciler);
    if (index >= 0) postWatchdogHealthReconcilers.splice(index, 1);
  };
}

export function clearChatStressPostWatchdogHealthReconcilers(): void {
  postWatchdogHealthReconcilers.length = 0;
}

export function resetChatStressCompletionTrackerForTests(): void {
  stopChatStressWatchdogHealthSweep();
  clearAllChatStressScenarioHardWatchdogs();
  totalScenarios = 0;
  aggregateComplete = false;
  lastScenarioId = null;
  activeScenarioId = null;
  lastSettledScenarioId = null;
  orderedScenarioIds = [];
  timeoutScenarioIds.length = 0;
  failedScenarioIds.length = 0;
  scenarios.clear();
  clearChatStressPostWatchdogHealthReconcilers();
}

export function beginChatStressSimulation(scenarioIds: readonly string[]): void {
  resetChatStressCompletionTrackerForTests();
  orderedScenarioIds = [...scenarioIds];
  totalScenarios = orderedScenarioIds.length;
}

export function setActiveChatStressScenario(scenarioId: string | null): void {
  activeScenarioId = scenarioId;
}

export function clearActiveChatStressScenarioIfMatches(scenarioId: string): void {
  if (activeScenarioId === scenarioId) {
    activeScenarioId = null;
  }
}

export function getChatStressTotalScenarios(): number {
  return totalScenarios;
}

export function listChatStressOrderedScenarioIds(): readonly string[] {
  return orderedScenarioIds;
}

export function isChatStressScenarioSettled(scenarioId: string): boolean {
  return scenarios.get(scenarioId)?.settled === true;
}

export function getChatStressScenarioLifecycleState(scenarioId: string): ChatStressScenarioLifecycleState {
  const entry = scenarios.get(scenarioId);
  if (entry?.settled) return 'SETTLED';
  if (entry?.started) return 'RUNNING';
  return 'PENDING';
}

export function getChatStressScenarioLastUpdateTimeMs(scenarioId: string): number | null {
  return scenarios.get(scenarioId)?.lastUpdateTimeMs ?? null;
}

export function getChatStressScenarioTerminalStatus(
  scenarioId: string,
): ChatStressScenarioTerminalStatus | null {
  return scenarios.get(scenarioId)?.terminalStatus ?? null;
}

export function listStartedChatStressScenarioIds(): readonly string[] {
  return orderedScenarioIds.filter((id) => scenarios.get(id)?.started === true);
}

export function markChatStressScenarioStarted(scenarioId: string): void {
  lastScenarioId = scenarioId;
  activeScenarioId = scenarioId;
  const existing = scenarios.get(scenarioId);
  if (existing?.started) return;
  scenarios.set(scenarioId, {
    started: true,
    settled: false,
    terminalStatus: null,
    lastUpdateTimeMs: Date.now(),
  });
}

function recordTerminalStatus(scenarioId: string, terminalStatus: ChatStressScenarioTerminalStatus): void {
  lastSettledScenarioId = scenarioId;
  if (terminalStatus === 'TIMEOUT' && !timeoutScenarioIds.includes(scenarioId)) {
    timeoutScenarioIds.push(scenarioId);
  }
  if (
    (terminalStatus === 'FAILED' || terminalStatus === 'ERROR') &&
    !failedScenarioIds.includes(scenarioId)
  ) {
    failedScenarioIds.push(scenarioId);
  }
  if (activeScenarioId === scenarioId) {
    activeScenarioId = null;
  }
}

export function tryMarkChatStressScenarioSettled(
  scenarioId: string,
  terminalStatus: ChatStressScenarioTerminalStatus,
): { accepted: boolean; duplicate: boolean; previousStatus: ChatStressScenarioTerminalStatus | null } {
  const existing = scenarios.get(scenarioId);
  if (existing?.settled) {
    return {
      accepted: false,
      duplicate: true,
      previousStatus: existing.terminalStatus,
    };
  }
  lastScenarioId = scenarioId;
  scenarios.set(scenarioId, {
    started: true,
    settled: true,
    terminalStatus,
    lastUpdateTimeMs: Date.now(),
  });
  recordTerminalStatus(scenarioId, terminalStatus);
  clearChatStressScenarioHardWatchdog(scenarioId);
  return { accepted: true, duplicate: false, previousStatus: null };
}

export function markChatStressScenarioSettled(
  scenarioId: string,
  terminalStatus: ChatStressScenarioTerminalStatus,
): void {
  tryMarkChatStressScenarioSettled(scenarioId, terminalStatus);
}

export function markChatStressScenarioSkippedBudget(scenarioId: string): void {
  if (isChatStressScenarioSettled(scenarioId)) return;
  clearChatStressScenarioHardWatchdog(scenarioId);
  lastScenarioId = scenarioId;
  scenarios.set(scenarioId, {
    started: false,
    settled: true,
    terminalStatus: 'SKIPPED_BUDGET',
    lastUpdateTimeMs: Date.now(),
  });
  recordTerminalStatus(scenarioId, 'SKIPPED_BUDGET');
}

export function markChatStressScenarioSkippedWithReason(
  scenarioId: string,
  _reason: string,
): void {
  tryMarkChatStressScenarioSettled(scenarioId, 'SKIPPED_WITH_REASON');
}

function fireWatchdogForScenario(scenarioId: string, record: WatchdogRecord): void {
  if (isChatStressScenarioSettled(scenarioId)) {
    clearChatStressScenarioHardWatchdog(scenarioId);
    return;
  }
  if (!record.fired) {
    record.fired = true;
    record.onFired?.(scenarioId);
  }
  if (!isChatStressScenarioSettled(scenarioId)) {
    tryMarkChatStressScenarioSettled(scenarioId, 'TIMEOUT');
  }
  if (isChatStressScenarioSettled(scenarioId)) {
    clearChatStressScenarioHardWatchdog(scenarioId);
  }
}

function ensureWatchdogHealthSweep(): void {
  if (healthSweepInterval != null) return;
  healthSweepInterval = setInterval(() => {
    reconcileChatStressWatchdogHealth(Date.now());
  }, WATCHDOG_HEALTH_SWEEP_MS);
  healthSweepInterval.unref?.();
}

export function stopChatStressWatchdogHealthSweep(): void {
  if (healthSweepInterval != null) {
    clearInterval(healthSweepInterval);
    healthSweepInterval = null;
  }
}

export function registerChatStressScenarioHardWatchdog(input: {
  scenarioId: string;
  timeoutMs: number;
  onArmed?: (scenarioId: string, deadlineMs: number) => void;
  onFired?: (scenarioId: string) => void;
}): { armedAtMs: number; deadlineMs: number } {
  clearChatStressScenarioHardWatchdog(input.scenarioId);
  const armedAtMs = Date.now();
  const deadlineMs = armedAtMs + input.timeoutMs;
  const timer = setTimeout(() => {
    const record = watchdogRecords.get(input.scenarioId);
    if (!record || isChatStressScenarioSettled(input.scenarioId)) return;
    fireWatchdogForScenario(input.scenarioId, record);
  }, input.timeoutMs);
  timer.unref?.();

  watchdogRecords.set(input.scenarioId, {
    armedAtMs,
    deadlineMs,
    hardTimeoutMs: input.timeoutMs,
    timer,
    onArmed: input.onArmed,
    onFired: input.onFired,
    fired: false,
  });

  input.onArmed?.(input.scenarioId, deadlineMs);
  ensureWatchdogHealthSweep();
  return { armedAtMs, deadlineMs };
}

export function clearChatStressScenarioHardWatchdog(scenarioId: string): void {
  const record = watchdogRecords.get(scenarioId);
  if (record) {
    clearTimeout(record.timer);
    watchdogRecords.delete(scenarioId);
  }
}

export function clearAllChatStressScenarioHardWatchdogs(): void {
  for (const record of watchdogRecords.values()) {
    clearTimeout(record.timer);
  }
  watchdogRecords.clear();
}

export function reconcileChatStressWatchdogHealth(nowMs = Date.now()): string[] {
  const firedScenarioIds: string[] = [];

  for (const [scenarioId, record] of watchdogRecords.entries()) {
    if (isChatStressScenarioSettled(scenarioId)) {
      clearChatStressScenarioHardWatchdog(scenarioId);
      continue;
    }
    if (nowMs >= record.deadlineMs) {
      fireWatchdogForScenario(scenarioId, record);
      firedScenarioIds.push(scenarioId);
    }
  }

  const snap = buildChatStressCompletionSnapshot(nowMs);
  for (const scenarioId of snap.pendingWithoutActiveWorkerScenarioIds) {
    if (isChatStressScenarioSettled(scenarioId)) continue;
    const record = watchdogRecords.get(scenarioId);
    if (record && nowMs >= record.deadlineMs) {
      fireWatchdogForScenario(scenarioId, record);
      if (!firedScenarioIds.includes(scenarioId)) {
        firedScenarioIds.push(scenarioId);
      }
      continue;
    }
    if (!record && scenarios.get(scenarioId)?.started && !isChatStressScenarioSettled(scenarioId)) {
      tryMarkChatStressScenarioSettled(scenarioId, 'TIMEOUT');
      firedScenarioIds.push(scenarioId);
    }
  }

  for (const reconciler of postWatchdogHealthReconcilers) {
    reconciler(nowMs);
  }

  return firedScenarioIds;
}

export function forceSettlePendingStartedChatStressScenarios(
  reason: string,
): Array<{ scenarioId: string; reason: string }> {
  reconcileChatStressWatchdogHealth(Date.now());
  const forced: Array<{ scenarioId: string; reason: string }> = [];
  for (const scenarioId of orderedScenarioIds) {
    const entry = scenarios.get(scenarioId);
    if (entry?.started && !entry.settled) {
      const record = watchdogRecords.get(scenarioId);
      if (record) {
        fireWatchdogForScenario(scenarioId, record);
      }
      if (!isChatStressScenarioSettled(scenarioId)) {
        tryMarkChatStressScenarioSettled(scenarioId, 'TIMEOUT');
        if (isChatStressScenarioSettled(scenarioId)) {
          forced.push({ scenarioId, reason: `${reason} (force TIMEOUT settle)` });
        } else {
          forced.push({ scenarioId, reason });
        }
      }
    } else if (!entry?.settled) {
      markChatStressScenarioSkippedBudget(scenarioId);
      forced.push({ scenarioId, reason: `${reason} (never started)` });
    }
  }
  return forced;
}

export function formatChatStressPendingStallReason(snapshot: ChatStressCompletionSnapshot): string {
  if (snapshot.pendingCount <= 0) {
    return `Chat stress simulation waiting on pending scenarios (${snapshot.pendingCount} unsettled)`;
  }
  const base = `Chat stress simulation waiting on pending scenarios: ${snapshot.pendingScenarioIds.join(', ')}`;
  if (snapshot.pendingWithoutActiveWorkerScenarioIds.length === 0) {
    return base;
  }
  const overdueSuffix =
    snapshot.chatStressWatchdogOverdueScenarioIds.length > 0
      ? ` — overdue: ${snapshot.chatStressWatchdogOverdueScenarioIds.join(', ')}`
      : '';
  return (
    `${base} (${snapshot.pendingWithoutActiveWorkerScenarioIds.join(', ')} pending without active worker — watchdog will force TIMEOUT${overdueSuffix})`
  );
}

export function markChatStressSimulationAggregateComplete(): void {
  aggregateComplete = true;
  activeScenarioId = null;
  stopChatStressWatchdogHealthSweep();
  clearAllChatStressScenarioHardWatchdogs();
}

function buildChatStressCompletionSnapshot(nowMs = Date.now()): ChatStressCompletionSnapshot {
  const startedCount = [...scenarios.values()].filter((entry) => entry.started).length;
  const settledCount = [...scenarios.values()].filter((entry) => entry.settled).length;
  const pendingScenarioIds = orderedScenarioIds.filter((id) => {
    const entry = scenarios.get(id);
    return !entry || !entry.settled;
  });
  const pendingCount = pendingScenarioIds.length;
  const pendingWithoutActiveWorkerScenarioIds = pendingScenarioIds.filter(
    (id) => activeScenarioId == null || id !== activeScenarioId,
  );

  const chatStressWatchdogArmedScenarioIds = [...watchdogRecords.keys()].filter(
    (id) => !isChatStressScenarioSettled(id),
  );
  const chatStressWatchdogDeadlineByScenarioId: Record<string, number> = {};
  const chatStressWatchdogOverdueScenarioIds: string[] = [];
  let chatStressMaxPendingElapsedMs = 0;

  for (const scenarioId of chatStressWatchdogArmedScenarioIds) {
    const record = watchdogRecords.get(scenarioId)!;
    chatStressWatchdogDeadlineByScenarioId[scenarioId] = record.deadlineMs;
    if (nowMs >= record.deadlineMs) {
      chatStressWatchdogOverdueScenarioIds.push(scenarioId);
    }
  }

  for (const scenarioId of pendingScenarioIds) {
    const record = watchdogRecords.get(scenarioId);
    const elapsedMs = record ? Math.max(0, nowMs - record.armedAtMs) : 0;
    if (elapsedMs > chatStressMaxPendingElapsedMs) {
      chatStressMaxPendingElapsedMs = elapsedMs;
    }
    if (!record && scenarios.get(scenarioId)?.started) {
      chatStressWatchdogOverdueScenarioIds.push(scenarioId);
    }
  }

  return {
    readOnly: true,
    inProgress: totalScenarios > 0 && !aggregateComplete,
    aggregateComplete,
    startedCount,
    settledCount,
    pendingCount,
    lastScenarioId,
    pendingScenarioIds,
    activeScenarioId,
    lastSettledScenarioId,
    timeoutScenarioIds: [...timeoutScenarioIds],
    failedScenarioIds: [...failedScenarioIds],
    pendingWithoutActiveWorkerScenarioIds,
    chatStressWatchdogArmedScenarioIds,
    chatStressWatchdogDeadlineByScenarioId,
    chatStressWatchdogOverdueScenarioIds: [...new Set(chatStressWatchdogOverdueScenarioIds)],
    chatStressMaxPendingElapsedMs,
  };
}

export function getChatStressCompletionSnapshot(nowMs?: number): ChatStressCompletionSnapshot {
  reconcileChatStressWatchdogHealth(nowMs ?? Date.now());
  return buildChatStressCompletionSnapshot(nowMs ?? Date.now());
}

export function allStartedChatStressScenariosSettled(): boolean {
  return allChatStressScenariosSettled();
}

export function allChatStressScenariosSettled(): boolean {
  if (totalScenarios <= 0) return true;
  return orderedScenarioIds.every((id) => scenarios.get(id)?.settled === true);
}

export function resolveChatStressScenarioTerminalStatus(run: {
  timedOut?: boolean;
  skipped?: boolean;
  skipReason?: string | null;
  passed?: boolean;
}): ChatStressScenarioTerminalStatus {
  if (run.skipped) {
    return run.skipReason?.includes('BUDGET') ? 'SKIPPED_BUDGET' : 'SKIPPED_WITH_REASON';
  }
  if (run.timedOut) return 'TIMEOUT';
  if (run.skipReason) return 'ERROR';
  if (run.passed === false) return 'FAILED';
  return 'PASSED';
}

export function shouldFlagChatStressPendingStage2Gap(input: {
  pendingCount: number;
  chatStressWatchdogOverdueScenarioIds: readonly string[];
  chatStressMaxPendingElapsedMs: number;
  hardTimeoutMs: number;
  graceMs: number;
  secondsSinceLastHeartbeat: number;
}): boolean {
  if (input.pendingCount <= 0) return false;
  if (input.chatStressWatchdogOverdueScenarioIds.length > 0) {
    return input.secondsSinceLastHeartbeat >= 3;
  }
  const stallAfterMs = input.hardTimeoutMs + input.graceMs;
  return input.chatStressMaxPendingElapsedMs >= stallAfterMs && input.secondsSinceLastHeartbeat >= 3;
}
