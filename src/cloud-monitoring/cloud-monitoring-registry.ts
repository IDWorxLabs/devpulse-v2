/**
 * Cloud Monitoring Foundation — registry and orchestrator.
 * Authority only — no real infrastructure monitoring, cloud provider connections, or notifications.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { processPersistentBuildRequest, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processCloudVerificationRequest, listCloudVerifications } from '../cloud-verification/index.js';
import { processCloudRecoveryRequest, listRecoveries } from '../cloud-recovery/index.js';
import { publishCloudMonitoringFeedStages } from '../operator-feed/cloud-monitoring-feed-bridge.js';
import {
  nextMonitoringId,
  storeCloudMonitoringRecord,
  getStoredCloudMonitoringRecord,
  listStoredCloudMonitoringRecords,
} from './cloud-monitoring-store.js';
import { buildCloudMonitoringOwnership, recordMonitoringOwnershipHistory } from './cloud-monitoring-ownership.js';
import { buildDefaultCloudMonitoringContext } from './cloud-monitoring-context.js';
import { buildDefaultMonitoringHealth, updateMonitoringHealth, resolveHealthStatusForScore } from './cloud-monitoring-health.js';
import { createMonitoringAlert, acknowledgeMonitoringAlert } from './cloud-monitoring-alerts.js';
import { linkMonitoringToRuntime } from './cloud-monitoring-runtime-bridge.js';
import { linkMonitoringToWorkspace } from './cloud-monitoring-workspace-bridge.js';
import { linkMonitoringToBuild } from './cloud-monitoring-build-bridge.js';
import { linkMonitoringToVerification } from './cloud-monitoring-verification-bridge.js';
import { linkMonitoringToRecovery } from './cloud-monitoring-recovery-bridge.js';
import { createMonitoringSession } from './cloud-monitoring-session-manager.js';
import {
  initializeCloudMonitoring,
  activateCloudMonitoring,
  recordHealthUpdated,
  recordAlertCreated,
  recordAlertAcknowledged,
  completeCloudMonitoring,
  recordCloudMonitoringLifecycleEvent,
} from './cloud-monitoring-lifecycle.js';
import { setMonitoringState } from './cloud-monitoring-state-manager.js';
import { recordCloudMonitoringHistoryEntry } from './cloud-monitoring-history.js';
import {
  validateCloudMonitoringRegistration,
  validateCloudMonitoringRecord,
} from './cloud-monitoring-validator.js';
import { updateCloudMonitoringDiagnostics, getCloudMonitoringDiagnostics } from './cloud-monitoring-diagnostics.js';
import {
  buildAllCloudMonitoringReports,
  composeCloudMonitoringResponse,
} from './cloud-monitoring-report-builder.js';
import type {
  CloudMonitoringRecord,
  CloudMonitoringValidationResult,
  PrepareCloudMonitoringFoundationInput,
  PrepareCloudMonitoringFoundationResult,
  RegisterMonitoringInput,
  RegisterMonitoringResult,
} from './cloud-monitoring-types.js';
import {
  CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
  isDuplicateCloudMonitoringExecutorQuestion,
} from './cloud-monitoring-types.js';

const BOOTSTRAP_MONITORING: Array<{
  name: string;
  type: CloudMonitoringRecord['monitoringType'];
  description: string;
  recoveryNameMatch: string;
  buildNameMatch: string;
}> = [
  { name: 'General Cloud Monitoring', type: 'GENERAL_MONITORING', description: 'General cloud monitoring authority', recoveryNameMatch: 'General Cloud Recovery', buildNameMatch: 'General Persistent' },
  { name: 'Runtime Cloud Monitoring', type: 'RUNTIME_MONITORING', description: 'Cloud runtime monitoring authority', recoveryNameMatch: 'Runtime Cloud Recovery', buildNameMatch: 'General Persistent' },
  { name: 'Workspace Cloud Monitoring', type: 'WORKSPACE_MONITORING', description: 'Hosted workspace monitoring authority', recoveryNameMatch: 'Workspace Cloud Recovery', buildNameMatch: 'Persistent Build Workspace' },
  { name: 'Persistent Build Monitoring', type: 'BUILD_MONITORING', description: 'Persistent build monitoring authority', recoveryNameMatch: 'Persistent Build Recovery', buildNameMatch: 'Persistent Build' },
  { name: 'Verification Cloud Monitoring', type: 'VERIFICATION_MONITORING', description: 'Cloud verification monitoring authority', recoveryNameMatch: 'Verification Cloud Recovery', buildNameMatch: 'Recovery' },
  { name: 'Recovery Cloud Monitoring', type: 'RECOVERY_MONITORING', description: 'Cloud recovery monitoring authority', recoveryNameMatch: 'Monitoring Cloud Recovery', buildNameMatch: 'Verification Triggered' },
  { name: 'World 2 Cloud Monitoring', type: 'WORLD2_MONITORING', description: 'World 2 cloud monitoring authority', recoveryNameMatch: 'World 2 Cloud Recovery', buildNameMatch: 'World 2' },
  { name: 'Autonomous Cloud Monitoring', type: 'AUTONOMOUS_MONITORING', description: 'Autonomous builder cloud monitoring authority', recoveryNameMatch: 'Autonomous Cloud Recovery', buildNameMatch: 'Autonomous' },
  { name: 'Mobile Cloud Monitoring', type: 'MOBILE_MONITORING', description: 'Mobile command cloud monitoring authority', recoveryNameMatch: 'Mobile Cloud Recovery', buildNameMatch: 'Mobile' },
];

let bootstrapped = false;

export function resetCloudMonitoringBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processWorkspaceHostingRequest('Show hosted workspace inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  processCloudVerificationRequest('Show cloud verification inventory');
  processCloudRecoveryRequest('Show cloud recovery inventory');
}

function resolveLinks(recoveryNameMatch: string, buildNameMatch: string): {
  workspaceId: string;
  runtimeId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  projectId: string;
} | null {
  const builds = listPersistentBuilds();
  const recoveries = listRecoveries();
  const build = builds.find((b) => b.buildMetadata.buildName.includes(buildNameMatch)) ?? builds[0];
  const recovery =
    recoveries.find((r) => r.recoveryMetadata.recoveryName.includes(recoveryNameMatch)) ?? recoveries[0];
  if (!build || !recovery) return null;
  return {
    workspaceId: build.buildOwner.workspaceId,
    runtimeId: build.buildOwner.runtimeId,
    persistentBuildId: build.buildId,
    verificationId: recovery.recoveryOwner.verificationId,
    recoveryId: recovery.recoveryId,
    projectId: build.buildOwner.projectId,
  };
}

function bootstrapCloudMonitoring(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_MONITORING) {
    const links = resolveLinks(seed.recoveryNameMatch, seed.buildNameMatch);
    if (!links) continue;
    registerMonitoringRecord({
      monitoringName: seed.name,
      monitoringType: seed.type,
      projectId: links.projectId || projectId,
      workspaceId: links.workspaceId,
      runtimeId: links.runtimeId,
      persistentBuildId: links.persistentBuildId,
      verificationId: links.verificationId,
      recoveryId: links.recoveryId,
      monitoringDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerMonitoringRecord(input: RegisterMonitoringInput): RegisterMonitoringResult {
  const existing = listStoredCloudMonitoringRecords().find(
    (r) =>
      r.monitoringMetadata.monitoringName === input.monitoringName &&
      r.monitoringOwner.projectId === input.projectId &&
      r.monitoringOwner.runtimeId === input.runtimeId &&
      r.monitoringOwner.workspaceId === input.workspaceId &&
      r.monitoringOwner.persistentBuildId === input.persistentBuildId &&
      r.monitoringOwner.verificationId === input.verificationId &&
      r.monitoringOwner.recoveryId === input.recoveryId,
  );
  if (existing && !input.allowDuplicate) {
    return { record: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateCloudMonitoringRegistration(input);
  if (!validation.valid) {
    return {
      record: null,
      duplicate: false,
      duplicateRisks: validation.duplicateRisks,
      blocked: true,
    };
  }

  const now = Date.now();
  const monitoringId = nextMonitoringId();
  const ownership = buildCloudMonitoringOwnership({
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryId: input.recoveryId,
    createdBy: input.createdBy,
  });

  const record: CloudMonitoringRecord = {
    monitoringId,
    monitoringType: input.monitoringType ?? 'GENERAL_MONITORING',
    monitoringOwner: ownership,
    monitoringState: 'CREATED',
    monitoringStatus: 'UNKNOWN',
    monitoringMetadata: {
      monitoringName: input.monitoringName,
      monitoringDescription: input.monitoringDescription ?? '',
      tags: [input.monitoringType ?? 'GENERAL_MONITORING'],
      monitorable: true,
    },
    monitoringVisibility: input.visibility ?? 'PROJECT',
    monitoringProvenance: {
      sourceSystem: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    monitoringContext: buildDefaultCloudMonitoringContext({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      verificationId: input.verificationId,
      recoveryId: input.recoveryId,
      monitoringType: input.monitoringType,
    }),
    monitoringHealth: buildDefaultMonitoringHealth(input.monitoringType ?? 'GENERAL'),
    monitoringAlerts: [],
    monitoringRuntimeLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    monitoringWorkspaceLink: {
      workspaceId: input.workspaceId,
      linkedAt: now,
      linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    monitoringBuildLink: {
      persistentBuildId: input.persistentBuildId,
      linkedAt: now,
      linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    monitoringVerificationLink: {
      verificationId: input.verificationId,
      linkedAt: now,
      linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    monitoringRecoveryLink: {
      recoveryId: input.recoveryId,
      linkedAt: now,
      linkAuthority: CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    monitoringRelationships: {
      parentMonitoringId: null,
      childMonitoringIds: [],
      relatedRuntimeIds: [input.runtimeId],
      relatedWorkspaceIds: [input.workspaceId],
      relatedPersistentBuildIds: [input.persistentBuildId],
      relatedVerificationIds: [input.verificationId],
      relatedRecoveryIds: [input.recoveryId],
      relatedProjectIds: [input.projectId],
    },
    createdAt: now,
    updatedAt: now,
  };

  storeCloudMonitoringRecord(record);
  recordCloudMonitoringLifecycleEvent(monitoringId, 'MONITORING_CREATED', `Registered ${input.monitoringName}`);
  linkMonitoringToRuntime(monitoringId, input.runtimeId);
  linkMonitoringToWorkspace(monitoringId, input.workspaceId);
  linkMonitoringToBuild(monitoringId, input.persistentBuildId);
  linkMonitoringToVerification(monitoringId, input.verificationId);
  linkMonitoringToRecovery(monitoringId, input.recoveryId);
  recordMonitoringOwnershipHistory(monitoringId, `Ownership assigned to ${ownership.ownerModule}`);
  recordCloudMonitoringHistoryEntry({
    monitoringId,
    category: 'MONITORING',
    summary: `Monitoring ${monitoringId} registered: ${input.monitoringName}`,
    scopeUsed: input.projectId,
  });

  return {
    record: getStoredCloudMonitoringRecord(monitoringId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getMonitoringRecord(monitoringId: string): CloudMonitoringRecord | null {
  return getStoredCloudMonitoringRecord(monitoringId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareCloudMonitoringFoundationInput> = {},
): PrepareCloudMonitoringFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('cloud_monitoring_foundation');
  const builds = listPersistentBuilds();
  const recoveries = listRecoveries();
  const build = builds[0];
  const recovery = recoveries[0];
  const runtimeId = build?.buildOwner.runtimeId ?? listRuntimes()[0]?.runtimeId ?? 'crrt-0001';
  const workspaceId = build?.buildOwner.workspaceId ?? listWorkspaces()[0]?.workspaceId ?? 'hws-0001';
  const persistentBuildId = build?.buildId ?? 'pbuild-0001';
  const verificationId = recovery?.recoveryOwner.verificationId ?? listCloudVerifications()[0]?.verificationId ?? 'cver-0001';
  const recoveryId = recovery?.recoveryId ?? 'crec-0001';

  return {
    query,
    projectId: project.projectId,
    workspaceId,
    runtimeId,
    persistentBuildId,
    verificationId,
    recoveryId,
    monitoringName: 'DevPulse Cloud Monitoring',
    monitoringType: 'GENERAL_MONITORING',
    projectExists: project.projectId !== 'none',
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: listWorkspaces().length > 0,
    persistentBuildExists: builds.length > 0,
    verificationExists: listCloudVerifications().length > 0,
    recoveryExists: recoveries.length > 0,
    ownershipValid: owner.ownerModule === CLOUD_MONITORING_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

export function prepareCloudMonitoringFoundation(
  input: PrepareCloudMonitoringFoundationInput,
): PrepareCloudMonitoringFoundationResult {
  const query = input.query ?? 'Show cloud monitoring inventory';

  if (isDuplicateCloudMonitoringExecutorQuestion(query)) {
    publishCloudMonitoringFeedStages(query, false);
    updateCloudMonitoringDiagnostics(query, 'FAILED');
    return {
      record: null,
      session: null,
      reports: buildAllCloudMonitoringReports(),
      diagnostics: getCloudMonitoringDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate cloud monitoring executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: 'Recommendation: No.\nDo not create cloud_monitoring_executor or parallel monitoring authorities.',
      authorityOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.verificationExists ||
    !input.recoveryExists
  ) {
    publishCloudMonitoringFeedStages(query, false);
    updateCloudMonitoringDiagnostics(query, 'FAILED');
    return {
      record: null,
      session: null,
      reports: buildAllCloudMonitoringReports(),
      diagnostics: getCloudMonitoringDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Missing project, runtime, workspace, persistent build, verification, or recovery link'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: composeCloudMonitoringResponse(query, null, null, buildAllCloudMonitoringReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapCloudMonitoring(input.projectId);

  const registration = registerMonitoringRecord({
    monitoringName: input.monitoringName ?? 'DevPulse Cloud Monitoring',
    monitoringType: input.monitoringType ?? 'GENERAL_MONITORING',
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryId: input.recoveryId,
    monitoringDescription: 'Cloud monitoring authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let record = registration.record;
  let validation: CloudMonitoringValidationResult = {
    valid: !registration.blocked && record !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && record) {
    validation.warnings.push(`Using existing monitoring record: ${record.monitoringId}`);
  }

  if (record && !registration.blocked) {
    initializeCloudMonitoring(record.monitoringId);
    record = getStoredCloudMonitoringRecord(record.monitoringId);
    if (record && record.monitoringState !== 'READY') {
      setMonitoringState(record.monitoringId, 'READY', true);
      record = getStoredCloudMonitoringRecord(record.monitoringId);
    }
    activateCloudMonitoring(record!.monitoringId);
    updateMonitoringHealth(record!.monitoringId, {
      healthScore: 85,
      healthStatus: resolveHealthStatusForScore(85),
      healthCategory: record!.monitoringType,
      healthEvidence: ['metadata_only', 'authority_session'],
    });
    recordHealthUpdated(record!.monitoringId, 'Sample health metadata — no infrastructure polling');
    const alert = createMonitoringAlert({
      monitoringId: record!.monitoringId,
      alertType: 'HEALTH_THRESHOLD',
      alertSeverity: 'LOW',
      alertCategory: 'METADATA',
    });
    if (alert) {
      recordAlertCreated(record!.monitoringId, alert.alertId);
      acknowledgeMonitoringAlert(record!.monitoringId, alert.alertId);
      recordAlertAcknowledged(record!.monitoringId, alert.alertId);
    }
    recordCloudMonitoringLifecycleEvent(record!.monitoringId, 'MONITORING_LINKED_TO_RUNTIME', `Linked to ${input.runtimeId}`);
    recordCloudMonitoringLifecycleEvent(record!.monitoringId, 'MONITORING_LINKED_TO_WORKSPACE', `Linked to ${input.workspaceId}`);
    recordCloudMonitoringLifecycleEvent(record!.monitoringId, 'MONITORING_LINKED_TO_BUILD', `Linked to ${input.persistentBuildId}`);
    recordCloudMonitoringLifecycleEvent(record!.monitoringId, 'MONITORING_LINKED_TO_VERIFICATION', `Linked to ${input.verificationId}`);
    recordCloudMonitoringLifecycleEvent(record!.monitoringId, 'MONITORING_LINKED_TO_RECOVERY', `Linked to ${input.recoveryId}`);
  }

  let session = record
    ? createMonitoringSession({
        monitoringId: record.monitoringId,
        projectId: input.projectId,
        runtimeId: input.runtimeId,
        workspaceId: input.workspaceId,
        persistentBuildId: input.persistentBuildId,
        verificationId: input.verificationId,
        recoveryId: input.recoveryId,
      })
    : null;

  if (record && session) {
    completeCloudMonitoring(record.monitoringId);
    record = getStoredCloudMonitoringRecord(record.monitoringId);
    validation = validateCloudMonitoringRecord(record);
  }

  const blocked = !validation.valid || registration.blocked;
  const reports = buildAllCloudMonitoringReports();
  const finalState = record?.monitoringState ?? (blocked ? 'FAILED' : 'MONITORING_ACTIVE');

  publishCloudMonitoringFeedStages(query, !blocked);
  updateCloudMonitoringDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    record,
    session,
    reports,
    diagnostics: getCloudMonitoringDiagnostics(),
    validation,
    responseText: composeCloudMonitoringResponse(query, record, session, reports, blocked),
    authorityOnly: true,
  };
}

export function processCloudMonitoringRequest(query: string): PrepareCloudMonitoringFoundationResult {
  return prepareCloudMonitoringFoundation(resolveInputFromQuery(query));
}

export function getCloudMonitoringContext(query: string): PrepareCloudMonitoringFoundationResult {
  return processCloudMonitoringRequest(query);
}
