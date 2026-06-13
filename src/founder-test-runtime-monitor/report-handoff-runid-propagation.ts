/**
 * Report handoff runId propagation — visible card-first resolution (V1).
 */

export const REPORT_HANDOFF_RUNID_PROPAGATION_REPAIR_V1_PASS =
  'REPORT_HANDOFF_RUNID_PROPAGATION_REPAIR_V1_PASS';

export const FORBIDDEN_HANDOFF_RUN_IDS = new Set(['', 'n/a', 'unknown', 'null', 'undefined']);

export function isValidHandoffRunId(runId: string | null | undefined): runId is string {
  if (runId == null) return false;
  const normalized = String(runId).trim().toLowerCase();
  return normalized.length > 0 && !FORBIDDEN_HANDOFF_RUN_IDS.has(normalized);
}

export function resolveReportHandoffRunId(input: {
  explicitRunId?: string | null;
  cardRunId?: string | null;
  runtimeRunId?: string | null;
  pinnedRunId?: string | null;
  activeRunId?: string | null;
  lastRuntimeRunId?: string | null;
}): string | null {
  const candidates = [
    input.explicitRunId,
    input.cardRunId,
    input.runtimeRunId,
    input.pinnedRunId,
    input.activeRunId,
    input.lastRuntimeRunId,
  ];
  for (const candidate of candidates) {
    if (isValidHandoffRunId(candidate)) return String(candidate).trim();
  }
  return null;
}

export function coerceReportHandoffRunId(input: {
  resolvedRunId: string | null;
  cardRunId?: string | null;
}): string | null {
  if (isValidHandoffRunId(input.resolvedRunId)) return String(input.resolvedRunId).trim();
  if (isValidHandoffRunId(input.cardRunId)) return String(input.cardRunId).trim();
  return null;
}

export function buildReportHandoffRunIdDiagnosticFields(input: {
  requestedRunId?: string | null;
  cardRunId?: string | null;
  pinnedRunId?: string | null;
  resolvedActiveRunId?: string | null;
  runtimeSnapshotRunId?: string | null;
}): Record<string, string> {
  return {
    requestedRunId: isValidHandoffRunId(input.requestedRunId) ? String(input.requestedRunId) : 'n/a',
    runtimeCardRunId: isValidHandoffRunId(input.cardRunId) ? String(input.cardRunId) : 'n/a',
    pinnedRunId: isValidHandoffRunId(input.pinnedRunId) ? String(input.pinnedRunId) : 'n/a',
    resolvedActiveRunId: isValidHandoffRunId(input.resolvedActiveRunId)
      ? String(input.resolvedActiveRunId)
      : 'n/a',
    runtimeSnapshotRunId: isValidHandoffRunId(input.runtimeSnapshotRunId)
      ? String(input.runtimeSnapshotRunId)
      : 'n/a',
  };
}

export function buildReportHandoffRunIdPropagationDiagnosticLines(
  fields: Record<string, string>,
): string[] {
  return [
    `- Requested runId: ${fields.requestedRunId}`,
    `- Runtime card runId: ${fields.runtimeCardRunId}`,
    `- Pinned runId: ${fields.pinnedRunId}`,
    `- Resolved active runId: ${fields.resolvedActiveRunId}`,
    `- Runtime snapshot runId: ${fields.runtimeSnapshotRunId}`,
  ];
}

export function assertHandoffEndpointRunId(input: {
  resolvedRunId: string | null;
  cardRunId?: string | null;
}): string | null {
  const runId = coerceReportHandoffRunId(input);
  if (runId) return runId;
  return null;
}
