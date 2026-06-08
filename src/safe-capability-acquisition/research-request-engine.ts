/**
 * Research request engine — creates research request packets.
 * Planning only. No research execution performed.
 */

import type { AcquisitionInput, AcquisitionRiskLevel, AcquisitionStrategy, ResearchRequestPacket } from './types.js';
import { nextResearchRequestId } from './types.js';

export function createResearchRequestPacket(
  input: AcquisitionInput,
  strategy: AcquisitionStrategy,
  riskLevel: AcquisitionRiskLevel,
  blocked: boolean,
): ResearchRequestPacket | null {
  if (blocked || strategy !== 'RESEARCH') return null;

  return {
    researchRequestId: nextResearchRequestId(),
    capabilityGapId: input.capabilityGapId,
    capabilityName: input.capabilityName,
    researchQuestion: `How should DevPulse safely acquire ${input.capabilityName}?`,
    researchScope: `Evaluate options for ${input.capabilityType} gap: ${input.gapReason}`,
    riskLevel,
    requiresApproval: false,
    status: 'READY',
  };
}

export function researchPacketKey(packet: ResearchRequestPacket | null): string {
  if (!packet) return 'none';
  return `${packet.researchRequestId}|${packet.status}`;
}
