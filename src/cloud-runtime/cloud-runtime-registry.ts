/**
 * Cloud Runtime Foundation — registry and orchestrator.
 * Authority only — no builds, World 2 plans, or autonomous builder execution.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { publishCloudRuntimeFeedStages } from '../operator-feed/cloud-runtime-feed-bridge.js';
import {
  nextRuntimeId,
  storeRuntime,
  getStoredRuntime,
  listStoredRuntimes,
} from './cloud-runtime-store.js';
import { buildRuntimeOwnership, recordOwnershipHistory } from './cloud-runtime-ownership.js';
import { createRuntimeSession } from './cloud-runtime-session-manager.js';
import {
  activateRuntime,
  completeRuntime,
  recordLifecycleEvent,
} from './cloud-runtime-lifecycle.js';
import { setRuntimeState } from './cloud-runtime-state-manager.js';
import { recordHistoryEntry } from './cloud-runtime-history.js';
import { validateRuntimeRegistration, validateCloudRuntime } from './cloud-runtime-validator.js';
import { updateCloudRuntimeDiagnostics, getCloudRuntimeDiagnostics } from './cloud-runtime-diagnostics.js';
import {
  buildAllCloudRuntimeReports,
  composeCloudRuntimeResponse,
} from './cloud-runtime-report-builder.js';
import type {
  CloudRuntime,
  CloudRuntimeValidationResult,
  PrepareCloudRuntimeFoundationInput,
  PrepareCloudRuntimeFoundationResult,
  RegisterRuntimeInput,
  RegisterRuntimeResult,
} from './cloud-runtime-types.js';
import {
  CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
  isDuplicateCloudRuntimeExecutorQuestion,
} from './cloud-runtime-types.js';

const BOOTSTRAP_RUNTIMES: Array<{
  name: string;
  type: CloudRuntime['runtimeType'];
  description: string;
}> = [
  { name: 'DevPulse Workspace Host', type: 'GENERAL_RUNTIME', description: 'General cloud workspace authority' },
  { name: 'Persistent Build Runtime', type: 'BUILD_RUNTIME', description: 'Long-running build session authority' },
  { name: 'Cloud Verification Runtime', type: 'VERIFICATION_RUNTIME', description: 'Cloud verification authority' },
  { name: 'World 2 Cloud Runtime', type: 'WORLD2_RUNTIME', description: 'Future World 2 cloud execution authority' },
  { name: 'Autonomous Builder Cloud', type: 'AUTONOMOUS_RUNTIME', description: 'Future autonomous builder cloud authority' },
  { name: 'Founder Cloud Runtime', type: 'FOUNDER_RUNTIME', description: 'Founder-controlled cloud authority' },
  { name: 'Mobile Command Runtime', type: 'MOBILE_RUNTIME', description: 'Mobile-controlled cloud work authority' },
];

let bootstrapped = false;

export function resetCloudRuntimeBootstrapForTests(): void {
  bootstrapped = false;
}

function bootstrapCloudRuntimes(projectId: string, workspaceId: string): void {
  if (bootstrapped) return;
  for (const seed of BOOTSTRAP_RUNTIMES) {
    registerRuntime({
      runtimeName: seed.name,
      runtimeType: seed.type,
      projectId,
      workspaceId,
      runtimeDescription: seed.description,
      resumable: true,
      monitorable: true,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerRuntime(input: RegisterRuntimeInput): RegisterRuntimeResult {
  const existing = listStoredRuntimes().find(
    (r) =>
      r.runtimeMetadata.runtimeName === input.runtimeName &&
      r.runtimeOwner.projectId === input.projectId &&
      r.runtimeOwner.workspaceId === input.workspaceId,
  );
  if (existing && !input.allowDuplicate) {
    return {
      runtime: existing,
      duplicate: true,
      duplicateRisks: [],
      blocked: false,
    };
  }

  const validation = validateRuntimeRegistration(input);
  if (!validation.valid) {
    return {
      runtime: null,
      duplicate: false,
      duplicateRisks: validation.duplicateRisks,
      blocked: true,
    };
  }

  const now = Date.now();
  const runtimeId = nextRuntimeId();
  const ownership = buildRuntimeOwnership({
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    createdBy: input.createdBy,
  });

  const runtime: CloudRuntime = {
    runtimeId,
    runtimeType: input.runtimeType ?? 'GENERAL_RUNTIME',
    runtimeOwner: ownership,
    runtimeState: 'CREATED',
    runtimeStatus: 'UNKNOWN',
    runtimeMetadata: {
      runtimeName: input.runtimeName,
      runtimeDescription: input.runtimeDescription ?? '',
      tags: [input.runtimeType ?? 'GENERAL_RUNTIME'],
      resumable: input.resumable ?? true,
      monitorable: input.monitorable ?? true,
    },
    runtimeVisibility: input.visibility ?? 'PROJECT',
    runtimeProvenance: {
      sourceSystem: CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    runtimeRelationships: {
      parentRuntimeId: null,
      childRuntimeIds: [],
      relatedProjectIds: [input.projectId],
      relatedWorkspaceIds: [input.workspaceId],
    },
    createdAt: now,
    updatedAt: now,
  };

  storeRuntime(runtime);
  recordLifecycleEvent(runtimeId, 'RUNTIME_CREATED', `Registered ${input.runtimeName}`);
  recordOwnershipHistory(runtimeId, `Ownership assigned to ${ownership.ownerModule}`);
  recordHistoryEntry({
    runtimeId,
    category: 'RUNTIME',
    summary: `Runtime ${runtimeId} registered: ${input.runtimeName}`,
    scopeUsed: input.workspaceId,
  });

  return {
    runtime,
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getRuntime(runtimeId: string): CloudRuntime | null {
  return getStoredRuntime(runtimeId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareCloudRuntimeFoundationInput> = {},
): PrepareCloudRuntimeFoundationInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('cloud_runtime_foundation');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    runtimeName: 'DevPulse Cloud Runtime',
    runtimeType: 'GENERAL_RUNTIME',
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    ownershipValid: owner.ownerModule === CLOUD_RUNTIME_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

export function prepareCloudRuntimeFoundation(
  input: PrepareCloudRuntimeFoundationInput,
): PrepareCloudRuntimeFoundationResult {
  const query = input.query ?? 'Show cloud runtime inventory';

  if (isDuplicateCloudRuntimeExecutorQuestion(query)) {
    const validation: CloudRuntimeValidationResult = {
      valid: false,
      blockers: ['Duplicate cloud runtime executor rejected'],
      warnings: [],
      duplicateRisks: [],
    };
    publishCloudRuntimeFeedStages(query, false);
    updateCloudRuntimeDiagnostics(query, 'FAILED');
    return {
      runtime: null,
      session: null,
      reports: buildAllCloudRuntimeReports(),
      diagnostics: getCloudRuntimeDiagnostics(),
      validation,
      responseText:
        'Recommendation: No.\nDo not create cloud_runtime_executor or parallel cloud execution authorities.',
      authorityOnly: true,
    };
  }

  if (!input.projectExists) {
    const validation: CloudRuntimeValidationResult = {
      valid: false,
      blockers: ['Missing project'],
      warnings: [],
      duplicateRisks: [],
    };
    publishCloudRuntimeFeedStages(query, false);
    updateCloudRuntimeDiagnostics(query, 'FAILED');
    return {
      runtime: null,
      session: null,
      reports: buildAllCloudRuntimeReports(),
      diagnostics: getCloudRuntimeDiagnostics(),
      validation,
      responseText: composeCloudRuntimeResponse(query, null, null, [], true),
      authorityOnly: true,
    };
  }

  bootstrapCloudRuntimes(input.projectId, input.workspaceId);

  const registration = registerRuntime({
    runtimeName: input.runtimeName ?? 'DevPulse Cloud Runtime',
    runtimeType: input.runtimeType ?? 'GENERAL_RUNTIME',
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeDescription: 'Cloud runtime authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let runtime = registration.runtime;
  let validation: CloudRuntimeValidationResult = {
    valid: !registration.blocked && runtime !== null,
    blockers: registration.blocked ? ['Registration blocked by duplicate runtime risk'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && runtime) {
    validation.warnings.push(`Using existing runtime: ${runtime.runtimeId}`);
  }

  if (runtime && !registration.blocked) {
    activateRuntime(runtime.runtimeId);
    runtime = getStoredRuntime(runtime.runtimeId);
    if (runtime && runtime.runtimeState !== 'READY') {
      setRuntimeState(runtime.runtimeId, 'READY', true);
      runtime = getStoredRuntime(runtime.runtimeId);
    }
  }

  let session = runtime
    ? createRuntimeSession({
        runtimeId: runtime.runtimeId,
        projectId: input.projectId,
        workspaceId: input.workspaceId,
      })
    : null;

  if (runtime && session) {
    runtime = getStoredRuntime(runtime.runtimeId);
    activateRuntime(runtime!.runtimeId);
    completeRuntime(runtime!.runtimeId);
    runtime = getStoredRuntime(runtime!.runtimeId);
    validation = validateCloudRuntime(runtime);
  }

  const blocked = !validation.valid || registration.blocked;

  const reports = buildAllCloudRuntimeReports();
  const finalState = runtime?.runtimeState ?? (blocked ? 'FAILED' : 'READY');

  publishCloudRuntimeFeedStages(query, !blocked);
  updateCloudRuntimeDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    runtime,
    session,
    reports,
    diagnostics: getCloudRuntimeDiagnostics(),
    validation,
    responseText: composeCloudRuntimeResponse(query, runtime, session, reports, blocked),
    authorityOnly: true,
  };
}

export function processCloudRuntimeRequest(query: string): PrepareCloudRuntimeFoundationResult {
  return prepareCloudRuntimeFoundation(resolveInputFromQuery(query));
}

export function getCloudRuntimeContext(query: string): PrepareCloudRuntimeFoundationResult {
  return processCloudRuntimeRequest(query);
}
