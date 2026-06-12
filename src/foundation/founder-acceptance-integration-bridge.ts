/**
 * Founder acceptance integration bridge — Phase 24XB.
 * 24.8 orchestrator = authoritative acceptance owner.
 * 24F = portfolio orchestration layer. 24G = repair-path acceptance gate.
 */

import { evaluateFounderAcceptanceOrchestrator } from '../founder-acceptance-validation/founder-acceptance-orchestrator/index.js';
import type {
  FounderAcceptanceResult,
  FounderAcceptanceResultBundle,
  FounderAcceptanceVerdict,
} from '../founder-acceptance-validation/founder-acceptance-orchestrator/index.js';

export const FOUNDER_ACCEPTANCE_AUTHORITATIVE_OWNER = 'founder_acceptance_orchestrator';
export const FOUNDER_TEST_INTEGRATION_ROLE = 'portfolio_orchestration_layer';
export const FOUNDER_ACCEPTANCE_GATE_ROLE = 'repair_path_acceptance_gate';

export interface FounderAcceptanceBridgeInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  repairPath?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderAcceptanceBridgeSnapshot {
  readOnly: true;
  authoritativeOwner: typeof FOUNDER_ACCEPTANCE_AUTHORITATIVE_OWNER;
  orchestratorResult: FounderAcceptanceResult;
  orchestratorVerdict: FounderAcceptanceVerdict;
  orchestratorScore: number;
  repairPathOnly: boolean;
  delegatedFrom: 'founder_test_integration' | 'founder_acceptance_gate';
  noDuplicateScoring: true;
}

export function resolveAuthoritativeFounderAcceptance(
  input: FounderAcceptanceBridgeInput,
): FounderAcceptanceResultBundle {
  return evaluateFounderAcceptanceOrchestrator({
    requestId: input.requestId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    governanceBlocked: input.governanceBlocked,
  });
}

export function buildFounderAcceptanceBridgeSnapshot(
  bundle: FounderAcceptanceResultBundle,
  delegatedFrom: FounderAcceptanceBridgeSnapshot['delegatedFrom'],
  repairPath = false,
): FounderAcceptanceBridgeSnapshot {
  return {
    readOnly: true,
    authoritativeOwner: FOUNDER_ACCEPTANCE_AUTHORITATIVE_OWNER,
    orchestratorResult: bundle.result,
    orchestratorVerdict: bundle.verdict,
    orchestratorScore: bundle.score.overallScore,
    repairPathOnly: repairPath,
    delegatedFrom,
    noDuplicateScoring: true,
  };
}

export function applyOrchestratorAcceptanceDelegation(
  localAcceptanceState: string,
  orchestratorResult: FounderAcceptanceResult,
  orchestratorVerdict: FounderAcceptanceVerdict,
): string {
  if (localAcceptanceState === 'INSUFFICIENT_EVIDENCE' || localAcceptanceState === 'BLOCKED') {
    return localAcceptanceState;
  }

  if (orchestratorResult === 'FAIL' || orchestratorVerdict === 'FOUNDER_REJECTS') {
    return 'NOT_ACCEPTED';
  }

  return localAcceptanceState;
}
