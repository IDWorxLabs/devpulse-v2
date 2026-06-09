/**
 * Verification scope builder — SYSTEM, PROJECT, WORKSPACE, MODULE, SESSION, etc.
 */

import type {
  RequestVerificationInput,
  VerificationRequestType,
  VerificationScope,
  VerificationScopeType,
} from './unified-verification-types.js';
import { inferScopeType } from './unified-verification-types.js';

let scopeCounter = 0;

export function resetVerificationScopeCounterForTests(): void {
  scopeCounter = 0;
}

function nextScopeId(): string {
  scopeCounter += 1;
  return `vscope-${scopeCounter.toString().padStart(4, '0')}`;
}

export function buildVerificationScope(
  input: RequestVerificationInput,
  requestType: VerificationRequestType,
  targetIds: string[],
): VerificationScope {
  const scopeType: VerificationScopeType = input.scopeType ?? inferScopeType(input.query ?? '', requestType);

  const moduleIds =
    scopeType === 'MODULE'
      ? ['devpulse_v2_verification_registry', 'devpulse_v2_verification_orchestrator']
      : scopeType === 'UVL'
        ? ['devpulse_v2_unified_verification_lab_runtime']
        : scopeType === 'WORLD2'
          ? ['devpulse_v2_world2_completion_runtime']
          : [];

  return {
    scopeId: nextScopeId(),
    scopeType,
    targetIds,
    moduleIds,
    description: `${scopeType} scope — ${targetIds.length} target(s), authority only`,
  };
}
