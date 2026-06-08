/**
 * Rollback gate engine — rollback gates for execution bridge.
 * Classification only. No execution.
 */

import type { BridgeInput, GateRecord } from './types.js';

export function generateRollbackGates(input: BridgeInput): GateRecord[] {
  return input.rollbackRequirements.map((req, index) => ({
    gateId: `rollback-gate-${(index + 1).toString().padStart(4, '0')}`,
    gateType: `ROLLBACK_${req.stageType}`,
    status: req.checkpointRequired ? 'REQUIRED' : 'OPEN',
    description: req.description,
  }));
}

export function rollbackGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}|${g.status}`).join(';');
}
