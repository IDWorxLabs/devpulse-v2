/**
 * Customer Operations Platform V1 — demo customer suite and registries.
 */

import type {
  CustomerAccount,
  CustomerProjectRecord,
  PlanDefinition,
  TenantRecord,
} from './customer-operations-platform-v1-types.js';
import { PLAN_TYPES } from './customer-operations-platform-v1-bounds.js';

export const DEMO_CUSTOMER_SUITE: readonly {
  customerId: string;
  organizationName: string;
  ownerUserId: string;
  email: string;
  status: CustomerAccount['status'];
  planType: CustomerAccount['planType'];
  tenantId: string;
  projects: readonly { projectId: string; projectName: string; profile: string }[];
}[] = [
  {
    customerId: 'cust-acme-corp',
    organizationName: 'Acme Corp',
    ownerUserId: 'user-acme-owner',
    email: 'ops@acme-corp.example',
    status: 'ACTIVE',
    planType: 'PRO',
    tenantId: 'tenant-acme-corp',
    projects: [
      { projectId: 'proj-acme-task-tracker', projectName: 'Task Tracker', profile: 'TASK_TRACKER_WEB_V1' },
      { projectId: 'proj-acme-crm', projectName: 'CRM Suite', profile: 'CRM_WEB_V1' },
    ],
  },
  {
    customerId: 'cust-nova-labs',
    organizationName: 'Nova Labs',
    ownerUserId: 'user-nova-owner',
    email: 'platform@nova-labs.example',
    status: 'ACTIVE',
    planType: 'BUSINESS',
    tenantId: 'tenant-nova-labs',
    projects: [
      { projectId: 'proj-nova-marketplace', projectName: 'Marketplace', profile: 'MARKETPLACE_WEB_V1' },
      { projectId: 'proj-nova-pm', projectName: 'Project Management', profile: 'PROJECT_MANAGEMENT_WEB_V1' },
    ],
  },
  {
    customerId: 'cust-starter-studio',
    organizationName: 'Starter Studio',
    ownerUserId: 'user-starter-owner',
    email: 'hello@starter-studio.example',
    status: 'TRIAL',
    planType: 'FREE',
    tenantId: 'tenant-starter-studio',
    projects: [
      { projectId: 'proj-starter-booking', projectName: 'Booking Platform', profile: 'APPOINTMENT_BOOKING_WEB_V1' },
    ],
  },
];

export function buildCustomerAccounts(now = new Date()): CustomerAccount[] {
  const iso = now.toISOString();
  return DEMO_CUSTOMER_SUITE.map((c) => ({
    readOnly: true as const,
    customerId: c.customerId,
    organizationName: c.organizationName,
    ownerUserId: c.ownerUserId,
    email: c.email,
    status: c.status,
    createdAt: iso,
    lastActiveAt: iso,
    planType: c.planType,
    tenantId: c.tenantId,
  }));
}

export function buildTenantRegistry(now = new Date()): TenantRecord[] {
  const iso = now.toISOString();
  return DEMO_CUSTOMER_SUITE.map((c) => ({
    readOnly: true as const,
    tenantId: c.tenantId,
    customerId: c.customerId,
    organizationName: c.organizationName,
    status: 'ACTIVE' as const,
    createdAt: iso,
    isolationBoundary: `isolated-workspace://${c.tenantId}`,
  }));
}

export function buildCustomerProjectRegistry(now = new Date()): CustomerProjectRecord[] {
  const iso = now.toISOString();
  const records: CustomerProjectRecord[] = [];

  for (const customer of DEMO_CUSTOMER_SUITE) {
    for (const project of customer.projects) {
      records.push({
        readOnly: true,
        projectId: project.projectId,
        customerId: customer.customerId,
        tenantId: customer.tenantId,
        projectName: project.projectName,
        profile: project.profile,
        buildHistoryCount: 3,
        launchHistoryCount: 2,
        productionHistoryCount: 1,
        world2HistoryCount: 2,
        createdAt: iso,
      });
    }
  }

  return records;
}

export function buildPlanDefinitions(): PlanDefinition[] {
  const plans: PlanDefinition[] = [
    {
      readOnly: true,
      planType: 'FREE',
      monthlyProjectLimit: 2,
      monthlyBuildLimit: 20,
      concurrentExecutionLimit: 1,
      world2ExecutionLimit: 2,
      upgradePath: 'PRO',
    },
    {
      readOnly: true,
      planType: 'PRO',
      monthlyProjectLimit: 10,
      monthlyBuildLimit: 200,
      concurrentExecutionLimit: 3,
      world2ExecutionLimit: 10,
      upgradePath: 'BUSINESS',
    },
    {
      readOnly: true,
      planType: 'BUSINESS',
      monthlyProjectLimit: 50,
      monthlyBuildLimit: 1000,
      concurrentExecutionLimit: 10,
      world2ExecutionLimit: 50,
      upgradePath: 'ENTERPRISE',
    },
    {
      readOnly: true,
      planType: 'ENTERPRISE',
      monthlyProjectLimit: 999,
      monthlyBuildLimit: 9999,
      concurrentExecutionLimit: 50,
      world2ExecutionLimit: 999,
      upgradePath: null,
    },
  ];
  return plans.filter((p) => PLAN_TYPES.includes(p.planType));
}

export function getTenantForProject(
  projectId: string,
  projects: readonly CustomerProjectRecord[],
): string | null {
  return projects.find((p) => p.projectId === projectId)?.tenantId ?? null;
}

export function getCustomerForTenant(
  tenantId: string,
  tenants: readonly TenantRecord[],
): string | null {
  return tenants.find((t) => t.tenantId === tenantId)?.customerId ?? null;
}
