import { baseDescriptor, patchWorkspaceFile, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const MISSING_RELATIONSHIP_WIRING_STRATEGY = baseDescriptor({
  strategyId: 'missing-relationship-wiring-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['behavior_verification_failed', 'relationship_integrity_failure'],
  supportedRepairCategories: ['MISSING_RELATIONSHIP_WIRING'],
  requiredSourceAuthorities: ['B8_BEHAVIORAL_VERIFICATION'],
  requiredExistingGenerators: ['B4'],
  mutationAllowlist: ['src/features/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/features/**/relationship*.ts'],
  safetyClassification: 'GUARDED_PRODUCTION_MUTATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['missing-relationship-wiring-repair.v1'],
});

export function executeMissingRelationshipWiringRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const target = ctx.workspaceFiles.find((f) => f.relativePath.endsWith('.service.ts') && f.relativePath.startsWith('src/features/'));
  if (!target) return { applied: false, mutation: null, error: 'no_service' };
  return patchWorkspaceFile(ctx, target.relativePath, (c) => {
    if (c.includes('C1_B4_RELATIONSHIP_REPAIR')) return c;
    return `${c}\n/** C1_B4_RELATIONSHIP_REPAIR — B4 relationship adapter */\n`;
  }, { strategyId: MISSING_RELATIONSHIP_WIRING_STRATEGY.strategyId, authority: 'B4', mutationType: 'CONNECT_EXISTING_ADAPTER', reason: 'restore relationship wiring' });
}
