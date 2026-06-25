/**
 * Customer Operations Platform V1 — customer support registry (visibility only).
 */

import { DEMO_CUSTOMER_SUITE } from './customer-platform-registry.js';
import type { SupportIncident } from './customer-operations-platform-v1-types.js';

export function buildCustomerSupportRegistry(now = new Date()): SupportIncident[] {
  const iso = now.toISOString();
  const incidents: SupportIncident[] = [
    {
      readOnly: true,
      incidentId: 'support-acme-onboarding',
      customerId: 'cust-acme-corp',
      tenantId: 'tenant-acme-corp',
      category: 'support_request',
      status: 'RESOLVED',
      detail: 'Acme Corp onboarding assistance — workspace provisioning verified',
      createdAt: iso,
    },
    {
      readOnly: true,
      incidentId: 'support-nova-quota',
      customerId: 'cust-nova-labs',
      tenantId: 'tenant-nova-labs',
      category: 'customer_incident',
      status: 'IN_PROGRESS',
      detail: 'Nova Labs quota review — BUSINESS plan concurrent execution limit advisory',
      createdAt: iso,
    },
    {
      readOnly: true,
      incidentId: 'support-platform-health',
      customerId: 'cust-starter-studio',
      tenantId: 'tenant-starter-studio',
      category: 'platform_issue',
      status: 'OPEN',
      detail: 'Starter Studio trial activation — first project guidance',
      createdAt: iso,
    },
  ];
  return incidents.filter((i) => DEMO_CUSTOMER_SUITE.some((c) => c.customerId === i.customerId));
}
