/**
 * World 2 activation plan builder — assembles activation plan without executing anything.
 */

import { buildRuntimeVerificationReport } from '../runtime-verification-layer/runtime-verification-report-builder.js';
import { checkWorld2GovernanceGates } from './world2-governance-gate-checker.js';
import { evaluateWorld2ActivationReadiness } from './world2-activation-readiness.js';
import { linkWorld2RuntimeChain } from './world2-runtime-chain-linker.js';
import { checkWorld2WorkspaceIsolation } from './world2-workspace-isolation-checker.js';
import type { World2ActivationPlan } from './world2-execution-activation-types.js';

let planCounter = 0;

function nextActivationId(): string {
  planCounter += 1;
  return `w2act-${planCounter.toString().padStart(4, '0')}`;
}

export function resetWorld2ActivationPlanCounterForTests(): void {
  planCounter = 0;
}

export function buildWorld2ActivationPlan(query: string): World2ActivationPlan {
  const verification = buildRuntimeVerificationReport(query);
  const isolation = checkWorld2WorkspaceIsolation(query);
  const governance = checkWorld2GovernanceGates(isolation, verification);
  const runtimeChain = linkWorld2RuntimeChain(verification);
  const readiness = evaluateWorld2ActivationReadiness({ isolation, governance, runtimeChain });

  return {
    activationId: nextActivationId(),
    title: 'World 2 Execution Activation Plan',
    description:
      'Governed, isolated, simulation-first World 2 execution activation pathway — no real execution in Phase 15.1',
    targetProjectId: isolation.targetProjectId,
    targetWorkspaceId: isolation.targetWorkspaceId,
    world: 'WORLD_2',
    activationState: readiness.state,
    runtimeChain,
    verificationReport: verification,
    governanceGates: governance,
    isolationReport: isolation,
    readinessReport: readiness.readinessReport,
    readiness: readiness.readiness,
    blocked: readiness.blocked,
    blockers: readiness.blockers,
    approvalRequired: governance.approvalRequired,
    confidence: readiness.confidence,
    activationOnly: true,
  };
}
