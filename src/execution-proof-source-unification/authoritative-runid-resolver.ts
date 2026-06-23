/**
 * Phase 26.94 — Authoritative runId resolver (V1).
 */

export function resolveAuthoritativeExecutionRunId(input: {
  explicitRunId?: string | null;
  founderFlowRunId?: string | null;
  founderTestRunId?: string | null;
  runtimeDeliveryRunId?: string | null;
}): string | null {
  return (
    input.explicitRunId ??
    input.founderFlowRunId ??
    input.runtimeDeliveryRunId ??
    input.founderTestRunId ??
    null
  );
}

export function describeRunIdSource(input: {
  runId: string | null;
  authoritativeRunId: string | null;
  dataSource: string;
}): string {
  if (!input.runId) return 'SOURCE_NOT_DISCOVERABLE';
  if (input.runId === input.authoritativeRunId) return 'active founder run';
  if (input.runId.startsWith('stale-') || input.runId.includes('historical')) {
    return `historical founder run (${input.runId})`;
  }
  if (input.dataSource.includes('CACHED')) return `cached run (${input.runId})`;
  return `${input.dataSource} run (${input.runId})`;
}
