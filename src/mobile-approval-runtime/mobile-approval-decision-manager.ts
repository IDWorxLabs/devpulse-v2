/**
 * Mobile Approval Runtime Foundation — approval decision manager (metadata only).
 */

import {
  getStoredMobileApprovalSession,
  storeMobileApprovalSession,
  getStoredMobileApprovalRequest,
  nextMobileApprovalDecisionId,
  storeMobileApprovalDecision,
  getStoredMobileApprovalDecision,
  listStoredMobileApprovalDecisions,
  listStoredMobileApprovalDecisionsForSession,
  resetMobileApprovalDecisionCounterForTests,
} from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import {
  recordMobileApprovalDecisionLifecycle,
  approveMobileApproval,
  rejectMobileApproval,
} from './mobile-approval-lifecycle.js';
import type { MobileApprovalDecision, MobileApprovalDecisionType } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export interface MobileApprovalDecisionEvaluation {
  decisionId: string | null;
  requestId: string;
  mobileApprovalId: string;
  decisionType: MobileApprovalDecisionType;
  evaluationSummary: string;
  founderOnlyDecision: boolean;
  requiresMoreContext: boolean;
  expiredDecision: boolean;
  authorityOnly: true;
  executionPerformed: false;
  routingSummary: string;
}

export function resetMobileApprovalDecisionManagerForTests(): void {
  resetMobileApprovalDecisionCounterForTests();
}

export function recordApprovalDecision(input: {
  mobileApprovalId: string;
  requestId: string;
  decisionType: MobileApprovalDecisionType;
  reason?: string;
  recordedBy?: string;
}): MobileApprovalDecision | null {
  const session = getStoredMobileApprovalSession(input.mobileApprovalId);
  if (!session) return null;

  const request = getStoredMobileApprovalRequest(input.requestId);
  if (!request || request.mobileApprovalId !== input.mobileApprovalId) return null;

  const evaluation = evaluateApprovalDecision({
    mobileApprovalId: input.mobileApprovalId,
    requestId: input.requestId,
    decisionType: input.decisionType,
  });

  const decision: MobileApprovalDecision = {
    decisionId: nextMobileApprovalDecisionId(),
    mobileApprovalId: input.mobileApprovalId,
    requestId: input.requestId,
    decisionType: input.decisionType,
    reason: input.reason ?? evaluation.evaluationSummary,
    recordedAt: Date.now(),
    recordedBy: input.recordedBy ?? MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    sourceModule: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    founderOnlyDecision: evaluation.founderOnlyDecision,
    requiresMoreContext: evaluation.requiresMoreContext,
    expiredDecision: evaluation.expiredDecision,
    authorityOnly: true,
    executionPerformed: false,
  };

  storeMobileApprovalDecision(decision);
  storeMobileApprovalSession({
    ...session,
    mobileApprovalDecisions: [...session.mobileApprovalDecisions, decision],
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId: input.mobileApprovalId,
    category: 'DECISION',
    summary: `Approval decision recorded: ${decision.decisionId} — ${decision.decisionType}`,
    scopeUsed: decision.decisionId,
  });

  recordMobileApprovalDecisionLifecycle(input.mobileApprovalId, decision.reason.slice(0, 80));

  if (decision.decisionType === 'APPROVED') {
    approveMobileApproval(input.mobileApprovalId);
  } else if (decision.decisionType === 'REJECTED') {
    rejectMobileApproval(input.mobileApprovalId, decision.reason);
  }

  return decision;
}

export function getApprovalDecision(decisionId: string): MobileApprovalDecision | null {
  return getStoredMobileApprovalDecision(decisionId);
}

export function listApprovalDecisions(): MobileApprovalDecision[] {
  return listStoredMobileApprovalDecisions();
}

export function listDecisionsByApprovalSession(mobileApprovalId: string): MobileApprovalDecision[] {
  return listStoredMobileApprovalDecisionsForSession(mobileApprovalId);
}

export function evaluateApprovalDecision(input: {
  mobileApprovalId: string;
  requestId: string;
  decisionType: MobileApprovalDecisionType;
}): MobileApprovalDecisionEvaluation {
  const session = getStoredMobileApprovalSession(input.mobileApprovalId);
  const request = getStoredMobileApprovalRequest(input.requestId);

  const founderOnlyDecision =
    input.decisionType === 'FOUNDER_ONLY' ||
    request?.requiresFounderDecision === true ||
    session?.mobileApprovalType === 'FOUNDER_APPROVAL';
  const requiresMoreContext =
    input.decisionType === 'REQUIRES_MORE_CONTEXT' || request?.requiresMoreContext === true;
  const expiredDecision = input.decisionType === 'EXPIRED';

  const routingSummary = routeDecisionMetadata(input.decisionType);
  const evaluationSummary = buildEvaluationSummary({
    decisionType: input.decisionType,
    founderOnlyDecision,
    requiresMoreContext,
    expiredDecision,
    requestPresent: request !== null,
    sessionPresent: session !== null,
  });

  return {
    decisionId: null,
    requestId: input.requestId,
    mobileApprovalId: input.mobileApprovalId,
    decisionType: input.decisionType,
    evaluationSummary,
    founderOnlyDecision,
    requiresMoreContext,
    expiredDecision,
    authorityOnly: true,
    executionPerformed: false,
    routingSummary,
  };
}

function routeDecisionMetadata(decisionType: MobileApprovalDecisionType): string {
  switch (decisionType) {
    case 'APPROVED':
      return 'Record approval metadata and defer execution to governed systems';
    case 'REJECTED':
      return 'Record rejection metadata — no execution performed';
    case 'PENDING':
      return 'Decision pending — authority holds request metadata only';
    case 'EXPIRED':
      return 'Decision expired — request metadata retained without execution';
    case 'REQUIRES_MORE_CONTEXT':
      return 'More context required — decision metadata deferred';
    case 'FOUNDER_ONLY':
      return 'Founder decision required — runtime records metadata only';
    default:
      return 'Unknown decision routing — metadata only';
  }
}

function buildEvaluationSummary(input: {
  decisionType: MobileApprovalDecisionType;
  founderOnlyDecision: boolean;
  requiresMoreContext: boolean;
  expiredDecision: boolean;
  requestPresent: boolean;
  sessionPresent: boolean;
}): string {
  if (!input.sessionPresent) return 'Mobile approval session missing — decision metadata cannot be finalized';
  if (!input.requestPresent) return 'Approval request missing — decision metadata cannot be finalized';
  if (input.expiredDecision) return 'Decision expired — authority metadata retained, no execution';
  if (input.requiresMoreContext) return 'Additional context required before governed decision metadata is final';
  if (input.founderOnlyDecision) return 'Founder-only decision path — metadata recorded without execution';
  return `Decision ${input.decisionType} evaluated — authority only, no execution performed`;
}
