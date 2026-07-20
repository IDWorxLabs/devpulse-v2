/**
 * Universal Capability Pack Framework V1 — compatibility validation.
 */

import type { CapabilityPackDescriptor } from './universal-capability-pack-types.js';
import { UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION } from './universal-capability-pack-types.js';
import type { CapabilityPackMaterializationInput } from './universal-capability-pack-types.js';

export interface CompatibilityIssue {
  readonly code: 'incompatible_engine_version' | 'incompatible_b1' | 'incompatible_b2' | 'incompatible_b3' | 'incompatible_b4' | 'incompatible_b5' | 'incompatible_b6';
  readonly packId: string;
  readonly detail: string;
}

export function validatePackCompatibility(
  pack: CapabilityPackDescriptor,
  input: CapabilityPackMaterializationInput,
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  if (pack.engineCompatibility && !pack.engineCompatibility.startsWith('>=')) {
    issues.push({ code: 'incompatible_engine_version', packId: pack.packId, detail: 'Invalid engine compatibility range' });
  }
  if (pack.requiredB1Features.length > 0 && !input.crudBacked) {
    issues.push({ code: 'incompatible_b1', packId: pack.packId, detail: 'Pack requires B1 CRUD but workspace is not CRUD-backed' });
  }
  if (pack.requiredB2Features.length > 0 && !input.actionBacked) {
    issues.push({ code: 'incompatible_b2', packId: pack.packId, detail: 'Pack requires B2 actions but workspace is not action-backed' });
  }
  if (pack.requiredB3Features.length > 0 && !input.workflowBacked) {
    issues.push({ code: 'incompatible_b3', packId: pack.packId, detail: 'Pack requires B3 workflows' });
  }
  if (pack.requiredB4Features.length > 0 && !input.relationshipBacked) {
    issues.push({ code: 'incompatible_b4', packId: pack.packId, detail: 'Pack requires B4 relationships' });
  }
  if (pack.requiredB5Features.length > 0 && !input.runtimeBacked) {
    issues.push({ code: 'incompatible_b5', packId: pack.packId, detail: 'Pack requires B5 runtime state' });
  }
  if (pack.requiredB6Features.length > 0 && !input.ruleBacked) {
    issues.push({ code: 'incompatible_b6', packId: pack.packId, detail: 'Pack requires B6 business rules' });
  }
  if (pack.packVersion === '0.0.0' && pack.supportStatus === 'NOT_IMPLEMENTED') {
    issues.push({ code: 'incompatible_engine_version', packId: pack.packId, detail: 'Unimplemented pack cannot be composed' });
  }
  return issues;
}

export function isEngineVersionCompatible(_pack: CapabilityPackDescriptor): boolean {
  return true; // local registry — framework version is UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION
}

export { UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION };
