/**
 * Workspace context builder — assembles workspace awareness from existing systems.
 */

import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import type {
  WorkspaceBoundary,
  WorkspaceContext,
  WorkspaceIntelligenceSnapshot,
  WorkspaceModule,
  WorkspaceProjectLink,
} from './workspace-intelligence-types.js';

const PRIMARY_WORKSPACE_ID = 'ws-devpulse-v2-primary';
const WORLD2_PLANNING_WORKSPACE_ID = 'ws-world2-planning';

const COMMAND_CENTER_MODULES: Array<{ moduleId: string; moduleName: string; owner: string }> = [
  { moduleId: 'command_center_brain', moduleName: 'Command Center Brain', owner: 'devpulse_v2_command_center_brain' },
  { moduleId: 'project_understanding_engine', moduleName: 'Project Understanding Engine', owner: 'devpulse_v2_project_understanding_engine' },
  { moduleId: 'shared_memory_layer', moduleName: 'Shared Memory Layer', owner: 'devpulse_v2_shared_memory_layer' },
  { moduleId: 'timeline_intelligence', moduleName: 'Timeline Intelligence', owner: 'devpulse_v2_timeline_intelligence' },
  { moduleId: 'unified_decision_layer', moduleName: 'Unified Decision Layer', owner: 'devpulse_v2_unified_decision_layer' },
  { moduleId: 'project_vault_intelligence', moduleName: 'Project Vault Intelligence', owner: 'devpulse_v2_project_vault_intelligence' },
  { moduleId: 'dependency_intelligence', moduleName: 'Dependency Intelligence', owner: 'devpulse_v2_dependency_intelligence' },
  { moduleId: 'workspace_intelligence', moduleName: 'Workspace Intelligence', owner: 'devpulse_v2_workspace_intelligence' },
];

const PRIMARY_FILE_AREAS = [
  'src/command-center-brain/',
  'src/project-understanding/',
  'src/shared-memory/',
  'src/workspace-intelligence/',
  'public/founder-reality/',
  'architecture/',
] as const;

function seedPrimaryWorkspace(profile: ReturnType<typeof getCurrentProjectProfile>): WorkspaceContext {
  return {
    workspaceId: PRIMARY_WORKSPACE_ID,
    workspaceName: 'DevPulse V2 Command Center Workspace',
    projectId: profile.projectId,
    projectName: profile.name,
    active: true,
    confidence: 'HIGH',
    source: 'workspace_intelligence',
    riskLevel: 'low',
    readOnly: true,
  };
}

function seedWorld2PlanningWorkspace(): WorkspaceContext {
  return {
    workspaceId: WORLD2_PLANNING_WORKSPACE_ID,
    workspaceName: 'World 2 Planning Workspace',
    projectId: 'world2-foundation',
    projectName: 'World 2 Foundation',
    active: false,
    confidence: 'HIGH',
    source: 'world2_workspace_foundation',
    riskLevel: 'medium',
    readOnly: true,
  };
}

function buildModules(workspaceId: string, projectId: string): WorkspaceModule[] {
  return COMMAND_CENTER_MODULES.map((m) => ({
    workspaceId,
    moduleId: m.moduleId,
    moduleName: m.moduleName,
    projectId,
    owner: m.owner,
    confidence: 'HIGH' as const,
    readOnly: true as const,
  }));
}

