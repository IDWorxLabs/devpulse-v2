/**
 * Chat Stress Completion Tracker — scenario lifecycle barrier for Stage 2 (V1).
 * Phase 26.54 — hard watchdog + idempotent settlement.
 * Phase 26.56 — watchdog runtime firing + health reconciliation.
 */

import {
  CHAT_STRESS_DEFAULT_CONCURRENCY,
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
  resolveChatStressWorstCaseBatchDeadlineMs,
} from '../founder-test-product-readiness/product-readiness-simulation-budget.js';

export const CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS =
  'CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS';

export const CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_V1_PASS =
  'CHAT_STRESS_SCENARIO_SETTLEMENT_REPAIR_V1_PASS';

export const CAP_05_HARD_SETTLEMENT_ESCALATION_V1_PASS =
  'CAP_05_HARD_SETTLEMENT_ESCALATION_V1_PASS';

export const CHAT_STRESS_WATCHDOG_RUNTIME_FIRING_REPAIR_V1_PASS =
  'CHAT_STRESS_WATCHDOG_RUNTIME_FIRING_REPAIR_V1_PASS';

export const CHAT_STRESS_BATCH_FINALIZER_TIMEOUT_REASON = 'BATCH_FINALIZER_TIMEOUT';

export const CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_V1_PASS =
  'CHAT_STRESS_CONCURRENT_ACTIVE_WORKER_TRACKING_REPAIR_V1_PASS';

export const CHAT_STRESS_BATCH_DEADLINE_EXCEEDED_REASON = 'CHAT_STRESS_BATCH_DEADLINE_EXCEEDED';

export const CHAT_STRESS_TERMINAL_SETTLEMENT_SWEEP_V1_PASS =
  'CHAT_STRESS_TERMINAL_SETTLEMENT_SWEEP_V1_PASS';

export const CHAT_STRESS_TERMINAL_SETTLEMENT_SWEEP_REASON =
  'CHAT_STRESS_TERMINAL_SETTLEMENT_SWEEP';

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
  /** Compatibility — most recently started active scenario; not used for concurrency decisions. */
  activeScenarioId: string | null;
  activeScenarioIds: readonly string[];
  activeScenarioCount: number;
  lastSettledScenarioId: string | null;
  timeoutScenarioIds: string[];
  failedScenarioIds: string[];
  pendingWithoutActiveWorkerScenarioIds: string[];
  chatStressWatchdogArmedScenarioIds: string[];
  chatStressWatchdogDeadlineByScenarioId: Readonly<Record<string, number>>;
  chatStressWatchdogOverdueScenarioIds: string[];
  chatStressMaxPendingElapsedMs: number;
  oldestPendingElapsedMs: number;
  nextScenarioDeadlineMs: number | null;
  msUntilNextDeadline: number | null;
  batchDeadlineMs: number | null;
  msUntilBatchDeadline: number | null;
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
let lastActiveScenarioId: string | null = null;
const activeScenarioIds = new Set<string>();
let lastSettledScenarioId: string | null = null;
let orderedScenarioIds: string[] = [];
const timeoutScenarioIds: string[] = [];
const failedScenarioIds: string[] = [];
const scenarios = new Map<string, ScenarioRecord>();
const watchdogRecords = new Map<string, WatchdogRecord>();
let healthSweepInterval: ReturnType<typeof setInterval> | null = null;
const postWatchdogHealthReconcilers: Array<(nowMs: number) => void> = [];
let batchStartedAtMs: number | null = null;
let batchDeadlineMs: number | null = null;
let batchFinalizerCompleted = false;
let batchDeadlineArmedTimer: ReturnType<typeof setTimeout> | null = null;
let batchDeadlineArmedNotified = false;

export const CHAT_STRESS_BATCH_DEADLINE_ARMED_OPERATION_ID = 'chat-stress-batch-deadline-armed';
export const CHAT_STRESS_TERMINAL_SWEEP_STARTED_OPERATION_ID = 'chat-stress-terminal-sweep-started';
export const CHAT_STRESS_TERMINAL_SWEEP_SETTLED_OPERATION_ID = 'chat-stress-terminal-sweep-settled';

type BatchDeadlineArmedHandler = (input: {
  batchDeadlineMs: number;
  batchEndsAtMs: number;
  scenarioCount: number;
  concurrency: number;
}) => void;

type TerminalSettlementSweepHandler = (input: {
  reason: string;
  settledCount: number;
  pendingCount: number;
  forcedCount: number;
}) => void;

