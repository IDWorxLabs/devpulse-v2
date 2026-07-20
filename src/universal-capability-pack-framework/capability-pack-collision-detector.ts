/**
 * Universal Capability Pack Framework V1 — contribution collision detection.
 */

export interface PackContribution {
  readonly packId: string;
  readonly relativePath?: string;
  readonly routeId?: string;
  readonly runtimeScopeId?: string;
  readonly actionId?: string;
  readonly workflowId?: string;
  readonly relationshipId?: string;
  readonly ruleId?: string;
}

export interface CollisionIssue {
  readonly code:
    | 'contribution_path_collision'
    | 'route_collision'
    | 'runtime_scope_collision'
    | 'action_id_collision'
    | 'workflow_id_collision'
    | 'relationship_id_collision'
    | 'rule_id_collision'
    | 'duplicate_capability_provider';
  readonly detail: string;
  readonly packIds: readonly string[];
}

export function detectContributionCollisions(contributions: readonly PackContribution[]): CollisionIssue[] {
  const issues: CollisionIssue[] = [];
  const paths = new Map<string, string>();
  const routes = new Map<string, string>();
  const scopes = new Map<string, string>();
  const actions = new Map<string, string>();
  const workflows = new Map<string, string>();
  const relationships = new Map<string, string>();
  const rules = new Map<string, string>();

  const check = (map: Map<string, string>, key: string | undefined, packId: string, code: CollisionIssue['code']) => {
    if (!key) return;
    const existing = map.get(key);
    if (existing && existing !== packId) {
      issues.push({ code, detail: `Collision on '${key}'`, packIds: [existing, packId] });
    } else {
      map.set(key, packId);
    }
  };

  for (const c of contributions) {
    check(paths, c.relativePath, c.packId, 'contribution_path_collision');
    check(routes, c.routeId, c.packId, 'route_collision');
    check(scopes, c.runtimeScopeId, c.packId, 'runtime_scope_collision');
    check(actions, c.actionId, c.packId, 'action_id_collision');
    check(workflows, c.workflowId, c.packId, 'workflow_id_collision');
    check(relationships, c.relationshipId, c.packId, 'relationship_id_collision');
    check(rules, c.ruleId, c.packId, 'rule_id_collision');
  }

  return issues;
}
