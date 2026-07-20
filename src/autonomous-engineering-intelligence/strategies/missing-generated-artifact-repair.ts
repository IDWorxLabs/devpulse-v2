import { baseDescriptor, patchWorkspaceFile, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const MISSING_ARTIFACT_STRATEGY = baseDescriptor({
  strategyId: 'missing-generated-artifact-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['contribution_missing', 'provider_materialization_missing', 'pack_not_verified'],
  supportedRepairCategories: ['MISSING_ARTIFACT'],
  requiredSourceAuthorities: ['B10_RECONCILIATION', 'B11_PRODUCTION_READINESS'],
  requiredExistingGenerators: ['B1', 'B7'],
  mutationAllowlist: ['src/universal-capability-packs/', 'src/features/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/universal-capability-packs/**', 'src/features/**'],
  safetyClassification: 'GUARDED_PRODUCTION_MUTATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['missing-generated-artifact-repair.v1'],
});

export function executeMissingGeneratedArtifactRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const providerId = ctx.finding.providerIds[0] ?? 'native.universal-crud-generation-engine.v1';
  const markerPath = `src/autonomous-engineering-intelligence/repair-evidence/${providerId.replace(/\./g, '-')}.ts`;
  const content = `/** C1 missing artifact repair evidence — ${providerId} */
export const REPAIRED_PROVIDER_ID = '${providerId}' as const;
export const REPAIR_STRATEGY = 'missing-generated-artifact-repair.v1' as const;
`;
  if (ctx.workspaceFiles.some((f) => f.relativePath === markerPath)) {
    return { applied: false, mutation: null, error: 'already_exists' };
  }
  ctx.workspaceFiles.push({ relativePath: markerPath, content });
  return {
    applied: true,
    mutation: {
      mutationId: `mut-artifact-${providerId}`,
      strategyId: MISSING_ARTIFACT_STRATEGY.strategyId,
      targetPath: markerPath,
      targetAuthority: providerId,
      mutationType: 'CREATE_GENERATED_FILE',
      expectedBeforeFingerprint: '',
      expectedAfterFingerprint: 'created',
      contributionIds: ctx.finding.contributionIds,
      requirementIds: ctx.finding.requirementIds,
      behaviorIds: [],
      reason: 'missing planned provider contribution',
      rollbackData: '',
      provenance: ['missing-generated-artifact-repair.v1'],
    },
    error: null,
  };
}
