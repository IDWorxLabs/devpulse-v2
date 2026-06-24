/**
 * Customer Operations Platform V1 — tenant management authority.
 */

import type { TenantRecord } from './customer-operations-platform-v1-types.js';
import { buildTenantRegistry } from './customer-platform-registry.js';

export interface TenantManagementAction {
  readOnly: true;
  action: 'CREATE' | 'SUSPEND' | 'ARCHIVE' | 'TRANSFER_OWNERSHIP';
  tenantId: string;
  customerId: string;
  rationale: string;
  isolationMaintained: true;
}

export function createTenantManagementPlan(tenants: readonly TenantRecord[]): TenantManagementAction[] {
  return tenants.map((t) => ({
    readOnly: true as const,
    action: 'CREATE' as const,
    tenantId: t.tenantId,
    customerId: t.customerId,
    rationale: `Tenant ${t.tenantId} created with isolation boundary ${t.isolationBoundary}`,
    isolationMaintained: true as const,
  }));
}

export function provisionTenantsForCustomers(now = new Date()): TenantRecord[] {
  return buildTenantRegistry(now);
}
