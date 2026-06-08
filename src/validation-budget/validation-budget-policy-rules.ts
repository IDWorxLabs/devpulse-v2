/**
 * Validation budget policy rules — fast vs full-stack vs phase transition.
 */

import type {
  ValidationMode,
  ValidationRecommendation,
  ValidationTrigger,
} from './types.js';
import {
  FAST_FORBIDDEN_PATTERNS,
  FAST_REQUIRED_COMMANDS,
  FULL_STACK_TRIGGERS,
} from './types.js';

function createRecommendationId(): string {
  return `val-budget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const FULL_STACK_COMMANDS = [
  'npm run validate:foundation',
  'npm run validate:task-governor',
  'npm run validate:shell',
  'npm run validate:chat-authority',
  'npm run validate:inline-operator-feed',
  'npm run validate:browser-harness',
  'npm run validate:real-browser',
  'npm run validate:phase-1-soak',
  'npm run typecheck',
];

const PHASE_TRANSITION_COMMANDS = [
  ...FULL_STACK_COMMANDS,
  'npm run validate:trust-engine',
  'npm run validate:project-vault',
  'npm run validate:evidence-registry',
  'npm run validate:validation-budget',
];

export function resolveValidationMode(trigger: ValidationTrigger): ValidationMode {
  if (trigger === 'PHASE_TRANSITION') {
    return 'PHASE_TRANSITION_CHECK';
  }
  if (trigger === 'FEATURE_LOCAL_CHANGE') {
    return 'FAST_FEATURE_CHECK';
  }
  if ((FULL_STACK_TRIGGERS as readonly string[]).includes(trigger)) {
    return 'FULL_STACK_CHECK';
  }
  return 'FAST_FEATURE_CHECK';
}

export function buildValidationRecommendation(
  trigger: ValidationTrigger,
  featureValidatorCommand = 'npm run validate:<current-feature>',
): ValidationRecommendation {
  const mode = resolveValidationMode(trigger);
  const warnings: string[] = [];

  if (mode === 'FAST_FEATURE_CHECK') {
    return {
      recommendationId: createRecommendationId(),
      mode,
      requiredCommands: [
        featureValidatorCommand,
        'npm run typecheck',
      ],
      forbiddenCommands: [...FAST_FORBIDDEN_PATTERNS],
      reason:
        'Normal feature foundation work — run only the current feature validator and typecheck.',
      warnings: [
        'Do not spawn nested npm run validate:* scripts for unrelated systems.',
      ],
    };
  }

  if (mode === 'FULL_STACK_CHECK') {
    warnings.push('Full-stack checkpoint triggered — nested validators allowed in FULL_STACK_CHECK scripts only.');
    return {
      recommendationId: createRecommendationId(),
      mode,
      requiredCommands: [...FULL_STACK_COMMANDS],
      forbiddenCommands: [],
      reason: `Checkpoint trigger ${trigger} requires full dependent validation chain.`,
      warnings,
    };
  }

  return {
    recommendationId: createRecommendationId(),
    mode: 'PHASE_TRANSITION_CHECK',
    requiredCommands: [...PHASE_TRANSITION_COMMANDS],
    forbiddenCommands: [],
    reason: 'Phase transition requires complete validation chain before advancing.',
    warnings: ['Run all phase validators before starting next phase work.'],
  };
}

export { FAST_REQUIRED_COMMANDS, FULL_STACK_TRIGGERS };
