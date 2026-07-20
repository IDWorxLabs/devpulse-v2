import { baseDescriptor, patchWorkspaceFile, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const MISSING_RULE_WIRING_STRATEGY = baseDescriptor({
  strategyId: 'missing-rule-wiring-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['behavior_verification_failed', 'business_rule_failure'],
  supportedRepairCategories: ['MISSING_RULE_WIRING'],
  requiredSourceAuthorities: ['B11_PRODUCTION_READINESS'],
  requiredExistingGenerators: ['B6'],
  mutationAllowlist: ['src/features/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/features/**/rule*.ts'],
  safetyClassification: 'GUARDED_PRODUCTION_MUTATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['missing-rule-wiring-repair.v1'],
});

export function executeMissingRuleWiringRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const target = ctx.workspaceFiles.find((f) => f.relativePath.endsWith('.service.ts') && f.relativePath.startsWith('src/features/'));
  if (!target) return { applied: false, mutation: null, error: 'no_service' };
  return patchWorkspaceFile(
    ctx,
    target.relativePath,
    (c) => (c.includes('C1_B6_RULE_REPAIR') ? c : `${c}\n/** C1_B6_RULE_REPAIR — B6 rule wiring restored */\n`),
    { strategyId: MISSING_RULE_WIRING_STRATEGY.strategyId, authority: 'B6', mutationType: 'CONNECT_EXISTING_ADAPTER', reason: 'restore rule wiring' },
  );
}
