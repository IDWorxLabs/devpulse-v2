/**
 * Universal Business Rule Engine V1 — rule normalization.
 *
 * Normalizes varied approved rule declarations into generic rule semantics.
 * No domain-specific mappings: normalization keys on generic rule phrases only.
 */

import type { RawApprovedBusinessRule, UniversalBusinessRuleKind } from './universal-business-rule-types.js';

export type NormalizedRuleSemantic =
  | 'REQUIRED'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'NON_NEGATIVE'
  | 'CROSS_FIELD_COMPARISON'
  | 'SUM_AGGREGATION'
  | 'COUNT_AGGREGATION'
  | 'AVERAGE_AGGREGATION'
  | 'PERCENTAGE_CALCULATION'
  | 'GENERIC_CALCULATION'
  | 'DERIVED_CLASSIFICATION'
  | 'UNIQUENESS_CONSTRAINT'
  | 'RELATIONSHIP_CONSTRAINT'
  | 'ACTION_ELIGIBILITY'
  | 'WORKFLOW_COMPLETION_RULE'
  | 'STATE_TRANSITION_RULE'
  | 'THRESHOLD_POLICY'
  | 'INFORMATIONAL';

export interface NormalizedBusinessRule {
  readonly raw: RawApprovedBusinessRule;
  readonly semantic: NormalizedRuleSemantic;
  readonly ruleKind: UniversalBusinessRuleKind;
  readonly deterministic: boolean;
  readonly missingSemantics: readonly string[];
}

const SEMANTIC_MATCHERS: readonly { readonly pattern: RegExp; readonly semantic: NormalizedRuleSemantic }[] = [
  { pattern: /\brequired\b|\bmandatory\b|\bmust\s+(?:be\s+)?(?:provided|entered|filled)\b/i, semantic: 'REQUIRED' },
  { pattern: /\bgreater\s+than\b|\bat\s+least\b|\bpositive\b/i, semantic: 'GREATER_THAN' },
  { pattern: /\bless\s+than\b|\bat\s+most\b/i, semantic: 'LESS_THAN' },
  { pattern: /\bnon[- ]negative\b/i, semantic: 'NON_NEGATIVE' },
  { pattern: /\bstart\b[^.]{0,40}\bbefore\b|\bbefore\b[^.]{0,40}\bend\b/i, semantic: 'CROSS_FIELD_COMPARISON' },
  { pattern: /\bsum\s+of\b|\btotal\b|\bsubtotal\b/i, semantic: 'SUM_AGGREGATION' },
  { pattern: /\bcount\s+of\b|\bnumber\s+of\b/i, semantic: 'COUNT_AGGREGATION' },
  { pattern: /\baverage\b/i, semantic: 'AVERAGE_AGGREGATION' },
  { pattern: /\bpercentage\b|\bpercent\b|\bdiscount\b|\bratio\b/i, semantic: 'PERCENTAGE_CALCULATION' },
  { pattern: /\bcalculat|formula|comput/i, semantic: 'GENERIC_CALCULATION' },
  { pattern: /\bclassification\b|\bscore\b|\bderived\b|\bprogress\b/i, semantic: 'DERIVED_CLASSIFICATION' },
  { pattern: /\bunique\b|\bduplicate\b/i, semantic: 'UNIQUENESS_CONSTRAINT' },
  { pattern: /\bcannot\s+delete\b|\bdelete\s+(?:is\s+)?(?:blocked|restricted|prevented)\b/i, semantic: 'RELATIONSHIP_CONSTRAINT' },
  { pattern: /\bapprov|eligib/i, semantic: 'ACTION_ELIGIBILITY' },
  { pattern: /\bworkflow\b[^.]{0,60}\bcomplete\b|\bcomplete\b[^.]{0,60}\b(?:only|when|all)\b/i, semantic: 'WORKFLOW_COMPLETION_RULE' },
  { pattern: /\bstatus\b|\btransition\b/i, semantic: 'STATE_TRANSITION_RULE' },
  { pattern: /\blimit\b|\bthreshold\b|\bmaximum\s+of\b|\bminimum\s+of\b/i, semantic: 'THRESHOLD_POLICY' },
];

export function normalizeBusinessRule(raw: RawApprovedBusinessRule): NormalizedBusinessRule {
  const matcher = SEMANTIC_MATCHERS.find((entry) => entry.pattern.test(raw.label));
  const semantic = matcher?.semantic ?? 'INFORMATIONAL';

  const missingSemantics: string[] = [];
  // A calculation phrase without a defined structure cannot be executed —
  // we never invent formulas or guess thresholds.
  if (semantic === 'GENERIC_CALCULATION' && !/\b(?:sum|count|average|percent|ratio|difference|product)\b/i.test(raw.label)) {
    missingSemantics.push('missing_formula');
  }
  if (semantic === 'THRESHOLD_POLICY' && !/\b\d+(?:\.\d+)?\b/.test(raw.label)) {
    missingSemantics.push('missing_threshold');
  }

  return {
    raw,
    semantic,
    ruleKind: raw.ruleKind,
    deterministic: semantic !== 'INFORMATIONAL' && missingSemantics.length === 0,
    missingSemantics,
  };
}

export function normalizeBusinessRules(raws: readonly RawApprovedBusinessRule[]): NormalizedBusinessRule[] {
  return raws.map(normalizeBusinessRule);
}
