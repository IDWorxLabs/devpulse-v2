/**
 * Workspace Intelligence diagnostics.
 */

import type { WorkspaceIntelligenceDiagnostics, WorkspaceIntelligenceSnapshot } from './workspace-intelligence-types.js';

let diagnostics: WorkspaceIntelligenceDiagnostics = {
  workspaceIntelligenceActive: false,
  workspaceCount: 0,
  activeWorkspace: null,
  activeProject: null,
  workspaceOwnershipConfidence: 'LOW',
  workspaceRiskCount: 0,
  contextLeakageRisk: 'clear',
  lastWorkspaceQuery: null,
  duplicateWorkspaceRisk: 'clear',
};

export function getWorkspaceIntelligenceDiagnostics(): WorkspaceIntelligenceDiagnostics {
  return { ...diagnostics };
}

export function updateWorkspaceIntelligenceDiagnostics(
  query: string,
  snapshot: WorkspaceIntelligenceSnapshot,
): void {
  diagnostics = {
    workspaceIntelligenceActive: true,
    workspaceCount: snapshot.workspaceCount,
    activeWorkspace: snapshot.activeWorkspace?.workspaceName ?? null,
    activeProject: snapshot.activeProject?.projectName ?? null,
    workspaceOwnershipConfidence: snapshot.ownershipConfidence,
    workspaceRiskCount: snapshot.risks.length,
    contextLeakageRisk: snapshot.contextLeakageRisk,
    lastWorkspaceQuery: query,
    duplicateWorkspaceRisk: snapshot.duplicateWorkspaceRisk,
  };
}

export function resetWorkspaceIntelligenceDiagnostics(): void {
  diagnostics = {
    workspaceIntelligenceActive: false,
    workspaceCount: 0,
    activeWorkspace: null,
    activeProject: null,
    workspaceOwnershipConfidence: 'LOW',
    workspaceRiskCount: 0,
    contextLeakageRisk: 'clear',
    lastWorkspaceQuery: null,
    duplicateWorkspaceRisk: 'clear',
  };
}

export function workspaceIntelligenceKey(): string {
  const d = diagnostics;
  return [
    String(d.workspaceIntelligenceActive),
    String(d.workspaceCount),
    d.activeWorkspace ?? 'none',
    d.activeProject ?? 'none',
    d.workspaceOwnershipConfidence,
    String(d.workspaceRiskCount),
    d.contextLeakageRisk,
    d.duplicateWorkspaceRisk,
  ].join('|');
}
