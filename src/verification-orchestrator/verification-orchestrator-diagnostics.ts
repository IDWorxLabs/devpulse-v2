/**
 * Verification orchestrator diagnostics tracker.
 */

import type { VerificationOrchestratorDiagnostics, OrchestrationState } from './types.js';

const diagnostics: VerificationOrchestratorDiagnostics = {
  orchestrationActive: false,
  orchestrationId: null,
  verificationPlanCount: 0,
  readyTargetCount: 0,
  blockedTargetCount: 0,
  waitingTargetCount: 0,
  lastQuery: null,
  lastState: null,
};

export function verificationOrchestratorKey(): string {
  return 'verification_orchestrator';
}

export function getVerificationOrchestratorDiagnostics(): VerificationOrchestratorDiagnostics {
  return { ...diagnostics };
}

export function updateVerificationOrchestratorDiagnostics(
  query: string,
  state: OrchestrationState,
  orchestrationId: string,
  planCount: number,
  readyCount: number,
  blockedCount: number,
  waitingCount: number,
): void {
  diagnostics.orchestrationActive = true;
  diagnostics.lastQuery = query;
  diagnostics.lastState = state;
  diagnostics.orchestrationId = orchestrationId;
  diagnostics.verificationPlanCount = planCount;
  diagnostics.readyTargetCount = readyCount;
  diagnostics.blockedTargetCount = blockedCount;
  diagnostics.waitingTargetCount = waitingCount;
}

export function resetVerificationOrchestratorDiagnostics(): void {
  diagnostics.orchestrationActive = false;
  diagnostics.orchestrationId = null;
  diagnostics.verificationPlanCount = 0;
  diagnostics.readyTargetCount = 0;
  diagnostics.blockedTargetCount = 0;
  diagnostics.waitingTargetCount = 0;
  diagnostics.lastQuery = null;
  diagnostics.lastState = null;
}
