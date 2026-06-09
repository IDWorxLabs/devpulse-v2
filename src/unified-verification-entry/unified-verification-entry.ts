/**
 * Unified Verification Entry Point — Phase 16.12 orchestrator.
 * Single verification authority surface — no provider execution.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { listEvidence } from '../verification-evidence-engine/index.js';
import { listReports } from '../verification-reporting-engine/index.js';
import { publishUnifiedVerificationFeedStages } from '../operator-feed/unified-verification-feed-bridge.js';
import { routeVerificationRequest } from './verification-request-router.js';
import { buildVerificationScope } from './verification-scope-builder.js';
import { buildVerificationContext } from './verification-context-builder.js';
import {
  buildVerificationSession,
  getVerificationSession,
  listVerificationSessions,
  updateVerificationSessionState,
} from './verification-session-builder.js';
import {
  advanceVerificationState,
  deriveFinalState,
  getVerificationState,
  resetVerificationStateForTests,
  setVerificationState,
} from './verification-state-manager.js';
import {
  getVerificationHistory,
  recordVerificationHistory,
  resetVerificationEntryHistoryForTests,
} from './verification-history-manager.js';
import { buildVerificationResponse } from './verification-response-builder.js';
import {
  evaluateEntryGates,
  validateVerificationEntry,
} from './verification-entry-validator.js';
import {
  getVerificationEntryDiagnostics,
  updateVerificationEntryDiagnostics,
} from './verification-entry-diagnostics.js';
import { buildVerificationEntryReport } from './verification-entry-report.js';
import {
  inferRequestType,
  isDuplicateUnifiedVerificationQuestion,
  type RequestVerificationInput,
  type VerificationAuthorityResult,
  type VerificationAuthorityState,
  type VerificationRequest,
  type VerificationResponse,
} from './unified-verification-types.js';

const requests = new Map<string, VerificationRequest>();
const requestIdSet = new Set<string>();

let requestCounter = 0;
let authorityCounter = 0;
let lastResponse: VerificationResponse | null = null;

export function resetVerificationRequestsForTests(): void {
  requests.clear();
  requestIdSet.clear();
  requestCounter = 0;
  authorityCounter = 0;
  lastResponse = null;
}

export function resetUnifiedVerificationEntryForTests(): void {
  resetVerificationRequestsForTests();
  resetVerificationStateForTests();
  resetVerificationEntryHistoryForTests();
}

function nextRequestId(): string {
  requestCounter += 1;
  return `vreq-${requestCounter.toString().padStart(4, '0')}`;
}

function nextAuthorityId(): string {
  authorityCounter += 1;
  return `uventauth-${authorityCounter.toString().padStart(4, '0')}`;
}

function resolveInput(
  input: RequestVerificationInput = {},
): RequestVerificationInput {
  const query = input.query ?? 'Request verification';
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('unified_verification_entry');

  return {
    query,
    requestType: input.requestType ?? inferRequestType(query),
    projectId: input.projectId ?? project.projectId,
    workspaceId: input.workspaceId ?? project.workspaceId,
    projectExists: input.projectExists ?? project.projectId !== 'none',
    workspaceExists: input.workspaceExists ?? project.workspaceId !== 'none',
    world1Protected: input.world1Protected ?? true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_unified_verification_entry',
    requestedBy: input.requestedBy ?? 'unified_verification_entry',
    ...input,
  };
}

function buildOwnership(input: RequestVerificationInput) {
  return {
    ownerModule: 'devpulse_v2_unified_verification_entry',
    ownerDomain: 'unified_verification_entry',
    requestedBy: input.requestedBy ?? 'unified_verification_entry',
    projectId: input.projectId ?? 'none',
    workspaceId: input.workspaceId ?? 'none',
  };
}

export function listVerificationRequests(): VerificationRequest[] {
  return [...requests.values()];
}

export function getVerificationReports(): ReturnType<typeof listReports> {
  return listReports();
}

export function getVerificationEvidence(): ReturnType<typeof listEvidence> {
  return listEvidence();
}

export function getVerificationDiagnostics(): ReturnType<typeof getVerificationEntryDiagnostics> {
  return getVerificationEntryDiagnostics();
}

export function requestVerification(input: RequestVerificationInput = {}): VerificationAuthorityResult {
  const resolved = resolveInput(input);
  const query = resolved.query ?? 'Request verification';

  if (isDuplicateUnifiedVerificationQuestion(query)) {
    const blocked: VerificationAuthorityResult = {
      authorityId: nextAuthorityId(),
      authorityState: 'BLOCKED',
      response: lastResponse ?? ({} as VerificationResponse),
      validationValid: false,
      blockedReasons: ['Duplicate engine rejected — use unified_verification_entry only'],
    };
    publishUnifiedVerificationFeedStages(query, false);
    return blocked;
  }

  const requestId = nextRequestId();
  if (requestIdSet.has(requestId)) {
    return {
      authorityId: nextAuthorityId(),
      authorityState: 'BLOCKED',
      response: lastResponse ?? ({} as VerificationResponse),
      validationValid: false,
      blockedReasons: ['Duplicate request id rejected'],
    };
  }

  setVerificationState(requestId, 'REQUESTED');
  recordVerificationHistory({ requestId, sessionId: 'pending', event: 'REQUESTED', consumer: resolved.requestedBy });

  const routed = routeVerificationRequest(resolved);
  recordVerificationHistory({ requestId, sessionId: 'pending', event: 'ROUTED' });

  advanceVerificationState(requestId, 'REQUESTED', 'PREPARING');

  const context = buildVerificationContext(routed);
  const scope = buildVerificationScope(resolved, resolved.requestType!, context.targets);
  recordVerificationHistory({ requestId, sessionId: 'pending', event: 'SCOPE_BUILT', scopeType: scope.scopeType });
  recordVerificationHistory({ requestId, sessionId: 'pending', event: 'CONTEXT_BUILT', scopeType: scope.scopeType });

  const ownership = buildOwnership(resolved);
  const session = buildVerificationSession({
    requestId,
    sessionType: resolved.requestType!,
    state: 'PREPARING',
    metadata: { scopeType: scope.scopeType },
  });
  recordVerificationHistory({ requestId, sessionId: session.sessionId, event: 'SESSION_CREATED', scopeType: scope.scopeType });

  const request: VerificationRequest = {
    requestId,
    requestType: resolved.requestType!,
    query,
    scope,
    ownership,
    state: 'PREPARING',
    sessionId: session.sessionId,
    createdAt: Date.now(),
    metadata: { scopeType: scope.scopeType },
    authorityOnly: true,
  };
  requests.set(requestId, request);
  requestIdSet.add(requestId);

  const gateReport = evaluateEntryGates(resolved);
  const blocked = gateReport.blockers.length > 0;

  const finalState = blocked
    ? 'FAILED'
    : deriveFinalState({
        blocked,
        evidenceCount: context.evidenceCount,
        reportCount: context.reportCount,
      });

  setVerificationState(requestId, finalState);
  updateVerificationSessionState(session.sessionId, finalState);
  request.state = finalState;

  const knownEvidenceIds = new Set(routed.evidence.evidenceRecords.map((e) => e.evidenceId));
  const knownReportIds = new Set(routed.reporting.reports.map((r) => r.reportId));

  const provisionalValidation = validateVerificationEntry({
    request,
    session: { ...session, state: finalState },
    response: {
      evidenceReferences: routed.evidence.evidenceRecords.map((e) => e.evidenceId),
      reportReferences: routed.reporting.reports.map((r) => r.reportId),
    } as VerificationResponse,
    knownEvidenceIds,
    knownReportIds,
  });

  const response = buildVerificationResponse({
    query,
    request,
    scope,
    context,
    session: { ...session, state: finalState },
    state: finalState,
    routed,
    validation: provisionalValidation,
    ownership,
  });

  const validation = validateVerificationEntry({
    request,
    session: { ...session, state: finalState },
    response,
    knownEvidenceIds,
    knownReportIds,
  });
  response.diagnostics = {
    issueCount: validation.issues.length,
    warnings: validation.warnings,
    issues: validation.issues.map((i) => ({ code: i.code, message: i.message, severity: i.severity })),
  };

  recordVerificationHistory({ requestId, sessionId: session.sessionId, event: 'STATE_UPDATED', scopeType: scope.scopeType });
  recordVerificationHistory({ requestId, sessionId: session.sessionId, event: 'RESPONSE_GENERATED', consumer: resolved.requestedBy });
  if (finalState === 'COMPLETED') {
    recordVerificationHistory({ requestId, sessionId: session.sessionId, event: 'COMPLETED', consumer: resolved.requestedBy });
  }

  const authorityState: VerificationAuthorityState = blocked
    ? 'BLOCKED'
    : validation.valid
      ? 'READY'
      : 'INVALID';

  const authorityId = nextAuthorityId();
  const result: VerificationAuthorityResult = {
    authorityId,
    authorityState,
    response,
    validationValid: validation.valid && !blocked,
    blockedReasons: blocked ? gateReport.blockers : [],
  };

  buildVerificationEntryReport(result);
  lastResponse = response;

  publishUnifiedVerificationFeedStages(query, !blocked && validation.valid);

  updateVerificationEntryDiagnostics(
    query,
    authorityState,
    authorityId,
    requests.size,
    listVerificationSessions().length,
    getVerificationHistory().length,
  );

  return result;
}

export function processUnifiedVerificationRequest(query: string): VerificationAuthorityResult {
  return requestVerification({ query });
}

export function getUnifiedVerificationContext(query: string): VerificationAuthorityResult {
  return processUnifiedVerificationRequest(query);
}
