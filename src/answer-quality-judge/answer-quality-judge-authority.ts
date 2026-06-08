/**
 * DevPulse V2 Answer Quality Judge Authority — post-answer review layer only.
 * Does NOT create, modify, rewrite, or replace answers.
 */

import { type DevPulseV2Answer } from '../chat/answer-contract.js';
import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../central-brain/types.js';
import {
  DevPulseV2AnswerAuthorityProtectionAuthority,
  PROTECTION_OWNER_MODULE,
} from '../answer-authority-protection/index.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { INTENT_OWNER_MODULE } from '../intent-architecture/types.js';
import { CONTEXT_ARBITRATION_OWNER_MODULE } from '../context-arbitration/types.js';
import { POLICY_OWNER_MODULE } from '../validation-budget/types.js';
import {
  getAuthorityComplianceSummary,
  resetAuthorityReviewBridgeForTests,
  reviewAuthorityCompliance,
} from './answer-authority-review-bridge.js';
import {
  getLatestReviewSummary,
  publishReviewSummary,
  resetQualityBrainBridgeForTests,
} from './answer-quality-brain-bridge.js';
import {
  calculateQualityScore,
  generateQualityChecks,
  reviewAnswer,
  summarizeReview,
} from './answer-quality-review-engine.js';
import { formatAnswerQualityReport } from './answer-quality-report.js';
import type {
  AnswerQualityJudgeState,
  AnswerQualityReview,
  AuthorityComplianceSummary,
  ReviewSummary,
} from './types.js';
import { JUDGE_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2AnswerQualityJudgeAuthority | null = null;

function createJudgeId(): string {
  return `judge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneReview(review: AnswerQualityReview): AnswerQualityReview {
  return {
    ...review,
    checks: review.checks.map((c) => ({ ...c })),
    warnings: [...review.warnings],
    errors: [...review.errors],
  };
}

export class DevPulseV2AnswerQualityJudgeAuthority {
  private readonly judgeId = createJudgeId();
  private readonly reviews: AnswerQualityReview[] = [];
  private judgeWarnings: string[] = [
    'Answer Quality Judge performs review only — no answer creation, modification, or replacement.',
  ];
  private judgeErrors: string[] = [];

  static readonly ownerModule = JUDGE_OWNER_MODULE;
  static readonly ownerDomain = 'answer_quality_judge' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('answer_quality_judge');
    return owner.ownerModule === JUDGE_OWNER_MODULE;
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const judge = getDevPulseV2Owner('answer_quality_judge');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      judge.ownerModule === JUDGE_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  static assertDoesNotModifyAnswers(): boolean {
    const judge = new DevPulseV2AnswerQualityJudgeAuthority();
    return (
      typeof (judge as { modifyAnswer?: unknown }).modifyAnswer === 'undefined' &&
      typeof (judge as { rewriteAnswer?: unknown }).rewriteAnswer === 'undefined' &&
      typeof (judge as { buildAnswer?: unknown }).buildAnswer === 'undefined'
    );
  }

  static assertDoesNotRewriteAnswers(): boolean {
    const judge = new DevPulseV2AnswerQualityJudgeAuthority();
    return (
      typeof (judge as { rewriteAnswer?: unknown }).rewriteAnswer === 'undefined' &&
      typeof (judge as { replaceAnswer?: unknown }).replaceAnswer === 'undefined'
    );
  }

  static assertDoesNotExecuteActions(): boolean {
    const judge = new DevPulseV2AnswerQualityJudgeAuthority();
    return (
      typeof (judge as { execute?: unknown }).execute === 'undefined' &&
      typeof (judge as { runAction?: unknown }).runAction === 'undefined'
    );
  }

  static assertDoesNotReplaceCentralBrain(): boolean {
    return getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE;
  }

  static assertDoesNotReplaceIntentArchitecture(): boolean {
    return getDevPulseV2Owner('intent_architecture').ownerModule === INTENT_OWNER_MODULE;
  }

  static assertDoesNotReplaceContextArbitration(): boolean {
    return getDevPulseV2Owner('context_arbitration').ownerModule === CONTEXT_ARBITRATION_OWNER_MODULE;
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

  reviewAndStore(answer: DevPulseV2Answer | null): AnswerQualityReview {
    const review = reviewAnswer(answer);
    this.reviews.push(cloneReview(review));
    return cloneReview(review);
  }

  getReview(reviewId: string): AnswerQualityReview | null {
    const found = this.reviews.find((r) => r.reviewId === reviewId);
    return found ? cloneReview(found) : null;
  }

  listReviews(): AnswerQualityReview[] {
    return this.reviews.map(cloneReview);
  }

  getJudgeState(): AnswerQualityJudgeState {
    return {
      judgeId: this.judgeId,
      reviewCount: this.reviews.length,
      warnings: [...this.judgeWarnings],
      errors: [...this.judgeErrors],
    };
  }

  reviewAuthorityCompliance(): AuthorityComplianceSummary {
    return reviewAuthorityCompliance();
  }

  getAuthorityComplianceSummary(): AuthorityComplianceSummary | null {
    return getAuthorityComplianceSummary();
  }

  publishReviewSummary(review: AnswerQualityReview): ReviewSummary {
    return publishReviewSummary(review);
  }

  getLatestReviewSummary(): ReviewSummary | null {
    return getLatestReviewSummary();
  }

  formatReport(): string {
    return formatAnswerQualityReport(this.getJudgeState(), this.listReviews());
  }
}

export function createDevPulseV2AnswerQualityJudgeAuthority(): DevPulseV2AnswerQualityJudgeAuthority {
  singleton = new DevPulseV2AnswerQualityJudgeAuthority();
  return singleton;
}

export function getDevPulseV2AnswerQualityJudgeAuthority(): DevPulseV2AnswerQualityJudgeAuthority {
  if (!singleton) {
    singleton = new DevPulseV2AnswerQualityJudgeAuthority();
  }
  return singleton;
}

export function resetDevPulseV2AnswerQualityJudgeAuthorityForTests(): DevPulseV2AnswerQualityJudgeAuthority {
  resetAuthorityReviewBridgeForTests();
  resetQualityBrainBridgeForTests();
  singleton = new DevPulseV2AnswerQualityJudgeAuthority();
  return singleton;
}

export { calculateQualityScore, generateQualityChecks, reviewAnswer, summarizeReview };
