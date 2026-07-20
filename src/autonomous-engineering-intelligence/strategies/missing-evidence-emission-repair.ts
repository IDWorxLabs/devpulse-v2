import { baseDescriptor, type RepairStrategyExecutionContext, type RepairStrategyExecutionResult } from './strategy-utils.js';

export const MISSING_EVIDENCE_EMISSION_STRATEGY = baseDescriptor({
  strategyId: 'missing-evidence-emission-repair.v1',
  strategyVersion: '1.0.0',
  supportedDiagnosticCodes: ['evidence_missing', 'traceability_gap', 'behavior_verification_missing'],
  supportedRepairCategories: ['MISSING_EVIDENCE_EMISSION'],
  requiredSourceAuthorities: ['B11_PRODUCTION_READINESS'],
  requiredExistingGenerators: ['B8', 'B9', 'B11'],
  mutationAllowlist: ['src/autonomous-engineering-intelligence/'],
  mutationDenylist: [],
  supportedArtifactPatterns: ['src/autonomous-engineering-intelligence/**'],
  safetyClassification: 'SAFE_DETERMINISTIC',
  productionSupportStatus: 'FUNCTIONAL_REFERENCE',
  maximumAttempts: 1,
  provenance: ['missing-evidence-emission-repair.v1'],
});

export function executeMissingEvidenceEmissionRepair(ctx: RepairStrategyExecutionContext): RepairStrategyExecutionResult {
  const path = 'src/autonomous-engineering-intelligence/evidence-adapter-repair.json';
  if (ctx.workspaceFiles.some((f) => f.relativePath === path)) {
    return { applied: false, mutation: null, error: 'already_exists' };
  }
  const payload = {
    strategy: MISSING_EVIDENCE_EMISSION_STRATEGY.strategyId,
    readinessEvaluationId: ctx.input.readinessReport?.readinessEvaluationId ?? '',
    behaviorReportId: ctx.input.behaviorReport?.reportId ?? '',
    note: 'evidence adapter — requires B8 re-execution for VERIFIED classification',
  };
  ctx.workspaceFiles.push({ relativePath: path, content: `${JSON.stringify(payload, null, 2)}\n` });
  return {
    applied: true,
    mutation: {
      mutationId: 'mut-evidence-adapter',
      strategyId: MISSING_EVIDENCE_EMISSION_STRATEGY.strategyId,
      targetPath: path,
      targetAuthority: 'B11',
      mutationType: 'ADD_EVIDENCE_ADAPTER',
      expectedBeforeFingerprint: '',
      expectedAfterFingerprint: 'created',
      contributionIds: [],
      requirementIds: ctx.finding.requirementIds,
      behaviorIds: ctx.finding.behaviorIds,
      reason: 'add evidence emission adapter',
      rollbackData: '',
      provenance: ['missing-evidence-emission-repair.v1'],
    },
    error: null,
  };
}
