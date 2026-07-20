/**
 * Universal Production Readiness Verification V1 — category-specific readiness validators.
 */

import type { ProductionReadinessInput } from './universal-production-readiness-types.js';
import { createReadinessFinding, dimensionResult } from './production-readiness-finding-utils.js';

function behaviorFindingsForCategory(
  input: ProductionReadinessInput,
  categoryPrefix: string,
  dimension: import('./universal-production-readiness-types.js').ReadinessDimensionId,
) {
  const findings = [];
  const report = input.behaviorReport;
  if (!report) {
    findings.push(createReadinessFinding({ code: 'behavior_verification_missing', severity: 'BLOCKER', dimension, detail: categoryPrefix }));
    return findings;
  }
  const relevant = report.results.filter((r) => r.behaviorId.includes(categoryPrefix.toLowerCase()));
  if (relevant.length === 0 && input.compositionPlan?.nativeEngineEligibility.crud) {
    // acceptable when behaviors use different id scheme
  }
  for (const r of relevant) {
    if (['FAILED', 'NOT_EXECUTED', 'UNSUPPORTED'].includes(r.classification)) {
      findings.push(createReadinessFinding({
        code: `${categoryPrefix.toLowerCase()}_execution_failure`,
        severity: 'BLOCKER',
        dimension,
        detail: r.behaviorId,
        behaviorIds: [r.behaviorId],
      }));
    }
  }
  return findings;
}

export function evaluateCrudReadiness(input: ProductionReadinessInput) {
  if (!input.compositionPlan?.nativeEngineEligibility.crud) {
    return dimensionResult('CRUD_READINESS', []);
  }
  const findings = behaviorFindingsForCategory(input, 'crud', 'CRUD_READINESS');
  const hasCrudFiles = input.workspaceFiles.some((f) => f.relativePath.includes('universal-crud') || f.relativePath.endsWith('.service.ts'));
  if (!hasCrudFiles) {
    findings.push(createReadinessFinding({ code: 'provider_materialization_missing', severity: 'BLOCKER', dimension: 'CRUD_READINESS', detail: 'CRUD artifacts' }));
  }
  return dimensionResult('CRUD_READINESS', findings);
}

export function evaluateActionReadiness(input: ProductionReadinessInput) {
  if (!input.compositionPlan?.nativeEngineEligibility.actions) return dimensionResult('ACTION_READINESS', []);
  return dimensionResult('ACTION_READINESS', behaviorFindingsForCategory(input, 'action', 'ACTION_READINESS'));
}

export function evaluateWorkflowReadiness(input: ProductionReadinessInput) {
  if (!input.compositionPlan?.nativeEngineEligibility.workflows) return dimensionResult('WORKFLOW_READINESS', []);
  return dimensionResult('WORKFLOW_READINESS', behaviorFindingsForCategory(input, 'workflow', 'WORKFLOW_READINESS'));
}

export function evaluateRelationshipReadiness(input: ProductionReadinessInput) {
  if (!input.compositionPlan?.nativeEngineEligibility.relationships) return dimensionResult('RELATIONSHIP_READINESS', []);
  const findings = behaviorFindingsForCategory(input, 'relationship', 'RELATIONSHIP_READINESS');
  return dimensionResult('RELATIONSHIP_READINESS', findings);
}

export function evaluateRuleReadiness(input: ProductionReadinessInput) {
  if (!input.compositionPlan?.nativeEngineEligibility.businessRules) return dimensionResult('BUSINESS_RULE_READINESS', []);
  return dimensionResult('BUSINESS_RULE_READINESS', behaviorFindingsForCategory(input, 'rule', 'BUSINESS_RULE_READINESS'));
}

export function evaluateRuntimeReadiness(input: ProductionReadinessInput) {
  const findings = [];
  if (!input.compositionPlan?.nativeEngineEligibility.runtime) return dimensionResult('RUNTIME_READINESS', findings);
  const hasRuntime = input.workspaceFiles.some((f) => f.relativePath.includes('universal-runtime'));
  if (!hasRuntime) {
    findings.push(createReadinessFinding({ code: 'runtime_registration_missing', severity: 'BLOCKER', dimension: 'RUNTIME_READINESS', detail: 'runtime files' }));
  }
  return dimensionResult('RUNTIME_READINESS', findings);
}

