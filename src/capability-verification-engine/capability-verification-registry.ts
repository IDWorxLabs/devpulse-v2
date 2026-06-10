/**
 * Capability Verification Engine — verification record registry.
 */

import type { CapabilityVerificationDecision, CapabilityVerificationRecord } from './capability-verification-types.js';

const registry = new Map<string, CapabilityVerificationRecord>();

export function registerCapabilityVerification(record: CapabilityVerificationRecord): void {
  registry.set(record.verificationId, record);
}

export function getCapabilityVerification(verificationId: string): CapabilityVerificationRecord | undefined {
  return registry.get(verificationId);
}

export function listCapabilityVerifications(): CapabilityVerificationRecord[] {
  return [...registry.values()];
}

export function listCapabilityVerificationsByDecision(decision: CapabilityVerificationDecision): CapabilityVerificationRecord[] {
  return listCapabilityVerifications().filter((r) => r.decision === decision);
}

export function getCapabilityVerificationCount(): number {
  return registry.size;
}

export function resetCapabilityVerificationRegistryForTests(): void {
  registry.clear();
}
