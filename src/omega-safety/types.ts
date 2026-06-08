/** DevPulse V2 OMEGA Prompt Safety Policy — types. */

export type OmegaPromptScope =
  | 'SINGLE_SYSTEM_AUTHORITY'
  | 'SINGLE_CAPABILITY_WAVE'
  | 'SINGLE_VERTICAL_SLICE'
  | 'MULTI_AUTHORITY_UNSAFE'
  | 'UNKNOWN';

export type OmegaPromptSafetyStatus = 'SAFE' | 'WARN' | 'UNSAFE';

export type OmegaValidationMode =
  | 'FAST_FEATURE_CHECK'
  | 'FULL_STACK_CHECK'
  | 'PHASE_TRANSITION_CHECK';

export interface OmegaPromptSafetyResult {
  resultId: string;
  createdAt: number;
  status: OmegaPromptSafetyStatus;
  scope: OmegaPromptScope;
  systemId: string;
  authorityOwner: string;
  validationMode: OmegaValidationMode;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface OmegaPromptClassificationInput {
  promptText: string;
  declaredSystemId?: string;
}

export const OMEGA_OWNER_MODULE = 'devpulse_v2_omega_prompt_safety_authority';
export const OMEGA_PASS_TOKEN = 'DEVPULSE_V2_OMEGA_PROMPT_SAFETY_POLICY_V1_PASS';

export const UNSAFE_PHRASE_PATTERNS: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /central brain.*aidev|aidev.*central brain/i, reason: 'Mixes Central Brain + AiDev' },
  { pattern: /connect everything|connect all systems|connect module/i, reason: 'Connect-everything prompt' },
  { pattern: /execute automatically|autonomous execution|auto[- ]fix/i, reason: 'Execution/autonomy risk' },
  { pattern: /replace chat authority|new answer authority|duplicate answer authority/i, reason: 'Answer authority risk' },
  { pattern: /hidden startup|hidden startup chain|skip startup/i, reason: 'Hidden startup chain risk' },
  { pattern: /connect_v\d+|connect module/i, reason: 'Connect module pattern' },
  { pattern: /bypass task governor|skip task governor/i, reason: 'Task Governor bypass' },
  { pattern: /run full validation chain|nested npm run validate|spawn.*validate:/i, reason: 'Validator explosion risk' },
  { pattern: /multiple systems|all phases|entire devpulse|build everything/i, reason: 'Multi-system scope' },
  { pattern: /central brain.*execution|aidev.*execution/i, reason: 'Central Brain + AiDev + execution mix' },
];

export const SAFE_PHRASE_PATTERNS: readonly RegExp[] = [
  /system id/i,
  /one authority|single authority|one system authority/i,
  /validation[_ ]mode/i,
  /fast[_ ]feature[_ ]check/i,
  /does not become answer authority/i,
  /does not execute/i,
  /does not replace/i,
  /does not build central brain/i,
  /does not build aidev/i,
];
