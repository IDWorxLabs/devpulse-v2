/**
 * Mobile Approval Runtime Foundation — registry and orchestrator.
 * Authority only — no execution, push notifications, or real approvals.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { processPersistentBuildRequest, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import {
  processMobileCommandRequest,
  listMobileCommandSessionsAll,
} from '../mobile-command-runtime/index.js';
import {
  processMobileChatRequest,
  listMobileChatSessionsAll,
} from '../mobile-chat-runtime/index.js';
import {
  processMobilePreviewRequest,
  listMobilePreviewSessionsAll,
} from '../mobile-preview-runtime/index.js';
import { getDevPulseV2MobileApprovalFlowFoundation } from '../mobile-approval-flow-foundation/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { publishMobileApprovalFeedStages } from '../operator-feed/mobile-approval-feed-bridge.js';
import {
  nextMobileApprovalId,
  storeMobileApprovalSession,
  getStoredMobileApprovalSession,
  listStoredMobileApprovalSessions,
} from './mobile-approval-store.js';
import { buildMobileApprovalOwnership, recordMobileApprovalOwnershipHistory } from './mobile-approval-ownership.js';
import { buildDefaultMobileApprovalContext, refreshMobileApprovalContext } from './mobile-approval-context.js';
import { buildDefaultMobileApprovalVisibility } from './mobile-approval-visibility.js';
import { linkMobileApprovalToCommandSession } from './mobile-approval-command-bridge.js';
import { linkMobileApprovalToChatSession } from './mobile-approval-chat-bridge.js';
import { linkMobileApprovalToPreviewSession } from './mobile-approval-preview-bridge.js';
import { linkMobileApprovalToCloud } from './mobile-approval-cloud-bridge.js';
import { linkMobileApprovalToProjectVault } from './mobile-approval-project-vault-bridge.js';
import { linkMobileApprovalToOperatorFeed } from './mobile-approval-operator-feed-bridge.js';
import { createMobileApprovalSession as createTrackedMobileApprovalSession } from './mobile-approval-session-manager.js';
import {
  recordMobileApprovalLifecycleEvent,
  initializeMobileApproval,
  markMobileApprovalReady,
  completeMobileApproval,
} from './mobile-approval-lifecycle.js';
import { registerApprovalRequest } from './mobile-approval-request-manager.js';
import { recordApprovalDecision } from './mobile-approval-decision-manager.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import { validateMobileApprovalRegistration, validateMobileApprovalRecord } from './mobile-approval-validator.js';
import { updateMobileApprovalDiagnostics, getMobileApprovalDiagnostics } from './mobile-approval-diagnostics.js';
import { buildAllMobileApprovalReports, composeMobileApprovalResponse } from './mobile-approval-report-builder.js';
import type {
  MobileApprovalSession,
  MobileApprovalCategory,
  MobileApprovalGovernance,
  MobileApprovalValidationResult,
  MobileApprovalWorkspaceLink,
  MobileApprovalBuildLink,
  MobileApprovalFlowLink,
  PrepareMobileApprovalRuntimeFoundationInput,
  PrepareMobileApprovalRuntimeFoundationResult,
  RegisterMobileApprovalInput,
  RegisterMobileApprovalResult,
} from './mobile-approval-types.js';
import {
  MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
  isDuplicateMobileApprovalExecutorQuestion,
} from './mobile-approval-types.js';

const BOOTSTRAP_MOBILE_APPROVALS: Array<{
  previewNameMatch: string;
  approvalName: string;
  type: MobileApprovalCategory;
  description: string;
}> = [
  {
    previewNameMatch: 'General Mobile Preview',
    approvalName: 'General Mobile Approval',
    type: 'GENERAL_APPROVAL',
    description: 'General mobile approval authority',
  },
  {
    previewNameMatch: 'Project Mobile Preview',
    approvalName: 'Project Mobile Approval',
    type: 'PROJECT_APPROVAL',
    description: 'Project mobile approval authority',
  },
  {
    previewNameMatch: 'World 2 Mobile Preview',
    approvalName: 'World 2 Mobile Approval',
    type: 'WORLD2_APPROVAL',
    description: 'World 2 mobile approval authority',
  },
  {
    previewNameMatch: 'AiDev Mobile Preview',
    approvalName: 'AiDev Mobile Approval',
    type: 'AIDEV_APPROVAL',
    description: 'AiDev mobile approval authority',
  },
  {
    previewNameMatch: 'Autonomous Mobile Preview',
    approvalName: 'Autonomous Mobile Approval',
    type: 'AUTONOMOUS_APPROVAL',
    description: 'Autonomous mobile approval authority',
  },
  {
    previewNameMatch: 'Founder Mobile Preview',
    approvalName: 'Founder Mobile Approval',
    type: 'FOUNDER_APPROVAL',
    description: 'Founder mobile approval authority',
  },
  {
    previewNameMatch: 'Verification Mobile Preview',
    approvalName: 'Cloud Mobile Approval',
    type: 'CLOUD_APPROVAL',
    description: 'Cloud mobile approval authority',
  },
  {
    previewNameMatch: 'App Build Mobile Preview',
    approvalName: 'Build Mobile Approval',
    type: 'BUILD_APPROVAL',
    description: 'Build mobile approval authority',
  },
  {
    previewNameMatch: 'Monitoring Mobile Preview',
    approvalName: 'Self Evolution Mobile Approval',
    type: 'SELF_EVOLUTION_APPROVAL',
    description: 'Self evolution mobile approval authority',
  },
];

let bootstrapped = false;

export function resetMobileApprovalBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  if (
    listRuntimes().length > 0 &&
    listMobileCommandSessionsAll().length > 0 &&
    listMobileChatSessionsAll().length > 0 &&
    listMobilePreviewSessionsAll().length > 0
  ) {
    return;
  }
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processMobileCommandRequest('Show mobile command inventory');
  processMobileChatRequest('Show mobile chat inventory');
  processMobilePreviewRequest('Show mobile preview inventory');
}

function linkMobileApprovalToWorkspace(
  mobileApprovalId: string,
  workspaceId: string,
): MobileApprovalWorkspaceLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  const workspace = getWorkspace(workspaceId);
  if (!session || !workspace) return null;

  const mismatch = workspace.workspaceOwner.projectId !== session.mobileApprovalOwner.projectId;
  const link: MobileApprovalWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalWorkspaceLink: link,
    mobileApprovalOwner: { ...session.mobileApprovalOwner, workspaceId },
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'WORKSPACE',
    summary: `Linked to workspace ${workspaceId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: workspaceId,
  });

  return link;
}

function linkMobileApprovalToBuild(
  mobileApprovalId: string,
  persistentBuildId: string,
): MobileApprovalBuildLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  const build = getPersistentBuild(persistentBuildId);
  if (!session || !build) return null;

  const mismatch = build.buildOwner.projectId !== session.mobileApprovalOwner.projectId;
  const link: MobileApprovalBuildLink = {
    persistentBuildId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalBuildLink: link,
    mobileApprovalOwner: { ...session.mobileApprovalOwner, persistentBuildId },
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'PERSISTENT_BUILD',
    summary: `Linked to build ${persistentBuildId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: persistentBuildId,
  });

  return link;
}

function linkMobileApprovalToFlowFoundation(
  mobileApprovalId: string,
  approvalFlowFoundationId?: string,
): MobileApprovalFlowLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return null;

  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();
  const foundationId = approvalFlowFoundationId ?? flowFoundation.getFoundationState().foundationId;
  const link: MobileApprovalFlowLink = {
    approvalFlowFoundationId: foundationId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: !foundationId,
    governancePhase: '8.4',
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalFlowLink: link,
    mobileApprovalOwner: {
      ...session.mobileApprovalOwner,
      mobileApprovalFlowFoundationId: foundationId,
    },
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'FLOW',
    summary: `Linked to mobile approval flow foundation ${foundationId}`,
    scopeUsed: foundationId,
  });

  return link;
}

function buildMobileApprovalGovernance(
  mobileApprovalId: string,
  mobileApprovalType: MobileApprovalCategory,
): MobileApprovalGovernance {
  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();
  const founderOnlyRequired =
    mobileApprovalType === 'FOUNDER_APPROVAL' || mobileApprovalType === 'SELF_EVOLUTION_APPROVAL';
  return {
    governanceId: `mapprgov-${mobileApprovalId}`,
    mobileApprovalId,
    result: founderOnlyRequired ? 'FOUNDER_ONLY' : 'ALIGNED',
    reason: founderOnlyRequired
      ? 'Founder review required — decision interface metadata only'
      : 'Mobile Approval Flow Foundation governance interface aligned',
    evaluatedAt: Date.now(),
    flowFoundationPhase: '8.4',
    flowFoundationOwnerModule: 'devpulse_v2_mobile_approval_flow_foundation',
    governanceAligned: !founderOnlyRequired,
    founderOnlyRequired,
    decisionInterfaceOnly: true,
    executionBlocked: true,
  };
}

function resolveLinksFromPreview(previewNameMatch: string): {
  mobilePreviewSessionId: string;
  mobileCommandSessionId: string;
  mobileChatSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  projectId: string;
} | null {
  const preview =
    listMobilePreviewSessionsAll().find((p) => p.mobilePreviewMetadata.previewName === previewNameMatch) ??
    listMobilePreviewSessionsAll().find((p) =>
      p.mobilePreviewMetadata.previewName.includes(previewNameMatch.replace(' Mobile Preview', '')),
    );
  if (!preview) return null;
  return {
    mobilePreviewSessionId: preview.mobilePreviewId,
    mobileCommandSessionId: preview.mobilePreviewOwner.mobileCommandSessionId,
    mobileChatSessionId: preview.mobilePreviewOwner.mobileChatSessionId,
    runtimeId: preview.mobilePreviewOwner.runtimeId,
    workspaceId: preview.mobilePreviewOwner.workspaceId,
    persistentBuildId: preview.mobilePreviewOwner.persistentBuildId,
    projectId: preview.mobilePreviewOwner.projectId,
  };
}

function bootstrapMobileApprovals(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();

  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();
  const flowFoundationId = flowFoundation.getFoundationState().foundationId;

  for (const seed of BOOTSTRAP_MOBILE_APPROVALS) {
    const links = resolveLinksFromPreview(seed.previewNameMatch);
    if (!links) continue;
    registerMobileApprovalSession({
      approvalName: seed.approvalName,
      mobileApprovalType: seed.type,
      projectId: links.projectId || projectId,
      mobileCommandSessionId: links.mobileCommandSessionId,
      mobileChatSessionId: links.mobileChatSessionId,
      mobilePreviewSessionId: links.mobilePreviewSessionId,
      runtimeId: links.runtimeId,
      workspaceId: links.workspaceId,
      persistentBuildId: links.persistentBuildId,
      mobileApprovalFlowFoundationId: flowFoundationId,
      approvalDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerMobileApprovalSession(input: RegisterMobileApprovalInput): RegisterMobileApprovalResult {
  const approvalType = input.mobileApprovalType ?? 'GENERAL_APPROVAL';
  const existing = listStoredMobileApprovalSessions().find(
    (s) =>
      s.mobileApprovalMetadata.approvalName === input.approvalName &&
      s.mobileApprovalOwner.projectId === input.projectId &&
      s.mobileApprovalOwner.mobilePreviewSessionId === input.mobilePreviewSessionId &&
      s.mobileApprovalType === approvalType,
  );
  if (existing && !input.allowDuplicate) {
    return { session: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateMobileApprovalRegistration(input);
  if (!validation.valid) {
    return { session: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const mobileApprovalId = nextMobileApprovalId();
  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();
  const flowFoundationId =
    input.mobileApprovalFlowFoundationId ?? flowFoundation.getFoundationState().foundationId;

  const ownership = buildMobileApprovalOwnership({
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    mobilePreviewSessionId: input.mobilePreviewSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    mobileApprovalFlowFoundationId: flowFoundationId,
    createdBy: input.createdBy,
  });

  const session: MobileApprovalSession = {
    mobileApprovalId,
    mobileApprovalType: approvalType,
    mobileApprovalOwner: ownership,
    mobileApprovalState: 'CREATED',
    mobileApprovalStatus: 'UNKNOWN',
    mobileApprovalMetadata: {
      approvalName: input.approvalName,
      approvalDescription: input.approvalDescription ?? '',
      tags: [approvalType],
      monitorable: true,
    },
    mobileApprovalVisibility: input.visibility ?? buildDefaultMobileApprovalVisibility(approvalType),
    mobileApprovalProvenance: {
      sourceSystem: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    mobileApprovalContext: buildDefaultMobileApprovalContext({
      projectId: input.projectId,
      mobileCommandSessionId: input.mobileCommandSessionId,
      mobileChatSessionId: input.mobileChatSessionId,
      mobilePreviewSessionId: input.mobilePreviewSessionId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      mobileApprovalFlowFoundationId: flowFoundationId,
      mobileApprovalType: approvalType,
    }),
    mobileApprovalRequests: [],
    mobileApprovalDecisions: [],
    mobileApprovalGovernance: buildMobileApprovalGovernance(mobileApprovalId, approvalType),
    mobileApprovalCommandLink: {
      mobileCommandId: input.mobileCommandSessionId,
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalChatLink: {
      mobileChatId: input.mobileChatSessionId,
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalPreviewLink: {
      mobilePreviewId: input.mobilePreviewSessionId,
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalCloudLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalWorkspaceLink: {
      workspaceId: input.workspaceId,
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalBuildLink: {
      persistentBuildId: input.persistentBuildId,
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalFlowLink: {
      approvalFlowFoundationId: flowFoundationId,
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
      governancePhase: '8.4',
    },
    mobileApprovalOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalProjectVaultLink: {
      vaultProjectId: input.projectId,
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalWorld2Link: {
      world2OperationId: '',
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobileApprovalAiDevLink: {
      aidevOperationId: '',
      linkedAt: now,
      linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    createdAt: now,
    updatedAt: now,
  };

  storeMobileApprovalSession(session);
  recordMobileApprovalLifecycleEvent(mobileApprovalId, 'MOBILE_APPROVAL_CREATED', `Registered ${input.approvalName}`);
  linkMobileApprovalToCommandSession(mobileApprovalId, input.mobileCommandSessionId);
  linkMobileApprovalToChatSession(mobileApprovalId, input.mobileChatSessionId);
  linkMobileApprovalToPreviewSession(mobileApprovalId, input.mobilePreviewSessionId);
  linkMobileApprovalToCloud(mobileApprovalId, input.runtimeId);
  linkMobileApprovalToWorkspace(mobileApprovalId, input.workspaceId);
  linkMobileApprovalToBuild(mobileApprovalId, input.persistentBuildId);
  linkMobileApprovalToFlowFoundation(mobileApprovalId, flowFoundationId);
  linkMobileApprovalToProjectVault(mobileApprovalId, input.projectId);
  linkMobileApprovalToOperatorFeed(mobileApprovalId);
  recordMobileApprovalOwnershipHistory(mobileApprovalId, `Ownership assigned to ${ownership.ownerModule}`);
  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'MOBILE_APPROVAL',
    summary: `Mobile approval ${mobileApprovalId} registered: ${input.approvalName}`,
    scopeUsed: input.projectId,
  });

  return {
    session: getStoredMobileApprovalSession(mobileApprovalId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getMobileApprovalSession(mobileApprovalId: string): MobileApprovalSession | null {
  return getStoredMobileApprovalSession(mobileApprovalId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareMobileApprovalRuntimeFoundationInput> = {},
): PrepareMobileApprovalRuntimeFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('mobile_approval_runtime_foundation');
  const preview = listMobilePreviewSessionsAll()[0];
  const chat = listMobileChatSessionsAll()[0];
  const command = listMobileCommandSessionsAll()[0];
  const build = listPersistentBuilds()[0];
  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();

  return {
    query,
    projectId: project.projectId,
    mobileCommandSessionId:
      preview?.mobilePreviewOwner.mobileCommandSessionId ?? chat?.mobileChatOwner.mobileCommandSessionId ?? command?.mobileCommandId ?? 'mcmd-0001',
    mobileChatSessionId:
      preview?.mobilePreviewOwner.mobileChatSessionId ?? chat?.mobileChatId ?? 'mchat-0001',
    mobilePreviewSessionId: preview?.mobilePreviewId ?? 'mprev-0001',
    runtimeId:
      preview?.mobilePreviewOwner.runtimeId ??
      chat?.mobileChatOwner.runtimeId ??
      command?.mobileCommandOwner.runtimeId ??
      listRuntimes()[0]?.runtimeId ??
      'crrt-0001',
    workspaceId:
      preview?.mobilePreviewOwner.workspaceId ??
      chat?.mobileChatOwner.workspaceId ??
      command?.mobileCommandOwner.workspaceId ??
      build?.buildOwner.workspaceId ??
      'hws-0001',
    persistentBuildId:
      preview?.mobilePreviewOwner.persistentBuildId ??
      chat?.mobileChatOwner.persistentBuildId ??
      command?.mobileCommandOwner.persistentBuildId ??
      build?.buildId ??
      'pbuild-0001',
    mobileApprovalFlowFoundationId: flowFoundation.getFoundationState().foundationId,
    approvalName: 'DevPulse Mobile Approval',
    mobileApprovalType: 'GENERAL_APPROVAL',
    projectExists: project.projectId !== 'none',
    commandSessionExists: listMobileCommandSessionsAll().length > 0,
    chatSessionExists: listMobileChatSessionsAll().length > 0,
    previewSessionExists: listMobilePreviewSessionsAll().length > 0,
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: listWorkspaces().length > 0,
    persistentBuildExists: listPersistentBuilds().length > 0,
    flowFoundationExists: flowFoundation.getFoundationState().foundationId.length > 0,
    ownershipValid: owner.ownerModule === MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

function orchestrateMobileApprovalPipeline(mobileApprovalId: string): {
  session: MobileApprovalSession | null;
  rejected: boolean;
} {
  initializeMobileApproval(mobileApprovalId);
  markMobileApprovalReady(mobileApprovalId);
  refreshMobileApprovalContext(mobileApprovalId);

  const sessionBeforeRequest = getStoredMobileApprovalSession(mobileApprovalId);
  const request = registerApprovalRequest({
    mobileApprovalId,
    requestTitle: `Approval request for ${sessionBeforeRequest?.mobileApprovalMetadata.approvalName ?? mobileApprovalId}`,
    requestSummary: 'Mobile approval authority request — metadata only, no execution',
    requestCategory: sessionBeforeRequest?.mobileApprovalType,
  });

  let rejected = false;

  if (request && request.result === 'REGISTERED') {
    recordApprovalDecision({
      mobileApprovalId,
      requestId: request.requestId,
      decisionType: 'APPROVED',
      reason: 'Approval metadata recorded — authority only, no execution performed',
    });
  } else if (request && request.result === 'FOUNDER_ONLY') {
    recordApprovalDecision({
      mobileApprovalId,
      requestId: request.requestId,
      decisionType: 'FOUNDER_ONLY',
      reason: 'Founder-only approval path — decision metadata recorded without execution',
    });
  } else if (request) {
    rejected = request.result === 'BLOCKED' || request.result === 'DUPLICATE';
    if (request.result === 'CONTEXT_REQUIRED') {
      recordApprovalDecision({
        mobileApprovalId,
        requestId: request.requestId,
        decisionType: 'REQUIRES_MORE_CONTEXT',
        reason: 'Additional context required before decision metadata is final',
      });
    }
  }

  completeMobileApproval(mobileApprovalId);

  return {
    session: getStoredMobileApprovalSession(mobileApprovalId),
    rejected,
  };
}

export function prepareMobileApprovalRuntimeFoundation(
  input: PrepareMobileApprovalRuntimeFoundationInput,
): PrepareMobileApprovalRuntimeFoundationResult {
  const query = input.query ?? 'Show mobile approval inventory';

  if (isDuplicateMobileApprovalExecutorQuestion(query)) {
    publishMobileApprovalFeedStages(query, false);
    updateMobileApprovalDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllMobileApprovalReports(),
      diagnostics: getMobileApprovalDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate mobile approval executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create mobile_approval_executor or parallel mobile approval authorities.',
      authorityOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.commandSessionExists ||
    !input.chatSessionExists ||
    !input.previewSessionExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.flowFoundationExists
  ) {
    publishMobileApprovalFeedStages(query, false);
    updateMobileApprovalDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllMobileApprovalReports(),
      diagnostics: getMobileApprovalDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeMobileApprovalResponse(query, null, null, buildAllMobileApprovalReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapMobileApprovals(input.projectId);

  const registration = registerMobileApprovalSession({
    approvalName: input.approvalName ?? 'DevPulse Mobile Approval',
    mobileApprovalType: input.mobileApprovalType ?? 'GENERAL_APPROVAL',
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    mobilePreviewSessionId: input.mobilePreviewSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    mobileApprovalFlowFoundationId: input.mobileApprovalFlowFoundationId,
    approvalDescription: 'Mobile approval authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let session = registration.session;
  let validation: MobileApprovalValidationResult = {
    valid: !registration.blocked && session !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && session) {
    validation.warnings.push(`Using existing mobile approval session: ${session.mobileApprovalId}`);
  }

  let rejected = false;

  if (session && !registration.blocked && !registration.duplicate) {
    const pipeline = orchestrateMobileApprovalPipeline(session.mobileApprovalId);
    session = pipeline.session;
    rejected = pipeline.rejected;
  }

  const trackedSession = session
    ? createTrackedMobileApprovalSession({
        mobileApprovalId: session.mobileApprovalId,
        projectId: input.projectId,
        mobileCommandSessionId: input.mobileCommandSessionId,
        mobileChatSessionId: input.mobileChatSessionId,
        mobilePreviewSessionId: input.mobilePreviewSessionId,
        runtimeId: input.runtimeId,
        workspaceId: input.workspaceId,
        persistentBuildId: input.persistentBuildId,
      })
    : null;

  if (session && trackedSession && !registration.duplicate) {
    session = getStoredMobileApprovalSession(session.mobileApprovalId);
    validation = validateMobileApprovalRecord(session);
  }

  const blocked = !validation.valid || registration.blocked || rejected;
  const reports = buildAllMobileApprovalReports();
  const finalState = session?.mobileApprovalState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishMobileApprovalFeedStages(query, !blocked, session?.mobileApprovalId, blocked, rejected);
  if (session) linkMobileApprovalToOperatorFeed(session.mobileApprovalId);
  updateMobileApprovalDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    session,
    trackedSession,
    reports,
    diagnostics: getMobileApprovalDiagnostics(),
    validation,
    responseText: composeMobileApprovalResponse(query, session, trackedSession, reports, blocked),
    authorityOnly: true,
  };
}

export function processMobileApprovalRequest(query: string): PrepareMobileApprovalRuntimeFoundationResult {
  return prepareMobileApprovalRuntimeFoundation(resolveInputFromQuery(query));
}

export function getMobileApprovalContext(query: string): PrepareMobileApprovalRuntimeFoundationResult {
  return processMobileApprovalRequest(query);
}
