/**
 * User Idea Contract — capture and normalize founder/user prompt.
 */

import { buildSimpleUtilityUserIdeaContract } from '../simple-utility-app/simple-utility-requirement-contract.js';
import { detectSimpleUtilityAppKind, isSimpleUtilityAppPrompt } from '../simple-utility-app/simple-utility-app-registry.js';
import { VAGUE_PROMPT_PATTERNS } from './requirements-to-plan-contract-registry.js';
import type { UserIdeaContract, UserIdeaStatus } from './requirements-to-plan-contract-types.js';

let ideaCounter = 0;

export function resetUserIdeaContractCounterForTests(): void {
  ideaCounter = 0;
}

function nextIdeaId(): string {
  ideaCounter += 1;
  return `idea-${ideaCounter}`;
}

function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function isVaguePrompt(rawPrompt: string): boolean {
  const normalized = normalizeWhitespace(rawPrompt);
  if (wordCount(normalized) < 4) return true;
  return VAGUE_PROMPT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function detectProductType(lower: string): string {
  if (/crm|sales|contacts|deals|pipeline/i.test(lower)) return 'CRM';
  if (/booking|salon|appointment|schedule/i.test(lower)) return 'BOOKING';
  if (/marketplace|ecommerce|store|shop/i.test(lower)) return 'MARKETPLACE';
  if (/saas|dashboard|admin/i.test(lower)) return 'SAAS';
  if (/mobile|ios|android/i.test(lower)) return 'MOBILE_APP';
  return 'WEB_APPLICATION';
}

function detectTargetUsers(lower: string): string[] {
  const users: string[] = [];
  if (/task tracker|todo app|todo list/i.test(lower) && /tasks?/i.test(lower)) {
    users.push('Individual users managing personal tasks');
    return users;
  }
  if (/sales team|small sales/i.test(lower)) users.push('Small sales team members');
  if (/admin role|administrator/i.test(lower)) users.push('Administrators');
  if (/salon|stylist|staff/i.test(lower)) users.push('Salon staff');
  if (/customer|client|user/i.test(lower)) users.push('End customers');
  if (users.length === 0 && !isVaguePrompt(lower)) users.push('Primary product users (needs clarification)');
  return users;
}

function detectPlatformHints(lower: string): string[] {
  const hints: string[] = [];
  if (/web|browser|dashboard/i.test(lower)) hints.push('Web');
  if (/mobile|ios|android/i.test(lower)) hints.push('Mobile');
  if (/desktop/i.test(lower)) hints.push('Desktop');
  if (hints.length === 0 && !isVaguePrompt(lower)) hints.push('Web (default — confirm platform)');
  return hints;
}

function detectConstraints(lower: string): string[] {
  const constraints: string[] = [];
  if (/small team|mvp|simple/i.test(lower)) constraints.push('MVP scope for small team');
  if (/login|auth/i.test(lower)) constraints.push('Authentication required');
  if (/admin role|role/i.test(lower)) constraints.push('Role-based access');
  return constraints;
}

function detectUnknowns(lower: string, vague: boolean): string[] {
  if (vague) return ['Product purpose', 'Target users', 'Core features', 'Platform', 'MVP scope'];
  const unknowns: string[] = [];
  if (!/auth|login|sign/i.test(lower)) unknowns.push('Authentication approach');
  if (!/web|mobile|platform/i.test(lower)) unknowns.push('Target platform');
  if (!/payment|billing|stripe/i.test(lower)) unknowns.push('Payment/billing needs');
  if (!/deploy|host|cloud/i.test(lower)) unknowns.push('Deployment target');
  return unknowns;
}

function computeConfidence(rawPrompt: string, vague: boolean, unknowns: string[]): number {
  if (vague) return 15;
  let score = 45;
  const lower = rawPrompt.toLowerCase();
  if (wordCount(rawPrompt) >= 12) score += 15;
  if (/contacts|deals|tasks|dashboard|login|crm|booking/i.test(lower)) score += 20;
  if (/admin|role|team/i.test(lower)) score += 10;
  score -= unknowns.length * 4;
  return Math.max(0, Math.min(100, score));
}

export function buildUserIdeaContract(rawPrompt: string, ideaId?: string): UserIdeaContract {
  const resolvedIdeaId = ideaId ?? nextIdeaId();
  const simpleKind = detectSimpleUtilityAppKind(rawPrompt);
  if (simpleKind) {
    return buildSimpleUtilityUserIdeaContract(rawPrompt, simpleKind, resolvedIdeaId);
  }

  const normalized = normalizeWhitespace(rawPrompt);
  const vague = isVaguePrompt(normalized);
  const lower = normalized.toLowerCase();
  const productType = detectProductType(lower);
  const targetUsers = detectTargetUsers(lower);
  const platformHints = detectPlatformHints(lower);
  const knownConstraints = detectConstraints(lower);
  const unknowns = detectUnknowns(lower, vague);
  const confidence = computeConfidence(normalized, vague, unknowns);

  let status: UserIdeaStatus = 'CAPTURED';
  let normalizedGoal = normalized;
  let problemStatement = `User wants to build: ${normalized}`;
  let desiredOutcome = `Working ${productType.toLowerCase().replace('_', ' ')} from stated intent`;

  if (vague) {
    status = 'INSUFFICIENT_INPUT';
    normalizedGoal = 'Unspecified product goal';
    problemStatement = 'Prompt too vague to derive a build-ready problem statement';
    desiredOutcome = 'Cannot determine desired outcome without clarification';
  } else if (/crm|sales/i.test(lower)) {
    normalizedGoal = 'CRM for small sales team to manage contacts, deals, and tasks';
    problemStatement = 'Sales team needs centralized contact, deal, and task management';
    desiredOutcome = 'Team can log in, view dashboard, manage pipeline, and administer roles';
  } else if (/booking|salon/i.test(lower)) {
    normalizedGoal = 'Booking application for salon appointments';
    problemStatement = 'Salon needs appointment scheduling for staff and customers';
    desiredOutcome = 'Customers can book; staff can manage schedule';
  } else if (/task tracker|todo app|todo list/i.test(lower) && /tasks?/i.test(lower)) {
    normalizedGoal =
      'Simple browser task tracker with add, complete, delete, filter, and active task count';
    problemStatement = 'User needs a lightweight way to manage daily tasks in the browser';
    desiredOutcome = 'Working task tracker with filters and remaining active task count';
  }

  return {
    readOnly: true,
    ideaId: ideaId ?? nextIdeaId(),
    rawPrompt: normalized,
    normalizedGoal,
    targetUsers,
    problemStatement,
    desiredOutcome,
    productType,
    platformHints,
    knownConstraints,
    unknowns,
    confidence,
    status,
  };
}
