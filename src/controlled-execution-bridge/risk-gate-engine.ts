/**
 * Risk gate engine — risk control gates for execution bridge.
 * Classification only. No execution.
 */

import type { BridgeInput, GateRecord } from './types.js';

export function generateRiskGates(input: BridgeInput): GateRecord[] {
  return input.riskControls.map((control, index) => ({
    gateId: `risk-gate-${(index + 1).toString().padStart(4, '0')}`,
    gateType: `RISK_${control.likelihood}`,
    status: control.mitigationRequired ? 'REQUIRED' : 'OPEN',
    description: control.controlDescription,
  }));
}

export function riskGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}|${g.status}`).join(';');
}
