/**
 * Universal Business Rule Engine V1 — B5 runtime state integration.
 *
 * B6 is the evaluation authority; B5 is the runtime state authority. Rule
 * evaluation outcomes reach B5 exclusively through typed runtime events
 * dispatched to the shared universal runtime store.
 */

export const BUSINESS_RULE_RUNTIME_EVENT_TYPES = [
  'rule/evaluation-start',
  'rule/evaluation-success',
  'rule/evaluation-failure',
  'rule/value-updated',
  'rule/blocked',
  'rule/invalid',
  'rule/dependency-invalidated',
] as const;

export type BusinessRuleRuntimeEventType = (typeof BUSINESS_RULE_RUNTIME_EVENT_TYPES)[number];

export const BUSINESS_RULE_RUNTIME_PROVENANCE = 'UNIVERSAL_BUSINESS_RULE_ENGINE_V1' as const;
