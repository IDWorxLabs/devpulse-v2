/**
 * Rule-based verification engine — no AI, LLM, execution, or answer generation.
 */

import { verifyEvidenceRecord } from './verification-evidence-bridge.js';
import type {
  EvidenceLinkResult,
  VerificationConfidence,
  VerificationReview,
  VerificationStatus,
  VerifyClaimInput,
  VerifySubjectResult,
} from './types.js';

function createVerificationId(): string {
  return `verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function verifySubject(subject: string): VerifySubjectResult {
  const trimmed = subject.trim();
  if (!trimmed) {
    return { valid: false, subject: trimmed, reason: 'Subject is empty — nothing to verify.' };
  }
  return { valid: true, subject: trimmed, reason: 'Subject exists and is verifiable.' };
}

export function verifyEvidenceLinks(evidenceIds: string[]): EvidenceLinkResult[] {
  return evidenceIds.map((evidenceId) => {
    const record = verifyEvidenceRecord(evidenceId);
    if (!record.valid) {
      return {
        evidenceId,
        valid: false,
        status: 'MISSING',
        reason: `Evidence record not found: ${evidenceId}`,
      };
    }
    return {
      evidenceId,
      valid: true,
      status: record.status,
      reason: `Evidence linked: ${record.summary}`,
    };
  });
}

function deriveStatus(
  subjectValid: boolean,
  links: EvidenceLinkResult[],
): VerificationStatus {
  if (!subjectValid) return 'UNVERIFIED';

  const validLinks = links.filter((l) => l.valid);
  if (validLinks.length === 0) return 'UNVERIFIED';

  const statuses = validLinks.map((l) => l.status);
  const hasPass = statuses.includes('PASS');
  const hasFail = statuses.includes('FAIL');
  const hasWarn = statuses.includes('WARN') || statuses.includes('INFO');

  if (hasPass && hasFail) return 'CONFLICT';
  if (hasFail && !hasPass) return 'PARTIAL';
  if (hasPass && !hasWarn && !hasFail) return 'VERIFIED';
  if (hasPass && hasWarn) return 'PARTIAL';
  if (hasWarn || statuses.includes('INFO')) return 'PARTIAL';

  return 'UNVERIFIED';
}

function deriveConfidence(status: VerificationStatus): VerificationConfidence {
  if (status === 'VERIFIED') return 'HIGH';
  if (status === 'PARTIAL') return 'MEDIUM';
  return 'LOW';
}

export function verifyClaim(input: VerifyClaimInput): VerificationReview {
  const subjectResult = verifySubject(input.subject);
  const links = verifyEvidenceLinks(input.evidenceIds);
  const validIds = links.filter((l) => l.valid).map((l) => l.evidenceId);
  const warnings: string[] = [
    'Verification Loop verifies claims only — it does not answer, execute, or generate code.',
  ];
  const errors: string[] = [];
  const findings: string[] = [];

  if (!subjectResult.valid) {
    errors.push(subjectResult.reason);
  } else {
    findings.push(subjectResult.reason);
  }

  for (const link of links) {
    if (link.valid) {
      findings.push(`${link.evidenceId}: ${link.reason}`);
    } else {
      errors.push(link.reason);
    }
  }

  const status = deriveStatus(subjectResult.valid, links);

  if (status === 'UNVERIFIED' && subjectResult.valid) {
    warnings.push('Missing or invalid supporting evidence — claim is unverified.');
  }
  if (status === 'CONFLICT') {
    warnings.push('Contradictory evidence detected — PASS and FAIL records conflict.');
  }
  if (status === 'PARTIAL') {
    warnings.push('Weak or mixed evidence — partial verification only.');
  }

  return {
    verificationId: createVerificationId(),
    createdAt: Date.now(),
    subject: subjectResult.subject,
    status,
    evidenceIds: validIds,
    confidence: deriveConfidence(status),
    findings,
    warnings,
    errors,
  };
}

export function summarizeVerification(review: VerificationReview): string {
  return (
    `Verification ${review.verificationId}: subject="${review.subject}" ` +
    `status=${review.status} confidence=${review.confidence} ` +
    `evidence=${review.evidenceIds.length} findings=${review.findings.length}`
  );
}
