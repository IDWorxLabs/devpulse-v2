/**
 * Cloud Verification Foundation — registry and orchestrator.
 * Authority only — no verification provider execution, cloud workers, or file mutation.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { processPersistentBuildRequest, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processUnifiedVerificationRequest } from '../unified-verification-entry/index.js';
import { publishCloudVerificationFeedStages } from '../operator-feed/cloud-verification-feed-bridge.js';
import {
  nextVerificationId,
  storeCloudVerification,
  getStoredCloudVerification,
  listStoredCloudVerifications,
} from './cloud-verification-store.js';
import { buildCloudVerificationOwnership, recordVerificationOwnershipHistory } from './cloud-verification-ownership.js';
import { buildDefaultCloudVerificationScope } from './cloud-verification-scope.js';
import { buildDefaultCloudVerificationContext } from './cloud-verification-context.js';
import { requestCloudVerificationThroughUnifiedEntry } from './cloud-verification-unified-entry-bridge.js';
import { linkCloudVerificationEvidence } from './cloud-verification-evidence-bridge.js';
import { linkCloudVerificationReport, listAvailableReportIdsForBridge } from './cloud-verification-report-bridge.js';
import { linkCloudVerificationToRuntime } from './cloud-verification-runtime-bridge.js';
import { linkCloudVerificationToWorkspace } from './cloud-verification-workspace-bridge.js';
import { linkCloudVerificationToPersistentBuild } from './cloud-verification-build-bridge.js';
import { createCloudVerificationSession } from './cloud-verification-session-manager.js';
import {
  initializeCloudVerification,
  requestCloudVerification,
  completeCloudVerification,
  recordCloudVerificationLifecycleEvent,
} from './cloud-verification-lifecycle.js';
import { setCloudVerificationState } from './cloud-verification-state-manager.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import {
  validateCloudVerificationRegistration,
  validateCloudVerificationRecord,
} from './cloud-verification-validator.js';
import { updateCloudVerificationDiagnostics, getCloudVerificationDiagnostics } from './cloud-verification-diagnostics.js';
import {
  buildAllCloudVerificationReports,
  composeCloudVerificationResponse,
} from './cloud-verification-report-builder.js';
import type {
  CloudVerification,
  CloudVerificationValidationResult,
  PrepareCloudVerificationFoundationInput,
  PrepareCloudVerificationFoundationResult,
  RegisterCloudVerificationInput,
  RegisterCloudVerificationResult,
} from './cloud-verification-types.js';
import {
  CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
  isDuplicateCloudVerificationExecutorQuestion,
} from './cloud-verification-types.js';

const BOOTSTRAP_VERIFICATIONS: Array<{
  name: string;
  type: CloudVerification['verificationType'];
  description: string;
  buildNameMatch: string;
  intent: string;
}> = [
  { name: 'General Cloud Verification', type: 'GENERAL_CLOUD_VERIFICATION', description: 'General cloud verification authority', buildNameMatch: 'General Persistent', intent: 'General cloud verification coordination metadata' },
  { name: 'Runtime Cloud Verification', type: 'RUNTIME_VERIFICATION', description: 'Cloud runtime verification authority', buildNameMatch: 'General Persistent', intent: 'Runtime verification scope metadata' },
  { name: 'Workspace Cloud Verification', type: 'WORKSPACE_VERIFICATION', description: 'Hosted workspace verification authority', buildNameMatch: 'Persistent Build Workspace', intent: 'Workspace verification scope metadata' },
  { name: 'Persistent Build Verification', type: 'PERSISTENT_BUILD_VERIFICATION', description: 'Persistent build verification authority', buildNameMatch: 'Persistent Build', intent: 'Persistent build verification scope metadata' },
  { name: 'World 2 Cloud Verification', type: 'WORLD2_CLOUD_VERIFICATION', description: 'World 2 cloud verification authority', buildNameMatch: 'World 2', intent: 'World 2 cloud verification context metadata' },
  { name: 'Autonomous Cloud Verification', type: 'AUTONOMOUS_CLOUD_VERIFICATION', description: 'Autonomous builder cloud verification authority', buildNameMatch: 'Autonomous', intent: 'Autonomous builder verification metadata' },
  { name: 'Mobile Cloud Verification', type: 'MOBILE_CLOUD_VERIFICATION', description: 'Mobile command cloud verification authority', buildNameMatch: 'Mobile', intent: 'Mobile-triggered verification metadata' },
  { name: 'Recovery Cloud Verification', type: 'RECOVERY_CLOUD_VERIFICATION', description: 'Recovery cloud verification authority', buildNameMatch: 'Recovery', intent: 'Recovery verification context metadata' },
  { name: 'Monitoring Cloud Verification', type: 'MONITORING_CLOUD_VERIFICATION', description: 'Cloud monitoring verification authority', buildNameMatch: 'Verification Triggered', intent: 'Monitoring verification metadata' },
];

let bootstrapped = false;

export function resetCloudVerificationBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processWorkspaceHostingRequest('Show hosted workspace inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  processUnifiedVerificationRequest('Show verification inventory');
}

function resolveLinks(buildNameMatch: string): {
  workspaceId: string;
  runtimeId: string;
  persistentBuildId: string;
  projectId: string;
} | null {
  const builds = listPersistentBuilds();
  const build = builds.find((b) => b.buildMetadata.buildName.includes(buildNameMatch)) ?? builds[0];
  if (!build) return null;
  return {
    workspaceId: build.buildOwner.workspaceId,
    runtimeId: build.buildOwner.runtimeId,
    persistentBuildId: build.buildId,
    projectId: build.buildOwner.projectId,
  };
}

function bootstrapCloudVerifications(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_VERIFICATIONS) {
    const links = resolveLinks(seed.buildNameMatch);
    if (!links) continue;
    registerCloudVerification({
      verificationName: seed.name,
      verificationType: seed.type,
      projectId: links.projectId || projectId,
      workspaceId: links.workspaceId,
      runtimeId: links.runtimeId,
      persistentBuildId: links.persistentBuildId,
      verificationDescription: seed.description,
      verificationIntent: seed.intent,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerCloudVerification(input: RegisterCloudVerificationInput): RegisterCloudVerificationResult {
  const existing = listStoredCloudVerifications().find(
    (v) =>
      v.verificationMetadata.verificationName === input.verificationName &&
      v.verificationOwner.projectId === input.projectId &&
      v.verificationOwner.runtimeId === input.runtimeId &&
      v.verificationOwner.workspaceId === input.workspaceId &&
      v.verificationOwner.persistentBuildId === input.persistentBuildId,
  );
  if (existing && !input.allowDuplicate) {
    return { verification: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateCloudVerificationRegistration(input);
  if (!validation.valid) {
    return {
      verification: null,
      duplicate: false,
      duplicateRisks: validation.duplicateRisks,
      blocked: true,
    };
  }

  const now = Date.now();
  const verificationId = nextVerificationId();
  const ownership = buildCloudVerificationOwnership({
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    createdBy: input.createdBy,
  });

  const verification: CloudVerification = {
    verificationId,
    verificationType: input.verificationType ?? 'GENERAL_CLOUD_VERIFICATION',
    verificationOwner: ownership,
    verificationState: 'CREATED',
    verificationStatus: 'UNKNOWN',
    verificationMetadata: {
      verificationName: input.verificationName,
      verificationDescription: input.verificationDescription ?? '',
      tags: [input.verificationType ?? 'GENERAL_CLOUD_VERIFICATION'],
      monitorable: true,
    },
    verificationVisibility: input.visibility ?? 'PROJECT',
    verificationProvenance: {
      sourceSystem: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    verificationScope: buildDefaultCloudVerificationScope({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      verificationType: input.verificationType,
      verificationIntent: input.verificationIntent,
    }),
    verificationContext: buildDefaultCloudVerificationContext({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      verificationType: input.verificationType,
    }),
    verificationUnifiedEntryLink: {
      unifiedSessionId: '',
      unifiedRequestId: null,
      authorityId: null,
      linkedAt: now,
      linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    verificationEvidenceLink: {
      evidenceIds: input.evidenceIds ?? [],
      linkedAt: now,
      linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    verificationReportLink: {
      reportIds: input.reportIds ?? [],
      linkedAt: now,
      linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    verificationRuntimeLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    verificationWorkspaceLink: {
      workspaceId: input.workspaceId,
      linkedAt: now,
      linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    verificationPersistentBuildLink: {
      persistentBuildId: input.persistentBuildId,
      linkedAt: now,
      linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    verificationRelationships: {
      parentVerificationId: null,
      childVerificationIds: [],
      relatedRuntimeIds: [input.runtimeId],
      relatedWorkspaceIds: [input.workspaceId],
      relatedPersistentBuildIds: [input.persistentBuildId],
      relatedProjectIds: [input.projectId],
    },
    createdAt: now,
    updatedAt: now,
  };

  storeCloudVerification(verification);
  recordCloudVerificationLifecycleEvent(verificationId, 'VERIFICATION_CREATED', `Registered ${input.verificationName}`);
  linkCloudVerificationToRuntime(verificationId, input.runtimeId);
  linkCloudVerificationToWorkspace(verificationId, input.workspaceId);
  linkCloudVerificationToPersistentBuild(verificationId, input.persistentBuildId);
  recordVerificationOwnershipHistory(verificationId, `Ownership assigned to ${ownership.ownerModule}`);
  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'VERIFICATION',
    summary: `Verification ${verificationId} registered: ${input.verificationName}`,
    scopeUsed: input.projectId,
  });

  return {
    verification: getStoredCloudVerification(verificationId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getCloudVerification(verificationId: string): CloudVerification | null {
  return getStoredCloudVerification(verificationId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareCloudVerificationFoundationInput> = {},
): PrepareCloudVerificationFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('cloud_verification_foundation');
  const builds = listPersistentBuilds();
  const build = builds[0];
  const runtimeId = build?.buildOwner.runtimeId ?? listRuntimes()[0]?.runtimeId ?? 'crrt-0001';
  const workspaceId = build?.buildOwner.workspaceId ?? listWorkspaces()[0]?.workspaceId ?? 'hws-0001';
  const persistentBuildId = build?.buildId ?? 'pbuild-0001';

  return {
    query,
    projectId: project.projectId,
    workspaceId,
    runtimeId,
    persistentBuildId,
    verificationName: 'DevPulse Cloud Verification',
    verificationType: 'GENERAL_CLOUD_VERIFICATION',
    projectExists: project.projectId !== 'none',
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: listWorkspaces().length > 0,
    persistentBuildExists: builds.length > 0,
    ownershipValid: owner.ownerModule === CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

export function prepareCloudVerificationFoundation(
  input: PrepareCloudVerificationFoundationInput,
): PrepareCloudVerificationFoundationResult {
  const query = input.query ?? 'Show cloud verification inventory';

  if (isDuplicateCloudVerificationExecutorQuestion(query)) {
    publishCloudVerificationFeedStages(query, false);
    updateCloudVerificationDiagnostics(query, 'FAILED');
    return {
      verification: null,
      session: null,
      reports: buildAllCloudVerificationReports(),
      diagnostics: getCloudVerificationDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate cloud verification executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: 'Recommendation: No.\nDo not create cloud_verification_executor or parallel verification authorities.',
      authorityOnly: true,
    };
  }

  if (!input.projectExists || !input.runtimeExists || !input.workspaceExists || !input.persistentBuildExists) {
    publishCloudVerificationFeedStages(query, false);
    updateCloudVerificationDiagnostics(query, 'FAILED');
    return {
      verification: null,
      session: null,
      reports: buildAllCloudVerificationReports(),
      diagnostics: getCloudVerificationDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Missing project, runtime, workspace, or persistent build link'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: composeCloudVerificationResponse(query, null, null, buildAllCloudVerificationReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapCloudVerifications(input.projectId);

  const registration = registerCloudVerification({
    verificationName: input.verificationName ?? 'DevPulse Cloud Verification',
    verificationType: input.verificationType ?? 'GENERAL_CLOUD_VERIFICATION',
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    persistentBuildId: input.persistentBuildId,
    verificationDescription: 'Cloud verification authority session',
    verificationIntent: 'Cloud-specific verification coordination metadata',
    query,
    allowDuplicate: input.forceDuplicate === true,
    evidenceIds: ['vevid-0001'],
    reportIds: listAvailableReportIdsForBridge().slice(0, 1).length > 0 ? listAvailableReportIdsForBridge().slice(0, 1) : [],
  });

  let verification = registration.verification;
  let validation: CloudVerificationValidationResult = {
    valid: !registration.blocked && verification !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && verification) {
    validation.warnings.push(`Using existing verification: ${verification.verificationId}`);
  }

  if (verification && !registration.blocked) {
    initializeCloudVerification(verification.verificationId);
    verification = getStoredCloudVerification(verification.verificationId);
    if (verification && verification.verificationState !== 'READY') {
      setCloudVerificationState(verification.verificationId, 'READY', true);
      verification = getStoredCloudVerification(verification.verificationId);
    }
    requestCloudVerificationThroughUnifiedEntry(verification!.verificationId, query);
    recordCloudVerificationLifecycleEvent(verification!.verificationId, 'VERIFICATION_LINKED_TO_UNIFIED_ENTRY', 'Unified entry linked');
    recordCloudVerificationLifecycleEvent(verification!.verificationId, 'VERIFICATION_LINKED_TO_RUNTIME', `Linked to ${input.runtimeId}`);
    recordCloudVerificationLifecycleEvent(verification!.verificationId, 'VERIFICATION_LINKED_TO_WORKSPACE', `Linked to ${input.workspaceId}`);
    recordCloudVerificationLifecycleEvent(verification!.verificationId, 'VERIFICATION_LINKED_TO_PERSISTENT_BUILD', `Linked to ${input.persistentBuildId}`);
    requestCloudVerification(verification!.verificationId);
    linkCloudVerificationEvidence(verification!.verificationId, ['vevid-0001']);
    recordCloudVerificationLifecycleEvent(verification!.verificationId, 'VERIFICATION_EVIDENCE_LINKED', 'Evidence linked');
    const reportIds = listAvailableReportIdsForBridge().slice(0, 1);
    if (reportIds.length > 0) {
      linkCloudVerificationReport(verification!.verificationId, reportIds);
      recordCloudVerificationLifecycleEvent(verification!.verificationId, 'VERIFICATION_REPORT_LINKED', 'Report linked');
    }
  }

  let session = verification
    ? createCloudVerificationSession({
        verificationId: verification.verificationId,
        projectId: input.projectId,
        runtimeId: input.runtimeId,
        workspaceId: input.workspaceId,
        persistentBuildId: input.persistentBuildId,
      })
    : null;

  if (verification && session) {
    setCloudVerificationState(verification.verificationId, 'IN_PROGRESS_METADATA_ONLY', true);
    completeCloudVerification(verification.verificationId);
    verification = getStoredCloudVerification(verification.verificationId);
    validation = validateCloudVerificationRecord(verification);
  }

  const blocked = !validation.valid || registration.blocked;
  const reports = buildAllCloudVerificationReports();
  const finalState = verification?.verificationState ?? (blocked ? 'FAILED' : 'READY');

  publishCloudVerificationFeedStages(query, !blocked);
  updateCloudVerificationDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    verification,
    session,
    reports,
    diagnostics: getCloudVerificationDiagnostics(),
    validation,
    responseText: composeCloudVerificationResponse(query, verification, session, reports, blocked),
    authorityOnly: true,
  };
}

export function processCloudVerificationRequest(query: string): PrepareCloudVerificationFoundationResult {
  return prepareCloudVerificationFoundation(resolveInputFromQuery(query));
}

export function getCloudVerificationContext(query: string): PrepareCloudVerificationFoundationResult {
  return processCloudVerificationRequest(query);
}
