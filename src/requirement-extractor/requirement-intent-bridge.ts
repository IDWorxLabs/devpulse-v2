/**
 * Intent Architecture bridge — intent owner unchanged; extractor consumes summaries.
 */

import { classifyIntent } from '../intent-architecture/intent-extractor.js';
import { getDevPulseV2IntentArchitectureAuthority } from '../intent-architecture/intent-architecture-authority.js';
import { INTENT_OWNER_MODULE } from '../intent-architecture/types.js';
import type { IntentType } from '../intent-architecture/types.js';

export interface IntentRequirementStrategy {
  intentType: IntentType;
  strategy: string;
  focusCategories: string[];
}

const STRATEGY_MAP: Record<IntentType, IntentRequirementStrategy> = {
  BUILD_REQUEST: {
    intentType: 'BUILD_REQUEST',
    strategy: 'Extract features, platforms, constraints, and success criteria from build language.',
    focusCategories: ['FEATURE', 'PLATFORM', 'CONSTRAINT', 'SUCCESS_CRITERIA', 'USER_TYPE'],
  },
  PROJECT_REQUEST: {
    intentType: 'PROJECT_REQUEST',
    strategy: 'Extract project scope, user types, and success criteria.',
    focusCategories: ['FEATURE', 'USER_TYPE', 'SUCCESS_CRITERIA'],
  },
  ANALYSIS_REQUEST: {
    intentType: 'ANALYSIS_REQUEST',
    strategy: 'Extract risks and constraints from analysis language.',
    focusCategories: ['RISK', 'CONSTRAINT'],
  },
  QUESTION: {
    intentType: 'QUESTION',
    strategy: 'Minimal requirement extraction — questions rarely produce build requirements.',
    focusCategories: [],
  },
  INFORMATION_REQUEST: {
    intentType: 'INFORMATION_REQUEST',
    strategy: 'Light extraction — information requests may hint at user types only.',
    focusCategories: ['USER_TYPE'],
  },
  UNKNOWN: {
    intentType: 'UNKNOWN',
    strategy: 'Conservative extraction with low confidence.',
    focusCategories: ['FEATURE'],
  },
};

export function mapIntentToRequirementStrategy(userInput: string): IntentRequirementStrategy {
  const { intentType } = classifyIntent(userInput);
  return { ...STRATEGY_MAP[intentType] };
}

export function getIntentRequirementSummary(userInput: string): string {
  const strategy = mapIntentToRequirementStrategy(userInput);
  return `Intent strategy: ${strategy.intentType} — ${strategy.strategy}`;
}

export function assertIntentArchitectureOwnershipUnchanged(): boolean {
  const authority = getDevPulseV2IntentArchitectureAuthority();
  return (
    authority.constructor.name === 'DevPulseV2IntentArchitectureAuthority' &&
    typeof authority.extractAndStoreIntent === 'function' &&
    typeof (authority as { extractRequirements?: unknown }).extractRequirements === 'undefined'
  );
}

export function getIntentArchitectureOwnerForBridge(): string {
  return INTENT_OWNER_MODULE;
}
