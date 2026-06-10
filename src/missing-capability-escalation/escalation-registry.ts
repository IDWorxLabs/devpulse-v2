/**
 * Missing Capability Escalation — escalation registry.
 */

import type { CapabilityEscalationRecord, EscalationDecision, EscalationTrigger } from './escalation-types.js';

const records = new Map<string, CapabilityEscalationRecord>();
const byTrigger = new Map<EscalationTrigger, CapabilityEscalationRecord[]>();
const byDecision = new Map<EscalationDecision, CapabilityEscalationRecord[]>();

export function registerEscalation(record: CapabilityEscalationRecord): CapabilityEscalationRecord {
  records.set(record.escalationId, record);

  const triggerList = byTrigger.get(record.trigger) ?? [];
  triggerList.unshift(record);
  byTrigger.set(record.trigger, triggerList);

  const decisionList = byDecision.get(record.decision) ?? [];
  decisionList.unshift(record);
  byDecision.set(record.decision, decisionList);

  return record;
}

export function getEscalation(escalationId: string): CapabilityEscalationRecord | undefined {
  return records.get(escalationId);
}

export function listEscalations(): CapabilityEscalationRecord[] {
  return [...records.values()];
}

export function getEscalationCount(): number {
  return records.size;
}

export function listEscalationsByTrigger(trigger: EscalationTrigger): CapabilityEscalationRecord[] {
  return byTrigger.get(trigger) ?? [];
}

export function listEscalationsByDecision(decision: EscalationDecision): CapabilityEscalationRecord[] {
  return byDecision.get(decision) ?? [];
}

export function resetEscalationRegistryForTests(): void {
  records.clear();
  byTrigger.clear();
  byDecision.clear();
}
