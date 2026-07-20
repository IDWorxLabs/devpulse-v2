/**
 * Universal Business Rule Engine V1 — rule support classification.
 *
 * Every approved rule receives exactly one explicit classification.
 * Unsupported rules never disappear: they become blocked or invalid evidence.
 */

import type { NormalizedBusinessRule } from './business-rule-normalization-engine.js';
import type { UniversalBusinessRuleSupportClassification } from './universal-business-rule-types.js';

const FUTURE_CAPABILITY_MARKERS: readonly { readonly pattern: RegExp; readonly reason: string }[] = [
  { pattern: /\bavailabilit|schedul|calendar\s+slot|time\s+slot\b/i, reason: 'blocked_by_scheduling_capability' },
  { pattern: /\blogin|password|permission|role|authenticat\b/i, reason: 'blocked_by_authentication_capability' },
  { pattern: /\bexchange\s+rate|external\s+api|third[- ]party|market\s+data\b/i, reason: 'blocked_by_external_data_capability' },
  { pattern: /\breal[- ]?time|live\s+sync|websocket|push\b/i, reason: 'blocked_by_realtime_capability' },
  { pattern: /\bforecast|predict|machine\s+learning|analytics\s+model\b/i, reason: 'blocked_by_advanced_analytics_capability' },
];

export interface BusinessRuleSupportDecision {
  readonly classification: UniversalBusinessRuleSupportClassification;
  readonly blockedReason?: string;
}

export function classifyBusinessRuleSupport(normalized: NormalizedBusinessRule): BusinessRuleSupportDecision {
  const marker = FUTURE_CAPABILITY_MARKERS.find((entry) => entry.pattern.test(normalized.raw.label));
  if (marker) {
    return { classification: 'BLOCKED_BY_FUTURE_CAPABILITY', blockedReason: marker.reason };
  }

  if (normalized.missingSemantics.length > 0) {
    return {
      classification: 'INVALID_RULE_CONTRACT',
      blockedReason: normalized.missingSemantics.join(','),
    };
  }

  switch (normalized.semantic) {
    case 'REQUIRED':
    case 'GREATER_THAN':
    case 'LESS_THAN':
    case 'NON_NEGATIVE':
      return { classification: 'VALIDATION_SUPPORTED' };
    case 'CROSS_FIELD_COMPARISON':
      return { classification: 'PREDICATE_SUPPORTED' };
    case 'SUM_AGGREGATION':
    case 'COUNT_AGGREGATION':
    case 'AVERAGE_AGGREGATION':
      return { classification: 'AGGREGATION_SUPPORTED' };
    case 'PERCENTAGE_CALCULATION':
    case 'GENERIC_CALCULATION':
      return { classification: 'CALCULATION_SUPPORTED' };
    case 'DERIVED_CLASSIFICATION':
      return { classification: 'DERIVED_VALUE_SUPPORTED' };
    case 'UNIQUENESS_CONSTRAINT':
      return { classification: 'PERSISTENCE_CONSTRAINT_SUPPORTED' };
    case 'RELATIONSHIP_CONSTRAINT':
      return { classification: 'RELATIONSHIP_RULE_SUPPORTED' };
    case 'ACTION_ELIGIBILITY':
      return { classification: 'ACTION_ELIGIBILITY_SUPPORTED' };
    case 'WORKFLOW_COMPLETION_RULE':
      return { classification: 'WORKFLOW_GUARD_SUPPORTED' };
    case 'STATE_TRANSITION_RULE':
      return { classification: 'STATE_TRANSITION_SUPPORTED' };
    case 'THRESHOLD_POLICY':
      return { classification: 'FULLY_SUPPORTED' };
    case 'INFORMATIONAL':
    default:
      return { classification: 'NOT_EXECUTABLE_INFORMATIONAL' };
  }
}
