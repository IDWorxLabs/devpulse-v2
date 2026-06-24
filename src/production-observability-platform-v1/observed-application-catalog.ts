/**
 * Production Observability Platform V1 — observed applications from Customer Operations.
 */

import { DEMO_CUSTOMER_SUITE } from '../customer-operations-platform-v1/customer-platform-registry.js';
import type {
  DeploymentRecord,
  ProductionApplicationHealth,
  RuntimeMetricsSnapshot,
} from './production-observability-platform-v1-types.js';

const HEALTH_BY_PROJECT: Record<
  string,
  {
    status: ProductionApplicationHealth['status'];
    uptime: number;
    errorRate: number;
    latency: number;
    env: DeploymentRecord['environment'];
  }
> = {
  'proj-acme-task-tracker': { status: 'HEALTHY', uptime: 99.95, errorRate: 0.02, latency: 92, env: 'PRODUCTION' },
  'proj-acme-crm': { status: 'HEALTHY', uptime: 99.91, errorRate: 0.05, latency: 88, env: 'PRODUCTION' },
  'proj-nova-marketplace': { status: 'DEGRADED', uptime: 98.2, errorRate: 1.2, latency: 72, env: 'PRODUCTION' },
  'proj-nova-pm': { status: 'HEALTHY', uptime: 99.88, errorRate: 0.08, latency: 85, env: 'STAGING' },
  'proj-starter-booking': { status: 'WARNING', uptime: 96.5, errorRate: 0.9, latency: 78, env: 'PRODUCTION' },
};

function availabilityScore(uptime: number): number {
  if (uptime >= 99.9) return 100;
  if (uptime >= 99) return 90;
  if (uptime >= 95) return 75;
  return 50;
}

export function buildObservedApplications(now = new Date()): ProductionApplicationHealth[] {
  const iso = now.toISOString();
  const apps: ProductionApplicationHealth[] = [];

  for (const customer of DEMO_CUSTOMER_SUITE) {
    for (const project of customer.projects) {
      const meta = HEALTH_BY_PROJECT[project.projectId] ?? {
        status: 'HEALTHY' as const,
        uptime: 99.5,
        errorRate: 0.1,
        latency: 80,
        env: 'PRODUCTION' as const,
      };

      apps.push({
        readOnly: true,
        applicationId: `app-${project.projectId}`,
        tenantId: customer.tenantId,
        customerId: customer.customerId,
        projectId: project.projectId,
        applicationName: project.projectName,
        status: meta.status,
        uptimePercent: meta.uptime,
        availabilityScore: availabilityScore(meta.uptime),
        errorRate: meta.errorRate,
        latencyScore: meta.latency,
        deploymentStatus: meta.status === 'OFFLINE' ? 'FAILED' : 'DEPLOYED',
        lastObservedAt: iso,
      });
    }
  }

  return apps;
}

export function buildDeploymentRegistry(now = new Date()): DeploymentRecord[] {
  const iso = now.toISOString();
  const deployments: DeploymentRecord[] = [];

  for (const customer of DEMO_CUSTOMER_SUITE) {
    for (const project of customer.projects) {
      const meta = HEALTH_BY_PROJECT[project.projectId];
      const env = meta?.env ?? 'PRODUCTION';
      deployments.push({
        readOnly: true,
        deploymentId: `deploy-${project.projectId}-prod`,
        projectId: project.projectId,
        tenantId: customer.tenantId,
        customerId: customer.customerId,
        environment: env,
        version: '1.0.0',
        deployedAt: iso,
        deploymentHealth: meta?.status ?? 'HEALTHY',
        rollbackAvailable: true,
      });
    }
  }

  return deployments;
}

export function collectRuntimeMetrics(
  apps: readonly ProductionApplicationHealth[],
): RuntimeMetricsSnapshot[] {
  return apps.map((app) => ({
    readOnly: true,
    applicationId: app.applicationId,
    responseTimeMs: Math.round(120 + (100 - app.latencyScore) * 2),
    errorRate: app.errorRate,
    availabilityPercent: app.uptimePercent,
    deploymentSuccess: app.deploymentStatus === 'DEPLOYED',
    crashCount: app.status === 'CRITICAL' ? 3 : app.status === 'WARNING' ? 1 : 0,
    recoveryCount: app.status === 'HEALTHY' ? 2 : 1,
  }));
}
