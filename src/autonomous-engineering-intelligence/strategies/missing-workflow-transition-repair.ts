import { baseDescriptor, patchWorkspaceFile, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const MISSING_WORKFLOW_TRANSITION_STRATEGY = baseDescriptor({
  strategyId: 'missing-workflow-transition-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['behavior_verification_failed'],
  supportedRepairCategories: ['MISSING_WORKFLOW_TRANSITION'],
  requiredSourceAuthorities: ['B8_BEHAVIORAL_VERIFICATION'],
  requiredExistingGenerators: ['B3'],
  mutationAllowlist: ['src/features/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/features/**/workflow*.ts'],
  safetyClassification: 'GUARDED_PRODUCTION_MUTATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['missing-workflow-transition-repair.v1'],
});

export function executeMissingWorkflowTransitionRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const target = ctx.workspaceFiles.find((f) => f.relativePath.includes('workflow') && f.relativePath.startsWith('src/features/'));
  if (!target) return { applied: false, mutation: null, error: 'no_workflow_file' };
  return patchWorkspaceFile(ctx, target.relativePath, (c) => {
    if (c.includes('C1_B3_TRANSITION_REPAIR')) return c;
    return `${c}\n/** C1_B3_TRANSITION_REPAIR — B3 transition wiring restored */\n`;
  }, { strategyId: MISSING_WORKFLOW_TRANSITION_STRATEGY.strategyId, authority: 'B3', mutationType: 'CONNECT_EXISTING_ADAPTER', reason: 'restore workflow transition wiring' });
}
