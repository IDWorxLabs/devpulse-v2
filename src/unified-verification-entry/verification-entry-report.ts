/**
 * Verification entry report — authority summary and failure context.
 */

import { isUnifiedVerificationQuestion } from './unified-verification-types.js';
import type { VerificationAuthorityResult, VerificationResponse } from './unified-verification-types.js';

export interface VerificationEntryReport {
  reportId: string;
  authorityId: string;
  requestCount: number;
  sessionCount: number;
  evidenceReferenceCount: number;
  reportReferenceCount: number;
  historyEntryCount: number;
  authorityState: string;
  createdAt: number;
  authorityOnly: true;
}

let reportCounter = 0;

export function resetVerificationEntryReportCounterForTests(): void {
  reportCounter = 0;
}

export function buildVerificationEntryReport(result: VerificationAuthorityResult): VerificationEntryReport {
  reportCounter += 1;
  return {
    reportId: `uventrep-${reportCounter.toString().padStart(4, '0')}`,
    authorityId: result.authorityId,
    requestCount: 1,
    sessionCount: 1,
    evidenceReferenceCount: result.response.evidenceReferences.length,
    reportReferenceCount: result.response.reportReferences.length,
    historyEntryCount: result.response.historyReferences.length,
    authorityState: result.authorityState,
    createdAt: Date.now(),
    authorityOnly: true,
  };
}

export interface UnifiedVerificationFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildUnifiedVerificationFailureContext(query: string): UnifiedVerificationFailureContext[] {
  if (!isUnifiedVerificationQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: UnifiedVerificationFailureContext[] = [
    {
      title: 'Unified verification entry: authority only',
      description: 'Phase 16.12 single verification surface without provider execution',
      sourceSystem: 'unified_verification_entry',
      severity: 'LOW',
    },
  ];

  if (lower.includes('blocked') || lower.includes('verification blocked')) {
    records.push({
      title: 'Verification entry blocked',
      description: 'Unified verification entry gates failed',
      sourceSystem: 'unified_verification_entry',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('duplicate')) {
    records.push({
      title: 'Duplicate verification request',
      description: 'Verification request rejected due to duplicate id',
      sourceSystem: 'unified_verification_entry',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('broken reference') || lower.includes('missing scope')) {
    records.push({
      title: 'Broken verification reference',
      description: 'Verification response references missing evidence or report',
      sourceSystem: 'unified_verification_entry',
      severity: 'HIGH',
    });
  }

  return records;
}

export function summarizeEntryResponse(response: VerificationResponse): string {
  return [
    `Request: ${response.request.requestId} (${response.request.requestType})`,
    `Scope: ${response.scope.scopeType} — ${response.scope.targetIds.length} targets`,
    `State: ${response.state}`,
    `Evidence refs: ${response.evidenceReferences.length}`,
    `Report refs: ${response.reportReferences.length}`,
  ].join('\n');
}
