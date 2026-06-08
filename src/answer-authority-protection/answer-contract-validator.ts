/**
 * Answer contract validation — single visible answer owner, no post-answer mutation.
 */

import { assertAnswerContract } from '../chat/answer-contract.js';
import { getDevPulseV2ChatAuthority } from '../chat/chat-authority.js';
import { CHAT_ANSWER_SOURCE, CHAT_OWNER_MODULE } from '../chat/types.js';
import {
  detectCompetingAnswerModulesFromList,
  detectHiddenAnswerOwners,
  getRegisteredAnswerAuthorities,
  getVisibleAnswerAuthority,
  verifyAuthorityOwnership,
  verifyChatAuthorityRegistered,
  verifyForbiddenSystemDoesNotOwnAnswers,
} from './answer-authority-registry-check.js';
import type { AnswerAuthorityViolationCheck } from './types.js';
import { FORBIDDEN_ANSWER_SYSTEM_DOMAINS } from './types.js';

export function validateSingleAnswerAuthority(): AnswerAuthorityViolationCheck {
  const registered = getRegisteredAnswerAuthorities();
  const unique = [...new Set(registered)];
  const passed = unique.length === 1 && unique[0] === CHAT_OWNER_MODULE;
  return {
    code: 'SINGLE_ANSWER_AUTHORITY',
    message: passed
      ? 'Exactly one answer authority registered.'
      : `Expected single chat authority, found: ${unique.join(', ') || 'none'}`,
    passed,
  };
}

export function validateVisibleAnswerOwner(): AnswerAuthorityViolationCheck {
  const visibleOwner = getVisibleAnswerAuthority();
  const passed = visibleOwner === CHAT_OWNER_MODULE && verifyAuthorityOwnership();
  return {
    code: 'VISIBLE_ANSWER_OWNER',
    message: passed
      ? 'Visible answer owner is Chat Authority.'
      : `Visible answer owner mismatch: ${visibleOwner}`,
    passed,
  };
}

export function validateAnswerContractIntegrity(): AnswerAuthorityViolationCheck {
  const chat = getDevPulseV2ChatAuthority();
  const lastAnswer = chat.getLastAnswer();

  if (!lastAnswer) {
    return {
      code: 'ANSWER_CONTRACT_INTEGRITY',
      message: 'No answer produced yet — contract check deferred (registry ownership valid).',
      passed: verifyAuthorityOwnership(),
    };
  }

  const contractOk = assertAnswerContract(lastAnswer);
  const sourceOk = lastAnswer.source === CHAT_ANSWER_SOURCE;
  const passed = contractOk && sourceOk;

  return {
    code: 'ANSWER_CONTRACT_INTEGRITY',
    message: passed
      ? 'Answer contract intact — visibleAnswerText owned by Chat Authority.'
      : 'Answer contract violation — hidden fields or wrong source detected.',
    passed,
  };
}

export function detectAnswerAuthorityViolations(
  competingAnswerAuthorities: string[] = [],
): AnswerAuthorityViolationCheck[] {
  const checks: AnswerAuthorityViolationCheck[] = [
    validateSingleAnswerAuthority(),
    validateVisibleAnswerOwner(),
    validateAnswerContractIntegrity(),
  ];

  if (!verifyChatAuthorityRegistered()) {
    checks.push({
      code: 'CHAT_AUTHORITY_UNREGISTERED',
      message: 'Chat Authority is not properly registered in ownership registry.',
      passed: false,
    });
  }

  for (const domain of FORBIDDEN_ANSWER_SYSTEM_DOMAINS) {
    const passed = verifyForbiddenSystemDoesNotOwnAnswers(domain);
    checks.push({
      code: `FORBIDDEN_ANSWER_${domain.toUpperCase()}`,
      message: passed
        ? `${domain} does not own visible answers.`
        : `${domain} incorrectly owns visible answer authority.`,
      passed,
    });
  }

  const hidden = detectHiddenAnswerOwners();
  checks.push({
    code: 'HIDDEN_ANSWER_OWNERS',
    message:
      hidden.length === 0
        ? 'No hidden answer owners detected.'
        : `Hidden answer owners detected: ${hidden.join('; ')}`,
    passed: hidden.length === 0,
  });

  const competing = detectCompetingAnswerModulesFromList(competingAnswerAuthorities);
  checks.push({
    code: 'MULTIPLE_ANSWER_AUTHORITIES',
    message:
      competing.length === 0
        ? 'No competing answer authorities in supplied list.'
        : `Competing answer authorities: ${competing.join(', ')}`,
    passed: competing.length === 0,
  });

  return checks;
}

export function simulateMultipleAnswerAuthorityViolation(): string[] {
  return ['devpulse_v2_chat_authority', 'devpulse_v2_trust_engine_authority'];
}

export function simulateHiddenAnswerAuthorityViolation(): string[] {
  return detectHiddenAnswerOwners().length > 0
    ? detectHiddenAnswerOwners()
    : ['simulated_hidden: devpulse_v2_hidden_answer_module'];
}

export function runMultipleAnswerAuthorityDetection(
  answerAuthorities: string[],
): boolean {
  const unique = [...new Set(answerAuthorities)];
  return unique.length > 1;
}

export function runHiddenAnswerAuthorityDetection(
  answerAuthorities: string[] = [],
): boolean {
  const hidden = detectHiddenAnswerOwners();
  const competing = detectCompetingAnswerModulesFromList(answerAuthorities);
  return hidden.length > 0 || competing.length > 0;
}
