/**
 * Phase 25.38 — Honest capability model for the chat brain.
 */

import { buildChatSelfModel } from '../chat-cognitive-architecture/chat-self-model.js';
import type { ChatBrainCapabilityClaim, ChatBrainCapabilityLevel } from './chat-brain-types.js';
import type { ChatBrainContext } from './chat-brain-types.js';

export interface ChatBrainCapabilityModel {
  readOnly: true;
  claims: ChatBrainCapabilityClaim[];
  provenToday: string[];
  partialToday: string[];
  unprovenToday: string[];
  honestyStatement: string;
}

export function buildChatBrainCapabilityModel(context: ChatBrainContext): ChatBrainCapabilityModel {
  const selfModel = buildChatSelfModel();
  const claims = context.capabilities.length
    ? context.capabilities
    : selfModel.canHelpWithToday.map((item) => ({
        readOnly: true as const,
        name: item,
        level: 'PARTIAL' as ChatBrainCapabilityLevel,
        explanation: 'Bounded capability — verify with Founder Test before trusting launch claims.',
      }));

  const provenToday = claims.filter((c) => c.level === 'PROVEN').map((c) => c.name);
  const partialToday = claims.filter((c) => c.level === 'PARTIAL').map((c) => c.name);
  const unprovenToday = claims
    .filter((c) => c.level === 'UNPROVEN' || c.level === 'CONTRADICTED' || c.level === 'UNKNOWN')
    .map((c) => c.name);

  return {
    readOnly: true,
    claims,
    provenToday,
    partialToday,
    unprovenToday,
    honestyStatement:
      'I only claim what DevPulse intelligence systems can prove. Chat confidence is not evidence — Founder Test, verification, and execution proof are.',
  };
}

export function summarizeCapabilityHonesty(model: ChatBrainCapabilityModel): string {
  const parts: string[] = [];
  if (model.provenToday.length) parts.push(`Proven: ${model.provenToday.slice(0, 3).join(', ')}`);
  if (model.partialToday.length) parts.push(`Partial: ${model.partialToday.slice(0, 3).join(', ')}`);
  if (model.unprovenToday.length) parts.push(`Not proven yet: ${model.unprovenToday.slice(0, 3).join(', ')}`);
  return parts.join('. ') || model.honestyStatement;
}
