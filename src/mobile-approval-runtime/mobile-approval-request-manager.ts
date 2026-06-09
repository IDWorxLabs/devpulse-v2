/**
 * Mobile Approval Runtime Foundation — approval request manager (metadata only).
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getRuntime } from '../cloud-runtime/index.js';
import { getWorkspace } from '../workspace-hosting/index.js';
import { getPersistentBuild } from '../persistent-build-runtime/index.js';
import { getDevPulseV2MobileApprovalFlowFoundation } from '../mobile-approval-flow-foundation/index.js';
import {
  getStoredMobileApprovalSession,
  storeMobileApprovalSession,
  nextMobileApprovalRequestId,
  storeMobileApprovalRequest,
  getStoredMobileApprovalRequest,
  listStoredMobileApprovalRequests,
  listStoredMobileApprovalRequestsForSession,
  resetMobileApprovalRequestCounterForTests,
} from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import {
  registerMobileApprovalRequestLifecycle,
  waitForMobileApprovalDecision,
} from './mobile-approval-lifecycle.js';
import type {
  MobileApprovalCategory,
  MobileApprovalRequest,
  MobileApprovalRequestResult,
  MobileApprovalRiskLevel,
  MobileApprovalUrgency,
} from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function resetMobileApprovalRequestManagerForTests(): void {
  resetMobileApprovalRequestCounterForTests();
}

export function registerApprovalRequest(input: {
  mobileApprovalId: string;
  requestTitle: string;
  requestSummary: string;
  requestCategory?: MobileApprovalCategory;
  requestedBy?: string;
  targetAction?: string;
  targetSystem?: string;
  riskLevel?: MobileApprovalRiskLevel;
  urgency?: MobileApprovalUrgency;
}): MobileApprovalRequest | null {
  const session = getStoredMobileApprovalSession(input.mobileApprovalId);
  if (!session) return null;
  if (!input.requestTitle?.trim() || !input.requestSummary?.trim()) return null;

  const owner = session.mobileApprovalOwner;
  const command = getMobileCommandSession(owner.mobileCommandSessionId);
  const chat = getMobileChatSession(owner.mobileChatSessionId);
  const preview = getMobilePreviewSession(owner.mobilePreviewSessionId);
  const runtime = getRuntime(owner.runtimeId);
  const workspace = getWorkspace(owner.workspaceId);
  const build = getPersistentBuild(owner.persistentBuildId);
  const flowFoundation = getDevPulseV2MobileApprovalFlowFoundation();

  const commandSessionPresent = command !== null;
  const chatSessionPresent = chat !== null;
  const previewSessionPresent = preview !== null;
  const runtimePresent = runtime !== null;
  const workspacePresent = workspace !== null;
  const buildPresent = build !== null;
  const flowFoundationPresent = flowFoundation.getFoundationState().foundationId.length > 0;
  const contextPresent =
    commandSessionPresent &&
    chatSessionPresent &&
    previewSessionPresent &&
    runtimePresent &&
    workspacePresent &&
    buildPresent;

  const category = input.requestCategory ?? session.mobileApprovalType;
  const requiresFounderDecision =
    category === 'FOUNDER_APPROVAL' || category === 'SELF_EVOLUTION_APPROVAL' || category === 'AUTONOMOUS_APPROVAL';
  const requiresMoreContext = !contextPresent;

  const duplicate = session.mobileApprovalRequests.some(
    (r) => r.requestTitle === input.requestTitle.trim() && r.targetAction === (input.targetAction ?? 'GENERAL_ACTION'),
  );

  const result = resolveRequestResult({
    duplicate,
    contextPresent,
    requiresFounderDecision,
    requiresMoreContext,
    category,
  });

  const request: MobileApprovalRequest = {
    requestId: nextMobileApprovalRequestId(),
    mobileApprovalId: input.mobileApprovalId,
    requestTitle: input.requestTitle.trim(),
    requestSummary: input.requestSummary.trim(),
    requestCategory: category,
    result,
    reason: buildRequestReason(result, contextPresent, duplicate),
    registeredAt: Date.now(),
    requestedBy: input.requestedBy ?? MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    targetAction: input.targetAction ?? 'GENERAL_ACTION',
    targetSystem: input.targetSystem ?? 'mobile_approval_runtime_foundation',
    riskLevel: input.riskLevel ?? 'MODERATE',
    urgency: input.urgency ?? 'ROUTINE',
    requiresFounderDecision,
    requiresMoreContext,
    contextPresent,
    commandSessionPresent,
    chatSessionPresent,
    previewSessionPresent,
    runtimePresent,
    workspacePresent,
    buildPresent,
    flowFoundationPresent,
    metadataOnly: true,
  };

  storeMobileApprovalRequest(request);
  storeMobileApprovalSession({
    ...session,
    mobileApprovalRequests: [...session.mobileApprovalRequests, request],
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId: input.mobileApprovalId,
    category: 'REQUEST',
    summary: `Approval request registered: ${request.requestId} — ${request.result}`,
    scopeUsed: request.requestId,
  });

  if (result === 'REGISTERED') {
    registerMobileApprovalRequestLifecycle(input.mobileApprovalId, request.requestSummary.slice(0, 80));
    waitForMobileApprovalDecision(input.mobileApprovalId, `Awaiting decision for ${request.requestId}`);
  }

  return request;
}

export function getApprovalRequest(requestId: string): MobileApprovalRequest | null {
  return getStoredMobileApprovalRequest(requestId);
}

export function listApprovalRequests(): MobileApprovalRequest[] {
  return listStoredMobileApprovalRequests();
}

export function listApprovalRequestsByApprovalSession(mobileApprovalId: string): MobileApprovalRequest[] {
  return listStoredMobileApprovalRequestsForSession(mobileApprovalId);
}

export function listApprovalRequestsByProject(projectId: string): MobileApprovalRequest[] {
  return listStoredMobileApprovalRequests().filter((request) => {
    const session = getStoredMobileApprovalSession(request.mobileApprovalId);
    return session?.mobileApprovalOwner.projectId === projectId;
  });
}

function resolveRequestResult(input: {
  duplicate: boolean;
  contextPresent: boolean;
  requiresFounderDecision: boolean;
  requiresMoreContext: boolean;
  category: MobileApprovalCategory;
}): MobileApprovalRequestResult {
  if (input.duplicate) return 'DUPLICATE';
  if (input.category === 'FOUNDER_APPROVAL') return 'FOUNDER_ONLY';
  if (input.requiresMoreContext) return 'CONTEXT_REQUIRED';
  if (input.requiresFounderDecision && !input.contextPresent) return 'BLOCKED';
  return 'REGISTERED';
}

function buildRequestReason(
  result: MobileApprovalRequestResult,
  contextPresent: boolean,
  duplicate: boolean,
): string {
  if (duplicate) return 'Duplicate approval request blocked — metadata only';
  if (result === 'FOUNDER_ONLY') return 'Founder-only approval category — decision metadata only';
  if (!contextPresent) return 'Upstream context incomplete — request metadata recorded without execution';
  if (result === 'BLOCKED') return 'Approval request blocked — authority prerequisites missing';
  return 'Approval request registered — awaiting governed decision metadata';
}
