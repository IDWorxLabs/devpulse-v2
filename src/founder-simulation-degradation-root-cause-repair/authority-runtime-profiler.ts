/**
 * Phase 27.02 — Authority runtime profiler (V1).
 */

import type { FounderTestRuntimeTraceEvent } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import { OPERATION_TO_AUTHORITY, STAGE_TO_AUTHORITY } from './founder-simulation-degradation-root-cause-registry.js';
import type { FounderSimulationAuthorityProfile } from './founder-simulation-degradation-root-cause-types.js';

function resolveAuthorityName(operationId: string, stageId: string | null): string {
  if (OPERATION_TO_AUTHORITY[operationId]) return OPERATION_TO_AUTHORITY[operationId];
  if (stageId && STAGE_TO_AUTHORITY[stageId]) return STAGE_TO_AUTHORITY[stageId];
  return operationId.replace(/-/g, ' ');
}

function parseTimestampMs(timestamp: string): number {
  const ms = Date.parse(timestamp);
  return Number.isFinite(ms) ? ms : 0;
}

export function profileAuthorityRuntimeFromTrace(input: {
  traceEvents: readonly FounderTestRuntimeTraceEvent[];
  runId: string | null;
  totalRuntimeMs: number;
}): FounderSimulationAuthorityProfile[] {
  const byAuthority = new Map<string, { startMs: number; endMs: number; stageId: string | null; verdict: string }>();

  const sorted = [...input.traceEvents].sort(
    (a, b) => parseTimestampMs(a.timestamp) - parseTimestampMs(b.timestamp),
  );

  for (let i = 0; i < sorted.length; i += 1) {
    const event = sorted[i]!;
    const authorityName = resolveAuthorityName(event.operationId, event.stageId);
    const startMs = parseTimestampMs(event.timestamp);
    const next = sorted[i + 1];
    const endMs = next ? parseTimestampMs(next.timestamp) : startMs + 1;
    const elapsedMs = Math.max(endMs - startMs, 1);

    const existing = byAuthority.get(authorityName);
    if (existing) {
      existing.endMs = Math.max(existing.endMs, endMs);
      existing.verdict = event.status;
    } else {
      byAuthority.set(authorityName, {
        startMs,
        endMs,
        stageId: event.stageId,
        verdict: event.status,
      });
    }

    if (elapsedMs > 500) {
      const bucket = byAuthority.get(`${authorityName} (${event.operationId})`);
      if (!bucket) {
        byAuthority.set(`${authorityName} (${event.operationId})`, {
          startMs,
          endMs,
          stageId: event.stageId,
          verdict: event.status,
        });
      }
    }
  }

  const profiles: FounderSimulationAuthorityProfile[] = [];
  for (const [authorityName, window] of byAuthority.entries()) {
    const elapsedMs = Math.max(window.endMs - window.startMs, 1);
    profiles.push({
      readOnly: true,
      authorityId: authorityName.replace(/\s+/g, '_').toUpperCase(),
      authorityName,
      stageId: window.stageId,
      startTime: new Date(window.startMs).toISOString(),
      endTime: new Date(window.endMs).toISOString(),
      elapsedMs,
      workspaceId: null,
      runId: input.runId,
      verdict: window.verdict,
      proofLevel: window.verdict,
      rank: 0,
      runtimePercent: input.totalRuntimeMs > 0 ? (elapsedMs / input.totalRuntimeMs) * 100 : 0,
    });
  }

  profiles.sort((a, b) => b.elapsedMs - a.elapsedMs);
  return profiles.map((profile, index) => ({ ...profile, rank: index + 1 }));
}

export function mergeAuthorityProfiles(
  stageProfiles: readonly FounderSimulationAuthorityProfile[],
  traceProfiles: readonly FounderSimulationAuthorityProfile[],
  totalRuntimeMs: number,
): FounderSimulationAuthorityProfile[] {
  const merged = new Map<string, FounderSimulationAuthorityProfile>();

  for (const profile of [...stageProfiles, ...traceProfiles]) {
    const key = profile.authorityName;
    const existing = merged.get(key);
    if (!existing || profile.elapsedMs > existing.elapsedMs) {
      merged.set(key, profile);
    }
  }

  const profiles = [...merged.values()].sort((a, b) => b.elapsedMs - a.elapsedMs);
  return profiles.map((profile, index) => ({
    ...profile,
    rank: index + 1,
    runtimePercent: totalRuntimeMs > 0 ? (profile.elapsedMs / totalRuntimeMs) * 100 : 0,
  }));
}
