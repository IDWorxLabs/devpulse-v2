/**
 * Continuity packet engine — creates continuity packets and handoff summaries.
 * Context transfer only. Does NOT execute or duplicate project truth.
 */

import type { CapabilityClassification, ContinuityInput, HandoffType } from './types.js';

let packetCounter = 0;

export function resetContinuityPacketCounterForTests(): void {
  packetCounter = 0;
}

function createPacketId(): string {
  packetCounter += 1;
  return `continuity-pkt-${packetCounter.toString().padStart(4, '0')}`;
}

export function createContinuityPacketId(): string {
  return createPacketId();
}

export function generateHandoffSummary(
  input: ContinuityInput,
  handoffType: HandoffType,
  allowed: CapabilityClassification[],
  cloudStateRefreshRequired: boolean,
): string {
  const capabilityList = allowed.map((c) => c.capability).join(', ') || 'none';
  const refreshNote = cloudStateRefreshRequired
    ? 'Cloud state refresh required — cloud workspace remains source of truth.'
    : 'Context resume only — no file sync.';

  return [
    `Handoff ${handoffType}: ${input.fromDeviceId} → ${input.toDeviceId}`,
    `Project: ${input.projectId} | Scope: ${input.continuityScope}`,
    `Allowed capabilities: ${capabilityList}`,
    refreshNote,
    'No execution, file modification, code generation, or deployment performed.',
    'No duplicate project truth created.',
  ].join(' | ');
}

export function handoffSummaryKey(summary: string, allowedCount: number): string {
  return `${allowedCount}|${summary.slice(0, 80)}`;
}

export function packetStructuralKey(packetId: string, handoffType: HandoffType): string {
  return `${packetId}|${handoffType}`;
}
