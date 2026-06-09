/**
 * DevPulse V2 Phase 12.3 — Workspace Intelligence types.
 * Intelligence only — workspace awareness, boundaries, and isolation advisory.
 */

import type { RiskLevel } from '../foundation/types.js';

export const WORKSPACE_INTELLIGENCE_PASS_TOKEN =
  'DEVPULSE_V2_WORKSPACE_INTELLIGENCE_FOUNDATION_V1_PASS';
export const WORKSPACE_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_workspace_intelligence';

export type WorkspaceConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type WorkspaceBoundaryType =
  | 'WORLD1_COMMAND_CENTER'
  | 'WORLD2_ISOLATED'
  | 'VAULT_READ_ONLY'
  | 'MEMORY_SCOPED'
  | 'PROJECT_OWNED'
  | 'INTELLIGENCE_ONLY';

export interface WorkspaceContext {
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
  active: boolean;
  confidence: WorkspaceConfidence;
  source: string;
  riskLevel: RiskLevel;
  readOnly: true;
}

export interface WorkspaceProjectLink {
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
  owner: string;
  confidence: WorkspaceConfidence;
  reason: string;
  readOnly: true;
}

export interface WorkspaceModule {
  workspaceId: string;
  moduleId: string;
  moduleName: string;
  projectId: string;
  owner: string;
  confidence: WorkspaceConfidence;
  readOnly: true;
}

export interface WorkspaceBoundary {
  workspaceId: string;
  boundaryType: WorkspaceBoundaryType;
  owner: string;
  reason: string;
  confidence: WorkspaceConfidence;
  riskLevel: RiskLevel;
  readOnly: true;
}

export interface WorkspaceRisk {
  riskId: string;
  workspaceId: string;
  projectId: string;
  riskLevel: RiskLevel;
  riskType:
    | 'mismatch'
    | 'unknown_ownership'
    | 'multiple_ownership'
    | 'missing_link'
    | 'orphaned'
    | 'contamination'
    | 'duplicate_ownership'
    | 'context_leakage';
  summary: string;
  reason: string;
  advisoryOnly: true;
}

export interface WorkspaceIntelligenceSnapshot {
  workspaces: WorkspaceContext[];
  projectLinks: WorkspaceProjectLink[];
  modules: WorkspaceModule[];
  boundaries: WorkspaceBoundary[];
  risks: WorkspaceRisk[];
  activeWorkspace: WorkspaceContext | null;
  activeProject: { projectId: string; projectName: string } | null;
  workspaceCount: number;
  ownershipConfidence: WorkspaceConfidence;
  mismatchCount: number;
  contextLeakageRisk: 'clear' | 'warning' | 'high';
  duplicateWorkspaceRisk: 'clear' | 'warning';
  builtAt: number;
}

export interface WorkspaceAnalysis {
  query: string;
  snapshot: WorkspaceIntelligenceSnapshot;
  isolationWarnings: string[];
  safeToReason: boolean;
  recommendedProject: string | null;
}

export interface WorkspaceIntelligenceDiagnostics {
  workspaceIntelligenceActive: boolean;
  workspaceCount: number;
  activeWorkspace: string | null;
  activeProject: string | null;
  workspaceOwnershipConfidence: WorkspaceConfidence;
  workspaceRiskCount: number;
  contextLeakageRisk: 'clear' | 'warning' | 'high';
  lastWorkspaceQuery: string | null;
  duplicateWorkspaceRisk: 'clear' | 'warning';
}

export interface WorkspaceAnswer {
  query: string;
  analysis: WorkspaceAnalysis;
  responseText: string;
}

export const WORKSPACE_QUESTION_SIGNALS = [
  'workspace',
  'project ownership',
  'active project',
  'currently active',
  'project is currently active',
  'project is active',
  'active workspace',
  'workspace boundary',
  'workspace mismatch',
  'workspace risk',
  'workspace isolation',
  'what workspace',
  'which workspace',
  'project owns',
  'owns this workspace',
  'belong to this workspace',
  'modules belong',
  'files appear',
  'files belong',
  'context leakage',
  'context should remain isolated',
  'context isolation',
  'mismatch risk',
  'work belong to',
  'workspace intelligence',
  'workspace boundaries',
  'orphaned workspace',
  'unknown workspace',
] as const;

export const FORBIDDEN_WORKSPACE_INTELLIGENCE_DUPLICATES = [
  'workspace_brain',
  'workspace_understanding_v2',
  'workspace_memory_authority',
  'brain_v2',
  'project_brain',
  'memory_brain',
  'second_workspace_authority',
  'workspace_context_engine',
] as const;

export function isWorkspaceIntelligenceQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return WORKSPACE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateWorkspaceBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('create a new workspace brain') ||
    lower.includes('workspace brain') ||
    lower.includes('second workspace intelligence') ||
    lower.includes('workspace understanding v2') ||
    lower.includes('workspace memory authority') ||
    lower.includes('replace workspace intelligence')
  );
}
