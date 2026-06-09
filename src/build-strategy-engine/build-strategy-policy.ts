/**
 * Build Strategy Engine — policy application (strategy/planning only).
 */

import {
  nextBuildStrategyPolicyId,
  getStoredBuildStrategyRecord,
  storeBuildStrategyRecord,
  storeBuildStrategyPolicy,
} from './build-strategy-store.js';
import { recordBuildStrategyHistoryEntry } from './build-strategy-history.js';
import { recordBuildStrategyLifecycleEvent } from './build-strategy-lifecycle.js';
import type { BuildStrategyPolicy } from './build-strategy-types.js';

export function applyBuildPolicy(input: {
  buildStrategyId: string;
  policyName?: string;
  policyReason?: string;
}): BuildStrategyPolicy | null {
  const record = getStoredBuildStrategyRecord(input.buildStrategyId);
  if (!record) return null;

  const policy: BuildStrategyPolicy = {
    policyId: nextBuildStrategyPolicyId(),
    buildStrategyId: input.buildStrategyId,
    policyName: input.policyName ?? 'strategy_planning_only',
    policyReason: input.policyReason ?? 'Strategy/planning metadata only — no code modification or execution',
    appliedAt: Date.now(),
    strategyOnly: true,
  };

  storeBuildStrategyPolicy(policy);
  storeBuildStrategyRecord({ ...record, strategyPolicy: policy, updatedAt: Date.now() });

  recordBuildStrategyHistoryEntry({
    buildStrategyId: input.buildStrategyId,
    category: 'POLICY',
    summary: `Policy ${policy.policyId}: ${policy.policyName}`,
    scopeUsed: policy.policyId,
  });

  recordBuildStrategyLifecycleEvent(input.buildStrategyId, 'STRATEGY_POLICY_APPLIED', policy.policyReason);

  return policy;
}

export function getBuildStrategyPolicy(buildStrategyId: string): BuildStrategyPolicy | null {
  return getStoredBuildStrategyRecord(buildStrategyId)?.strategyPolicy ?? null;
}
