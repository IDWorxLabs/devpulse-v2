/**
 * Workspace risk detector — mismatch, orphan, leakage, and duplicate ownership risks.
 */

import type {
  WorkspaceIntelligenceSnapshot,
  WorkspaceRisk,
} from './workspace-intelligence-types.js';

let riskCounter = 0;

function nextRiskId(): string {
  riskCounter += 1;
  return `wsrisk-${riskCounter.toString().padStart(4, '0')}`;
}

export function detectWorkspaceRisks(snapshot: WorkspaceIntelligenceSnapshot): WorkspaceRisk[] {
  const risks: WorkspaceRisk[] = [];
  const projectToWorkspaces = new Map<string, string[]>();

  for (const link of snapshot.projectLinks) {
    const list = projectToWorkspaces.get(link.projectId) ?? [];
    list.push(link.workspaceId);
    projectToWorkspaces.set(link.projectId, list);
  }

  for (const [projectId, workspaceIds] of projectToWorkspaces) {
    if (workspaceIds.length > 1) {
      const unique = [...new Set(workspaceIds)];
      if (unique.length > 1) {
        risks.push({
          riskId: nextRiskId(),
          workspaceId: unique.join(','),
          projectId,
          riskLevel: 'medium',
          riskType: 'duplicate_ownership',
          summary: `Project ${projectId} has multiple workspace claims.`,
          reason: 'Duplicate workspace ownership increases context leakage risk.',
          advisoryOnly: true,
        });
      }
    }
  }

  const active = snapshot.activeWorkspace;
  const activeProject = snapshot.activeProject;
  if (active && activeProject && active.projectId !== activeProject.projectId) {
    risks.push({
      riskId: nextRiskId(),
      workspaceId: active.workspaceId,
      projectId: active.projectId,
      riskLevel: 'high',
      riskType: 'mismatch',
      summary: `Active workspace project ${active.projectId} mismatches active project ${activeProject.projectId}.`,
      reason: 'Workspace/project mismatch — verify ownership before reasoning.',
      advisoryOnly: true,
    });
  }

  for (const ws of snapshot.workspaces) {
    const hasLink = snapshot.projectLinks.some((l) => l.workspaceId === ws.workspaceId);
    if (!hasLink) {
      risks.push({
        riskId: nextRiskId(),
        workspaceId: ws.workspaceId,
        projectId: ws.projectId,
        riskLevel: 'high',
        riskType: 'missing_link',
        summary: `Workspace ${ws.workspaceName} has no registered project link.`,
        reason: 'Missing project link — ownership unresolved.',
        advisoryOnly: true,
      });
    }
  }

  const linkedWorkspaceIds = new Set(snapshot.projectLinks.map((l) => l.workspaceId));
  for (const ws of snapshot.workspaces) {
    if (!linkedWorkspaceIds.has(ws.workspaceId) && !ws.active) {
      risks.push({
        riskId: nextRiskId(),
        workspaceId: ws.workspaceId,
        projectId: ws.projectId,
        riskLevel: 'medium',
        riskType: 'orphaned',
        summary: `Workspace ${ws.workspaceName} appears orphaned.`,
        reason: 'Orphaned workspace — no active project binding.',
        advisoryOnly: true,
      });
    }
  }

  if (snapshot.workspaces.some((w) => w.source === 'world2_workspace_foundation') && active?.source === 'workspace_intelligence') {
    risks.push({
      riskId: nextRiskId(),
      workspaceId: active?.workspaceId ?? 'unknown',
      projectId: active?.projectId ?? 'unknown',
      riskLevel: 'medium',
      riskType: 'contamination',
      summary: 'World 2 and Command Center workspaces coexist — cross-project contamination risk.',
      reason: 'Keep World 1 command center reasoning separate from World 2 planning context.',
      advisoryOnly: true,
    });
  }

  if (risks.some((r) => r.riskType === 'context_leakage' || r.riskType === 'contamination' || r.riskType === 'mismatch')) {
    // already covered
  } else if (risks.length >= 2) {
    risks.push({
      riskId: nextRiskId(),
      workspaceId: active?.workspaceId ?? 'unknown',
      projectId: active?.projectId ?? 'unknown',
      riskLevel: 'medium',
      riskType: 'context_leakage',
      summary: 'Multiple workspace risks elevate context leakage advisory.',
      reason: 'Review workspace boundaries before combining project facts.',
      advisoryOnly: true,
    });
  }

  const unknownLinks = snapshot.projectLinks.filter((l) => l.owner === 'unresolved');
  for (const link of unknownLinks) {
    risks.push({
      riskId: nextRiskId(),
      workspaceId: link.workspaceId,
      projectId: link.projectId,
      riskLevel: 'high',
      riskType: 'unknown_ownership',
      summary: `Unknown ownership for workspace ${link.workspaceName}.`,
      reason: 'Workspace ownership could not be resolved from registry.',
      advisoryOnly: true,
    });
  }

  return risks;
}

export function applyRisksToSnapshot(snapshot: WorkspaceIntelligenceSnapshot): WorkspaceIntelligenceSnapshot {
  const risks = detectWorkspaceRisks(snapshot);
  const mismatchCount = risks.filter((r) => r.riskType === 'mismatch').length;
  const hasLeakage = risks.some(
    (r) => r.riskType === 'context_leakage' || r.riskType === 'contamination',
  );
  const hasDuplicate = risks.some((r) => r.riskType === 'duplicate_ownership');

  let contextLeakageRisk: WorkspaceIntelligenceSnapshot['contextLeakageRisk'] = 'clear';
  if (hasLeakage || mismatchCount > 0) contextLeakageRisk = 'warning';
  if (risks.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length > 1) {
    contextLeakageRisk = 'high';
  }

  return {
    ...snapshot,
    risks,
    mismatchCount,
    contextLeakageRisk,
    duplicateWorkspaceRisk: hasDuplicate ? 'warning' : snapshot.duplicateWorkspaceRisk,
  };
}

export function resetWorkspaceRiskCounterForTests(): void {
  riskCounter = 0;
}
