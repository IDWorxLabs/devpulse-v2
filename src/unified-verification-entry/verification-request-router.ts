/**
 * Verification request router — routes into registry, orchestrator, evidence, reporting.
 * Callers never talk to subsystems directly.
 */

import { prepareVerificationRegistry } from '../verification-registry/index.js';
import { prepareVerificationOrchestration } from '../verification-orchestrator/index.js';
import { prepareVerificationEvidence } from '../verification-evidence-engine/index.js';
import { prepareVerificationReporting } from '../verification-reporting-engine/index.js';
import { prepareVerificationRuntime } from '../unified-verification-lab/index.js';
import type { RequestVerificationInput } from './unified-verification-types.js';

export interface RoutedVerificationSubsystems {
  registry: ReturnType<typeof prepareVerificationRegistry>;
  orchestration: ReturnType<typeof prepareVerificationOrchestration>;
  evidence: ReturnType<typeof prepareVerificationEvidence>;
  reporting: ReturnType<typeof prepareVerificationReporting>;
  runtimeBootstrapped: boolean;
}

export function routeVerificationRequest(
  input: RequestVerificationInput,
): RoutedVerificationSubsystems {
  const query = input.query ?? 'Request verification';

  const base = {
    query,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    world1Protected: input.world1Protected,
    ownershipValid: input.ownershipValid,
    suppressRuntimeBootstrap: input.suppressRuntimeBootstrap,
  };

  let runtimeBootstrapped = false;
  if (!input.suppressRuntimeBootstrap) {
    prepareVerificationRuntime({ ...base, suppressRuntimeBootstrap: false });
    runtimeBootstrapped = true;
  }

  const registry = prepareVerificationRegistry({ ...base, suppressRuntimeBootstrap: true });
  const orchestration = prepareVerificationOrchestration({ ...base, suppressRuntimeBootstrap: true });
  const evidence = prepareVerificationEvidence(base);
  const reporting = prepareVerificationReporting({ ...base, suppressRuntimeBootstrap: true });

  return { registry, orchestration, evidence, reporting, runtimeBootstrapped };
}

export function describeRoutingPlan(): string[] {
  return [
    'registry → verification targets and requirements',
    'orchestrator → execution planning and readiness',
    'evidence_engine → evidence authority and lineage',
    'reporting_engine → structured verification reports',
    'session_state → entry session lifecycle',
    'history_state → request and consumer history',
  ];
}
