/**
 * Mobile Command Runtime Foundation — registry and orchestrator.
 * Authority only — no mobile UI, push notifications, or cloud execution.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { processPersistentBuildRequest, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processCloudVerificationRequest, listCloudVerifications } from '../cloud-verification/index.js';
import { processCloudRecoveryRequest, listRecoveries } from '../cloud-recovery/index.js';
import { processCloudMonitoringRequest, listMonitoringRecords } from '../cloud-monitoring/index.js';
import { publishMobileCommandFeedStages } from '../operator-feed/mobile-command-feed-bridge.js';
import {
  nextMobileCommandId,
  storeMobileCommandSession,
  getStoredMobileCommandSession,
  listStoredMobileCommandSessions,
} from './mobile-command-store.js';
import { buildMobileCommandOwnership, recordMobileCommandOwnershipHistory } from './mobile-command-ownership.js';
import { buildDefaultMobileCommandContext, refreshMobileCommandContext } from './mobile-command-context.js';
import { buildDefaultMobileCommandPermissions } from './mobile-command-permissions.js';
import { evaluateMobileCommandAction, registerMobileActionGateResult } from './mobile-command-action-gate.js';
import { linkMobileCommandToCloud } from './mobile-command-cloud-bridge.js';
import { linkMobileCommandToWorkspace } from './mobile-command-workspace-bridge.js';
import { linkMobileCommandToBuild } from './mobile-command-build-bridge.js';
import { linkMobileCommandToVerification } from './mobile-command-verification-bridge.js';
import { linkMobileCommandToRecovery } from './mobile-command-recovery-bridge.js';
import { linkMobileCommandToMonitoring } from './mobile-command-monitoring-bridge.js';
import { linkMobileCommandToOperatorFeed } from './mobile-command-operator-feed-bridge.js';
import { linkMobileCommandToProjectVault } from './mobile-command-project-vault-bridge.js';
import { createMobileCommandSession as createTrackedMobileCommandSession } from './mobile-command-session-manager.js';
import {
  recordMobileCommandLifecycleEvent,
  initializeMobileCommand,
  completeMobileCommand,
} from './mobile-command-lifecycle.js';
import { setMobileCommandState } from './mobile-command-state-manager.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import {
  validateMobileCommandRegistration,
  validateMobileCommandRecord,
} from './mobile-command-validator.js';
import { updateMobileCommandDiagnostics, getMobileCommandDiagnostics } from './mobile-command-diagnostics.js';
import {
  buildAllMobileCommandReports,
  composeMobileCommandResponse,
} from './mobile-command-report-builder.js';
import type {
  MobileCommandSession,
  MobileCommandCategory,
  MobileCommandValidationResult,
  PrepareMobileCommandRuntimeFoundationInput,
  PrepareMobileCommandRuntimeFoundationResult,
  RegisterMobileCommandInput,
  RegisterMobileCommandResult,
} from './mobile-command-types.js';
import {
  MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
  isDuplicateMobileCommandExecutorQuestion,
} from './mobile-command-types.js';

const BOOTSTRAP_MOBILE_COMMANDS: Array<{
  name: string;
  type: MobileCommandCategory;
  description: string;
  monitoringNameMatch: string;
}> = [
  { name: 'General Mobile Command', type: 'GENERAL_MOBILE_COMMAND', description: 'General mobile command authority', monitoringNameMatch: 'General Cloud Monitoring' },
  { name: 'Project Mobile Command', type: 'PROJECT_MOBILE_COMMAND', description: 'Project-scoped mobile command authority', monitoringNameMatch: 'Runtime Cloud Monitoring' },
  { name: 'World 2 Mobile Command', type: 'WORLD2_MOBILE_COMMAND', description: 'World 2 mobile command authority', monitoringNameMatch: 'World 2 Cloud Monitoring' },
  { name: 'AiDev Mobile Command', type: 'AIDEV_MOBILE_COMMAND', description: 'AiDev mobile command authority', monitoringNameMatch: 'Autonomous Cloud Monitoring' },
  { name: 'Autonomous Mobile Command', type: 'AUTONOMOUS_MOBILE_COMMAND', description: 'Autonomous builder mobile command authority', monitoringNameMatch: 'Autonomous Cloud Monitoring' },
  { name: 'Founder Mobile Command', type: 'FOUNDER_MOBILE_COMMAND', description: 'Founder mobile command authority', monitoringNameMatch: 'Mobile Cloud Monitoring' },
  { name: 'Verification Mobile Command', type: 'VERIFICATION_MOBILE_COMMAND', description: 'Verification mobile command authority', monitoringNameMatch: 'Verification Cloud Monitoring' },
  { name: 'Recovery Mobile Command', type: 'RECOVERY_MOBILE_COMMAND', description: 'Recovery mobile command authority', monitoringNameMatch: 'Recovery Cloud Monitoring' },
  { name: 'Monitoring Mobile Command', type: 'MONITORING_MOBILE_COMMAND', description: 'Monitoring mobile command authority', monitoringNameMatch: 'Persistent Build Monitoring' },
];

let bootstrapped = false;

export function resetMobileCommandBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processWorkspaceHostingRequest('Show hosted workspace inventory');
  processPersistentBuildRequest('Show persistent build inventory');
  processCloudVerificationRequest('Show cloud verification inventory');
  processCloudRecoveryRequest('Show cloud recovery inventory');
  processCloudMonitoringRequest('Show cloud monitoring inventory');
}

function resolveLinksFromMonitoring(monitoringNameMatch: string): {
  workspaceId: string;
  runtimeId: string;
  persistentBuildId: string;
  verificationId: string;
  recoveryId: string;
  monitoringId: string;
  projectId: string;
} | null {
  const monitoring =
    listMonitoringRecords().find((m) => m.monitoringMetadata.monitoringName.includes(monitoringNameMatch)) ??
    listMonitoringRecords()[0];
  if (!monitoring) return null;
  return {
    workspaceId: monitoring.monitoringOwner.workspaceId,
    runtimeId: monitoring.monitoringOwner.runtimeId,
    persistentBuildId: monitoring.monitoringOwner.persistentBuildId,
    verificationId: monitoring.monitoringOwner.verificationId,
    recoveryId: monitoring.monitoringOwner.recoveryId,
    monitoringId: monitoring.monitoringId,
    projectId: monitoring.monitoringOwner.projectId,
  };
}

function bootstrapMobileCommands(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_MOBILE_COMMANDS) {
    const links = resolveLinksFromMonitoring(seed.monitoringNameMatch);
    if (!links) continue;
    registerMobileCommandSession({
      commandName: seed.name,
      mobileCommandType: seed.type,
      projectId: links.projectId || projectId,
      workspaceId: links.workspaceId,
      runtimeId: links.runtimeId,
      persistentBuildId: links.persistentBuildId,
      verificationId: links.verificationId,
      recoveryId: links.recoveryId,
      monitoringId: links.monitoringId,
      commandDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerMobileCommandSession(input: RegisterMobileCommandInput): RegisterMobileCommandResult {
  const existing = listStoredMobileCommandSessions().find(
    (s) =>
      s.mobileCommandMetadata.commandName === input.commandName &&
      s.mobileCommandOwner.projectId === input.projectId &&
      s.mobileCommandOwner.runtimeId === input.runtimeId &&
      s.mobileCommandOwner.workspaceId === input.workspaceId &&
      s.mobileCommandOwner.persistentBuildId === input.persistentBuildId &&
      s.mobileCommandOwner.verificationId === input.verificationId &&
      s.mobileCommandOwner.recoveryId === input.recoveryId &&
      s.mobileCommandOwner.monitoringId === input.monitoringId &&
      s.mobileCommandType === (input.mobileCommandType ?? 'GENERAL_MOBILE_COMMAND'),
  );
  if (existing && !input.allowDuplicate) {
    return { session: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateMobileCommandRegistration(input);
  if (!validation.valid) {
    return {
      session: null,
      duplicate: false,
      duplicateRisks: validation.duplicateRisks,
      blocked: true,
    };
  }

  const now = Date.now();
  const mobileCommandId = nextMobileCommandId();
  const commandType = input.mobileCommandType ?? 'GENERAL_MOBILE_COMMAND';
  const ownership = buildMobileCommandOwnership({
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryId: input.recoveryId,
    monitoringId: input.monitoringId,
    createdBy: input.createdBy,
  });

  const session: MobileCommandSession = {
    mobileCommandId,
    mobileCommandType: commandType,
    mobileCommandOwner: ownership,
    mobileCommandState: 'CREATED',
    mobileCommandStatus: 'UNKNOWN',
    mobileCommandMetadata: {
      commandName: input.commandName,
      commandDescription: input.commandDescription ?? '',
      tags: [commandType],
      monitorable: true,
    },
    mobileCommandVisibility: input.visibility ?? 'PROJECT',
    mobileCommandProvenance: {
      sourceSystem: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    mobileCommandContext: buildDefaultMobileCommandContext({
      projectId: input.projectId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      verificationId: input.verificationId,
      recoveryId: input.recoveryId,
      monitoringId: input.monitoringId,
      mobileCommandType: commandType,
    }),
    mobileCommandPermissions: buildDefaultMobileCommandPermissions(commandType),
    mobileCommandActionGateResults: [],
    mobileCommandCloudLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileCommandWorkspaceLink: {
      workspaceId: input.workspaceId,
      linkedAt: now,
      linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileCommandBuildLink: {
      persistentBuildId: input.persistentBuildId,
      linkedAt: now,
      linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileCommandVerificationLink: {
      verificationId: input.verificationId,
      linkedAt: now,
      linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileCommandRecoveryLink: {
      recoveryId: input.recoveryId,
      linkedAt: now,
      linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileCommandMonitoringLink: {
      monitoringId: input.monitoringId,
      linkedAt: now,
      linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileCommandOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      linkedAt: now,
      linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileCommandProjectVaultLink: {
      vaultProjectId: input.projectId,
      linkedAt: now,
      linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileCommandRelationships: {
      parentMobileCommandId: null,
      childMobileCommandIds: [],
      relatedRuntimeIds: [input.runtimeId],
      relatedWorkspaceIds: [input.workspaceId],
      relatedPersistentBuildIds: [input.persistentBuildId],
      relatedVerificationIds: [input.verificationId],
      relatedRecoveryIds: [input.recoveryId],
      relatedMonitoringIds: [input.monitoringId],
      relatedProjectIds: [input.projectId],
    },
    createdAt: now,
    updatedAt: now,
  };

  storeMobileCommandSession(session);
  recordMobileCommandLifecycleEvent(mobileCommandId, 'MOBILE_COMMAND_CREATED', `Registered ${input.commandName}`);
  linkMobileCommandToCloud(mobileCommandId, input.runtimeId);
  linkMobileCommandToWorkspace(mobileCommandId, input.workspaceId);
  linkMobileCommandToBuild(mobileCommandId, input.persistentBuildId);
  linkMobileCommandToVerification(mobileCommandId, input.verificationId);
  linkMobileCommandToRecovery(mobileCommandId, input.recoveryId);
  linkMobileCommandToMonitoring(mobileCommandId, input.monitoringId);
  linkMobileCommandToOperatorFeed(mobileCommandId);
  linkMobileCommandToProjectVault(mobileCommandId, input.projectId);
  recordMobileCommandOwnershipHistory(mobileCommandId, `Ownership assigned to ${ownership.ownerModule}`);
  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'MOBILE_COMMAND',
    summary: `Mobile command ${mobileCommandId} registered: ${input.commandName}`,
    scopeUsed: input.projectId,
  });

  return {
    session: getStoredMobileCommandSession(mobileCommandId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getMobileCommandSession(mobileCommandId: string): MobileCommandSession | null {
  return getStoredMobileCommandSession(mobileCommandId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareMobileCommandRuntimeFoundationInput> = {},
): PrepareMobileCommandRuntimeFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('mobile_command_runtime_foundation');
  const monitoring = listMonitoringRecords()[0];
  const build = listPersistentBuilds()[0];
  const recovery = listRecoveries()[0];
  const runtimeId = monitoring?.monitoringOwner.runtimeId ?? build?.buildOwner.runtimeId ?? listRuntimes()[0]?.runtimeId ?? 'crrt-0001';
  const workspaceId = monitoring?.monitoringOwner.workspaceId ?? build?.buildOwner.workspaceId ?? listWorkspaces()[0]?.workspaceId ?? 'hws-0001';
  const persistentBuildId = monitoring?.monitoringOwner.persistentBuildId ?? build?.buildId ?? 'pbuild-0001';
  const verificationId = monitoring?.monitoringOwner.verificationId ?? recovery?.recoveryOwner.verificationId ?? listCloudVerifications()[0]?.verificationId ?? 'cver-0001';
  const recoveryId = monitoring?.monitoringOwner.recoveryId ?? recovery?.recoveryId ?? 'crec-0001';
  const monitoringId = monitoring?.monitoringId ?? 'cmon-0001';

  return {
    query,
    projectId: project.projectId,
    workspaceId,
    runtimeId,
    persistentBuildId,
    verificationId,
    recoveryId,
    monitoringId,
    commandName: 'DevPulse Mobile Command',
    mobileCommandType: 'GENERAL_MOBILE_COMMAND',
    projectExists: project.projectId !== 'none',
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: listWorkspaces().length > 0,
    persistentBuildExists: listPersistentBuilds().length > 0,
    verificationExists: listCloudVerifications().length > 0,
    recoveryExists: listRecoveries().length > 0,
    monitoringExists: listMonitoringRecords().length > 0,
    ownershipValid: owner.ownerModule === MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

export function prepareMobileCommandRuntimeFoundation(
  input: PrepareMobileCommandRuntimeFoundationInput,
): PrepareMobileCommandRuntimeFoundationResult {
  const query = input.query ?? 'Show mobile command inventory';

  if (isDuplicateMobileCommandExecutorQuestion(query)) {
    publishMobileCommandFeedStages(query, false);
    updateMobileCommandDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllMobileCommandReports(),
      diagnostics: getMobileCommandDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate mobile command executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: 'Recommendation: No.\nDo not create mobile_command_executor or parallel mobile command authorities.',
      authorityOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.verificationExists ||
    !input.recoveryExists ||
    !input.monitoringExists
  ) {
    publishMobileCommandFeedStages(query, false);
    updateMobileCommandDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllMobileCommandReports(),
      diagnostics: getMobileCommandDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Missing project, runtime, workspace, build, verification, recovery, or monitoring link'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: composeMobileCommandResponse(query, null, null, buildAllMobileCommandReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapMobileCommands(input.projectId);

  const registration = registerMobileCommandSession({
    commandName: input.commandName ?? 'DevPulse Mobile Command',
    mobileCommandType: input.mobileCommandType ?? 'GENERAL_MOBILE_COMMAND',
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    recoveryId: input.recoveryId,
    monitoringId: input.monitoringId,
    commandDescription: 'Mobile command authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let session = registration.session;
  let validation: MobileCommandValidationResult = {
    valid: !registration.blocked && session !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && session) {
    validation.warnings.push(`Using existing mobile command session: ${session.mobileCommandId}`);
  }

  if (session && !registration.blocked) {
    initializeMobileCommand(session.mobileCommandId);
    session = getStoredMobileCommandSession(session.mobileCommandId);
    if (session && session.mobileCommandState !== 'READY') {
      setMobileCommandState(session.mobileCommandId, 'READY', true);
      session = getStoredMobileCommandSession(session.mobileCommandId);
    }

    recordMobileCommandLifecycleEvent(session!.mobileCommandId, 'MOBILE_COMMAND_CONNECTED_TO_CLOUD', `Linked to ${input.runtimeId}`);
    recordMobileCommandLifecycleEvent(session!.mobileCommandId, 'MOBILE_COMMAND_CONNECTED_TO_WORKSPACE', `Linked to ${input.workspaceId}`);
    recordMobileCommandLifecycleEvent(session!.mobileCommandId, 'MOBILE_COMMAND_CONNECTED_TO_BUILD', `Linked to ${input.persistentBuildId}`);
    recordMobileCommandLifecycleEvent(session!.mobileCommandId, 'MOBILE_COMMAND_CONNECTED_TO_VERIFICATION', `Linked to ${input.verificationId}`);
    recordMobileCommandLifecycleEvent(session!.mobileCommandId, 'MOBILE_COMMAND_CONNECTED_TO_RECOVERY', `Linked to ${input.recoveryId}`);
    recordMobileCommandLifecycleEvent(session!.mobileCommandId, 'MOBILE_COMMAND_CONNECTED_TO_MONITORING', `Linked to ${input.monitoringId}`);

    const viewResult = evaluateMobileCommandAction(session!.mobileCommandId, 'view_status');
    registerMobileActionGateResult({
      mobileCommandId: session!.mobileCommandId,
      actionName: 'view_status',
      result: viewResult,
      reason: 'Canonical mobile read action',
    });

    const buildGate = evaluateMobileCommandAction(session!.mobileCommandId, 'execute_build');
    registerMobileActionGateResult({
      mobileCommandId: session!.mobileCommandId,
      actionName: 'execute_build',
      result: buildGate,
      reason: buildGate === 'BLOCK' ? 'Build execution blocked on mobile' : 'Gate evaluated',
    });

    if (buildGate === 'BLOCK') {
      recordMobileCommandLifecycleEvent(session!.mobileCommandId, 'MOBILE_COMMAND_ACTION_BLOCKED', 'execute_build blocked');
    } else {
      recordMobileCommandLifecycleEvent(session!.mobileCommandId, 'MOBILE_COMMAND_ACTION_ALLOWED', 'view_status allowed');
    }

    refreshMobileCommandContext(session!.mobileCommandId);
    session = getStoredMobileCommandSession(session!.mobileCommandId);
  }

  const trackedSession = session
    ? createTrackedMobileCommandSession({
        mobileCommandId: session.mobileCommandId,
        projectId: input.projectId,
        runtimeId: input.runtimeId,
        workspaceId: input.workspaceId,
        persistentBuildId: input.persistentBuildId,
        verificationId: input.verificationId,
        recoveryId: input.recoveryId,
        monitoringId: input.monitoringId,
      })
    : null;

  if (session && trackedSession) {
    completeMobileCommand(session.mobileCommandId);
    session = getStoredMobileCommandSession(session.mobileCommandId);
    validation = validateMobileCommandRecord(session);
  }

  const blocked = !validation.valid || registration.blocked;
  const reports = buildAllMobileCommandReports();
  const finalState = session?.mobileCommandState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishMobileCommandFeedStages(query, !blocked, session?.mobileCommandId);
  updateMobileCommandDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    session,
    trackedSession,
    reports,
    diagnostics: getMobileCommandDiagnostics(),
    validation,
    responseText: composeMobileCommandResponse(query, session, trackedSession, reports, blocked),
    authorityOnly: true,
  };
}

export function processMobileCommandRequest(query: string): PrepareMobileCommandRuntimeFoundationResult {
  return prepareMobileCommandRuntimeFoundation(resolveInputFromQuery(query));
}

export function getMobileCommandContext(query: string): PrepareMobileCommandRuntimeFoundationResult {
  return processMobileCommandRequest(query);
}
