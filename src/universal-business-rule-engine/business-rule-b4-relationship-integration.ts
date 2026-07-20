/**
 * Universal Business Rule Engine V1 — B4 relationship integration anchors.
 *
 * B4 keeps relationship persistence and behavior. B6 evaluates reusable
 * relationship policies via evaluate*DeleteConstraint and the pluggable
 * register*RelatedLinkCounter hook so constraints use real link data.
 */

export const BUSINESS_RULE_RELATIONSHIP_PROVENANCE = 'UNIVERSAL_BUSINESS_RULE_ENGINE_V1.relationship-policy' as const;
export const BUSINESS_RULE_RELATIONSHIP_ENFORCEMENT_POINTS = ['SERVICE_DELETE', 'RELATIONSHIP_LINK', 'RELATIONSHIP_UNLINK'] as const;
