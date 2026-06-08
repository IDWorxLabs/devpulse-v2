/**
 * DevPulse V2 Verification Loop Authority — claim verification against evidence.
 * Does NOT answer, execute, generate code, or replace Trust Engine / Browser Harness / Judge.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { PROTECTION_OWNER_MODULE } from '../answer-authority-protection/types.js';
import { DevPulseV2AnswerAuthorityProtectionAuthority } from '../answer-authority-protection/index.js';
import { JUDGE_OWNER_MODULE } from '../answer-quality-judge/types.js';
import { HARNESS_OWNER_MODULE } from '../browser-verification/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getEvidenceVerificationSummary,
  resetEvidenceVerificationBridgeForTests,
  verifyEvidenceRecord,
} from './verification-evidence-bridge.js';
import {
  getLatestVerificationSummary,
  publishVerificationSummary,
  resetVerificationBrainBridgeForTests,
} from './verification-brain-bridge.js';
import {
  getQualityVerificationSummary,
  resetQualityVerificationBridgeForTests,
  verifyReviewQualityClaims,
} from './verification-quality-bridge.js';
import {
  summarizeVerification,
  verifyClaim,
  verifyEvidenceLinks,
  verifySubject,
} from './verification-engine.js';
import { formatVerificationLoopReport } from './verification-loop-report.js';
import type {
  VerificationLoopState,
  VerificationReview,
  VerificationSummary,
  VerifyClaimInput,
} from './types.js';
import { LOOP_OWNER_MODULE } from './types.js';
import type { AnswerQualityReview } from '../answer-quality-judge/types.js';

let singleton: DevPulseV2VerificationLoopAuthority | null = null;

function createLoopId(): string {
  return `loop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneReview(review: VerificationReview): VerificationReview {
  return {
    ...review,
    evidenceIds: [...review.evidenceIds],
    findings: [...review.findings],
    warnings: [...review.warnings],
    errors: [...review.errors],
  };
}

export class DevPulseV2VerificationLoopAuthority {
  private readonly loopId = createLoopId();
  private readonly reviews: VerificationReview[] = [];
  private loopWarnings: string[] = [
    'Verification Loop performs verification only — no answers, execution, or code generation.',
  ];
  private loopErrors: string[] = [];

  static readonly ownerModule = LOOP_OWNER_MODULE;
  static readonly ownerDomain = 'verification_loop' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('verification_loop');
    return owner.ownerModule === LOOP_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const loop = getDevPulseV2Owner('verification_loop');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      loop.ownerModule === LOOP_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const loop = new DevPulseV2VerificationLoopAuthority();
    return (
      typeof (loop as { execute?: unknown }).execute === 'undefined' &&
      typeof (loop as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotGenerateCode(): boolean {
    const loop = new DevPulseV2VerificationLoopAuthority();
    return (
      typeof (loop as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (loop as { writeCode?: unknown }).writeCode === 'undefined'
    );
  }

  static assertDoesNotReplaceTrustEngine(): boolean {
    return getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE;
  }

  static assertDoesNotReplaceBrowserHarness(): boolean {
    return getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE;
  }

  static assertDoesNotReplaceAnswerQualityJudge(): boolean {
    return getDevPulseV2Owner('answer_quality_judge').ownerModule === JUDGE_OWNER_MODULE;
  }

  static assertDoesNotReplaceCentralBrain(): boolean {
    return getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE;
  }

  static assertAnswerAuthorityProtectionCompatible(): boolean {
    return (
      DevPulseV2AnswerAuthorityProtectionAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('answer_authority_protection_policy').ownerModule === PROTECTION_OWNER_MODULE
    );
  }

  static assertValidationBudgetCompatible(): boolean {
    return getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE;
  }

  verifyAndStoreClaim(input: VerifyClaimInput): VerificationReview {
    const review = verifyClaim(input);
    this.reviews.push(cloneReview(review));
    return cloneReview(review);
  }

  getVerification(verificationId: string): VerificationReview | null {
    const found = this.reviews.find((r) => r.verificationId === verificationId);
    return found ? cloneReview(found) : null;
  }

  listVerifications(): VerificationReview[] {
    return this.reviews.map(cloneReview);
  }

  getLoopState(): VerificationLoopState {
    return {
      loopId: this.loopId,
      reviewCount: this.reviews.length,
      warnings: [...this.loopWarnings],
      errors: [...this.loopErrors],
    };
  }

  publishVerificationSummary(review: VerificationReview): VerificationSummary {
    return publishVerificationSummary(review);
  }

  getLatestVerificationSummary(): VerificationSummary | null {
    return getLatestVerificationSummary();
  }

  verifyReviewQualityClaims(review: AnswerQualityReview) {
    return verifyReviewQualityClaims(review);
  }

  getQualityVerificationSummary() {
    return getQualityVerificationSummary();
  }

  verifyEvidenceRecord(evidenceId: string) {
    return verifyEvidenceRecord(evidenceId);
  }

  getEvidenceVerificationSummary() {
    return getEvidenceVerificationSummary();
  }

  formatReport(): string {
    return formatVerificationLoopReport(this.getLoopState(), this.listVerifications());
  }
}

export function createDevPulseV2VerificationLoopAuthority(): DevPulseV2VerificationLoopAuthority {
  singleton = new DevPulseV2VerificationLoopAuthority();
  return singleton;
}

export function getDevPulseV2VerificationLoopAuthority(): DevPulseV2VerificationLoopAuthority {
  if (!singleton) {
    singleton = new DevPulseV2VerificationLoopAuthority();
  }
  return singleton;
}

export function resetDevPulseV2VerificationLoopAuthorityForTests(): DevPulseV2VerificationLoopAuthority {
  resetEvidenceVerificationBridgeForTests();
  resetQualityVerificationBridgeForTests();
  resetVerificationBrainBridgeForTests();
  singleton = new DevPulseV2VerificationLoopAuthority();
  return singleton;
}

export { summarizeVerification, verifyClaim, verifyEvidenceLinks, verifySubject };
