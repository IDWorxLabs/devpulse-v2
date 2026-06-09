/**
 * Cloud Recovery Foundation — registry and orchestrator.
 * Authority only — no recovery execution, rollback, cloud worker restart, or file mutation.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { processPersistentBuildRequest, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processCloudVerificationRequest, listCloudVerifications } from '../cloud-verification/index.js';
import { publishCloudRecoveryFeedStages } from '../operator-feed/cloud-recovery-feed-bridge.js';
import {
  nextRecoveryId,
  storeCloudRecovery,
  getStoredCloudRecovery,
  listStoredCloudRecoveries,
} from './cloud-recovery-store.js';
import { buildCloudRecoveryOwnership, recordRecoveryOwnershipHistory } from './cloud-recovery-ownership.js';
import { buildDefaultCloudRecoveryScope } from './cloud-recovery-scope.js';
import { buildDefaultCloudRecoveryContext } from './cloud-recovery-context.js';
import { linkRecoveryToRuntime } from './cloud-recovery-runtime-bridge.js';
import { linkRecoveryToWorkspace } from './cloud-recovery-workspace-bridge.js';
import { linkRecoveryToPersistentBuild } from './cloud-recovery-build-bridge.js';
import { linkRecoveryToVerification } from './cloud-recovery-verification-bridge.js';
import { createRecoverySession } from './cloud-recovery-session-manager.js';
import {
  initializeCloudRecovery,
  registerFailure,
  registerRecoveryCandidate,
  registerRecoveryPlan,
  markRecoveryReady,
  completeCloudRecovery,
  recordCloudRecoveryLifecycleEvent,
} from './cloud-recovery-lifecycle.js';
import { setRecoveryState } from './cloud-recovery-state-manager.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import {
  validateCloudRecoveryRegistration,
  validateCloudRecoveryRecord,
} from './cloud-recovery-validator.js';
import { updateCloudRecoveryDiagnostics, getCloudRecoveryDiagnostics } from './cloud-recovery-diagnostics.js';
import {
  buildAllCloudRecoveryReports,
  composeCloudRecoveryResponse,
} from './cloud-recovery-report-builder.js';
import type {
  CloudRecovery,
  CloudRecoveryValidationResult,
  PrepareCloudRecoveryFoundationInput,
  PrepareCloudRecoveryFoundationResult,
  RegisterRecoveryInput,
  RegisterRecoveryResult,
} from './cloud-recovery-types.js';
import {
  CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
  isDuplicateCloudRecoveryExecutorQuestion,
} from './cloud-recovery-types.js';

const BOOTSTRAP_RECOVERIES: Array<{
  name: string;
  type: CloudRecovery['recoveryType'];
  description: string;
  verificationNameMatch: string;
  buildNameMatch: string;
  intent: string;
}> = [
  { name: 'General Cloud Recovery', type: 'GENERAL_RECOVERY', description: 'General cloud recovery authority', verificationNameMatch: 'General Cloud Verification', buildNameMatch: 'General Persistent', intent: 'General recovery coordination metadata' },
  { name: 'Runtime Cloud Recovery', type: 'RUNTIME_RECOVERY', description: 'Cloud runtime recovery authority', verificationNameMatch: 'Runtime Cloud Verification', buildNameMatch: 'General Persistent', intent: 'Runtime recovery scope metadata' },
  { name: 'Workspace Cloud Recovery', type: 'WORKSPACE_RECOVERY', description: 'Hosted workspace recovery authority', verificationNameMatch: 'Workspace Cloud Verification', buildNameMatch: 'Persistent Build Workspace', intent: 'Workspace recovery scope metadata' },
  { name: 'Persistent Build Recovery', type: 'BUILD_RECOVERY', description: 'Persistent build recovery authority', verificationNameMatch: 'Persistent Build Verification', buildNameMatch: 'Persistent Build', intent: 'Persistent build recovery scope metadata' },
  { name: 'World 2 Cloud Recovery', type: 'WORLD2_RECOVERY', description: 'World 2 cloud recovery authority', verificationNameMatch: 'World 2 Cloud Verification', buildNameMatch: 'World 2', intent: 'World 2 recovery context metadata' },
  { name: 'Autonomous Cloud Recovery', type: 'AUTONOMOUS_RECOVERY', description: 'Autonomous builder cloud recovery authority', verificationNameMatch: 'Autonomous Cloud Verification', buildNameMatch: 'Autonomous', intent: 'Autonomous builder recovery metadata' },
  { name: 'Mobile Cloud Recovery', type: 'MOBILE_RECOVERY', description: 'Mobile command cloud recovery authority', verificationNameMatch: 'Mobile Cloud Verification', buildNameMatch: 'Mobile', intent: 'Mobile-triggered recovery metadata' },
  { name: 'Monitoring Cloud Recovery', type: 'MONITORING_RECOVERY', description: 'Cloud monitoring recovery authority', verificationNameMatch: 'Monitoring Cloud Verification', buildNameMatch: 'Verification Triggered', intent: 'Monitoring recovery metadata' },
  { name: 'Verification Cloud Recovery', type: 'VERIFICATION_RECOVERY', description: 'Verification-linked cloud recovery authority', verificationNameMatch: 'Recovery Cloud Verification', buildNameMatch: 'Recovery', intent: 'Verification recovery context metadata' },
];

let bootstrapped = false;

export function resetCloudRecoveryBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processWorkspaceHostingRequest('Show hosted workspace inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  processCloudVerificationRequest('Show cloud verification inventory');
}

function resolveLinks(verificationNameMatch: string, buildNameMatch: string): {
  workspaceId: string;
  runtimeId: string;
  persistentBuildId: string;
  verificationId: string;
  projectId: string;
} | null {
  const builds = listPersistentBuilds();
  const verifications = listCloudVerifications();
  const build = builds.find((b) => b.buildMetadata.buildName.includes(buildNameMatch)) ?? builds[0];
  const verification =
    verifications.find((v) => v.verificationMetadata.verificationName.includes(verificationNameMatch)) ??
    verifications[0];
  if (!build || !verification) return null;
  return {
    workspaceId: build.buildOwner.workspaceId,
    runtimeId: build.buildOwner.runtimeId,
    persistentBuildId: build.buildId,
    verificationId: verification.verificationId,
    projectId: build.buildOwner.projectId,
  };
}

function bootstrapCloudRecoveries(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_RECOVERIES) {
    const links = resolveLinks(seed.verificationNameMatch, seed.buildNameMatch);
    if (!links) continue;
    registerRecovery({
      recoveryName: seed.name,
      recoveryType: seed.type,
      projectId: links.projectId || projectId,
      workspaceId: links.workspaceId,
      runtimeId: links.runtimeId,
      persistentBuildId: links.persistentBuildId,
      verificationId: links.verificationId,
      recoveryDescription: seed.description,
      recoveryIntent: seed.intent,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerRecovery(input: RegisterRecoveryInput): RegisterRecoveryResult {
  const existing = listStoredCloudRecoveries().find(
    (r) =>
      r.recoveryMetadata.recoveryName === input.recoveryName &&
      r.recoveryOwner.projectId === input.projectId &&
      r.recoveryOwner.runtimeId === input.runtimeId &&
      r.recoveryOwner.workspaceId === input.workspaceId &&
      r.recoveryOwner.persistentBuildId === input.persistentBuildId &&
      r.recoveryOwner.verificationId === input.verificationId,
  );
  if (existing && !input.allowDuplicate) {
    return { recovery: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateCloudRecoveryRegistration(input);
  if (!validation.valid) {
    return {
      recovery: null,
      duplicate: false,
      duplicateRisks: validation.duplicateRisks,
      blocked: true,
    };
  }

  const now = Date.now();
  const recoveryId = nextRecoveryId();
  const ownership = buildCloudRecoveryOwnership({
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    createdBy: input.createdBy,
  });

  const recovery: CloudRecovery = {
    recoveryId,
    recoveryType: input.recoveryType ?? 'GENERAL_RECOVERY',
    recoveryOwner: ownership,
    recoveryState: 'CREATED',
    recoveryStatus: 'UNKNOWN',
    recoveryMetadata: {
      recoveryName: input.recoveryName,
      recoveryDescription: input.recoveryDescription ?? '',
      failureDescription: input.failureDescription ?? null,
      candidateDescription: input.candidateDescription ?? null,
      planDescription: input.planDescription ?? null,
      tags: [input.recoveryType ?? 'GENERAL_RECOVERY'],
      monitorable: true,
    },
    recoveryVisibility: input.visibility ?? 'PROJECT',
    recoveryProvenance: {
      sourceSystem: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    recoveryScope: buildDefaultCloudRecoveryScope({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      verificationId: input.verificationId,
      recoveryType: input.recoveryType,
      recoveryIntent: input.recoveryIntent,
      failureCategory: input.failureCategory,
    }),
    recoveryContext: buildDefaultCloudRecoveryContext({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      verificationId: input.verificationId,
      recoveryType: input.recoveryType,
      failureDescription: input.failureDescription,
      candidateDescription: input.candidateDescription,
      planDescription: input.planDescription,
    }),
    recoveryRuntimeLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    recoveryWorkspaceLink: {
      workspaceId: input.workspaceId,
      linkedAt: now,
      linkAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    recoveryPersistentBuildLink: {
      persistentBuildId: input.persistentBuildId,
      linkedAt: now,
      linkAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    recoveryVerificationLink: {
      verificationId: input.verificationId,
      linkedAt: now,
      linkAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    recoveryRelationships: {
      parentRecoveryId: null,
      childRecoveryIds: [],
      relatedRuntimeIds: [input.runtimeId],
      relatedWorkspaceIds: [input.workspaceId],
      relatedPersistentBuildIds: [input.persistentBuildId],
      relatedVerificationIds: [input.verificationId],
      relatedProjectIds: [input.projectId],
    },
    createdAt: now,
    updatedAt: now,
  };

  storeCloudRecovery(recovery);
  recordCloudRecoveryLifecycleEvent(recoveryId, 'RECOVERY_CREATED', `Registered ${input.recoveryName}`);
  linkRecoveryToRuntime(recoveryId, input.runtimeId);
  linkRecoveryToWorkspace(recoveryId, input.workspaceId);
  linkRecoveryToPersistentBuild(recoveryId, input.persistentBuildId);
  linkRecoveryToVerification(recoveryId, input.verificationId);
  recordRecoveryOwnershipHistory(recoveryId, `Ownership assigned to ${ownership.ownerModule}`);
  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: 'RECOVERY',
    summary: `Recovery ${recoveryId} registered: ${input.recoveryName}`,
    scopeUsed: input.projectId,
  });

  return {
    recovery: getStoredCloudRecovery(recoveryId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getRecovery(recoveryId: string): CloudRecovery | null {
  return getStoredCloudRecovery(recoveryId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareCloudRecoveryFoundationInput> = {},
): PrepareCloudRecoveryFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('cloud_recovery_foundation');
  const builds = listPersistentBuilds();
  const verifications = listCloudVerifications();
  const build = builds[0];
  const verification = verifications[0];
  const runtimeId = build?.buildOwner.runtimeId ?? listRuntimes()[0]?.runtimeId ?? 'crrt-0001';
  const workspaceId = build?.buildOwner.workspaceId ?? listWorkspaces()[0]?.workspaceId ?? 'hws-0001';
  const persistentBuildId = build?.buildId ?? 'pbuild-0001';
  const verificationId = verification?.verificationId ?? 'cver-0001';

  return {
    query,
    projectId: project.projectId,
    workspaceId,
    runtimeId,
    persistentBuildId,
    verificationId,
    recoveryName: 'DevPulse Cloud Recovery',
    recoveryType: 'GENERAL_RECOVERY',
    projectExists: project.projectId !== 'none',
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: listWorkspaces().length > 0,
    persistentBuildExists: builds.length > 0,
    verificationExists: verifications.length > 0,
    ownershipValid: owner.ownerModule === CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

export function prepareCloudRecoveryFoundation(
  input: PrepareCloudRecoveryFoundationInput,
): PrepareCloudRecoveryFoundationResult {
  const query = input.query ?? 'Show cloud recovery inventory';

  if (isDuplicateCloudRecoveryExecutorQuestion(query)) {
    publishCloudRecoveryFeedStages(query, false);
    updateCloudRecoveryDiagnostics(query, 'FAILED');
    return {
      recovery: null,
      session: null,
      reports: buildAllCloudRecoveryReports(),
      diagnostics: getCloudRecoveryDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate cloud recovery executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: 'Recommendation: No.\nDo not create cloud_recovery_executor or parallel recovery authorities.',
      authorityOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.verificationExists
  ) {
    publishCloudRecoveryFeedStages(query, false);
    updateCloudRecoveryDiagnostics(query, 'FAILED');
    return {
      recovery: null,
      session: null,
      reports: buildAllCloudRecoveryReports(),
      diagnostics: getCloudRecoveryDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Missing project, runtime, workspace, persistent build, or verification link'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: composeCloudRecoveryResponse(query, null, null, buildAllCloudRecoveryReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapCloudRecoveries(input.projectId);

  const registration = registerRecovery({
    recoveryName: input.recoveryName ?? 'DevPulse Cloud Recovery',
    recoveryType: input.recoveryType ?? 'GENERAL_RECOVERY',
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryDescription: 'Cloud recovery authority session',
    recoveryIntent: 'Cloud recovery coordination metadata only',
    failureDescription: 'Sample failure metadata — no execution',
    candidateDescription: 'Sample recovery candidate — no execution',
    planDescription: 'Sample recovery plan — no execution',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let recovery = registration.recovery;
  let validation: CloudRecoveryValidationResult = {
    valid: !registration.blocked && recovery !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && recovery) {
    validation.warnings.push(`Using existing recovery: ${recovery.recoveryId}`);
  }

  if (recovery && !registration.blocked) {
    initializeCloudRecovery(recovery.recoveryId);
    recovery = getStoredCloudRecovery(recovery.recoveryId);
    if (recovery && recovery.recoveryState !== 'READY') {
      setRecoveryState(recovery.recoveryId, 'READY', true);
      recovery = getStoredCloudRecovery(recovery.recoveryId);
    }
    registerFailure(recovery!.recoveryId, 'Failure metadata registered — no execution');
    registerRecoveryCandidate(recovery!.recoveryId, 'Recovery candidate registered — no execution');
    registerRecoveryPlan(recovery!.recoveryId, 'Recovery plan registered — no execution');
    recordCloudRecoveryLifecycleEvent(recovery!.recoveryId, 'RECOVERY_LINKED_TO_RUNTIME', `Linked to ${input.runtimeId}`);
    recordCloudRecoveryLifecycleEvent(recovery!.recoveryId, 'RECOVERY_LINKED_TO_WORKSPACE', `Linked to ${input.workspaceId}`);
    recordCloudRecoveryLifecycleEvent(recovery!.recoveryId, 'RECOVERY_LINKED_TO_BUILD', `Linked to ${input.persistentBuildId}`);
    recordCloudRecoveryLifecycleEvent(recovery!.recoveryId, 'RECOVERY_LINKED_TO_VERIFICATION', `Linked to ${input.verificationId}`);
    markRecoveryReady(recovery!.recoveryId);
  }

  let session = recovery
    ? createRecoverySession({
        recoveryId: recovery.recoveryId,
        projectId: input.projectId,
        runtimeId: input.runtimeId,
        workspaceId: input.workspaceId,
        persistentBuildId: input.persistentBuildId,
        verificationId: input.verificationId,
      })
    : null;

  if (recovery && session) {
    completeCloudRecovery(recovery.recoveryId);
    recovery = getStoredCloudRecovery(recovery.recoveryId);
    validation = validateCloudRecoveryRecord(recovery);
  }

  const blocked = !validation.valid || registration.blocked;
  const reports = buildAllCloudRecoveryReports();
  const finalState = recovery?.recoveryState ?? (blocked ? 'FAILED' : 'RECOVERY_READY');

  publishCloudRecoveryFeedStages(query, !blocked);
  updateCloudRecoveryDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    recovery,
    session,
    reports,
    diagnostics: getCloudRecoveryDiagnostics(),
    validation,
    responseText: composeCloudRecoveryResponse(query, recovery, session, reports, blocked),
    authorityOnly: true,
  };
}

export function processCloudRecoveryRequest(query: string): PrepareCloudRecoveryFoundationResult {
  return prepareCloudRecoveryFoundation(resolveInputFromQuery(query));
}

export function getCloudRecoveryContext(query: string): PrepareCloudRecoveryFoundationResult {
  return processCloudRecoveryRequest(query);
}
