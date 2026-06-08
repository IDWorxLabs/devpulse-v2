/**
 * Integration helpers — convert existing outputs into evidence records only.
 * Does NOT rerun validations, score trust, or mutate source systems.
 */

import type { BrowserVerificationResult } from '../browser-verification/types.js';
import type { DevPulseV2Answer } from '../chat/answer-contract.js';
import type { ProjectSnapshot } from '../project-vault/types.js';
import type { ShellReport } from '../shell/types.js';
import type { TrustResult } from '../trust-engine/types.js';
import type { EvidenceRecordInput, EvidenceStatus } from './types.js';

function mapCheckStatus(status: string): EvidenceStatus {
  if (status === 'PASS') return 'PASS';
  if (status === 'WARN') return 'WARN';
  if (status === 'FAIL') return 'FAIL';
  return 'INFO';
}

export function fromBrowserVerificationResult(
  result: BrowserVerificationResult,
): EvidenceRecordInput {
  const status =
    result.status === 'PENDING' ? 'INFO' : mapCheckStatus(result.status);

  return {
    source: 'BROWSER_VERIFICATION',
    label: 'browser_verification_result',
    summary: `Verification ${result.status} via ${result.runnerUsed}; checks=${result.checks.length}`,
    status,
    relatedSystemId: 'browser_verification_harness',
    relatedRecordId: result.verificationId,
    tags: ['browser', 'verification', result.runnerUsed],
    warnings: [...result.warnings],
    errors: [...result.errors],
  };
}

export function fromTrustEngineResult(result: TrustResult): EvidenceRecordInput {
  return {
    source: 'TRUST_ENGINE',
    label: 'trust_engine_result',
    summary: `Trust ${result.status}; score=${result.trustScore}; confidence=${result.confidence}`,
    status: mapCheckStatus(result.status),
    relatedSystemId: 'trust_engine',
    relatedRecordId: result.trustId,
    tags: ['trust', 'score-reference', result.confidence.toLowerCase()],
    warnings: [...result.warnings],
    errors: [...result.errors],
  };
}

export function fromProjectVaultSnapshot(snapshot: ProjectSnapshot): EvidenceRecordInput {
  return {
    source: 'PROJECT_VAULT',
    label: 'project_vault_snapshot',
    summary: `Snapshot ${snapshot.name} (${snapshot.status}); facts=${snapshot.factCount}`,
    status: 'INFO',
    relatedSystemId: 'project_vault',
    relatedRecordId: snapshot.snapshotId,
    tags: ['project', 'snapshot', snapshot.phase],
    warnings: [],
    errors: [],
  };
}

export function fromChatAnswer(answer: DevPulseV2Answer): EvidenceRecordInput {
  const status: EvidenceStatus =
    answer.status === 'READY' ? 'PASS' : answer.status === 'EMPTY' ? 'WARN' : 'FAIL';

  return {
    source: 'CHAT_AUTHORITY',
    label: 'chat_answer',
    summary: `Answer ${answer.status}; visibleText="${answer.visibleAnswerText.slice(0, 40)}..."`,
    status,
    relatedSystemId: 'chat_authority',
    relatedRecordId: answer.answerId,
    tags: ['chat', 'answer', answer.status.toLowerCase()],
    warnings: [...answer.warnings],
    errors: [...answer.errors],
  };
}

export function fromShellReport(report: ShellReport): EvidenceRecordInput {
  const status: EvidenceStatus =
    report.status === 'READY' || report.status === 'CLICKABLE' || report.status === 'VISIBLE'
      ? 'PASS'
      : report.status === 'DEGRADED'
        ? 'WARN'
        : report.status === 'BOOTING'
          ? 'INFO'
          : 'FAIL';

  return {
    source: 'SHELL_AUTHORITY',
    label: 'shell_report',
    summary: report.summary,
    status,
    relatedSystemId: 'shell',
    relatedRecordId: report.startupId,
    tags: ['shell', report.status.toLowerCase()],
    warnings: [],
    errors: [...report.errors],
  };
}
