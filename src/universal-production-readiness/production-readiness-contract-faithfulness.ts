/**
 * Universal Production Readiness Verification V1 — contract faithfulness.
 */

import type { ProductionReadinessInput } from './universal-production-readiness-types.js';
import { createReadinessFinding, dimensionResult } from './production-readiness-finding-utils.js';

export function evaluateContractFaithfulness(input: ProductionReadinessInput) {
  const findings = [];
  const envelope = input.envelope;
  const approvedModules = envelope.approvedModulePlan.moduleIds;

  for (const moduleId of input.moduleIds) {
    if (!approvedModules.some((m) => m === moduleId || moduleId.includes(m))) {
      findings.push(createReadinessFinding({
        code: 'requirement_silently_dropped',
        severity: 'WARNING',
        dimension: 'CONTRACT_FAITHFULNESS',
        detail: `module ${moduleId}`,
        affectedArtifacts: [`src/features/${moduleId}`],
      }));
    }
  }

  const hasFeatureFiles = input.moduleIds.every((m) =>
    input.workspaceFiles.some((f) => f.relativePath.startsWith(`src/features/${m}/`)),
  );
  if (!hasFeatureFiles && input.moduleIds.length > 0) {
    findings.push(createReadinessFinding({
      code: 'contribution_missing',
      severity: 'BLOCKER',
      dimension: 'CONTRACT_FAITHFULNESS',
      detail: 'approved modules not materialized',
    }));
  }

  return dimensionResult('CONTRACT_FAITHFULNESS', findings);
}