let batchDeadlineArmedHandler: BatchDeadlineArmedHandler | null = null;
let terminalSettlementSweepHandler: TerminalSettlementSweepHandler | null = null;

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

export function registerChatStressBatchDeadlineArmedHandler(
  handler: BatchDeadlineArmedHandler | null,
): void {
  batchDeadlineArmedHandler = handler;
}

export function registerChatStressTerminalSettlementSweepHandler(
  handler: TerminalSettlementSweepHandler | null,
): void {
  terminalSettlementSweepHandler = handler;
}

function clearChatStressBatchDeadlineArmedTimer(): void {
  if (batchDeadlineArmedTimer != null) {
    clearTimeout(batchDeadlineArmedTimer);
    batchDeadlineArmedTimer = null;
  }
}

function resetChatStressScenarioStateForBatch(): void {
  stopChatStressWatchdogHealthSweep();
  clearAllChatStressScenarioHardWatchdogs();
  clearChatStressBatchDeadlineArmedTimer();
  batchDeadlineArmedNotified = false;
  totalScenarios = 0;
  aggregateComplete = false;
  lastScenarioId = null;
  lastActiveScenarioId = null;
  activeScenarioIds.clear();
  lastSettledScenarioId = null;
  orderedScenarioIds = [];
  timeoutScenarioIds.length = 0;
  failedScenarioIds.length = 0;
  scenarios.clear();
  batchStartedAtMs = null;
  batchDeadlineMs = null;
  batchFinalizerCompleted = false;
}

export function resetChatStressCompletionTrackerForTests(): void {
  resetChatStressScenarioStateForBatch();
  clearChatStressPostWatchdogHealthReconcilers();
}

export function beginChatStressSimulation(scenarioIds: readonly string[]): void {
  resetChatStressScenarioStateForBatch();
  orderedScenarioIds = [...scenarioIds];
  totalScenarios = orderedScenarioIds.length;
}

export function beginChatStressBatchDeadline(input: {
  scenarioCount: number;
  concurrency?: number;
  perScenarioTimeoutMs?: number;
  startedAtMs?: number;
}): void {
  clearChatStressBatchDeadlineArmedTimer();
  batchDeadlineArmedNotified = false;
  batchStartedAtMs = input.startedAtMs ?? Date.now();
  batchDeadlineMs = resolveChatStressWorstCaseBatchDeadlineMs({
    scenarioCount: input.scenarioCount,
    concurrency: input.concurrency,
    perScenarioTimeoutMs: input.perScenarioTimeoutMs,
  });
  batchFinalizerCompleted = false;

  const batchEndsAtMs = batchStartedAtMs + batchDeadlineMs;
  if (!batchDeadlineArmedNotified) {
    batchDeadlineArmedNotified = true;
    batchDeadlineArmedHandler?.({
      batchDeadlineMs: batchDeadlineMs,
      batchEndsAtMs,
      scenarioCount: input.scenarioCount,
      concurrency: input.concurrency ?? CHAT_STRESS_DEFAULT_CONCURRENCY,
    });
  }

  batchDeadlineArmedTimer = setTimeout(() => {
    const nowMs = Date.now();
    reconcileChatStressTerminalSettlementSweep({
      nowMs,
      forceUnresolved: true,
      reason: CHAT_STRESS_BATCH_DEADLINE_EXCEEDED_REASON,
    });
  }, Math.max(0, batchEndsAtMs - Date.now()));
}

export function isChatStressBatchFinalizerCompleted(): boolean {
  return batchFinalizerCompleted;
}

function syncCompatibilityActiveScenarioId(): void {
  if (activeScenarioIds.size === 0) {
    lastActiveScenarioId = null;
    return;
  }
  if (lastActiveScenarioId != null && activeScenarioIds.has(lastActiveScenarioId)) {
    return;
  }
  lastActiveScenarioId = [...activeScenarioIds].at(-1) ?? null;
}

export function addActiveChatStressScenario(scenarioId: string): void {
  activeScenarioIds.add(scenarioId);
  lastActiveScenarioId = scenarioId;
}

export function removeActiveChatStressScenario(scenarioId: string): void {
  activeScenarioIds.delete(scenarioId);
  syncCompatibilityActiveScenarioId();
}

export function getActiveChatStressScenarioIds(): readonly string[] {
  return [...activeScenarioIds];
}

