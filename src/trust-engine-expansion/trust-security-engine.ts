/**
 * Trust security engine — security assertions for trust engine expansion.
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
    'modifyGovernance',
    'modifyRegistry',
    'replaceVerification',
    'replaceEvidenceLedger',
    'replaceCompletionVerifier',
  ];
  return forbidden.every((m) => typeof (obj as Record<string, unknown>)[m] === 'undefined');
}

export function ownershipGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}:${g.status}`).sort().join('|');
}

export function assertNoAutoFixCapability(obj: object): boolean {
  return (
    typeof (obj as { autoFixTrust?: unknown }).autoFixTrust === 'undefined' &&
    typeof (obj as { repairTrust?: unknown }).repairTrust === 'undefined' &&
    typeof (obj as { replaceVerificationSystem?: unknown }).replaceVerificationSystem === 'undefined'
  );
}

export function assertNoReplacementCapability(obj: object): boolean {
  return (
    typeof (obj as { replaceEvidenceLedger?: unknown }).replaceEvidenceLedger === 'undefined' &&
    typeof (obj as { replaceGovernanceSystem?: unknown }).replaceGovernanceSystem === 'undefined' &&
    typeof (obj as { createVerificationTruth?: unknown }).createVerificationTruth === 'undefined'
  );
}
