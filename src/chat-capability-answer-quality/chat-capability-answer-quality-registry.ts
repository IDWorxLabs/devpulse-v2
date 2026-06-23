/**
 * Phase 26.92 — Chat Capability Answer Quality registry (V1).
 */

import type { CapabilityAnswerScenarioDefinition } from './chat-capability-answer-quality-types.js';

export const CHAT_CAPABILITY_ANSWER_QUALITY_PASS = 'CHAT_CAPABILITY_ANSWER_QUALITY_PASS';

export const CHAT_CAPABILITY_ANSWER_QUALITY_CORE_QUESTION =
  'Can AiDevEngine answer foundational capability questions clearly, accurately, honestly, and usefully?';

export const CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE = 85;

export const CAPABILITY_ANSWER_QUALITY_RULES = [
  'Rule 1 — Honesty: never claim capabilities not proven by evidence',
  'Rule 2 — Completeness: cover identity, capabilities, workflow, limitations, next steps when relevant',
  'Rule 3 — Specificity: use concrete platform capabilities, not generic AI assistant language',
  'Rule 4 — Capability Boundaries: separate PROVEN, PARTIAL, and PLANNED capabilities',
  'Rule 5 — Actionability: user understands what AiDevEngine can do today and what happens next',
] as const;

export const CAPABILITY_ANSWER_SCENARIOS: readonly CapabilityAnswerScenarioDefinition[] = [
  {
    readOnly: true,
    id: 'what-is-aidevengine',
    stressScenarioId: 'identity-03',
    prompt: 'What is AiDevEngine?',
    requiredTopics: ['what it is', 'what it does', 'who it is for', 'capabilities', 'limitations'],
  },
  {
    readOnly: true,
    id: 'who-built-you',
    stressScenarioId: 'identity-05',
    prompt: 'Who built you and what product do you represent?',
    requiredTopics: ['Lungelo Richard Zungu', 'Asgard Dynamics', 'AiDevEngine', 'company-product relationship'],
  },
  {
    readOnly: true,
    id: 'build-from-one-prompt',
    stressScenarioId: 'cap-02',
    prompt: 'Can you build my whole application from one prompt?',
    requiredTopics: ['currently possible', 'clarification required', 'realistic boundaries', 'workflow'],
  },
  {
    readOnly: true,
    id: 'what-can-you-do',
    stressScenarioId: 'cap-01',
    prompt: 'What can you do?',
    requiredTopics: [
      'planning',
      'architecture',
      'validation',
      'code generation',
      'execution proof',
      'founder testing',
      'launch readiness',
      'limitations',
    ],
  },
] as const;

export const GENERIC_AI_PATTERNS = [
  /\bhow can i help you today\b/i,
  /\bi'?m here to help\b/i,
  /\bas an ai (language )?model\b/i,
  /\bi am a helpful assistant\b/i,
  /\bfeel free to ask\b/i,
  /\bhappy to assist\b/i,
] as const;

export const OVERCLAIM_PATTERNS = [
  /\bbuild (anything|everything) (instantly|immediately|from one prompt alone)\b/i,
  /\bship production software from one message\b/i,
  /\b100% autonomous with zero (input|effort)\b/i,
  /\bguarantee(d)? launch\b/i,
  /\bno limitations\b/i,
] as const;
