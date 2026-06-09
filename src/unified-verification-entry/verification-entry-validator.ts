/**
 * Verification entry validator — diagnostics only.
 */

import type {
  RequestVerificationInput,
  VerificationRequest,
  VerificationResponse,
  VerificationSession,
} from './unified-verification-types.js';

export interface EntryValidationIssue {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  requestId?: string;
}

export interface EntryValidationResult {
  valid: boolean;
  issues: EntryValidationIssue[];
  warnings: string[];
}

export function validateVerificationEntry(opts: {
  request: VerificationRequest;
  session: VerificationSession;
  response: VerificationResponse;
  knownEvidenceIds: Set<string>;
  knownReportIds: Set<string>;
}): EntryValidationResult {
  const issues: EntryValidationIssue[] = [];
  const warnings: string[] = [
    'Phase 16.12 — unified verification entry authority only',
    'No verification execution, trust engine decisions, or auto-fix',
    'Callers must use requestVerification() — not subsystems directly',
  ];

  if (!opts.request.requestType) {
    issues.push({ code: 'INVALID_REQUEST_TYPE', severity: 'HIGH', message: 'Missing request type', requestId: opts.request.requestId });
  }

  if (!opts.request.scope.scopeType) {
    issues.push({ code: 'MISSING_SCOPE', severity: 'HIGH', message: 'Missing verification scope', requestId: opts.request.requestId });
  }

  if (!opts.request.ownership.ownerModule || !opts.request.ownership.requestedBy) {
    issues.push({ code: 'MISSING_OWNERSHIP', severity: 'HIGH', message: 'Missing ownership', requestId: opts.request.requestId });
  }

  if (!opts.session.sessionId) {
    issues.push({ code: 'MISSING_SESSION', severity: 'HIGH', message: 'Missing session id', requestId: opts.request.requestId });
  }

  for (const ref of opts.response.evidenceReferences) {
    if (!opts.knownEvidenceIds.has(ref)) {
      issues.push({ code: 'BROKEN_REFERENCE', severity: 'HIGH', message: `Broken evidence reference: ${ref}`, requestId: opts.request.requestId });
    }
  }

  for (const ref of opts.response.reportReferences) {
    if (!opts.knownReportIds.has(ref)) {
      issues.push({ code: 'BROKEN_REFERENCE', severity: 'MEDIUM', message: `Broken report reference: ${ref}`, requestId: opts.request.requestId });
    }
  }

  const validStates = ['REQUESTED', 'PREPARING', 'READY', 'REPORT_AVAILABLE', 'EVIDENCE_AVAILABLE', 'COMPLETED', 'FAILED'];
  if (!validStates.includes(opts.response.state)) {
    issues.push({ code: 'INVALID_STATE', severity: 'CRITICAL', message: `Invalid state: ${opts.response.state}`, requestId: opts.request.requestId });
  }

  const valid = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;
  return { valid, issues, warnings };
}

export interface EntryGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export function evaluateEntryGates(input: RequestVerificationInput): EntryGateReport {
  const gates = [
    { name: 'Project Exists', satisfied: input.projectExists ?? true, summary: 'Project must exist' },
    { name: 'Workspace Exists', satisfied: input.workspaceExists ?? true, summary: 'Workspace must exist' },
    { name: 'Ownership Valid', satisfied: input.ownershipValid ?? true, summary: 'Entry ownership registered' },
    { name: 'World 1 Protection', satisfied: input.world1Protected ?? true, summary: 'World 1 protected' },
  ];
  const blockers = gates.filter((g) => !g.satisfied).map((g) => `Gate unsatisfied: ${g.name}`);
  return { gates, blockers };
}

export function detectDuplicateRequestId(
  requestId: string,
  existingIds: Set<string>,
): EntryValidationIssue | null {
  if (existingIds.has(requestId)) {
    return { code: 'DUPLICATE_REQUEST_ID', severity: 'CRITICAL', message: `Duplicate request id: ${requestId}`, requestId };
  }
  return null;
}