export function getActiveChatStressScenarioCount(): number {
  return activeScenarioIds.size;
}

/** Compatibility — replaces entire active set when null; adds when id provided. */
export function setActiveChatStressScenario(scenarioId: string | null): void {
  if (scenarioId == null) {
    activeScenarioIds.clear();
    lastActiveScenarioId = null;
    return;
  }
  addActiveChatStressScenario(scenarioId);
}

export function clearActiveChatStressScenarioIfMatches(scenarioId: string): void {
  removeActiveChatStressScenario(scenarioId);
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
  addActiveChatStressScenario(scenarioId);
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
  removeActiveChatStressScenario(scenarioId);
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
    started: true,
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

  reconcileChatStressOverdueRunningScenarios(nowMs, firedScenarioIds);

  if (!suppressPostWatchdogHealthReconcilers) {
    for (const reconciler of postWatchdogHealthReconcilers) {
      reconciler(nowMs);
    }
  }

  return firedScenarioIds;
}

export function shouldForceChatStressTerminalSettlementSweep(
  snap: Pick<
    ChatStressCompletionSnapshot,
    | 'pendingCount'
    | 'msUntilBatchDeadline'
    | 'batchDeadlineMs'
    | 'chatStressWatchdogOverdueScenarioIds'
    | 'oldestPendingElapsedMs'
  >,
  perScenarioTimeoutMs = CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  graceMs = CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
): boolean {
  if (snap.pendingCount <= 0) return false;
  if (snap.batchDeadlineMs != null && (snap.msUntilBatchDeadline ?? 0) <= 0) return true;
  if (snap.chatStressWatchdogOverdueScenarioIds.length > 0) return true;
  return snap.oldestPendingElapsedMs >= perScenarioTimeoutMs + graceMs;
}

function reconcileChatStressOverdueRunningScenarios(
  nowMs: number,
  firedScenarioIds: string[],
  perScenarioTimeoutMs = CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
): void {
  for (const scenarioId of orderedScenarioIds) {
    if (isChatStressScenarioSettled(scenarioId)) continue;
    const entry = scenarios.get(scenarioId);
    if (!entry?.started) continue;
    const elapsedMs = Math.max(0, nowMs - entry.lastUpdateTimeMs);
    if (elapsedMs < perScenarioTimeoutMs) continue;
    const record = watchdogRecords.get(scenarioId);
    if (record) {
      if (nowMs >= record.deadlineMs) {
        fireWatchdogForScenario(scenarioId, record);
        if (!firedScenarioIds.includes(scenarioId)) {
          firedScenarioIds.push(scenarioId);
        }
      }
      continue;
    }
    tryMarkChatStressScenarioSettled(scenarioId, 'TIMEOUT');
    if (!firedScenarioIds.includes(scenarioId)) {
      firedScenarioIds.push(scenarioId);
    }
  }
}

export function reconcileChatStressTerminalSettlementIfNeeded(nowMs = Date.now()): boolean {
  if (aggregateComplete || suppressPostWatchdogHealthReconcilers) return false;
  const snap = buildChatStressCompletionSnapshot(nowMs);
  if (!shouldForceChatStressTerminalSettlementSweep(snap)) return false;
  reconcileChatStressTerminalSettlementSweep({
    nowMs,
    forceUnresolved: true,
    reason: CHAT_STRESS_TERMINAL_SETTLEMENT_SWEEP_REASON,
  });
  return true;
}

export function forceSettlePendingStartedChatStressScenarios(
  reason: string,
): Array<{ scenarioId: string; reason: string }> {
  return withChatStressPostWatchdogHealthReconcilersSuppressed(() => {
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
  });
}

