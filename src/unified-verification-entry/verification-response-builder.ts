/**
 * Verification response builder — unified authority response assembly.
 */

import type {
  RequestVerificationInput,
  VerificationChain,
  VerificationDiagnostics,
  VerificationOwnership,
  VerificationRequest,
  VerificationResponse,
  VerificationStateType,
} from './unified-verification-types.js';
import type { RoutedVerificationSubsystems } from './verification-request-router.js';
import type { VerificationContext } from './unified-verification-types.js';
import type { VerificationScope } from './unified-verification-types.js';
import type { VerificationSession } from './unified-verification-types.js';
import type { EntryValidationResult } from './verification-entry-validator.js';
import { getVerificationHistory } from './verification-history-manager.js';

export function composeVerificationResponseText(
  query: string,
  response: VerificationResponse,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Unified Verification Entry Response', ''];

  lines.push(`Request: ${response.request.requestId}`);
  lines.push(`Type: ${response.request.requestType}`);
  lines.push(`Scope: ${response.scope.scopeType}`);
  lines.push(`State: ${response.state}`);
  lines.push(`Session: ${response.session.sessionId}`);
  lines.push('');

  if (lower.includes('verified') || lower.includes('what should')) {
    lines.push('Targets:');
    for (const t of response.scope.targetIds.slice(0, 8)) lines.push(`• ${t}`);
  }

  if (lower.includes('evidence')) {
    lines.push(`Evidence references: ${response.evidenceReferences.length}`);
    for (const e of response.evidenceReferences.slice(0, 5)) lines.push(`• ${e}`);
  }

  if (lower.includes('report')) {
    lines.push(`Report references: ${response.reportReferences.length}`);
    for (const r of response.reportReferences.slice(0, 5)) lines.push(`• ${r}`);
  }

  if (lower.includes('history')) {
    lines.push('History:');
    for (const h of response.historyReferences.slice(0, 5)) lines.push(`• ${h}`);
  }

  if (lower.includes('state')) {
    lines.push(`Orchestration: ${response.context.orchestrationState}`);
    lines.push(`Blocked: ${response.context.blockedTargets.length}`);
  }

  lines.push('');
  lines.push('Authority only — use requestVerification(); no direct subsystem access.');
  return lines.join('\n');
}

export function buildVerificationResponse(opts: {
  query: string;
  request: VerificationRequest;
  scope: VerificationScope;
  context: VerificationContext;
  session: VerificationSession;
  state: VerificationStateType;
  routed: RoutedVerificationSubsystems;
  validation: EntryValidationResult;
  ownership: VerificationOwnership;
}): VerificationResponse {
  const evidenceIds = opts.routed.evidence.evidenceRecords.map((e) => e.evidenceId);
  const reportIds = opts.routed.reporting.reports.map((r) => r.reportId);
  const historyRefs = getVerificationHistory().map((h) => h.entryId);

  const chain: VerificationChain = {
    chainId: `vchain-${opts.request.requestId.replace('vreq-', '')}`,
    requestId: opts.request.requestId,
    sessionId: opts.session.sessionId,
    orchestrationId: opts.context.orchestrationId,
    evidenceAuthorityId: opts.context.evidenceAuthorityId,
    reportingAuthorityId: opts.context.reportingAuthorityId,
    evidenceIds,
    reportIds,
  };

  const diagnostics: VerificationDiagnostics = {
    issueCount: opts.validation.issues.length,
    warnings: opts.validation.warnings,
    issues: opts.validation.issues.map((i) => ({
      code: i.code,
      message: i.message,
      severity: i.severity,
    })),
  };

  const response: VerificationResponse = {
    request: opts.request,
    scope: opts.scope,
    context: opts.context,
    session: opts.session,
    state: opts.state,
    evidenceReferences: evidenceIds,
    reportReferences: reportIds,
    historyReferences: historyRefs,
    diagnostics,
    ownership: opts.ownership,
    metadata: {
      orchestrationState: opts.context.orchestrationState,
      evidenceCount: opts.context.evidenceCount,
      reportCount: opts.context.reportCount,
      routingOnly: true,
    },
    chain,
    responseText: '',
    authorityOnly: true,
  };

  response.responseText = composeVerificationResponseText(opts.query, response);
  return response;
}
