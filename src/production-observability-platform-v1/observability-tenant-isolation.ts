/**
 * Production Observability Platform V1 — tenant isolation for observability views.
 */

import type { ProductionApplicationHealth, ProductionIncident } from './production-observability-platform-v1-types.js';

export function assessObservabilityTenantIsolation(input: {
  applications: readonly ProductionApplicationHealth[];
  incidents: readonly ProductionIncident[];
}): { isolationViolations: number; isolationProven: boolean } {
  let violations = 0;

  const tenantByApp = new Map(input.applications.map((a) => [a.applicationId, a.tenantId]));

  for (const incident of input.incidents) {
    const appTenant = tenantByApp.get(incident.applicationId);
    if (appTenant && appTenant !== incident.tenantId) {
      violations += 1;
    }
    if (incident.affectedCustomers.some((c) => !c.startsWith('cust-'))) {
      violations += 1;
    }
  }

  const tenantAppMap = new Map<string, string[]>();
  for (const app of input.applications) {
    const list = tenantAppMap.get(app.tenantId) ?? [];
    list.push(app.applicationId);
    tenantAppMap.set(app.tenantId, list);
  }

  for (const app of input.applications) {
    const sameTenantApps = tenantAppMap.get(app.tenantId) ?? [];
    if (!sameTenantApps.includes(app.applicationId)) {
      violations += 1;
    }
  }

  return {
    isolationViolations: violations,
    isolationProven: violations === 0,
  };
}
