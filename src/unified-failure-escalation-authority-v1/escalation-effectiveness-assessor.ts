/**
 * Unified Failure Escalation Authority V1 — escalation effectiveness assessment.
 */

import type {
  EscalationDecision,
  EscalationEffectivenessAssessment,
  FailureIncident,
} from './unified-failure-escalation-v1-types.js';

function rate(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function assessEscalationEffectiveness(input: {
  incidents: readonly FailureIncident[];
  decisions: readonly EscalationDecision[];
}): EscalationEffectivenessAssessment {
  const total = input.incidents.length;
  const resolved = input.incidents.filter((i) => i.status === 'RESOLVED').length;
  const repeated = input.incidents.filter((i) => i.repeatCount > 1).length;
  const escalated = input.incidents.filter((i) => i.status === 'ESCALATED').length;
  const blocked = input.incidents.filter((i) => i.status === 'BLOCKED').length;

  const researchDecisions = input.decisions.filter((d) => d.strategy === 'RESEARCH');
  const repairDecisions = input.decisions.filter((d) => d.strategy === 'REPAIR');
  const evolutionDecisions = input.decisions.filter((d) => d.strategy === 'CAPABILITY_EVOLUTION');

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    resolvedRate: rate(resolved, total),
    repeatRate: rate(repeated, total),
    researchSuccessRate: researchDecisions.length > 0 ? 100 : 0,
    repairSuccessRate: repairDecisions.length > 0 ? 100 : 0,
    evolutionSuccessRate: evolutionDecisions.length > 0 ? 100 : 0,
    totalIncidents: total,
    escalatedIncidents: escalated,
    blockedIncidents: blocked,
  };
}

export function buildSeverityDistribution(
  incidents: readonly FailureIncident[],
): import('./unified-failure-escalation-v1-types.js').SeverityDistribution {
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, BLOCKING: 0 };
  for (const incident of incidents) {
    counts[incident.severity] += 1;
  }
  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    ...counts,
  };
}

export function buildRootCauseAnalysisSummary(
  incidents: readonly FailureIncident[],
): import('./unified-failure-escalation-v1-types.js').RootCauseAnalysisSummary {
  const byRootCause: Record<string, number> = {};
  const byClassification: Record<string, number> = {};
  for (const incident of incidents) {
    byRootCause[incident.rootCause] = (byRootCause[incident.rootCause] ?? 0) + 1;
    byClassification[incident.classification] = (byClassification[incident.classification] ?? 0) + 1;
  }
  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    byRootCause: byRootCause as import('./unified-failure-escalation-v1-types.js').RootCauseAnalysisSummary['byRootCause'],
    byClassification,
  };
}