export function reconcileChatStressTerminalSettlementSweep(
  input: {
    nowMs?: number;
    reason?: string;
    budgetRemainingMs?: number | null;
    forceUnresolved?: boolean;
  } = {},
): {
  forced: Array<{ scenarioId: string; reason: string }>;
  pendingCount: number;
} {
  const nowMs = input.nowMs ?? Date.now();
  suppressPostWatchdogHealthReconcilers = true;
  try {
    reconcileChatStressWatchdogHealth(nowMs);
    reconcileChatStressBatchDeadlineFinalizer(nowMs);

    let forced: Array<{ scenarioId: string; reason: string }> = [];

    if (input.budgetRemainingMs != null && input.budgetRemainingMs <= 0) {
      forced = forceSettlePendingStartedChatStressScenarios('SIMULATION_BUDGET_EXCEEDED');
    }

    if (input.forceUnresolved === true && !allChatStressScenariosSettled()) {
      const sweepReason = input.reason ?? CHAT_STRESS_TERMINAL_SETTLEMENT_SWEEP_REASON;
      const settledBefore = buildChatStressCompletionSnapshot(nowMs).settledCount;
      terminalSettlementSweepHandler?.({
        reason: sweepReason,
        settledCount: settledBefore,
        pendingCount: buildChatStressCompletionSnapshot(nowMs).pendingCount,
        forcedCount: 0,
      });
      forced = [
        ...forced,
        ...forceSettlePendingStartedChatStressScenarios(sweepReason),
      ];
      const snapAfter = buildChatStressCompletionSnapshot(nowMs);
      terminalSettlementSweepHandler?.({
        reason: sweepReason,
        settledCount: snapAfter.settledCount,
        pendingCount: snapAfter.pendingCount,
        forcedCount: forced.length,
      });
    }

    return {
      forced,
      pendingCount: buildChatStressCompletionSnapshot(nowMs).pendingCount,
    };
  } finally {
    suppressPostWatchdogHealthReconcilers = false;
  }
}

export function reconcileChatStressBatchDeadlineFinalizer(nowMs = Date.now()): boolean {
  if (batchFinalizerCompleted || aggregateComplete) return false;
  if (batchStartedAtMs == null || batchDeadlineMs == null) return false;
  if (nowMs < batchStartedAtMs + batchDeadlineMs) return false;

  const pendingBefore = orderedScenarioIds.filter((id) => !isChatStressScenarioSettled(id)).length;
  if (pendingBefore <= 0) {
    batchFinalizerCompleted = true;
    clearChatStressBatchDeadlineArmedTimer();
    return false;
  }

  forceSettlePendingStartedChatStressScenarios(CHAT_STRESS_BATCH_DEADLINE_EXCEEDED_REASON);
  if (buildChatStressCompletionSnapshot(nowMs).pendingCount <= 0) {
    batchFinalizerCompleted = true;
    clearChatStressBatchDeadlineArmedTimer();
  }
  return true;
}

