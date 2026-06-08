/**
 * Verification gate engine — verification gates for execution bridge.
 * Classification only. No execution.
 */

import type { BridgeInput, GateRecord } from './types.js';

export function generateVerificationGates(input: BridgeInput): GateRecord[] {
  const gates: GateRecord[] = [
    {
      gateId: 'verify-gate-0001',
      gateType: 'VERIFICATION_GATED_APPLY',
      status: input.verificationRequirements.length > 0 && input.governanceStatus === 'PASS' ? 'OPEN' : 'REQUIRED',
      description: 'verification_gated_apply reference required for gated execution classification',
    },
  ];

  for (const req of input.verificationRequirements) {
    gates.push({
      gateId: `verify-req-${req.requirementId}`,
      gateType: `VERIFY_${req.stageType}`,
      status: req.mustPassBeforeExecution ? 'REQUIRED' : 'OPEN',
      description: req.description,
    });
  }

  return gates;
}

export function verificationGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}|${g.status}`).join(';');
}
