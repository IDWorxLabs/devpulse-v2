/**
 * Universal Business Rule Engine V1 — B3 workflow integration anchors.
 *
 * B3 keeps workflow state machines and transitions. B6 evaluates the guards
 * used by those transitions via the generated evaluate*WorkflowCompletionGuard
 * export and WORKFLOW_GUARD / WORKFLOW_COMPLETION enforcement points.
 */

export const BUSINESS_RULE_WORKFLOW_PROVENANCE = 'UNIVERSAL_BUSINESS_RULE_ENGINE_V1.workflow-guard' as const;
export const BUSINESS_RULE_WORKFLOW_ENFORCEMENT_POINTS = ['WORKFLOW_GUARD', 'WORKFLOW_COMPLETION'] as const;
