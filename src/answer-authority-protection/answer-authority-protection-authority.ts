/**
 * DevPulse V2 Answer Authority Protection Authority — permanent answer ownership policy.
 * Does NOT become answer authority — validates and protects Chat Authority ownership only.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  detectAnswerAuthorityViolations,
  validateAnswerContractIntegrity,
  validateSingleAnswerAuthority,
  validateVisibleAnswerOwner,
} from './answer-contract-validator.js';
import { formatAnswerAuthorityProtectionReport } from './answer-authority-protection-report.js';
import {
  getRegisteredAnswerAuthorities,
  getVisibleAnswerAuthority,
  verifyAuthorityOwnership,
  verifyChatAuthorityRegistered,
  verifyForbiddenSystemDoesNotOwnAnswers,
} from './answer-authority-registry-check.js';
import type {
  AnswerAuthorityProtectionReport,
  AnswerAuthorityProtectionState,
  AnswerAuthorityStatus,
  ForbiddenAnswerSystemDomain,
} from './types.js';
import { FORBIDDEN_ANSWER_SYSTEM_DOMAINS, PROTECTION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2AnswerAuthorityProtectionAuthority | null = null;

function createReportId(): string {
  return `answer-protect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createProtectionId(): string {
  return `protect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveStatus(
  violations: string[],
  registered: string[],
): AnswerAuthorityStatus {
  if (registered.length === 0) return 'UNREGISTERED';
  const unique = [...new Set(registered)];
  if (unique.length > 1 || violations.some((v) => v.includes('Multiple') || v.includes('Competing'))) {
    return 'MULTIPLE_AUTHORITIES';
  }
  if (violations.length > 0) return 'UNKNOWN';
  if (unique.length === 1 && unique[0] === CHAT_OWNER_MODULE) return 'SINGLE_AUTHORITY';
  return 'UNKNOWN';
}

export class DevPulseV2AnswerAuthorityProtectionAuthority {
  private readonly protectionId = createProtectionId();
  private checkCount = 0;
  private lastReport: AnswerAuthorityProtectionReport | null = null;
  private protectionWarnings: string[] = [
    'Answer Authority Protection Policy observes only — it does not produce user-visible answers.',
  ];
  private protectionErrors: string[] = [];

  static readonly ownerModule = PROTECTION_OWNER_MODULE;
  static readonly ownerDomain = 'answer_authority_protection_policy' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('answer_authority_protection_policy');
    return owner.ownerModule === PROTECTION_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const protection = getDevPulseV2Owner('answer_authority_protection_policy');
    const visible = getVisibleAnswerAuthority();
    return (
      protection.ownerModule === PROTECTION_OWNER_MODULE &&
      protection.ownerModule !== visible &&
      visible === CHAT_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  static assertSystemCannotBecomeAnswerAuthority(domain: ForbiddenAnswerSystemDomain): boolean {
    return verifyForbiddenSystemDoesNotOwnAnswers(domain);
  }

  runProtectionCheck(competingAnswerAuthorities: string[] = []): AnswerAuthorityProtectionReport {
    this.checkCount += 1;
    const checks = detectAnswerAuthorityViolations(competingAnswerAuthorities);
    const violations = checks.filter((c) => !c.passed).map((c) => c.message);
    const warnings = [...this.protectionWarnings];
    const errors = [...this.protectionErrors];
    const registeredAuthorities = getRegisteredAnswerAuthorities();
    const visibleAnswerOwner = getVisibleAnswerAuthority();

    const report: AnswerAuthorityProtectionReport = {
      reportId: createReportId(),
      createdAt: Date.now(),
      status: deriveStatus(violations, registeredAuthorities),
      registeredAuthorities,
      visibleAnswerOwner,
      violations,
      warnings,
      errors,
    };

    this.lastReport = { ...report, violations: [...violations], warnings: [...warnings], errors: [...errors] };
    return { ...this.lastReport };
  }

  getLastReport(): AnswerAuthorityProtectionReport | null {
    return this.lastReport
      ? {
          ...this.lastReport,
          registeredAuthorities: [...this.lastReport.registeredAuthorities],
          violations: [...this.lastReport.violations],
          warnings: [...this.lastReport.warnings],
          errors: [...this.lastReport.errors],
        }
      : null;
  }

  getProtectionState(): AnswerAuthorityProtectionState {
    return {
      protectionId: this.protectionId,
      checkCount: this.checkCount,
      lastReport: this.getLastReport(),
      warnings: [...this.protectionWarnings],
      errors: [...this.protectionErrors],
    };
  }

  formatReport(): string {
    const report = this.lastReport ?? this.runProtectionCheck();
    return formatAnswerAuthorityProtectionReport(report);
  }
}

export function createDevPulseV2AnswerAuthorityProtectionAuthority(): DevPulseV2AnswerAuthorityProtectionAuthority {
  singleton = new DevPulseV2AnswerAuthorityProtectionAuthority();
  return singleton;
}

export function getDevPulseV2AnswerAuthorityProtectionAuthority(): DevPulseV2AnswerAuthorityProtectionAuthority {
  if (!singleton) {
    singleton = new DevPulseV2AnswerAuthorityProtectionAuthority();
  }
  return singleton;
}

export function resetDevPulseV2AnswerAuthorityProtectionAuthorityForTests(): DevPulseV2AnswerAuthorityProtectionAuthority {
  singleton = new DevPulseV2AnswerAuthorityProtectionAuthority();
  return singleton;
}

export {
  detectAnswerAuthorityViolations,
  validateAnswerContractIntegrity,
  validateSingleAnswerAuthority,
  validateVisibleAnswerOwner,
  verifyAuthorityOwnership,
  verifyChatAuthorityRegistered,
  getRegisteredAnswerAuthorities,
  getVisibleAnswerAuthority,
};
