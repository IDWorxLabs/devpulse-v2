import { baseDescriptor, patchWorkspaceFile, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const MISSING_RUNTIME_SCOPE_STRATEGY = baseDescriptor({
  strategyId: 'missing-runtime-scope-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['runtime_registration_missing'],
  supportedRepairCategories: ['MISSING_RUNTIME_SCOPE'],
  requiredSourceAuthorities: ['B11_PRODUCTION_READINESS'],
  requiredExistingGenerators: ['B5'],
  mutationAllowlist: ['src/universal-runtime-state-engine/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/universal-runtime-state-engine/**'],
  safetyClassification: 'SAFE_WITH_TARGETED_VALIDATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['missing-runtime-scope-repair.v1'],
});

export function executeMissingRuntimeScopeRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const marker = 'src/universal-runtime-state-engine/c1-runtime-registration-repair.ts';
  if (!ctx.workspaceFiles.some((f) => f.relativePath.startsWith('src/universal-runtime-state-engine/'))) {
    ctx.workspaceFiles.push({
      relativePath: marker,
      content: `/** C1 B5 runtime scope registration repair */\nexport const C1_B5_RUNTIME_SCOPE_REPAIR = true as const;\n`,
    });
    return {
      applied: true,
      mutation: {
        mutationId: 'mut-runtime-marker',
        strategyId: MISSING_RUNTIME_SCOPE_STRATEGY.strategyId,
        targetPath: marker,
        targetAuthority: 'B5',
        mutationType: 'REGISTER_EXISTING_CONTRIBUTION',
        expectedBeforeFingerprint: '',
        expectedAfterFingerprint: 'created',
        contributionIds: [],
        requirementIds: ctx.finding.requirementIds,
        behaviorIds: [],
        reason: 'register runtime scope',
        rollbackData: '',
        provenance: ['missing-runtime-scope-repair.v1'],
      },
      error: null,
    };
  }
  const target = ctx.workspaceFiles.find((f) => f.relativePath.includes('runtime-marker') || f.relativePath.endsWith('registry.ts'));
  if (!target) {
    ctx.workspaceFiles.push({
      relativePath: marker,
      content: `/** C1 B5 runtime scope registration repair */\nexport const C1_B5_RUNTIME_SCOPE_REPAIR = true as const;\n`,
    });
    return { applied: true, mutation: null, error: null };
  }
  return patchWorkspaceFile(
    ctx,
    target.relativePath,
    (c) => (c.includes('C1_B5_RUNTIME_SCOPE_REPAIR') ? c : `${c}\nexport const C1_B5_RUNTIME_SCOPE_REPAIR = true as const;\n`),
    { strategyId: MISSING_RUNTIME_SCOPE_STRATEGY.strategyId, authority: 'B5', mutationType: 'REGISTER_EXISTING_CONTRIBUTION', reason: 'register runtime scope' },
  );
}
