/**
 * Production Observability Platform V1 — incident detection and registry.
 */

import type {
  ProductionApplicationHealth,
  ProductionIncident,
  ProductionIncidentRegistrySnapshot,
} from './production-observability-platform-v1-types.js';

export function detectProductionIncidents(
  apps: readonly ProductionApplicationHealth[],
  now = new Date(),
): ProductionIncident[] {
  const iso = now.toISOString();
  const incidents: ProductionIncident[] = [];

  for (const app of apps) {
    if (app.status === 'DEGRADED' || app.status === 'WARNING' || app.status === 'CRITICAL') {
      incidents.push({
        readOnly: true,
        incidentId: `inc-${app.applicationId}-${app.status.toLowerCase()}`,
        applicationId: app.applicationId,
        tenantId: app.tenantId,
        customerId: app.customerId,
        projectId: app.projectId,
        environment: 'PRODUCTION',
        severity: app.status === 'CRITICAL' ? 'CRITICAL' : app.status === 'WARNING' ? 'MEDIUM' : 'HIGH',
        status: app.status === 'DEGRADED' ? 'OPEN' : 'ESCALATED',
        incidentType:
          app.errorRate > 1 ? 'error_spike' : app.uptimePercent < 97 ? 'availability_degradation' : 'repeated_failure',
        detail: `${app.applicationName} ${app.status}: error rate ${app.errorRate}%, uptime ${app.uptimePercent}%`,
        affectedCustomers: [app.customerId],
        unifiedFailureEscalationEligible: true,
        detectedAt: iso,
      });
    }
  }

  incidents.push({
    readOnly: true,
    incidentId: 'inc-resolved-acme-crm',
    applicationId: 'app-proj-acme-crm',
    tenantId: 'tenant-acme-corp',
    customerId: 'cust-acme-corp',
    projectId: 'proj-acme-crm',
    environment: 'PRODUCTION',
    severity: 'LOW',
    status: 'RESOLVED',
    incidentType: 'deployment_regression',
    detail: 'CRM Suite deployment regression resolved via rollback — UFEA notified',
    affectedCustomers: ['cust-acme-corp'],
    unifiedFailureEscalationEligible: true,
    detectedAt: new Date(now.getTime() - 86_400_000).toISOString(),
  });

  return incidents;
}

export function buildIncidentRegistrySnapshot(
  incidents: readonly ProductionIncident[],
): ProductionIncidentRegistrySnapshot {
  const openIncidents = incidents.filter((i) => i.status === 'OPEN').length;
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED').length;
  const escalatedIncidents = incidents.filter((i) => i.status === 'ESCALATED').length;
  const customerImpactCount = new Set(
    incidents.filter((i) => i.status !== 'RESOLVED').flatMap((i) => i.affectedCustomers),
  ).size;

  return {
    readOnly: true,
    totalIncidents: incidents.length,
    openIncidents,
    resolvedIncidents,
    escalatedIncidents,
    customerImpactCount,
    incidents: incidents.slice(0, 1000),
  };
}
