/**
 * Workspace isolation analyzer — advisory isolation and contamination findings.
 */

import type { WorkspaceAnalysis, WorkspaceIntelligenceSnapshot } from './workspace-intelligence-types.js';
import { getPrimaryFileAreas } from './workspace-context-builder.js';
import { resolveActiveProject } from './workspace-owner-resolver.js';

export function analyzeWorkspaceIsolation(
  query: string,
  snapshot: WorkspaceIntelligenceSnapshot,
): Pick<WorkspaceAnalysis, 'isolationWarnings' | 'safeToReason' | 'recommendedProject'> {
  const warnings: string[] = [];
  const active = resolveActiveProject(snapshot);

  if (snapshot.mismatchCount > 0) {
    warnings.push(`${snapshot.mismatchCount} workspace/project mismatch risk(s) detected — verify active project before reasoning.`);
  }

  if (snapshot.contextLeakageRisk !== 'clear') {
    warnings.push(`Context leakage risk: ${snapshot.contextLeakageRisk} — keep World 2 and World 1 contexts isolated.`);
  }

  const inactiveActive = snapshot.workspaces.filter((w) => w.active && w.projectId !== active.projectId);
  if (inactiveActive.length > 1) {
    warnings.push('Multiple active workspace claims detected — use primary DevPulse V2 workspace for command center reasoning.');
  }

  const world2Active = snapshot.workspaces.find(
    (w) => w.source === 'world2_workspace_foundation' && w.active,
  );
  if (world2Active && snapshot.activeWorkspace?.workspaceId !== world2Active.workspaceId) {
    warnings.push('World 2 workspace active while Command Center workspace is primary — avoid cross-project contamination.');
  }

  if (query.toLowerCase().includes('isolated') || query.toLowerCase().includes('leakage')) {
    warnings.push('Shared Memory, Project Vault, and Dependency context should remain scoped to active project workspace.');
    warnings.push('World 2 planning workspace must not claim Command Center Brain ownership.');
  }

  const safeToReason =
    snapshot.contextLeakageRisk === 'clear' &&
    snapshot.mismatchCount === 0 &&
    active.confidence !== 'LOW';

  return {
    isolationWarnings: [...new Set(warnings)],
    safeToReason,
    recommendedProject: active.projectName,
  };
}

export function listWorkspaceModules(
  snapshot: WorkspaceIntelligenceSnapshot,
  workspaceId?: string,
): string[] {
  const target = workspaceId ?? snapshot.activeWorkspace?.workspaceId;
  if (!target) return [];
  return snapshot.modules
    .filter((m) => m.workspaceId === target)
    .map((m) => `${m.moduleName} (${m.moduleId}) — owner: ${m.owner}`);
}

export function listWorkspaceFileAreas(snapshot: WorkspaceIntelligenceSnapshot): string[] {
  if (snapshot.activeWorkspace?.workspaceId === 'ws-devpulse-v2-primary') {
    return [...getPrimaryFileAreas()];
  }
  return ['src/world2-workspace-foundation/', 'src/world2-execution-planner/'];
}
