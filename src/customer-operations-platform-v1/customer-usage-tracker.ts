/**
 * Customer Operations Platform V1 — usage tracking.
 */

import { DEMO_CUSTOMER_SUITE } from './customer-platform-registry.js';
import type { CustomerUsageMetrics } from './customer-operations-platform-v1-types.js';

const USAGE_BY_PLAN: Record<
  string,
  Omit<CustomerUsageMetrics, 'readOnly' | 'customerId' | 'tenantId'>
> = {
  FREE: {
    projectsCreated: 1,
    buildsExecuted: 8,
    verificationsExecuted: 6,
    world2Executions: 2,
    concurrentExecutions: 1,
    productionDeployments: 0,
  },
  PRO: {
    projectsCreated: 2,
    buildsExecuted: 24,
    verificationsExecuted: 20,
    world2Executions: 8,
    concurrentExecutions: 2,
    productionDeployments: 2,
  },
  BUSINESS: {
    projectsCreated: 2,
    buildsExecuted: 40,
    verificationsExecuted: 36,
    world2Executions: 12,
    concurrentExecutions: 4,
    productionDeployments: 4,
  },
  ENTERPRISE: {
    projectsCreated: 10,
    buildsExecuted: 200,
    verificationsExecuted: 180,
    world2Executions: 50,
    concurrentExecutions: 20,
    productionDeployments: 15,
  },
};

export function trackCustomerUsage(): CustomerUsageMetrics[] {
  return DEMO_CUSTOMER_SUITE.map((c) => {
    const usage = USAGE_BY_PLAN[c.planType] ?? USAGE_BY_PLAN.FREE;
    return {
      readOnly: true as const,
      customerId: c.customerId,
      tenantId: c.tenantId,
      ...usage,
      projectsCreated: c.projects.length,
    };
  });
}

export function aggregatePlatformUsage(metrics: readonly CustomerUsageMetrics[]): {
  totalProjects: number;
  totalBuilds: number;
  totalVerifications: number;
  totalWorld2: number;
  totalConcurrent: number;
  totalProduction: number;
} {
  return {
    totalProjects: metrics.reduce((s, m) => s + m.projectsCreated, 0),
    totalBuilds: metrics.reduce((s, m) => s + m.buildsExecuted, 0),
    totalVerifications: metrics.reduce((s, m) => s + m.verificationsExecuted, 0),
    totalWorld2: metrics.reduce((s, m) => s + m.world2Executions, 0),
    totalConcurrent: metrics.reduce((s, m) => s + m.concurrentExecutions, 0),
    totalProduction: metrics.reduce((s, m) => s + m.productionDeployments, 0),
  };
}