export function resolveChatStressStallHealth(
  snapshot: Pick<
    ChatStressCompletionSnapshot,
    | 'pendingCount'
    | 'activeScenarioCount'
    | 'activeScenarioIds'
    | 'chatStressWatchdogDeadlineByScenarioId'
    | 'msUntilBatchDeadline'
    | 'batchDeadlineMs'
  >,
  nowMs = Date.now(),
): 'HEALTHY' | 'SLOW' | 'STALLED' {
  if (snapshot.pendingCount <= 0) return 'HEALTHY';

  const activeOverdue = snapshot.activeScenarioIds.some((scenarioId) => {
    const deadline = snapshot.chatStressWatchdogDeadlineByScenarioId[scenarioId];
    return deadline != null && nowMs >= deadline;
  });

  if (snapshot.activeScenarioCount > 0) {
    return activeOverdue ? 'STALLED' : 'SLOW';
  }

  if (snapshot.batchDeadlineMs != null && (snapshot.msUntilBatchDeadline ?? 0) > 0) {
    return 'SLOW';
  }

  return 'STALLED';
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
  activeScenarioIds.clear();
  lastActiveScenarioId = null;
  stopChatStressWatchdogHealthSweep();
  clearAllChatStressScenarioHardWatchdogs();
  clearChatStressBatchDeadlineArmedTimer();
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
    (id) => !activeScenarioIds.has(id),
  );
  const activeScenarioIdsSnapshot = [...activeScenarioIds];
  const activeScenarioCount = activeScenarioIdsSnapshot.length;

  const chatStressWatchdogArmedScenarioIds = [...watchdogRecords.keys()].filter(
    (id) => !isChatStressScenarioSettled(id),
  );
  const chatStressWatchdogDeadlineByScenarioId: Record<string, number> = {};
  const chatStressWatchdogOverdueScenarioIds: string[] = [];
  let chatStressMaxPendingElapsedMs = 0;
  let oldestPendingElapsedMs = 0;
  let nextScenarioDeadlineMs: number | null = null;

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
      const startedAtMs = scenarios.get(scenarioId)?.lastUpdateTimeMs;
      const pendingElapsedMs =
        startedAtMs != null ? Math.max(0, nowMs - startedAtMs) : 0;
      if (pendingElapsedMs >= CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS) {
        chatStressWatchdogOverdueScenarioIds.push(scenarioId);
      }
    }
    const startedAtMs = scenarios.get(scenarioId)?.lastUpdateTimeMs;
    if (startedAtMs != null) {
      const pendingElapsedMs = Math.max(0, nowMs - startedAtMs);
      if (pendingElapsedMs > oldestPendingElapsedMs) {
        oldestPendingElapsedMs = pendingElapsedMs;
      }
    }
    const deadlineMs = record?.deadlineMs;
    if (deadlineMs != null && (nextScenarioDeadlineMs == null || deadlineMs < nextScenarioDeadlineMs)) {
      nextScenarioDeadlineMs = deadlineMs;
    }
  }

  if (batchStartedAtMs != null && batchDeadlineMs != null) {
    const batchEndMs = batchStartedAtMs + batchDeadlineMs;
    if (nextScenarioDeadlineMs == null || batchEndMs < nextScenarioDeadlineMs) {
      nextScenarioDeadlineMs = batchEndMs;
    }
  }

  const msUntilNextDeadline =
    nextScenarioDeadlineMs != null ? Math.max(0, nextScenarioDeadlineMs - nowMs) : null;
  const msUntilBatchDeadline =
    batchStartedAtMs != null && batchDeadlineMs != null
      ? Math.max(0, batchStartedAtMs + batchDeadlineMs - nowMs)
      : null;

  return {
    readOnly: true,
    inProgress: totalScenarios > 0 && !aggregateComplete,
    aggregateComplete,
    startedCount,
    settledCount,
    pendingCount,
    lastScenarioId,
    pendingScenarioIds,
    activeScenarioId: lastActiveScenarioId,
    activeScenarioIds: activeScenarioIdsSnapshot,
    activeScenarioCount,
    lastSettledScenarioId,
    timeoutScenarioIds: [...timeoutScenarioIds],
    failedScenarioIds: [...failedScenarioIds],
    pendingWithoutActiveWorkerScenarioIds,
    chatStressWatchdogArmedScenarioIds,
    chatStressWatchdogDeadlineByScenarioId,
    chatStressWatchdogOverdueScenarioIds: [...new Set(chatStressWatchdogOverdueScenarioIds)],
    chatStressMaxPendingElapsedMs,
    oldestPendingElapsedMs,
    nextScenarioDeadlineMs,
    msUntilNextDeadline,
    batchDeadlineMs,
    msUntilBatchDeadline,
  };
}

let snapshotReconcileDepth = 0;
let suppressPostWatchdogHealthReconcilers = false;

export function withChatStressPostWatchdogHealthReconcilersSuppressed<T>(fn: () => T): T {
  const previous = suppressPostWatchdogHealthReconcilers;
  suppressPostWatchdogHealthReconcilers = true;
  try {
    return fn();
  } finally {
    suppressPostWatchdogHealthReconcilers = previous;
  }
}

export function getChatStressCompletionSnapshot(nowMs?: number): ChatStressCompletionSnapshot {
  const at = nowMs ?? Date.now();
  if (snapshotReconcileDepth > 0) {
    return buildChatStressCompletionSnapshot(at);
  }
  snapshotReconcileDepth += 1;
  try {
    reconcileChatStressWatchdogHealth(at);
    reconcileChatStressBatchDeadlineFinalizer(at);
    reconcileChatStressTerminalSettlementIfNeeded(at);
    return buildChatStressCompletionSnapshot(at);
  } finally {
    snapshotReconcileDepth -= 1;
  }
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
  activeScenarioCount?: number;
  chatStressWatchdogOverdueScenarioIds: readonly string[];
  chatStressMaxPendingElapsedMs: number;
  hardTimeoutMs: number;
  graceMs: number;
  secondsSinceLastHeartbeat: number;
  msUntilBatchDeadline?: number | null;
}): boolean {
  if (input.pendingCount <= 0) return false;
  if ((input.activeScenarioCount ?? 0) > 0) return false;
  if (input.msUntilBatchDeadline != null && input.msUntilBatchDeadline > 0) return false;
  if (input.chatStressWatchdogOverdueScenarioIds.length > 0) {
    return input.secondsSinceLastHeartbeat >= 3;
  }
  const stallAfterMs = input.hardTimeoutMs + input.graceMs;
  return input.chatStressMaxPendingElapsedMs >= stallAfterMs && input.secondsSinceLastHeartbeat >= 3;
}
