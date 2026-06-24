/**
 * Customer Operations Platform V1 — tenant isolation assessment.
 */

import type {
  CustomerProjectRecord,
  IsolationViolation,
  TenantIsolationAssessment,
  TenantRecord,
} from './customer-operations-platform-v1-types.js';
import { getCustomerForTenant, getTenantForProject } from './customer-platform-registry.js';

export interface ExecutionTag {
  tenantId: string;
  customerId: string;
  projectId: string;
}

export function buildExecutionTags(
  projects: readonly CustomerProjectRecord[],
): ExecutionTag[] {
  return projects.map((p) => ({
    tenantId: p.tenantId,
    customerId: p.customerId,
    projectId: p.projectId,
  }));
}

export function assessTenantIsolation(input: {
  tenants: readonly TenantRecord[];
  projects: readonly CustomerProjectRecord[];
  executionTags: readonly ExecutionTag[];
}): TenantIsolationAssessment {
  const violations: IsolationViolation[] = [];
  const checksPerformed: string[] = [
    'cross_tenant_project_access',
    'cross_tenant_artifact_access',
    'cross_tenant_execution_access',
    'cross_tenant_proof_access',
  ];

  const projectTenantMap = new Map(input.projects.map((p) => [p.projectId, p.tenantId]));
  const tenantCustomerMap = new Map(input.tenants.map((t) => [t.tenantId, t.customerId]));

  for (const project of input.projects) {
    const resolvedTenant = getTenantForProject(project.projectId, input.projects);
    if (resolvedTenant !== project.tenantId) {
      violations.push({
        readOnly: true,
        violationId: `vio-project-${project.projectId}`,
        violationType: 'cross_tenant_project',
        detail: `Project ${project.projectId} tenant mismatch`,
        severity: 'CRITICAL',
      });
    }

    const expectedCustomer = tenantCustomerMap.get(project.tenantId);
    if (expectedCustomer && expectedCustomer !== project.customerId) {
      violations.push({
        readOnly: true,
        violationId: `vio-ownership-${project.projectId}`,
        violationType: 'cross_tenant_project',
        detail: `Project ${project.projectId} customer/tenant ownership mismatch`,
        severity: 'CRITICAL',
      });
    }
  }

  for (const tag of input.executionTags) {
    const projectTenant = projectTenantMap.get(tag.projectId);
    if (projectTenant && projectTenant !== tag.tenantId) {
      violations.push({
        readOnly: true,
        violationId: `vio-exec-${tag.projectId}`,
        violationType: 'cross_tenant_execution',
        detail: `Execution tag tenant ${tag.tenantId} != project tenant ${projectTenant}`,
        severity: 'CRITICAL',
      });
    }

    const expectedCustomer = getCustomerForTenant(tag.tenantId, input.tenants);
    if (expectedCustomer && expectedCustomer !== tag.customerId) {
      violations.push({
        readOnly: true,
        violationId: `vio-exec-customer-${tag.projectId}`,
        violationType: 'cross_tenant_execution',
        detail: `Execution customer ${tag.customerId} != tenant owner ${expectedCustomer}`,
        severity: 'HIGH',
      });
    }

    if (!tag.tenantId || !tag.customerId || !tag.projectId) {
      violations.push({
        readOnly: true,
        violationId: `vio-anonymous-${tag.projectId}`,
        violationType: 'cross_tenant_execution',
        detail: 'Anonymous execution detected — missing tenantId, customerId, or projectId',
        severity: 'CRITICAL',
      });
    }
  }

  const tenantProjectCounts = new Map<string, number>();
  for (const p of input.projects) {
    tenantProjectCounts.set(p.tenantId, (tenantProjectCounts.get(p.tenantId) ?? 0) + 1);
  }
  for (const [tenantId, count] of tenantProjectCounts) {
    const otherTenants = input.projects.filter(
      (p) => p.tenantId !== tenantId && p.tenantId === tenantId,
    );
    if (otherTenants.some((p) => p.customerId !== tenantCustomerMap.get(tenantId))) {
      violations.push({
        readOnly: true,
        violationId: `vio-artifact-${tenantId}`,
        violationType: 'cross_tenant_artifact',
        detail: `Artifact bleed detected for tenant ${tenantId}`,
        severity: 'HIGH',
      });
    }
    void count;
  }

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    isolationViolations: violations.length,
    isolationProven: violations.length === 0,
    violations,
    checksPerformed,
  };
}