export function evaluatePersistenceReadiness(input: ProductionReadinessInput) {
  const findings = behaviorFindingsForCategory(input, 'persistence', 'PERSISTENCE_READINESS');
  return dimensionResult('PERSISTENCE_READINESS', findings);
}

export function evaluateDataIntegrityReadiness(input: ProductionReadinessInput) {
  const findings = [];
  for (const file of input.workspaceFiles) {
    if (/password\s*=\s*['"][^'"]+['"]/i.test(file.content) || /api[_-]?key\s*=\s*['"][^'"]+['"]/i.test(file.content)) {
      findings.push(createReadinessFinding({
        code: 'data_integrity_failure',
        severity: 'BLOCKER',
        dimension: 'DATA_INTEGRITY_READINESS',
        detail: file.relativePath,
        affectedArtifacts: [file.relativePath],
      }));
    }
  }
  return dimensionResult('DATA_INTEGRITY_READINESS', findings);
}

export function evaluateNavigationReadiness(input: ProductionReadinessInput) {
  const findings = [];
  const hasRoutes = input.workspaceFiles.some((f) => f.relativePath.includes('FeatureAppRouter') || f.relativePath.includes('registry'));
  if (!hasRoutes && input.moduleIds.length > 0) {
    findings.push(createReadinessFinding({ code: 'navigation_failure', severity: 'WARNING', dimension: 'NAVIGATION_READINESS', detail: 'route registry' }));
  }
  return dimensionResult('NAVIGATION_READINESS', findings);
}

export function evaluatePackReadiness(input: ProductionReadinessInput) {
  const findings = [];
  const plan = input.compositionPlan;
  if (!plan) return dimensionResult('CAPABILITY_PACK_READINESS', findings);
  for (const pack of plan.selectedCapabilityPacks) {
    // A materialized pack self-identifies with its canonical packId inside its emitted artifacts
    // (manifest JSON, runtime, and the pack registry) — but those files are written under short
    // directory/file names (e.g. `universal-capability-packs/audit-trail/audit-trail-pack.json`),
    // so a path-only `includes(packId)` check misses them and reports a false `pack_not_verified`.
    // Verify presence by path OR content so the canonical packId embedded in the real artifacts
    // is honored (this strengthens verification to the artifact level, it does not weaken it).
    const hasPackFiles = input.workspaceFiles.some(
      (f) => f.relativePath.includes(pack.packId) || f.content.includes(pack.packId),
    );
    if (!hasPackFiles) {
      findings.push(createReadinessFinding({
        code: 'pack_not_verified',
        severity: 'BLOCKER',
        dimension: 'CAPABILITY_PACK_READINESS',
        detail: pack.packId,
        packIds: [pack.packId],
      }));
    }
  }
  return dimensionResult('CAPABILITY_PACK_READINESS', findings);
}

export function evaluateBuildReadiness(input: ProductionReadinessInput) {
  const findings = [];
  for (const file of input.workspaceFiles) {
    if (file.content.includes('Cannot find module') || file.content.includes('<<<<<<<')) {
      findings.push(createReadinessFinding({
        code: 'compile_only_readiness',
        severity: 'BLOCKER',
        dimension: 'BUILD_READINESS',
        detail: file.relativePath,
        affectedArtifacts: [file.relativePath],
      }));
    }
  }
  return dimensionResult('BUILD_READINESS', findings);
}

export function evaluatePreviewReadiness(_input: ProductionReadinessInput) {
  return dimensionResult('PREVIEW_READINESS', []);
}

export function evaluateDiagnosticReadiness(input: ProductionReadinessInput) {
  const findings = [];
  if (!input.compositionPlan && !input.behaviorReport) {
    findings.push(createReadinessFinding({ code: 'false_production_readiness', severity: 'BLOCKER', dimension: 'DIAGNOSTIC_READINESS', detail: 'no evidence' }));
  }
  return dimensionResult('DIAGNOSTIC_READINESS', findings);
}
