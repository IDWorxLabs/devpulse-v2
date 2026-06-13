/**
 * Founder Test Run Result Store — async POST result handoff (V1).
 * Phase 26.58 — runId-keyed in-memory result map.
 */

export interface StoredFounderTestRunResult {
  readOnly: true;
  runId: string;
  ok: boolean;
  completedAt: string;
  payload: Record<string, unknown>;
  errorMessage: string | null;
}

const MAX_STORED_RUN_RESULTS = 16;

let handlerExecutionAlive = false;
let handlerLastAliveAt: string | null = null;
const founderTestRunResultsByRunId = new Map<string, StoredFounderTestRunResult>();

export function resetFounderTestRunResultStoreForTests(): void {
  handlerExecutionAlive = false;
  handlerLastAliveAt = null;
  founderTestRunResultsByRunId.clear();
}

export function markFounderTestHandlerAlive(at = new Date()): void {
  handlerExecutionAlive = true;
  handlerLastAliveAt = at.toISOString();
}

export function markFounderTestHandlerIdle(): void {
  handlerExecutionAlive = false;
}

export function isFounderTestHandlerAlive(): boolean {
  return handlerExecutionAlive;
}

export function getFounderTestHandlerLastAliveAt(): string | null {
  return handlerLastAliveAt;
}

function trimStoredRunResults(): void {
  if (founderTestRunResultsByRunId.size <= MAX_STORED_RUN_RESULTS) return;
  const sorted = [...founderTestRunResultsByRunId.entries()].sort((left, right) =>
    left[1].completedAt.localeCompare(right[1].completedAt),
  );
  while (founderTestRunResultsByRunId.size > MAX_STORED_RUN_RESULTS) {
    const oldest = sorted.shift();
    if (!oldest) break;
    founderTestRunResultsByRunId.delete(oldest[0]);
  }
}

export function storeFounderTestRunResult(result: StoredFounderTestRunResult): void {
  founderTestRunResultsByRunId.set(result.runId, result);
  trimStoredRunResults();
}

export function hasFounderTestRunResult(runId: string): boolean {
  return founderTestRunResultsByRunId.has(runId);
}

export function getFounderTestRunResultCount(): number {
  return founderTestRunResultsByRunId.size;
}

export function consumeFounderTestRunResult(runId?: string | null): StoredFounderTestRunResult | null {
  if (runId) {
    const stored = founderTestRunResultsByRunId.get(runId) ?? null;
    if (stored) founderTestRunResultsByRunId.delete(runId);
    return stored;
  }
  const latest = peekFounderTestRunResult(null);
  if (latest) founderTestRunResultsByRunId.delete(latest.runId);
  return latest;
}

export function peekFounderTestRunResult(runId?: string | null): StoredFounderTestRunResult | null {
  if (runId) {
    return founderTestRunResultsByRunId.get(runId) ?? null;
  }
  if (founderTestRunResultsByRunId.size === 0) return null;
  return [...founderTestRunResultsByRunId.values()].sort((left, right) =>
    right.completedAt.localeCompare(left.completedAt),
  )[0];
}

export function listFounderTestRunResultIds(): string[] {
  return [...founderTestRunResultsByRunId.keys()];
}
