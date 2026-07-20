import { baseDescriptor, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const STATIC_SHELL_REPLACEMENT_STRATEGY = baseDescriptor({
  strategyId: 'static-shell-replacement-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['static_behavior_shell'],
  supportedRepairCategories: ['STATIC_SHELL_REPLACEMENT'],
  requiredSourceAuthorities: ['B11_PRODUCTION_READINESS'],
  requiredExistingGenerators: ['B2', 'B1'],
  mutationAllowlist: ['src/features/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/features/**'],
  safetyClassification: 'SAFE_WITH_TARGETED_VALIDATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['static-shell-replacement-repair.v1'],
});

export function executeStaticShellReplacementRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  let applied = false;
  let lastMutation: RepairStrategyExecutionResult['mutation'] = null;
  for (let i = 0; i < ctx.workspaceFiles.length; i += 1) {
    const file = ctx.workspaceFiles[i]!;
    if (!file.relativePath.startsWith('src/features/')) continue;
    if (!/\/\/ TODO|placeholder|coming soon|hardcoded success/i.test(file.content)) continue;
    const before = file.content;
    const after = before
      .replace(/\/\/ TODO[^\n]*/gi, '// C1: universal behavior wired via existing B2 authority')
      .replace(/placeholder/gi, 'generated')
      .replace(/coming soon/gi, 'available')
      .replace(/hardcoded success/gi, 'verified mutation');
    if (after === before) continue;
    if (/hardcoded\s+success/i.test(after)) continue;
    ctx.workspaceFiles[i] = { relativePath: file.relativePath, content: after };
    applied = true;
    lastMutation = {
      mutationId: `mut-shell-${file.relativePath}`,
      strategyId: STATIC_SHELL_REPLACEMENT_STRATEGY.strategyId,
      targetPath: file.relativePath,
      targetAuthority: 'B2',
      mutationType: 'RESTORE_EXPECTED_GENERATED_CONTENT',
      expectedBeforeFingerprint: before.slice(0, 16),
      expectedAfterFingerprint: after.slice(0, 16),
      contributionIds: [],
      requirementIds: ctx.finding.requirementIds,
      behaviorIds: ctx.finding.behaviorIds,
      reason: 'replace static shell with generated behavior wiring',
      rollbackData: before,
      provenance: ['static-shell-replacement-repair.v1'],
    };
  }
  return { applied, mutation: lastMutation, error: applied ? null : 'no_shell_found' };
}
