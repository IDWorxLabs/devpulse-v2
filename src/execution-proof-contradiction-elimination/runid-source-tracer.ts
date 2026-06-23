/**
 * Phase 27.01 — RunId source tracer (V1).
 */

export function traceRunIdSource(input: {
  runId: string | null;
  authoritativeRunId: string | null;
  authorityId: string;
}): { aligned: boolean; sourceChain: string; stale: boolean } {
  if (!input.runId) {
    return {
      aligned: Boolean(input.authoritativeRunId),
      sourceChain: `${input.authorityId} → runId:SOURCE_NOT_DISCOVERABLE`,
      stale: false,
    };
  }

  const stale =
    input.runId.startsWith('stale-') ||
    input.runId.includes('historical') ||
    input.runId.includes('cached-');
  const aligned =
    !stale &&
    Boolean(input.authoritativeRunId) &&
    input.runId === input.authoritativeRunId;

  return {
    aligned,
    stale,
    sourceChain: stale
      ? `${input.authorityId} → runId:historical(${input.runId})`
      : aligned
        ? `${input.authorityId} → runId:authoritative(${input.runId})`
        : `${input.authorityId} → runId:drift(${input.runId}≠${input.authoritativeRunId})`,
  };
}
