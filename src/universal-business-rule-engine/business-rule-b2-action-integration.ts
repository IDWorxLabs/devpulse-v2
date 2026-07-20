/**
 * Universal Business Rule Engine V1 — B2 action integration anchors.
 *
 * B2 keeps controls, handlers, execution adapters, feedback, undo, and retry.
 * B6 supplies eligibility and precondition evaluation via the generated
 * evaluate*ActionEligibility export and ACTION_PRECONDITION enforcement point.
 */

export const BUSINESS_RULE_ACTION_PROVENANCE = 'UNIVERSAL_BUSINESS_RULE_ENGINE_V1.action-eligibility' as const;
export const BUSINESS_RULE_ACTION_ENFORCEMENT_POINT = 'ACTION_PRECONDITION' as const;
