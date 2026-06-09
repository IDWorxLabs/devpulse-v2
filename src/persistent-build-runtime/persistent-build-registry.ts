/**
 * Persistent Build Runtime Foundation — registry and orchestrator.
 * Authority only — no real builds, cloud workers, or file mutation.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { publishPersistentBuildFeedStages } from '../operator-feed/persistent-build-feed-bridge.js';
import {
  nextBuildId,
  storePersistentBuild,
  getStoredPersistentBuild,
  listStoredPersistentBuilds,
} from './persistent-build-store.js';
import { buildPersistentBuildOwnership, recordBuildOwnershipHistory } from './persistent-build-ownership.js';
import { buildDefaultBuildContext } from './persistent-build-context.js';
import { buildInitialBuildProgress, updateBuildProgress } from './persistent-build-progress.js';
import { buildInitialResumeState, markResumeCheckpoint } from './persistent-build-resume.js';
import { linkBuildToRuntime } from './persistent-build-cloud-bridge.js';
import { linkBuildToWorkspace } from './persistent-build-workspace-bridge.js';
import { createPersistentBuildSession } from './persistent-build-session-manager.js';
import {
  activatePersistentBuild,
  completePersistentBuild,
  recordPersistentBuildLifecycleEvent,
} from './persistent-build-lifecycle.js';
import { setPersistentBuildState } from './persistent-build-state-manager.js';
import { recordPersistentBuildHistoryEntry } from './persistent-build-history.js';
import {
  validatePersistentBuildRegistration,
  validatePersistentBuildRecord,
} from './persistent-build-validator.js';
import { updatePersistentBuildDiagnostics, getPersistentBuildDiagnostics } from './persistent-build-diagnostics.js';
import {
  buildAllPersistentBuildReports,
  composePersistentBuildResponse,
} from './persistent-build-report-builder.js';
import type {
  PersistentBuild,
  PersistentBuildValidationResult,
  PreparePersistentBuildFoundationInput,
  PreparePersistentBuildFoundationResult,
  RegisterPersistentBuildInput,
  RegisterPersistentBuildResult,
} from './persistent-build-types.js';
import {
  PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
  isDuplicatePersistentBuildExecutorQuestion,
} from './persistent-build-types.js';

const BOOTSTRAP_BUILDS: Array<{
  name: string;
  type: PersistentBuild['buildType'];
  description: string;
  workspaceNameMatch: string;
  goal: string;
}> = [
  { name: 'General Persistent Build', type: 'GENERAL_BUILD', description: 'General long-running build authority', workspaceNameMatch: 'General Hosted', goal: 'Maintain general persistent build session metadata' },
  { name: 'AiDev Persistent Build', type: 'AIDEV_BUILD', description: 'AiDev execution build session authority', workspaceNameMatch: 'Persistent Build Workspace', goal: 'Track AiDev build context without execution' },
  { name: 'World 2 Persistent Build', type: 'WORLD2_BUILD', description: 'World 2 cloud build session authority', workspaceNameMatch: 'World 2', goal: 'Track World 2 build context without execution' },
  { name: 'Autonomous Builder Build', type: 'AUTONOMOUS_BUILD', description: 'Autonomous builder build session authority', workspaceNameMatch: 'Autonomous Builder', goal: 'Track autonomous builder context without execution' },
  { name: 'Founder Persistent Build', type: 'FOUNDER_BUILD', description: 'Founder-controlled build session authority', workspaceNameMatch: 'Founder Hosted', goal: 'Founder build session metadata' },
  { name: 'Mobile Triggered Build', type: 'MOBILE_TRIGGERED_BUILD', description: 'Mobile command build session authority', workspaceNameMatch: 'Mobile Command', goal: 'Mobile-triggered build context metadata' },
  { name: 'Verification Triggered Build', type: 'VERIFICATION_TRIGGERED_BUILD', description: 'Verification-triggered build session authority', workspaceNameMatch: 'Verification', goal: 'Verification-gated build context metadata' },
  { name: 'Recovery Build Session', type: 'RECOVERY_BUILD', description: 'Recovery build session authority', workspaceNameMatch: 'Sandbox', goal: 'Recovery build context metadata' },
];

let bootstrapped = false;

export function resetPersistentBuildBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processWorkspaceHostingRequest('Show hosted workspace inventory');
}

function resolveWorkspaceAndRuntime(workspaceNameMatch: string): { workspaceId: string; runtimeId: string; projectId: string } | null {
  const workspaces = listWorkspaces();
  const ws = workspaces.find((w) => w.workspaceMetadata.workspaceName.includes(workspaceNameMatch)) ?? workspaces[0];
  if (!ws) return null;
  return {
    workspaceId: ws.workspaceId,
    runtimeId: ws.workspaceOwner.runtimeId,
    projectId: ws.workspaceOwner.projectId,
  };
}

function bootstrapPersistentBuilds(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  for (const seed of BOOTSTRAP_BUILDS) {
    const links = resolveWorkspaceAndRuntime(seed.workspaceNameMatch);
    if (!links) continue;
    registerPersistentBuild({
      buildName: seed.name,
      buildType: seed.type,
      projectId: links.projectId || projectId,
      workspaceId: links.workspaceId,
      runtimeId: links.runtimeId,
      buildDescription: seed.description,
      currentGoal: seed.goal,
      pausable: true,
      resumable: true,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerPersistentBuild(input: RegisterPersistentBuildInput): RegisterPersistentBuildResult {
  const existing = listStoredPersistentBuilds().find(
    (b) =>
      b.buildMetadata.buildName === input.buildName &&
      b.buildOwner.projectId === input.projectId &&
      b.buildOwner.workspaceId === input.workspaceId &&
      b.buildOwner.runtimeId === input.runtimeId,
  );
  if (existing && !input.allowDuplicate) {
    return { build: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validatePersistentBuildRegistration(input);
  if (!validation.valid) {
    return {
      build: null,
      duplicate: false,
      duplicateRisks: validation.duplicateRisks,
      blocked: true,
    };
  }

  const now = Date.now();
  const buildId = nextBuildId();
  const ownership = buildPersistentBuildOwnership({
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    createdBy: input.createdBy,
  });

  const build: PersistentBuild = {
    buildId,
    buildType: input.buildType ?? 'GENERAL_BUILD',
    buildOwner: ownership,
    buildState: 'CREATED',
    buildStatus: 'UNKNOWN',
    buildMetadata: {
      buildName: input.buildName,
      buildDescription: input.buildDescription ?? '',
      tags: [input.buildType ?? 'GENERAL_BUILD'],
      pausable: input.pausable ?? true,
      resumable: input.resumable ?? true,
      monitorable: true,
    },
    buildVisibility: input.visibility ?? 'PROJECT',
    buildProvenance: {
      sourceSystem: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    buildContext: buildDefaultBuildContext({
      currentGoal: input.currentGoal,
      buildType: input.buildType,
    }),
    buildProgress: buildInitialBuildProgress(),
    buildResumeState: buildInitialResumeState(input.resumable ?? true),
    buildCloudRuntimeLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    buildWorkspaceLink: {
      workspaceId: input.workspaceId,
      linkedAt: now,
      linkAuthority: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    buildProjectLink: {
      projectId: input.projectId,
      linkedAt: now,
      linkAuthority: PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    },
    buildVerificationLink: {
      evidenceReferences: input.evidenceReferences ?? [],
      reportReferences: input.reportReferences ?? [],
      linkedAt: now,
    },
    buildRelationships: {
      parentBuildId: null,
      childBuildIds: [],
      relatedRuntimeIds: [input.runtimeId],
      relatedWorkspaceIds: [input.workspaceId],
      relatedProjectIds: [input.projectId],
    },
    createdAt: now,
    updatedAt: now,
  };

  storePersistentBuild(build);
  recordPersistentBuildLifecycleEvent(buildId, 'BUILD_CREATED', `Registered ${input.buildName}`);
  linkBuildToRuntime(buildId, input.runtimeId);
  linkBuildToWorkspace(buildId, input.workspaceId);
  recordBuildOwnershipHistory(buildId, `Ownership assigned to ${ownership.ownerModule}`);
  recordPersistentBuildHistoryEntry({
    buildId,
    category: 'BUILD',
    summary: `Build ${buildId} registered: ${input.buildName}`,
    scopeUsed: input.projectId,
  });

  return {
    build: getStoredPersistentBuild(buildId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getPersistentBuild(buildId: string): PersistentBuild | null {
  return getStoredPersistentBuild(buildId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PreparePersistentBuildFoundationInput> = {},
): PreparePersistentBuildFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('persistent_build_runtime_foundation');
  const workspaces = listWorkspaces();
  const ws = workspaces[0];
  const runtimeId = ws?.workspaceOwner.runtimeId ?? listRuntimes()[0]?.runtimeId ?? 'crrt-0001';
  const workspaceId = ws?.workspaceId ?? 'hws-0001';

  return {
    query,
    projectId: project.projectId,
    workspaceId,
    runtimeId,
    buildName: 'DevPulse Persistent Build',
    buildType: 'GENERAL_BUILD',
    projectExists: project.projectId !== 'none',
    workspaceExists: workspaces.length > 0,
    runtimeExists: listRuntimes().length > 0,
    ownershipValid: owner.ownerModule === PERSISTENT_BUILD_RUNTIME_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

export function preparePersistentBuildFoundation(
  input: PreparePersistentBuildFoundationInput,
): PreparePersistentBuildFoundationResult {
  const query = input.query ?? 'Show persistent build inventory';

  if (isDuplicatePersistentBuildExecutorQuestion(query)) {
    publishPersistentBuildFeedStages(query, false);
    updatePersistentBuildDiagnostics(query, 'FAILED');
    return {
      build: null,
      session: null,
      reports: buildAllPersistentBuildReports(),
      diagnostics: getPersistentBuildDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate persistent build executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: 'Recommendation: No.\nDo not create persistent_build_executor or parallel build authorities.',
      authorityOnly: true,
    };
  }

  if (!input.projectExists || !input.workspaceExists || !input.runtimeExists) {
    publishPersistentBuildFeedStages(query, false);
    updatePersistentBuildDiagnostics(query, 'FAILED');
    return {
      build: null,
      session: null,
      reports: buildAllPersistentBuildReports(),
      diagnostics: getPersistentBuildDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Missing project, workspace, or runtime link'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText: composePersistentBuildResponse(query, null, null, [], true),
      authorityOnly: true,
    };
  }

  bootstrapPersistentBuilds(input.projectId);

  const registration = registerPersistentBuild({
    buildName: input.buildName ?? 'DevPulse Persistent Build',
    buildType: input.buildType ?? 'GENERAL_BUILD',
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    runtimeId: input.runtimeId,
    buildDescription: 'Persistent build authority session',
    currentGoal: 'Long-running build session metadata',
    query,
    allowDuplicate: input.forceDuplicate === true,
    evidenceReferences: ['vevid-0001'],
    reportReferences: ['vrpt-0001'],
  });

  let build = registration.build;
  let validation: PersistentBuildValidationResult = {
    valid: !registration.blocked && build !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && build) {
    validation.warnings.push(`Using existing build: ${build.buildId}`);
  }

  if (build && !registration.blocked) {
    activatePersistentBuild(build.buildId);
    build = getStoredPersistentBuild(build.buildId);
    if (build && build.buildState !== 'READY') {
      setPersistentBuildState(build.buildId, 'READY', true);
      build = getStoredPersistentBuild(build.buildId);
    }
    recordPersistentBuildLifecycleEvent(build!.buildId, 'BUILD_LINKED_TO_RUNTIME', `Linked to ${input.runtimeId}`);
    recordPersistentBuildLifecycleEvent(build!.buildId, 'BUILD_LINKED_TO_WORKSPACE', `Linked to ${input.workspaceId}`);
    updateBuildProgress(build!.buildId, { progressPercent: 25, progressState: 'IN_PROGRESS', lastProgressMessage: 'Runtime and workspace linked' });
    markResumeCheckpoint(build!.buildId, 'READY', 'Initial authority checkpoint');
  }

  let session = build
    ? createPersistentBuildSession({
        buildId: build.buildId,
        projectId: input.projectId,
        workspaceId: input.workspaceId,
        runtimeId: input.runtimeId,
      })
    : null;

  if (build && session) {
    activatePersistentBuild(build.buildId);
    updateBuildProgress(build.buildId, { progressPercent: 100, progressState: 'COMPLETE', lastProgressMessage: 'Authority session complete' });
    completePersistentBuild(build.buildId);
    build = getStoredPersistentBuild(build.buildId);
    validation = validatePersistentBuildRecord(build);
  }

  const blocked = !validation.valid || registration.blocked;
  const reports = buildAllPersistentBuildReports();
  const finalState = build?.buildState ?? (blocked ? 'FAILED' : 'READY');

  publishPersistentBuildFeedStages(query, !blocked);
  updatePersistentBuildDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    build,
    session,
    reports,
    diagnostics: getPersistentBuildDiagnostics(),
    validation,
    responseText: composePersistentBuildResponse(query, build, session, reports, blocked),
    authorityOnly: true,
  };
}

export function processPersistentBuildRequest(query: string): PreparePersistentBuildFoundationResult {
  return preparePersistentBuildFoundation(resolveInputFromQuery(query));
}

export function getPersistentBuildContext(query: string): PreparePersistentBuildFoundationResult {
  return processPersistentBuildRequest(query);
}
