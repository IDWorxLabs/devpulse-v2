/**
 * Answer Authority Protection bridge — protection remains owner; judge consumes read-only.
 */

import { detectAnswerAuthorityViolations } from '../answer-authority-protection/answer-contract-validator.js';
import {
  getRegisteredAnswerAuthorities,
  getVisibleAnswerAuthority,
} from '../answer-authority-protection/answer-authority-registry-check.js';
import { PROTECTION_OWNER_MODULE } from '../answer-authority-protection/types.js';
import type { AuthorityComplianceSummary } from './types.js';

let lastComplianceSummary: AuthorityComplianceSummary | null = null;

export function reviewAuthorityCompliance(): AuthorityComplianceSummary {
  const violations = detectAnswerAuthorityViolations();
  const failed = violations.filter((v) => !v.passed);
  const registered = getRegisteredAnswerAuthorities();
  const visibleOwner = getVisibleAnswerAuthority();

  const summary: AuthorityComplianceSummary = {
    compliant: failed.length === 0,
    protectionStatus: failed.length === 0 ? 'SINGLE_AUTHORITY' : 'VIOLATION',
    visibleAnswerOwner: visibleOwner,
    violationCount: failed.length,
    summary:
      failed.length === 0
        ? `Authority compliant — visible owner=${visibleOwner}; registered=[${registered.join(', ')}]`
        : `Authority violations: ${failed.map((v) => v.code).join(', ')}`,
  };

  lastComplianceSummary = { ...summary };
  return { ...summary };
}

export function getAuthorityComplianceSummary(): AuthorityComplianceSummary | null {
  return lastComplianceSummary ? { ...lastComplianceSummary } : null;
}

export function assertProtectionOwnershipUnchanged(): boolean {
  return PROTECTION_OWNER_MODULE === 'devpulse_v2_answer_authority_protection_authority';
}

export function resetAuthorityReviewBridgeForTests(): void {
  lastComplianceSummary = null;
}
