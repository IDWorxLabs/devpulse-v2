/**
 * Evidence traceability — locate evidence by verification target, session, project, etc.
 */

import type { EvidenceRecord } from './verification-evidence-types.js';

export interface TraceabilityIndex {
  byVerificationTarget: Map<string, string[]>;
  byVerificationSession: Map<string, string[]>;
  byProject: Map<string, string[]>;
  byWorkspace: Map<string, string[]>;
  byModule: Map<string, string[]>;
  byOwner: Map<string, string[]>;
  byReport: Map<string, string[]>;
  byOrchestration: Map<string, string[]>;
  byCompletionChain: Map<string, string[]>;
  byWorld2Chain: Map<string, string[]>;
}

function addToIndex(map: Map<string, string[]>, key: string, evidenceId: string): void {
  const existing = map.get(key) ?? [];
  if (!existing.includes(evidenceId)) {
    map.set(key, [...existing, evidenceId]);
  }
}

export function buildTraceabilityIndex(records: EvidenceRecord[]): TraceabilityIndex {
  const index: TraceabilityIndex = {
    byVerificationTarget: new Map(),
    byVerificationSession: new Map(),
    byProject: new Map(),
    byWorkspace: new Map(),
    byModule: new Map(),
    byOwner: new Map(),
    byReport: new Map(),
    byOrchestration: new Map(),
    byCompletionChain: new Map(),
    byWorld2Chain: new Map(),
  };

  for (const r of records) {
    if (r.verificationTargetId) {
      addToIndex(index.byVerificationTarget, r.verificationTargetId, r.evidenceId);
    }
    if (r.verificationSessionId ?? r.evidenceOwner.verificationSession) {
      addToIndex(
        index.byVerificationSession,
        r.verificationSessionId ?? r.evidenceOwner.verificationSession!,
        r.evidenceId,
      );
    }
    addToIndex(index.byProject, r.evidenceOwner.projectId, r.evidenceId);
    addToIndex(index.byWorkspace, r.evidenceOwner.workspaceId, r.evidenceId);
    addToIndex(index.byModule, r.evidenceOwner.ownerModule, r.evidenceId);
    addToIndex(index.byOwner, r.evidenceOwner.producedBy, r.evidenceId);
    if (r.reportId) addToIndex(index.byReport, r.reportId, r.evidenceId);
    const orchId = r.orchestrationId ?? r.evidenceOwner.orchestrationId;
    if (orchId) addToIndex(index.byOrchestration, orchId, r.evidenceId);
    if (r.completionChainId) addToIndex(index.byCompletionChain, r.completionChainId, r.evidenceId);
    if (r.world2ChainId) addToIndex(index.byWorld2Chain, r.world2ChainId, r.evidenceId);
  }

  return index;
}

export function locateByVerificationTarget(
  index: TraceabilityIndex,
  targetId: string,
): string[] {
  return [...(index.byVerificationTarget.get(targetId) ?? [])];
}

export function locateByVerificationSession(
  index: TraceabilityIndex,
  sessionId: string,
): string[] {
  return [...(index.byVerificationSession.get(sessionId) ?? [])];
}

export function locateByProject(index: TraceabilityIndex, projectId: string): string[] {
  return [...(index.byProject.get(projectId) ?? [])];
}

export function locateByWorkspace(index: TraceabilityIndex, workspaceId: string): string[] {
  return [...(index.byWorkspace.get(workspaceId) ?? [])];
}

export function locateByModule(index: TraceabilityIndex, module: string): string[] {
  return [...(index.byModule.get(module) ?? [])];
}

export function locateByOwner(index: TraceabilityIndex, owner: string): string[] {
  return [...(index.byOwner.get(owner) ?? [])];
}

export function locateByReport(index: TraceabilityIndex, reportId: string): string[] {
  return [...(index.byReport.get(reportId) ?? [])];
}

export function locateByOrchestration(
  index: TraceabilityIndex,
  orchestrationId: string,
): string[] {
  return [...(index.byOrchestration.get(orchestrationId) ?? [])];
}

export function locateByCompletionChain(
  index: TraceabilityIndex,
  chainId: string,
): string[] {
  return [...(index.byCompletionChain.get(chainId) ?? [])];
}

export function locateByWorld2Chain(index: TraceabilityIndex, chainId: string): string[] {
  return [...(index.byWorld2Chain.get(chainId) ?? [])];
}

export function summarizeTraceabilityIndex(
  index: TraceabilityIndex,
): Array<{ key: string; evidenceIds: string[] }> {
  const entries: Array<{ key: string; evidenceIds: string[] }> = [];
  const maps: Array<[string, Map<string, string[]>]> = [
    ['verificationTarget', index.byVerificationTarget],
    ['verificationSession', index.byVerificationSession],
    ['project', index.byProject],
    ['workspace', index.byWorkspace],
    ['module', index.byModule],
    ['owner', index.byOwner],
    ['report', index.byReport],
    ['orchestration', index.byOrchestration],
    ['completionChain', index.byCompletionChain],
    ['world2Chain', index.byWorld2Chain],
  ];

  for (const [prefix, map] of maps) {
    for (const [key, ids] of map.entries()) {
      entries.push({ key: `${prefix}:${key}`, evidenceIds: [...ids] });
    }
  }
  return entries;
}

export function countTraceabilityKeys(index: TraceabilityIndex): number {
  return (
    index.byVerificationTarget.size +
    index.byVerificationSession.size +
    index.byProject.size +
    index.byWorkspace.size +
    index.byModule.size +
    index.byOwner.size +
    index.byReport.size +
    index.byOrchestration.size +
    index.byCompletionChain.size +
    index.byWorld2Chain.size
  );
}
