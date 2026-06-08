/**
 * Approval gate engine — founder approval gates for execution bridge.
 * Classification only. No execution.
 */

import type { BridgeInput, GateRecord } from './types.js';

export function generateApprovalGates(input: BridgeInput): GateRecord[] {
  const gates: GateRecord[] = [
    {
      gateId: 'approval-founder-0001',
      gateType: 'FOUNDER_APPROVAL',
      status: input.founderApproved ? 'OPEN' : 'REQUIRED',
      description: input.founderApproved
        ? 'Founder approval granted for gated execution classification'
        : 'Founder approval required before any execution request',
    },
  ];

  if (input.specialApproval) {
    gates.push({
      gateId: 'approval-special-0001',
      gateType: 'SPECIAL_APPROVAL',
      status: input.founderApproved ? 'OPEN' : 'REQUIRED',
      description: 'Special approval for DELETE_FILE_PROPOSED or RUN_COMMAND_PROPOSED actions',
    });
  }

  for (const req of input.approvalRequirements) {
    gates.push({
      gateId: `approval-req-${req.requirementId}`,
      gateType: `APPROVAL_${req.actionType}`,
      status: req.satisfied ? 'OPEN' : 'REQUIRED',
      description: req.description,
    });
  }

  return gates;
}

export function approvalGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}|${g.status}`).join(';');
}
