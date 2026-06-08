/** DevPulse V2 Answer Authority Protection Policy — types. */

export type AnswerAuthorityStatus =
  | 'SINGLE_AUTHORITY'
  | 'MULTIPLE_AUTHORITIES'
  | 'UNREGISTERED'
  | 'UNKNOWN';

export interface AnswerAuthorityProtectionReport {
  reportId: string;
  createdAt: number;
  status: AnswerAuthorityStatus;
  registeredAuthorities: string[];
  visibleAnswerOwner: string;
  violations: string[];
  warnings: string[];
  errors: string[];
}

export interface AnswerAuthorityProtectionState {
  protectionId: string;
  checkCount: number;
  lastReport: AnswerAuthorityProtectionReport | null;
  warnings: string[];
  errors: string[];
}

export interface AnswerAuthorityViolationCheck {
  code: string;
  message: string;
  passed: boolean;
}

export const PROTECTION_OWNER_MODULE = 'devpulse_v2_answer_authority_protection_authority';
export const PROTECTION_PASS_TOKEN = 'DEVPULSE_V2_ANSWER_AUTHORITY_PROTECTION_POLICY_V1_PASS';

/** Systems that must never produce user-visible answers. */
export const FORBIDDEN_ANSWER_SYSTEM_DOMAINS = [
  'trust_engine',
  'central_brain',
  'intent_architecture',
  'context_arbitration',
  'evidence_registry',
  'timeline_event_ledger',
  'project_vault',
  'validation_budget_policy',
  'omega_prompt_safety_policy',
] as const;

export type ForbiddenAnswerSystemDomain = (typeof FORBIDDEN_ANSWER_SYSTEM_DOMAINS)[number];

export const ANSWER_AUTHORITY_REGISTRY_DOMAINS = [
  'chat_authority',
  'chat_answer_authority',
] as const;
