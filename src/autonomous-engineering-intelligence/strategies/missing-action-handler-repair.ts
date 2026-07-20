import { augmentCrudComponentWithUniversalActions } from '../../universal-action-materialization-engine/universal-action-materialization-engine.js';
import { buildActionMaterializationInputFromEnvelope } from '../../universal-action-materialization-engine/index.js';
import { baseDescriptor, fingerprintContent, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const MISSING_ACTION_HANDLER_STRATEGY = baseDescriptor({
  strategyId: 'missing-action-handler-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['required_behavior_not_executed'],
  supportedRepairCategories: ['MISSING_HANDLER'],
  requiredSourceAuthorities: ['B11_PRODUCTION_READINESS', 'B8_BEHAVIORAL_VERIFICATION'],
  requiredExistingGenerators: ['B2'],
  mutationAllowlist: ['src/features/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/features/**/*.tsx'],
  safetyClassification: 'GUARDED_PRODUCTION_MUTATION',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['missing-action-handler-repair.v1'],
});

export function executeMissingActionHandlerRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const component = ctx.workspaceFiles.find((f) => f.relativePath.endsWith('Feature.tsx') && f.relativePath.startsWith('src/features/'));
  if (!component) return { applied: false, mutation: null, error: 'no_component' };
  const moduleId = component.relativePath.split('/')[2] ?? 'module';
  const moduleEntry = ctx.input.envelope.approvedModulePlan.moduleEntries.find((e) => e.moduleId === moduleId);
  const before = component.content;
  const actionInput = buildActionMaterializationInputFromEnvelope({
    envelope: ctx.input.envelope,
    moduleId,
    moduleDisplayName: moduleEntry?.displayName ?? moduleId,
    moduleRoute: moduleEntry?.route ?? `/${moduleId}`,
    appTitle: ctx.input.envelope.approvedProductIdentity.displayName,
    contractId: ctx.input.contractId,
    crudBacked: true,
  });
  const after = augmentCrudComponentWithUniversalActions(before, moduleId, actionInput);
  if (after === before || /hardcoded\s+success/i.test(after)) {
    return { applied: false, mutation: null, error: 'repair_validation_failed' };
  }
  const idx = ctx.workspaceFiles.findIndex((f) => f.relativePath === component.relativePath);
  ctx.workspaceFiles[idx] = { relativePath: component.relativePath, content: after };
  return {
    applied: true,
    mutation: {
      mutationId: `mut-action-${moduleId}`,
      strategyId: MISSING_ACTION_HANDLER_STRATEGY.strategyId,
      targetPath: component.relativePath,
      targetAuthority: 'B2',
      mutationType: 'CONNECT_EXISTING_ADAPTER',
      expectedBeforeFingerprint: fingerprintContent(before),
      expectedAfterFingerprint: fingerprintContent(after),
      contributionIds: [],
      requirementIds: ctx.finding.requirementIds,
      behaviorIds: ctx.finding.behaviorIds,
      reason: 'wire B2 action handlers',
      rollbackData: before,
      provenance: ['missing-action-handler-repair.v1'],
    },
    error: null,
  };
}
