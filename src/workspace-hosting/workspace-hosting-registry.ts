/**
 * Workspace Hosting Foundation — registry and orchestrator.
 * Authority only — no builds, cloud workers, or real app deployment.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes, getRuntime } from '../cloud-runtime/index.js';
import { publishWorkspaceHostingFeedStages } from '../operator-feed/workspace-hosting-feed-bridge.js';
import {
  nextWorkspaceId,
  storeWorkspace,
  getStoredWorkspace,
  listStoredWorkspaces,
} from './workspace-hosting-store.js';
import { buildWorkspaceOwnership, recordWorkspaceOwnershipHistory } from './workspace-hosting-ownership.js';
import { buildDefaultIsolation } from './workspace-hosting-isolation.js';
import { linkWorkspaceToRuntime } from './workspace-hosting-runtime-bridge.js';
import { createWorkspaceSession } from './workspace-hosting-session-manager.js';
import {
  activateWorkspace,
  completeWorkspace,
  recordWorkspaceLifecycleEvent,
} from './workspace-hosting-lifecycle.js';
import { setWorkspaceState } from './workspace-hosting-state-manager.js';
import { recordWorkspaceHistoryEntry } from './workspace-hosting-history.js';
import { validateWorkspaceRegistration, validateHostedWorkspace } from './workspace-hosting-validator.js';
import { updateWorkspaceHostingDiagnostics, getWorkspaceHostingDiagnostics } from './workspace-hosting-diagnostics.js';
import {
  buildAllWorkspaceHostingReports,
  composeWorkspaceHostingResponse,
} from './workspace-hosting-report-builder.js';
import type {
  HostedWorkspace,
  WorkspaceValidationResult,
  PrepareWorkspaceHostingFoundationInput,
  PrepareWorkspaceHostingFoundationResult,
  RegisterWorkspaceInput,
  RegisterWorkspaceResult,
} from './workspace-hosting-types.js';
import {
  WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
  isDuplicateWorkspaceHostingExecutorQuestion,
} from './workspace-hosting-types.js';

const BOOTSTRAP_WORKSPACES: Array<{
  name: string;
  type: HostedWorkspace['workspaceType'];
  description: string;
  runtimeNameMatch: string;
}> = [
  { name: 'General Hosted Workspace', type: 'GENERAL_WORKSPACE', description: 'General hosted workspace authority', runtimeNameMatch: 'Workspace Host' },
  { name: 'Persistent Build Workspace', type: 'BUILD_WORKSPACE', description: 'Long-running build workspace authority', runtimeNameMatch: 'Build Runtime' },
  { name: 'Cloud Verification Workspace', type: 'VERIFICATION_WORKSPACE', description: 'Cloud verification workspace authority', runtimeNameMatch: 'Verification Runtime' },
  { name: 'World 2 Hosted Workspace', type: 'WORLD2_WORKSPACE', description: 'Future World 2 cloud workspace authority', runtimeNameMatch: 'World 2' },
  { name: 'Autonomous Builder Workspace', type: 'AUTONOMOUS_WORKSPACE', description: 'Future autonomous builder workspace authority', runtimeNameMatch: 'Autonomous Builder' },
  { name: 'Founder Hosted Workspace', type: 'FOUNDER_WORKSPACE', description: 'Founder-controlled workspace authority', runtimeNameMatch: 'Founder Cloud' },
  { name: 'Mobile Command Workspace', type: 'MOBILE_WORKSPACE', description: 'Mobile-controlled workspace authority', runtimeNameMatch: 'Mobile Command' },
  { name: 'Sandbox Workspace', type: 'SANDBOX_WORKSPACE', description: 'Disposable sandbox workspace authority', runtimeNameMatch: 'Workspace Host' },
];

let bootstrapped = false;

export function resetWorkspaceHostingBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureCloudRuntimes(projectId: string, workspaceId: string): void {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  const runtimes = listRuntimes();
  if (runtimes.length === 0) {
    processCloudRuntimeRequest('Show cloud runtime inventory');
  }
}

function resolveRuntimeIdForBootstrap(runtimeNameMatch: string, projectId: string): string | null {
  const runtimes = listRuntimes();
  const match = runtimes.find((r) => r.runtimeMetadata.runtimeName.includes(runtimeNameMatch));
  if (match) return match.runtimeId;
  const general = runtimes.find((r) => r.runtimeType === 'GENERAL_RUNTIME');
  return general?.runtimeId ?? runtimes[0]?.runtimeId ?? null;
}

function bootstrapHostedWorkspaces(projectId: string): void {
  if (bootstrapped) return;
  ensureCloudRuntimes(projectId, projectId);

  for (const seed of BOOTSTRAP_WORKSPACES) {
    const runtimeId = resolveRuntimeIdForBootstrap(seed.runtimeNameMatch, projectId);
    if (!runtimeId) continue;
    registerWorkspace({
      workspaceName: seed.name,
      workspaceType: seed.type,
      projectId,
      runtimeId,
      workspaceDescription: seed.description,
      resumable: true,
      isolatable: true,
      isolationMode: seed.type === 'SANDBOX_WORKSPACE' ? 'SANDBOX' : 'PROJECT_BOUND',
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerWorkspace(input: RegisterWorkspaceInput): RegisterWorkspaceResult {
  const existing = listStoredWorkspaces().find(
    (w) =>
      w.workspaceMetadata.workspaceName === input.workspaceName &&
      w.workspaceOwner.projectId === input.projectId &&
      w.workspaceOwner.runtimeId === input.runtimeId,
  );
  if (existing && !input.allowDuplicate) {
    return {
      workspace: existing,
      duplicate: true,
      duplicateRisks: [],
      blocked: false,
    };
  }

  const validation = validateWorkspaceRegistration(input);
  if (!validation.valid) {
    return {
      workspace: null,
      duplicate: false,
      duplicateRisks: validation.duplicateRisks,
      blocked: true,
    };
  }

  const now = Date.now();
  const workspaceId = nextWorkspaceId();
  const ownership = buildWorkspaceOwnership({
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    createdBy: input.createdBy,
  });

  const workspace: HostedWorkspace = {
    workspaceId,
    workspaceType: input.workspaceType ?? 'GENERAL_WORKSPACE',
    workspaceOwner: ownership,
    workspaceState: 'CREATED',
    workspaceStatus: 'UNKNOWN',
    workspaceMetadata: {
      workspaceName: input.workspaceName,
      workspaceDescription: input.workspaceDescription ?? '',
      tags: [input.workspaceType ?? 'GENERAL_WORKSPACE'],
      resumable: input.resumable ?? true,
      isolatable: input.isolatable ?? true,
      monitorable: input.monitorable ?? true,
    },
    workspaceVisibility: input.visibility ?? 'PROJECT',
    workspaceProvenance: {
      sourceSystem: WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    workspaceIsolation: buildDefaultIsolation({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      mode: input.isolationMode,
      disposable: input.workspaceType === 'SANDBOX_WORKSPACE',
    }),
    workspaceRuntimeLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    workspaceProjectLink: {
      projectId: input.projectId,
      linkedAt: now,
      linkAuthority: WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
    },
    workspaceVerificationLink: {
      evidenceReferences: input.evidenceReferences ?? [],
      reportReferences: input.reportReferences ?? [],
      linkedAt: now,
    },
    workspaceRelationships: {
      parentWorkspaceId: null,
      childWorkspaceIds: [],
      relatedRuntimeIds: [input.runtimeId],
      relatedProjectIds: [input.projectId],
    },
    createdAt: now,
    updatedAt: now,
  };

  storeWorkspace(workspace);
  recordWorkspaceLifecycleEvent(workspaceId, 'WORKSPACE_CREATED', `Registered ${input.workspaceName}`);
  linkWorkspaceToRuntime(workspaceId, input.runtimeId);
  recordWorkspaceOwnershipHistory(workspaceId, `Ownership assigned to ${ownership.ownerModule}`);
  recordWorkspaceHistoryEntry({
    workspaceId,
    category: 'WORKSPACE',
    summary: `Workspace ${workspaceId} registered: ${input.workspaceName}`,
    scopeUsed: input.projectId,
  });

  return {
    workspace: getStoredWorkspace(workspaceId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getWorkspace(workspaceId: string): HostedWorkspace | null {
  return getStoredWorkspace(workspaceId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareWorkspaceHostingFoundationInput> = {},
): PrepareWorkspaceHostingFoundationInput {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('workspace_hosting_foundation');
  const runtimes = listRuntimes();
  const runtimeId = runtimes[0]?.runtimeId ?? 'crrt-0001';

  return {
    query,
    projectId: project.projectId,
    runtimeId,
    workspaceName: 'DevPulse Hosted Workspace',
    workspaceType: 'GENERAL_WORKSPACE',
    projectExists: project.projectId !== 'none',
    runtimeExists: runtimes.length > 0 || getRuntime(runtimeId) !== null,
    ownershipValid: owner.ownerModule === WORKSPACE_HOSTING_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

export function prepareWorkspaceHostingFoundation(
  input: PrepareWorkspaceHostingFoundationInput,
): PrepareWorkspaceHostingFoundationResult {
  const query = input.query ?? 'Show hosted workspace inventory';

  if (isDuplicateWorkspaceHostingExecutorQuestion(query)) {
    publishWorkspaceHostingFeedStages(query, false);
    updateWorkspaceHostingDiagnostics(query, 'FAILED');
    return {
      workspace: null,
      session: null,
      reports: buildAllWorkspaceHostingReports(),
      diagnostics: getWorkspaceHostingDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate workspace hosting executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: 'Recommendation: No.\nDo not create workspace_hosting_executor or parallel workspace authorities.',
      authorityOnly: true,
    };
  }

  if (!input.projectExists || !input.runtimeExists) {
    publishWorkspaceHostingFeedStages(query, false);
    updateWorkspaceHostingDiagnostics(query, 'FAILED');
    return {
      workspace: null,
      session: null,
      reports: buildAllWorkspaceHostingReports(),
      diagnostics: getWorkspaceHostingDiagnostics(),
      validation: {
        valid: false,
        blockers: [!input.projectExists ? 'Missing project' : 'Missing runtime link'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: composeWorkspaceHostingResponse(query, null, null, [], true),
      authorityOnly: true,
    };
  }

  bootstrapHostedWorkspaces(input.projectId);

  const registration = registerWorkspace({
    workspaceName: input.workspaceName ?? 'DevPulse Hosted Workspace',
    workspaceType: input.workspaceType ?? 'GENERAL_WORKSPACE',
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceDescription: 'Workspace hosting authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
    evidenceReferences: ['vevid-0001'],
    reportReferences: ['vrpt-0001'],
  });

  let workspace = registration.workspace;
  let validation: WorkspaceValidationResult = {
    valid: !registration.blocked && workspace !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && workspace) {
    validation.warnings.push(`Using existing workspace: ${workspace.workspaceId}`);
  }

  if (workspace && !registration.blocked) {
    activateWorkspace(workspace.workspaceId);
    workspace = getStoredWorkspace(workspace.workspaceId);
    if (workspace && workspace.workspaceState !== 'READY') {
      setWorkspaceState(workspace.workspaceId, 'READY', true);
      workspace = getStoredWorkspace(workspace.workspaceId);
    }
    recordWorkspaceLifecycleEvent(workspace!.workspaceId, 'WORKSPACE_LINKED_TO_RUNTIME', `Linked to ${input.runtimeId}`);
  }

  let session = workspace
    ? createWorkspaceSession({
        workspaceId: workspace.workspaceId,
        projectId: input.projectId,
        runtimeId: input.runtimeId,
      })
    : null;

  if (workspace && session) {
    activateWorkspace(workspace.workspaceId);
    completeWorkspace(workspace.workspaceId);
    workspace = getStoredWorkspace(workspace.workspaceId);
    validation = validateHostedWorkspace(workspace);
  }

  const blocked = !validation.valid || registration.blocked;
  const reports = buildAllWorkspaceHostingReports();
  const finalState = workspace?.workspaceState ?? (blocked ? 'FAILED' : 'READY');

  publishWorkspaceHostingFeedStages(query, !blocked);
  updateWorkspaceHostingDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    workspace,
    session,
    reports,
    diagnostics: getWorkspaceHostingDiagnostics(),
    validation,
    responseText: composeWorkspaceHostingResponse(query, workspace, session, reports, blocked),
    authorityOnly: true,
  };
}

export function processWorkspaceHostingRequest(query: string): PrepareWorkspaceHostingFoundationResult {
  return prepareWorkspaceHostingFoundation(resolveInputFromQuery(query));
}

export function getWorkspaceHostingContext(query: string): PrepareWorkspaceHostingFoundationResult {
  return processWorkspaceHostingRequest(query);
}
