import { baseDescriptor, patchWorkspaceFile, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const MISSING_VERIFICATION_SCENARIO_STRATEGY = baseDescriptor({
  strategyId: 'missing-verification-scenario-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['behavior_verification_failed', 'behavior_verification_missing'],
  supportedRepairCategories: ['MISSING_VERIFICATION_SCENARIO'],
  requiredSourceAuthorities: ['B8_BEHAVIORAL_VERIFICATION'],
  requiredExistingGenerators: ['B8'],
  mutationAllowlist: ['src/universal-behavioral-verification/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/universal-behavioral-verification/**'],
  safetyClassification: 'SAFE_WITH_TARGETED_VALIDATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['missing-verification-scenario-repair.v1'],
});

export function executeMissingVerificationScenarioRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const path = 'src/universal-behavioral-verification/c1-verification-plan-repair.json';
  const existing = ctx.workspaceFiles.find((f) => f.relativePath === path);
  const payload = JSON.stringify({
    repairStrategy: 'missing-verification-scenario-repair.v1',
    behaviorIds: ctx.finding.behaviorIds,
    source: 'B10_composition_verification_requirements',
  }, null, 2);
  if (existing) return { applied: false, mutation: null, error: 'already_exists' };
  ctx.workspaceFiles.push({ relativePath: path, content: `${payload}\n` });
  return {
    applied: true,
    mutation: {
      mutationId: 'mut-b8-scenario',
      strategyId: MISSING_VERIFICATION_SCENARIO_STRATEGY.strategyId,
      targetPath: path,
      targetAuthority: 'B8',
      mutationType: 'ADD_VERIFICATION_ENTRY',
      expectedBeforeFingerprint: '',
      expectedAfterFingerprint: 'created',
      contributionIds: [],
      requirementIds: ctx.finding.requirementIds,
      behaviorIds: ctx.finding.behaviorIds,
      reason: 'add B8 verification plan entry',
      rollbackData: '',
      provenance: ['missing-verification-scenario-repair.v1'],
    },
    error: null,
  };
}
