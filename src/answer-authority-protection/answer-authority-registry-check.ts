/**
 * Answer authority registry integration — uses ownership registry only, no second registry.
 */

import { CHAT_OWNER_MODULE } from '../chat/types.js';
import {
  getDevPulseV2Owner,
  listDevPulseV2Owners,
  type OwnerRecord,
} from '../foundation/ownership-registry.js';
import type { OwnershipDomain } from '../foundation/types.js';
import {
  ANSWER_AUTHORITY_REGISTRY_DOMAINS,
  FORBIDDEN_ANSWER_SYSTEM_DOMAINS,
} from './types.js';

export function getRegisteredAnswerAuthorities(): string[] {
  const modules = ANSWER_AUTHORITY_REGISTRY_DOMAINS.map(
    (domain) => getDevPulseV2Owner(domain).ownerModule,
  );
  return [...new Set(modules)];
}

export function getVisibleAnswerAuthority(): string {
  return getDevPulseV2Owner('chat_answer_authority').ownerModule;
}

export function verifyAuthorityOwnership(): boolean {
  const chat = getDevPulseV2Owner('chat_authority');
  const answer = getDevPulseV2Owner('chat_answer_authority');
  return (
    chat.ownerModule === CHAT_OWNER_MODULE &&
    answer.ownerModule === CHAT_OWNER_MODULE &&
    chat.ownerModule === answer.ownerModule
  );
}

export function verifyChatAuthorityRegistered(): boolean {
  const chat = getDevPulseV2Owner('chat_authority');
  return chat.ownerModule === CHAT_OWNER_MODULE && chat.ownerFunction.length > 0;
}

export function verifyForbiddenSystemDoesNotOwnAnswers(
  domain: (typeof FORBIDDEN_ANSWER_SYSTEM_DOMAINS)[number],
): boolean {
  const owner = getDevPulseV2Owner(domain);
  const visibleOwner = getVisibleAnswerAuthority();
  return owner.ownerModule !== visibleOwner;
}

export function detectHiddenAnswerOwners(): string[] {
  const hidden: string[] = [];

  for (const record of listDevPulseV2Owners()) {
    if (record.domain === 'chat_authority' || record.domain === 'chat_answer_authority') continue;
    if (record.domain === 'answer_authority_protection_policy') continue;

    const claimsAnswerOwnership =
      record.ownerModule.endsWith('_answer_authority') ||
      /createDevPulseV2ChatAuthority|produceAnswer|generateAnswer|createAnswer/i.test(
        record.ownerFunction,
      );

    if (claimsAnswerOwnership) {
      hidden.push(`${record.domain}:${record.ownerModule}`);
    }
  }

  return hidden;
}

export function detectCompetingAnswerModulesFromList(
  answerAuthorities: string[],
): string[] {
  const unique = [...new Set(answerAuthorities.filter(Boolean))];
  if (unique.length <= 1) return [];
  return unique.filter((m) => m !== CHAT_OWNER_MODULE);
}

export function getOwnerRecord(domain: OwnershipDomain): OwnerRecord {
  return getDevPulseV2Owner(domain);
}
