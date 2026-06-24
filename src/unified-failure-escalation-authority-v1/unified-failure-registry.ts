/**
 * Unified Failure Escalation Authority V1 — unified failure registry.
 */

import { randomUUID } from 'node:crypto';
import { MAX_FAILURE_REGISTRY_SIZE } from './unified-failure-escalation-v1-bounds.js';
import type {
  FailureIncident,
  UnifiedFailureRegistrySnapshot,
} from './unified-failure-escalation-v1-types.js';

const registry: FailureIncident[] = [];

export function resetUnifiedFailureRegistryForTests(): void {
  registry.length = 0;
}

export function registerFailureIncident(incident: FailureIncident): FailureIncident {
  if (registry.length >= MAX_FAILURE_REGISTRY_SIZE) {
    registry.shift();
  }
  registry.push(incident);
  return incident;
}

export function buildFailureIncident(input: Omit<FailureIncident, 'readOnly' | 'incidentId'> & { incidentId?: string }): FailureIncident {
  return {
    readOnly: true,
    incidentId: input.incidentId ?? randomUUID(),
    sourceSystem: input.sourceSystem,
    timestamp: input.timestamp,
    severity: input.severity,
    classification: input.classification,
    rootCause: input.rootCause,
    affectedCapabilities: input.affectedCapabilities,
    affectedProjects: input.affectedProjects,
    recommendedAction: input.recommendedAction,
    canonicalOwner: input.canonicalOwner,
    status: input.status,
    systemWideImpact: input.systemWideImpact,
    repeatCount: input.repeatCount,
    detail: input.detail,
  };
}

export function buildUnifiedFailureRegistrySnapshot(): UnifiedFailureRegistrySnapshot {
  const openIncidents = registry.filter((i) => i.status === 'OPEN').length;
  const resolvedIncidents = registry.filter((i) => i.status === 'RESOLVED').length;
  const escalatedIncidents = registry.filter((i) => i.status === 'ESCALATED').length;
  const blockedIncidents = registry.filter((i) => i.status === 'BLOCKED').length;
  const repeatedIncidents = registry.filter((i) => i.repeatCount > 1).length;

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    openIncidents,
    resolvedIncidents,
    escalatedIncidents,
    repeatedIncidents,
    blockedIncidents,
    totalIncidents: registry.length,
    boundedAt: MAX_FAILURE_REGISTRY_SIZE,
    incidents: [...registry],
  };
}

export function listRegistryIncidents(): readonly FailureIncident[] {
  return registry;
}
