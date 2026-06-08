/**
 * Complexity security engine — security assertions for complexity scoring.
 * Security gate only. No execution or auto-fix.
 */

import type { GateRecord } from './types.js';

export function assertNoExecutionMethods(obj: object): boolean {
  const forbidden = [
    'execute',
    'modifyFiles',
    'generateCode',
    'runCommand',
    'deploy',
    'autoFix',
    'modifyArchitecture',
    'modifyGovernance',
    'modifyRegistry',
    'refactorArchitecture',
  ];
  return forbidden.every((m) => typeof (obj as Record<string, unknown>)[m] === 'undefined');
}

export function ownershipGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}:${g.status}`).sort().join('|');
}

export function assertNoAutoFixCapability(obj: object): boolean {
  return (
    typeof (obj as { autoFixComplexity?: unknown }).autoFixComplexity === 'undefined' &&
    typeof (obj as { optimizeComplexity?: unknown }).optimizeComplexity === 'undefined' &&
    typeof (obj as { refactorFiles?: unknown }).refactorFiles === 'undefined'
  );
}
