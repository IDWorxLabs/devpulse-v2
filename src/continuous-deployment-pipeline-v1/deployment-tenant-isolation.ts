/**
 * Continuous Deployment Pipeline V1 — tenant isolation for deployment views.
 */

import type {
  DeploymentCandidate,
  ProductionDeploymentHistoryEntry,
} from './continuous-deployment-pipeline-v1-types.js';

export function assessDeploymentTenantIsolation(input: {
  candidates: readonly DeploymentCandidate[];
  history: readonly ProductionDeploymentHistoryEntry[];
}): { isolationViolations: number; isolationProven: boolean } {
  let violations = 0;
  const tenantByCustomer = new Map<string, string>();

  for (const candidate of input.candidates) {
    const prior = tenantByCustomer.get(candidate.customerId);
    if (prior && prior !== candidate.tenantId) violations += 1;
    tenantByCustomer.set(candidate.customerId, candidate.tenantId);

    if (!candidate.tenantId || !candidate.customerId || !candidate.deploymentOwner) {
      violations += 1;
    }
  }

  for (const entry of input.history) {
    const candidate = input.candidates.find((c) => c.candidateId === entry.candidateId);
    if (candidate && candidate.tenantId !== entry.tenantId) violations += 1;
    if (!entry.deploymentOwner) violations += 1;
  }

  return {
    isolationViolations: violations,
    isolationProven: violations === 0,
  };
}
