/**
 * Production Observability Platform V1 — recovery recommendations (advisory only).
 */

import type {
  OperationalRecoveryRecommendation,
  ProductionIncident,
} from './production-observability-platform-v1-types.js';

export function buildRecoveryRecommendations(
  incidents: readonly ProductionIncident[],
): OperationalRecoveryRecommendation[] {
  const recommendations: OperationalRecoveryRecommendation[] = [];

  for (const incident of incidents.filter((i) => i.status === 'OPEN' || i.status === 'ESCALATED')) {
    let action: OperationalRecoveryRecommendation['action'] = 'Escalate to operator';
    let rationale = 'Operator review required for customer-impacting production incident.';

    if (incident.incidentType === 'deployment_regression') {
      action = 'Rollback deployment';
      rationale = 'Deployment regression detected — rollback available on deployment registry.';
    } else if (incident.incidentType === 'error_spike') {
      action = 'Rebuild deployment';
      rationale = 'Error spike exceeds threshold — rebuild with increased validation.';
    } else if (incident.incidentType === 'availability_degradation') {
      action = 'Increase validation frequency';
      rationale = 'Availability below healthy threshold — increase validation cadence via OEFA.';
    } else if (incident.severity === 'HIGH') {
      action = 'Launch World2 investigation';
      rationale = 'High-severity incident — World2 isolated investigation recommended.';
    }

    recommendations.push({
      readOnly: true,
      recommendationId: `rec-${incident.incidentId}`,
      incidentId: incident.incidentId,
      action,
      rationale,
      autonomousModificationAllowed: false,
    });
  }

  if (!recommendations.some((r) => r.action === 'Escalate to operator')) {
    recommendations.push({
      readOnly: true,
      recommendationId: 'rec-operator-standby',
      incidentId: incidents[0]?.incidentId ?? 'inc-standby',
      action: 'Escalate to operator',
      rationale: 'Production observability standby — UFEA decides escalation path for all incidents.',
      autonomousModificationAllowed: false,
    });
  }

  return recommendations;
}
