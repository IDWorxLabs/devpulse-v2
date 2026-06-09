/**
 * Verification requirement registry — required evidence, dependencies, and states.
 */

import type { VerificationRequirementRecord } from './types.js';
import {
  listVerificationTargets,
  getVerificationTarget,
} from './verification-target-registry.js';

let reqCounter = 0;
const requirements = new Map<string, VerificationRequirementRecord>();

export function resetVerificationRequirementRegistryForTests(): void {
  reqCounter = 0;
  requirements.clear();
}

function nextReqId(): string {
  reqCounter += 1;
  return `vreq-${reqCounter.toString().padStart(4, '0')}`;
}

export interface RegisterRequirementResult {
  ok: boolean;
  record: VerificationRequirementRecord | null;
  error: string | null;
}

export function registerVerificationRequirement(
  record: VerificationRequirementRecord,
): RegisterRequirementResult {
  const target = getVerificationTarget(record.targetId);
  if (!target) {
    return { ok: false, record: null, error: 'Invalid requirement — target not found' };
  }
  if (requirements.has(record.requirementId)) {
    return { ok: false, record: null, error: 'Duplicate requirement rejected' };
  }
  requirements.set(record.requirementId, record);
  return { ok: true, record, error: null };
}

export function buildRequirementRecord(targetId: string): VerificationRequirementRecord {
  const target = getVerificationTarget(targetId);
  return {
    requirementId: nextReqId(),
    targetId,
    requiredEvidence: target ? [...target.supportedEvidence] : [],
    requiredDependencies: target ? [...target.dependencies] : [],
    requiredStates: ['REGISTERED', 'READY'],
    requiredOwnership: target ? [target.ownerModule] : [],
    requiredVerificationCapabilities: target
      ? [`${target.verificationCategory}_MODE`]
      : [],
    registryOnly: true,
  };
}

export function registerInitialRequirements(): RegisterRequirementResult[] {
  const results: RegisterRequirementResult[] = [];
  for (const target of listVerificationTargets()) {
    results.push(registerVerificationRequirement(buildRequirementRecord(target.verificationTargetId)));
  }
  return results;
}

export function getVerificationRequirement(requirementId: string): VerificationRequirementRecord | null {
  return requirements.get(requirementId) ?? null;
}

export function listVerificationRequirements(): VerificationRequirementRecord[] {
  return [...requirements.values()];
}