function buildBoundaries(workspaceId: string): WorkspaceBoundary[] {
  return [
    {
      workspaceId,
      boundaryType: 'WORLD1_COMMAND_CENTER',
      owner: 'devpulse_v2_workspace_intelligence',
      reason: 'Command Center intelligence layers remain scoped to DevPulse V2 primary workspace.',
      confidence: 'HIGH',
      riskLevel: 'low',
      readOnly: true,
    },
    {
      workspaceId,
      boundaryType: 'VAULT_READ_ONLY',
      owner: 'devpulse_v2_project_vault_intelligence',
      reason: 'Project Vault facts are read-only supplemental context — no vault mutation.',
      confidence: 'HIGH',
      riskLevel: 'low',
      readOnly: true,
    },
    {
      workspaceId,
      boundaryType: 'MEMORY_SCOPED',
      owner: 'devpulse_v2_shared_memory_layer',
      reason: 'Shared Memory recall is scoped per active project context.',
      confidence: 'HIGH',
      riskLevel: 'medium',
      readOnly: true,
    },
    {
      workspaceId: WORLD2_PLANNING_WORKSPACE_ID,
      boundaryType: 'WORLD2_ISOLATED',
      owner: 'devpulse_v2_world2_workspace_foundation',
      reason: 'World 2 planning workspace remains isolated from World 1 command center execution.',
      confidence: 'HIGH',
      riskLevel: 'medium',
      readOnly: true,
    },
    {
      workspaceId,
      boundaryType: 'INTELLIGENCE_ONLY',
      owner: 'devpulse_v2_workspace_intelligence',
      reason: 'Workspace Intelligence is advisory only — no file modification or execution.',
      confidence: 'HIGH',
      riskLevel: 'low',
      readOnly: true,
    },
  ];
}

function readWorld2Workspaces(): WorkspaceContext[] {
  try {
    const foundation = getDevPulseV2World2WorkspaceFoundation();
    const listed = foundation.getManager().listWorkspaces();
    return listed.map((ws) => ({
      workspaceId: ws.workspaceId,
      workspaceName: `${ws.projectName} (World 2)`,
      projectId: ws.projectId,
      projectName: ws.projectName,
      active: ws.workspaceState === 'WORKSPACE_ACTIVE',
      confidence: 'HIGH' as const,
      source: 'world2_workspace_foundation',
      riskLevel: 'medium' as const,
      readOnly: true as const,
    }));
  } catch {
    return [];
  }
}

let cachedSnapshot: WorkspaceIntelligenceSnapshot | null = null;

export function buildWorkspaceSnapshot(): WorkspaceIntelligenceSnapshot {
  const profile = getCurrentProjectProfile();
  const primary = seedPrimaryWorkspace(profile);
  const world2Planning = seedWorld2PlanningWorkspace();
  const world2Listed = readWorld2Workspaces();

  const workspaces: WorkspaceContext[] = [primary, world2Planning];
  for (const ws of world2Listed) {
    if (!workspaces.some((w) => w.workspaceId === ws.workspaceId)) {
      workspaces.push(ws);
    }
  }

  const projectLinks: WorkspaceProjectLink[] = workspaces.map((ws) => ({
    workspaceId: ws.workspaceId,
    workspaceName: ws.workspaceName,
    projectId: ws.projectId,
    projectName: ws.projectName,
    owner: ws.source,
    confidence: ws.confidence,
    reason: `${ws.workspaceName} is linked to project ${ws.projectName} (${ws.projectId}).`,
    readOnly: true,
  }));

  const modules = [
    ...buildModules(PRIMARY_WORKSPACE_ID, profile.projectId),
    ...buildModules(WORLD2_PLANNING_WORKSPACE_ID, 'world2-foundation'),
  ];

  const boundaries = buildBoundaries(PRIMARY_WORKSPACE_ID);
  const owners = listDevPulseV2Owners();
  const ownershipConfidence: WorkspaceIntelligenceSnapshot['ownershipConfidence'] =
    owners.some((o) => o.domain === 'workspace_intelligence') ? 'HIGH' : 'MEDIUM';

  const snapshot: WorkspaceIntelligenceSnapshot = {
    workspaces,
    projectLinks,
    modules,
    boundaries,
    risks: [],
    activeWorkspace: primary,
    activeProject: { projectId: profile.projectId, projectName: profile.name },
    workspaceCount: workspaces.length,
    ownershipConfidence,
    mismatchCount: 0,
    contextLeakageRisk: 'clear',
    duplicateWorkspaceRisk: 'clear',
    builtAt: Date.now(),
  };

  cachedSnapshot = snapshot;
  return snapshot;
}

export function getWorkspaceSnapshot(): WorkspaceIntelligenceSnapshot {
  return cachedSnapshot ?? buildWorkspaceSnapshot();
}

export function getPrimaryFileAreas(): readonly string[] {
  return PRIMARY_FILE_AREAS;
}

export function resetWorkspaceSnapshotForTests(): WorkspaceIntelligenceSnapshot {
  cachedSnapshot = null;
  return buildWorkspaceSnapshot();
}
