/**
 * Mobile Preview Runtime Foundation — registry and orchestrator.
 * Authority only — no mobile UI, preview streaming, or preview rendering.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { processCloudRuntimeRequest, listRuntimes } from '../cloud-runtime/index.js';
import { processWorkspaceHostingRequest, listWorkspaces } from '../workspace-hosting/index.js';
import { processPersistentBuildRequest, listPersistentBuilds } from '../persistent-build-runtime/index.js';
import { processCloudVerificationRequest, listCloudVerifications } from '../cloud-verification/index.js';
import {
  processMobileCommandRequest,
  listMobileCommandSessionsAll,
} from '../mobile-command-runtime/index.js';
import {
  processMobileChatRequest,
  listMobileChatSessionsAll,
} from '../mobile-chat-runtime/index.js';
import { processLivePreviewRequest, listPreviewSessions } from '../live-preview-runtime/index.js';
import { publishMobilePreviewFeedStages } from '../operator-feed/mobile-preview-feed-bridge.js';
import {
  nextMobilePreviewId,
  storeMobilePreviewSession,
  getStoredMobilePreviewSession,
  listStoredMobilePreviewSessions,
} from './mobile-preview-store.js';
import { buildMobilePreviewOwnership, recordMobilePreviewOwnershipHistory } from './mobile-preview-ownership.js';
import { buildDefaultMobilePreviewContext, refreshMobilePreviewContext } from './mobile-preview-context.js';
import { evaluateMobilePreviewEligibility } from './mobile-preview-eligibility.js';
import { evaluateMobilePreviewSafety } from './mobile-preview-safety.js';
import { getMobilePreviewDevicePolicy } from './mobile-preview-device-policy.js';
import { registerDesktopRecommendation } from './mobile-preview-desktop-recommendation.js';
import { registerPreviewLink } from './mobile-preview-link-manager.js';
import { linkMobilePreviewToCommandSession } from './mobile-preview-command-bridge.js';
import { linkMobilePreviewToChatSession } from './mobile-preview-chat-bridge.js';
import { linkMobilePreviewToCloud } from './mobile-preview-cloud-bridge.js';
import { linkMobilePreviewToWorkspace } from './mobile-preview-workspace-bridge.js';
import { linkMobilePreviewToBuild } from './mobile-preview-build-bridge.js';
import { linkMobilePreviewToVerification } from './mobile-preview-verification-bridge.js';
import { linkMobilePreviewToOperatorFeed } from './mobile-preview-operator-feed-bridge.js';
import { createMobilePreviewSession as createTrackedMobilePreviewSession } from './mobile-preview-session-manager.js';
import {
  recordMobilePreviewLifecycleEvent,
  initializeMobilePreview,
  checkMobilePreviewEligibility,
  checkMobilePreviewSafety,
  allowMobilePreview,
  blockMobilePreview,
  recommendDesktopForMobilePreview,
  registerMobilePreviewLinkLifecycle,
  markMobilePreviewPending,
  markMobilePreviewReady,
  completeMobilePreview,
} from './mobile-preview-lifecycle.js';
import { setMobilePreviewState } from './mobile-preview-state-manager.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import { validateMobilePreviewRegistration, validateMobilePreviewRecord } from './mobile-preview-validator.js';
import { updateMobilePreviewDiagnostics, getMobilePreviewDiagnostics } from './mobile-preview-diagnostics.js';
import { buildAllMobilePreviewReports, composeMobilePreviewResponse } from './mobile-preview-report-builder.js';
import type {
  MobilePreviewSession,
  MobilePreviewCategory,
  MobilePreviewValidationResult,
  PrepareMobilePreviewRuntimeFoundationInput,
  PrepareMobilePreviewRuntimeFoundationResult,
  RegisterMobilePreviewInput,
  RegisterMobilePreviewResult,
  MobilePreviewLivePreviewLink,
} from './mobile-preview-types.js';
import {
  MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
  isDuplicateMobilePreviewExecutorQuestion,
} from './mobile-preview-types.js';

const BOOTSTRAP_MOBILE_PREVIEWS: Array<{
  chatNameMatch: string;
  previewName: string;
  type: MobilePreviewCategory;
  description: string;
}> = [
  {
    chatNameMatch: 'General Mobile Chat',
    previewName: 'General Mobile Preview',
    type: 'GENERAL_MOBILE_PREVIEW',
    description: 'General mobile preview authority',
  },
  {
    chatNameMatch: 'Project Mobile Chat',
    previewName: 'Project Mobile Preview',
    type: 'PROJECT_MOBILE_PREVIEW',
    description: 'Project mobile preview authority',
  },
  {
    chatNameMatch: 'World 2 Mobile Chat',
    previewName: 'World 2 Mobile Preview',
    type: 'WORLD2_MOBILE_PREVIEW',
    description: 'World 2 mobile preview authority',
  },
  {
    chatNameMatch: 'AiDev Mobile Chat',
    previewName: 'AiDev Mobile Preview',
    type: 'AIDEV_MOBILE_PREVIEW',
    description: 'AiDev mobile preview authority',
  },
  {
    chatNameMatch: 'Autonomous Mobile Chat',
    previewName: 'Autonomous Mobile Preview',
    type: 'AUTONOMOUS_MOBILE_PREVIEW',
    description: 'Autonomous mobile preview authority',
  },
  {
    chatNameMatch: 'Founder Mobile Chat',
    previewName: 'Founder Mobile Preview',
    type: 'FOUNDER_MOBILE_PREVIEW',
    description: 'Founder mobile preview authority',
  },
  {
    chatNameMatch: 'Verification Mobile Chat',
    previewName: 'Verification Mobile Preview',
    type: 'VERIFICATION_MOBILE_PREVIEW',
    description: 'Verification mobile preview authority',
  },
  {
    chatNameMatch: 'Monitoring Mobile Chat',
    previewName: 'Monitoring Mobile Preview',
    type: 'LIVE_PREVIEW_MOBILE_PREVIEW',
    description: 'Live preview mobile preview authority',
  },
  {
    chatNameMatch: 'App Build Mobile Chat',
    previewName: 'App Build Mobile Preview',
    type: 'BUILD_MOBILE_PREVIEW',
    description: 'Build mobile preview authority',
  },
];

let bootstrapped = false;

export function resetMobilePreviewBootstrapForTests(): void {
  bootstrapped = false;
}

function ensureUpstreamAuthorities(): void {
  processCloudRuntimeRequest('Show cloud runtime inventory');
  processMobileCommandRequest('Show mobile command inventory');
  processMobileChatRequest('Show mobile chat inventory');
}

function linkMobilePreviewToLivePreview(
  mobilePreviewId: string,
  livePreviewSessionId: string,
): MobilePreviewLivePreviewLink | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return null;

  const liveSession = listPreviewSessions().find((p) => p.previewSessionId === livePreviewSessionId);
  const mismatch = !liveSession || liveSession.projectId !== session.mobilePreviewOwner.projectId;

  const link: MobilePreviewLivePreviewLink = {
    livePreviewSessionId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewLivePreviewLink: link,
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'LIVE_PREVIEW',
    summary: `Linked to live preview ${livePreviewSessionId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: livePreviewSessionId,
  });

  return link;
}

function resolveLinksFromChat(chatNameMatch: string): {
  mobileChatSessionId: string;
  mobileCommandSessionId: string;
  workspaceId: string;
  runtimeId: string;
  persistentBuildId: string;
  verificationId: string;
  projectId: string;
} | null {
  const chat =
    listMobileChatSessionsAll().find((c) => c.mobileChatMetadata.chatName === chatNameMatch) ??
    listMobileChatSessionsAll().find((c) => c.mobileChatMetadata.chatName.includes(chatNameMatch.replace(' Chat', '')));
  if (!chat) return null;
  return {
    mobileChatSessionId: chat.mobileChatId,
    mobileCommandSessionId: chat.mobileChatOwner.mobileCommandSessionId,
    workspaceId: chat.mobileChatOwner.workspaceId,
    runtimeId: chat.mobileChatOwner.runtimeId,
    persistentBuildId: chat.mobileChatOwner.persistentBuildId,
    verificationId: chat.mobileChatOwner.verificationId,
    projectId: chat.mobileChatOwner.projectId,
  };
}

function bootstrapMobilePreviews(projectId: string): void {
  if (bootstrapped) return;
  ensureUpstreamAuthorities();
  processLivePreviewRequest('Show live preview inventory');

  for (const seed of BOOTSTRAP_MOBILE_PREVIEWS) {
    const links = resolveLinksFromChat(seed.chatNameMatch);
    if (!links) continue;
    registerMobilePreviewSession({
      previewName: seed.previewName,
      mobilePreviewType: seed.type,
      projectId: links.projectId || projectId,
      mobileCommandSessionId: links.mobileCommandSessionId,
      mobileChatSessionId: links.mobileChatSessionId,
      workspaceId: links.workspaceId,
      runtimeId: links.runtimeId,
      persistentBuildId: links.persistentBuildId,
      verificationId: links.verificationId,
      previewDescription: seed.description,
      allowDuplicate: true,
      query: 'bootstrap',
    });
  }
  bootstrapped = true;
}

export function registerMobilePreviewSession(input: RegisterMobilePreviewInput): RegisterMobilePreviewResult {
  const previewType = input.mobilePreviewType ?? 'GENERAL_MOBILE_PREVIEW';
  const existing = listStoredMobilePreviewSessions().find(
    (s) =>
      s.mobilePreviewMetadata.previewName === input.previewName &&
      s.mobilePreviewOwner.projectId === input.projectId &&
      s.mobilePreviewOwner.mobileChatSessionId === input.mobileChatSessionId &&
      s.mobilePreviewType === previewType,
  );
  if (existing && !input.allowDuplicate) {
    return { session: existing, duplicate: true, duplicateRisks: [], blocked: false };
  }

  const validation = validateMobilePreviewRegistration(input);
  if (!validation.valid) {
    return { session: null, duplicate: false, duplicateRisks: validation.duplicateRisks, blocked: true };
  }

  const now = Date.now();
  const mobilePreviewId = nextMobilePreviewId();
  const ownership = buildMobilePreviewOwnership({
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    createdBy: input.createdBy,
  });

  const livePreviewSessionId =
    listPreviewSessions().find((p) => p.projectId === input.projectId)?.previewSessionId ??
    `lp-companion-${input.mobileChatSessionId}`;

  const session: MobilePreviewSession = {
    mobilePreviewId,
    mobilePreviewType: previewType,
    mobilePreviewOwner: ownership,
    mobilePreviewState: 'CREATED',
    mobilePreviewStatus: 'UNKNOWN',
    mobilePreviewMetadata: {
      previewName: input.previewName,
      previewDescription: input.previewDescription ?? '',
      tags: [previewType],
      monitorable: true,
    },
    mobilePreviewVisibility: input.visibility ?? 'PROJECT',
    mobilePreviewProvenance: {
      sourceSystem: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      registeredBy: input.createdBy ?? MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      registrationQuery: input.query ?? null,
    },
    mobilePreviewContext: buildDefaultMobilePreviewContext({
      projectId: input.projectId,
      mobileCommandSessionId: input.mobileCommandSessionId,
      mobileChatSessionId: input.mobileChatSessionId,
      runtimeId: input.runtimeId,
      workspaceId: input.workspaceId,
      persistentBuildId: input.persistentBuildId,
      verificationId: input.verificationId,
      mobilePreviewType: previewType,
    }),
    mobilePreviewEligibility: null,
    mobilePreviewSafety: null,
    mobilePreviewDevicePolicy: null,
    mobilePreviewDesktopRecommendations: [],
    mobilePreviewLinks: [],
    mobilePreviewCommandLink: {
      mobileCommandId: input.mobileCommandSessionId,
      linkedAt: now,
      linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobilePreviewChatLink: {
      mobileChatId: input.mobileChatSessionId,
      linkedAt: now,
      linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobilePreviewCloudLink: {
      runtimeId: input.runtimeId,
      linkedAt: now,
      linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobilePreviewWorkspaceLink: {
      workspaceId: input.workspaceId,
      linkedAt: now,
      linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobilePreviewBuildLink: {
      persistentBuildId: input.persistentBuildId,
      linkedAt: now,
      linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobilePreviewVerificationLink: {
      verificationId: input.verificationId,
      linkedAt: now,
      linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobilePreviewLivePreviewLink: {
      livePreviewSessionId,
      linkedAt: now,
      linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    mobilePreviewOperatorFeedLink: {
      feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
      linkedAt: now,
      linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
      mismatchDetected: false,
    },
    createdAt: now,
    updatedAt: now,
  };

  storeMobilePreviewSession(session);
  recordMobilePreviewLifecycleEvent(mobilePreviewId, 'MOBILE_PREVIEW_CREATED', `Registered ${input.previewName}`);
  linkMobilePreviewToCommandSession(mobilePreviewId, input.mobileCommandSessionId);
  linkMobilePreviewToChatSession(mobilePreviewId, input.mobileChatSessionId);
  linkMobilePreviewToCloud(mobilePreviewId, input.runtimeId);
  linkMobilePreviewToWorkspace(mobilePreviewId, input.workspaceId);
  linkMobilePreviewToBuild(mobilePreviewId, input.persistentBuildId);
  linkMobilePreviewToVerification(mobilePreviewId, input.verificationId);
  linkMobilePreviewToLivePreview(mobilePreviewId, livePreviewSessionId);
  linkMobilePreviewToOperatorFeed(mobilePreviewId);
  recordMobilePreviewOwnershipHistory(mobilePreviewId, `Ownership assigned to ${ownership.ownerModule}`);
  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'MOBILE_PREVIEW',
    summary: `Mobile preview ${mobilePreviewId} registered: ${input.previewName}`,
    scopeUsed: input.projectId,
  });

  return {
    session: getStoredMobilePreviewSession(mobilePreviewId),
    duplicate: false,
    duplicateRisks: validation.duplicateRisks,
    blocked: false,
  };
}

export function getMobilePreviewSession(mobilePreviewId: string): MobilePreviewSession | null {
  return getStoredMobilePreviewSession(mobilePreviewId);
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareMobilePreviewRuntimeFoundationInput> = {},
): PrepareMobilePreviewRuntimeFoundationInput {
  ensureUpstreamAuthorities();
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('mobile_preview_runtime_foundation');
  const chat = listMobileChatSessionsAll()[0];
  const command = listMobileCommandSessionsAll()[0];
  const build = listPersistentBuilds()[0];

  return {
    query,
    projectId: project.projectId,
    mobileCommandSessionId: chat?.mobileChatOwner.mobileCommandSessionId ?? command?.mobileCommandId ?? 'mcmd-0001',
    mobileChatSessionId: chat?.mobileChatId ?? 'mchat-0001',
    runtimeId:
      chat?.mobileChatOwner.runtimeId ?? command?.mobileCommandOwner.runtimeId ?? listRuntimes()[0]?.runtimeId ?? 'crrt-0001',
    workspaceId:
      chat?.mobileChatOwner.workspaceId ?? command?.mobileCommandOwner.workspaceId ?? build?.buildOwner.workspaceId ?? 'hws-0001',
    persistentBuildId:
      chat?.mobileChatOwner.persistentBuildId ?? command?.mobileCommandOwner.persistentBuildId ?? build?.buildId ?? 'pbuild-0001',
    verificationId:
      chat?.mobileChatOwner.verificationId ??
      command?.mobileCommandOwner.verificationId ??
      listCloudVerifications()[0]?.verificationId ??
      'cver-0001',
    previewName: 'DevPulse Mobile Preview',
    mobilePreviewType: 'GENERAL_MOBILE_PREVIEW',
    projectExists: project.projectId !== 'none',
    commandSessionExists: listMobileCommandSessionsAll().length > 0,
    chatSessionExists: listMobileChatSessionsAll().length > 0,
    runtimeExists: listRuntimes().length > 0,
    workspaceExists: listWorkspaces().length > 0,
    persistentBuildExists: listPersistentBuilds().length > 0,
    verificationExists: listCloudVerifications().length > 0,
    ownershipValid: owner.ownerModule === MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    ...overrides,
  };
}

function orchestrateMobilePreviewPipeline(mobilePreviewId: string): MobilePreviewSession | null {
  initializeMobilePreview(mobilePreviewId);
  setMobilePreviewState(mobilePreviewId, 'READY', true);

  refreshMobilePreviewContext(mobilePreviewId);
  getMobilePreviewDevicePolicy(mobilePreviewId);

  const eligibility = evaluateMobilePreviewEligibility(mobilePreviewId);
  checkMobilePreviewEligibility(mobilePreviewId, eligibility?.eligibilityReason ?? 'Eligibility evaluated');

  const safety = evaluateMobilePreviewSafety(mobilePreviewId);
  checkMobilePreviewSafety(mobilePreviewId, safety?.reason ?? 'Safety evaluated');

  let desktopRecommended = false;

  if (eligibility?.mobilePreviewAllowed && safety?.safeToPreviewOnMobile) {
    allowMobilePreview(mobilePreviewId);
  } else if (
    eligibility?.desktopRecommended ||
    safety?.desktopRequired ||
    eligibility?.result === 'DESKTOP_RECOMMENDED'
  ) {
    desktopRecommended = true;
    recommendDesktopForMobilePreview(
      mobilePreviewId,
      eligibility?.eligibilityReason ?? safety?.reason ?? 'Desktop recommended for preview scope',
    );
    registerDesktopRecommendation({ mobilePreviewId });
  } else {
    blockMobilePreview(
      mobilePreviewId,
      eligibility?.mobilePreviewBlockedReason ?? safety?.reason ?? 'Mobile preview blocked by authority',
    );
  }

  if (!desktopRecommended) {
    registerDesktopRecommendation({ mobilePreviewId });
  }

  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return null;

  registerPreviewLink({
    mobilePreviewId,
    urlMetadata: `metadata://${mobilePreviewId}/preview-link`,
    linkType: 'METADATA_PREVIEW_LINK',
    previewTarget: session.mobilePreviewMetadata.previewName,
    previewType: session.mobilePreviewType,
  });
  registerMobilePreviewLinkLifecycle(mobilePreviewId);
  markMobilePreviewPending(mobilePreviewId);
  markMobilePreviewReady(mobilePreviewId);

  return getStoredMobilePreviewSession(mobilePreviewId);
}

export function prepareMobilePreviewRuntimeFoundation(
  input: PrepareMobilePreviewRuntimeFoundationInput,
): PrepareMobilePreviewRuntimeFoundationResult {
  const query = input.query ?? 'Show mobile preview inventory';

  if (isDuplicateMobilePreviewExecutorQuestion(query)) {
    publishMobilePreviewFeedStages(query, false);
    updateMobilePreviewDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllMobilePreviewReports(),
      diagnostics: getMobilePreviewDiagnostics(),
      validation: {
        valid: false,
        blockers: ['Duplicate mobile preview executor rejected'],
        warnings: [],
        duplicateRisks: [],
      },
      responseText:
        'Recommendation: No.\nDo not create mobile_preview_executor or parallel mobile preview authorities.',
      authorityOnly: true,
    };
  }

  if (
    !input.projectExists ||
    !input.commandSessionExists ||
    !input.chatSessionExists ||
    !input.runtimeExists ||
    !input.workspaceExists ||
    !input.persistentBuildExists ||
    !input.verificationExists
  ) {
    publishMobilePreviewFeedStages(query, false);
    updateMobilePreviewDiagnostics(query, 'FAILED');
    return {
      session: null,
      trackedSession: null,
      reports: buildAllMobilePreviewReports(),
      diagnostics: getMobilePreviewDiagnostics(),
      validation: { valid: false, blockers: ['Missing upstream links'], warnings: [], duplicateRisks: [] },
      responseText: composeMobilePreviewResponse(query, null, null, buildAllMobilePreviewReports(), true),
      authorityOnly: true,
    };
  }

  bootstrapMobilePreviews(input.projectId);

  const registration = registerMobilePreviewSession({
    previewName: input.previewName ?? 'DevPulse Mobile Preview',
    mobilePreviewType: input.mobilePreviewType ?? 'GENERAL_MOBILE_PREVIEW',
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    mobileChatSessionId: input.mobileChatSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    previewDescription: 'Mobile preview authority session',
    query,
    allowDuplicate: input.forceDuplicate === true,
  });

  let session = registration.session;
  let validation: MobilePreviewValidationResult = {
    valid: !registration.blocked && session !== null,
    blockers: registration.blocked ? ['Registration blocked'] : [],
    warnings: registration.duplicateRisks,
    duplicateRisks: registration.duplicateRisks,
  };

  if (registration.duplicate && session) {
    validation.warnings.push(`Using existing mobile preview session: ${session.mobilePreviewId}`);
  }

  let desktopRecommended = false;
  let blockedByPipeline = false;

  if (session && !registration.blocked && !registration.duplicate) {
    session = orchestrateMobilePreviewPipeline(session.mobilePreviewId);
    desktopRecommended =
      session?.mobilePreviewState === 'DESKTOP_RECOMMENDED' ||
      session?.mobilePreviewEligibility?.desktopRecommended === true;
    blockedByPipeline = session?.mobilePreviewState === 'MOBILE_PREVIEW_BLOCKED';
  } else if (session && !registration.blocked && registration.duplicate) {
    desktopRecommended = session.mobilePreviewEligibility?.desktopRecommended === true;
    blockedByPipeline = session.mobilePreviewState === 'MOBILE_PREVIEW_BLOCKED';
  }

  const trackedSession = session
    ? createTrackedMobilePreviewSession({
        mobilePreviewId: session.mobilePreviewId,
        projectId: input.projectId,
        mobileCommandSessionId: input.mobileCommandSessionId,
        mobileChatSessionId: input.mobileChatSessionId,
        runtimeId: input.runtimeId,
        workspaceId: input.workspaceId,
        persistentBuildId: input.persistentBuildId,
        verificationId: input.verificationId,
      })
    : null;

  if (session && trackedSession && !registration.duplicate) {
    completeMobilePreview(session.mobilePreviewId);
    session = getStoredMobilePreviewSession(session.mobilePreviewId);
    validation = validateMobilePreviewRecord(session);
  }

  const blocked = !validation.valid || registration.blocked || blockedByPipeline;
  const reports = buildAllMobilePreviewReports();
  const finalState = session?.mobilePreviewState ?? (blocked ? 'FAILED' : 'COMPLETED');

  publishMobilePreviewFeedStages(query, !blocked, session?.mobilePreviewId, blocked, desktopRecommended);
  if (session) linkMobilePreviewToOperatorFeed(session.mobilePreviewId);
  updateMobilePreviewDiagnostics(query, finalState, registration.duplicateRisks.length);

  return {
    session,
    trackedSession,
    reports,
    diagnostics: getMobilePreviewDiagnostics(),
    validation,
    responseText: composeMobilePreviewResponse(query, session, trackedSession, reports, blocked),
    authorityOnly: true,
  };
}

export function processMobilePreviewRequest(query: string): PrepareMobilePreviewRuntimeFoundationResult {
  return prepareMobilePreviewRuntimeFoundation(resolveInputFromQuery(query));
}

export function getMobilePreviewContext(query: string): PrepareMobilePreviewRuntimeFoundationResult {
  return processMobilePreviewRequest(query);
}
