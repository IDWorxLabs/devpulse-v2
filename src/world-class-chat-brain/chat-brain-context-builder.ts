/**
 * Phase 25.38 — Chat brain context builder from DevPulse intelligence.
 */

import { buildChatSelfModel } from '../chat-cognitive-architecture/chat-self-model.js';
import { assessChatCapabilityBoundaries } from '../chat-cognitive-architecture/chat-capability-boundary-checker.js';
import { retrieveDevPulseIntelligenceSnapshot } from './devpulse-intelligence-adapter.js';
import type { ChatBrainCapabilityClaim, ChatBrainContext } from './chat-brain-types.js';

function mapLevel(
  level: string,
): ChatBrainCapabilityClaim['level'] {
  const upper = level.toUpperCase();
  if (upper === 'PROVEN' || upper === 'PARTIAL' || upper === 'UNPROVEN' || upper === 'CONTRADICTED') {
    return upper as ChatBrainCapabilityClaim['level'];
  }
  return 'UNKNOWN';
}

export function buildChatBrainContext(rootDir?: string): ChatBrainContext {
  const snapshot = retrieveDevPulseIntelligenceSnapshot(rootDir);
  const selfModel = buildChatSelfModel();
  const boundaries = assessChatCapabilityBoundaries(rootDir);

  const capabilities: ChatBrainCapabilityClaim[] = boundaries.map((b) => ({
    readOnly: true,
    name: b.capability.replace(/_/g, ' '),
    level: mapLevel(b.level),
    explanation: b.explanation,
  }));

  const projectStatusParts = [
    `Founder Test: ${snapshot.founderTesting.detail}`,
    `Execution: ${snapshot.executionConnected.detail}`,
  ];
  if (snapshot.knownBlockers.length) {
    projectStatusParts.push(`Blockers: ${snapshot.knownBlockers.slice(0, 2).join('; ')}`);
  }

  return {
    readOnly: true,
    projectStatus: projectStatusParts.join(' | '),
    founderTestStatus: `${snapshot.founderTesting.status} — ${snapshot.founderTesting.detail}`,
    executionProofStatus: `${snapshot.founderExecutionProof.status} — ${snapshot.founderExecutionProof.detail}`,
    verificationStatus: `${snapshot.verificationReality.status} — ${snapshot.verificationReality.detail}`,
    livePreviewStatus: `${snapshot.livePreviewReality.status} — ${snapshot.livePreviewReality.detail}`,
    launchReadinessStatus: `${snapshot.launchReadiness.status} — ${snapshot.launchReadiness.detail}`,
    repositoryTypecheckStatus: `${snapshot.repositoryTypecheck.status} — ${snapshot.repositoryTypecheck.detail}`,
    mobileRuntimeStatus: `${snapshot.mobileRuntimeReality.status} — ${snapshot.mobileRuntimeReality.detail}`,
    launchCouncilStatus: `${snapshot.launchCouncil.status} — ${snapshot.launchCouncil.detail}`,
    projectMemoryStatus: `${snapshot.projectMemory.status} — ${snapshot.projectMemory.detail}`,
    cognitiveArchitectureStatus: snapshot.chatCognitiveArchitecture.detail,
    knownBlockers: snapshot.knownBlockers,
    capabilities,
    limitations: [...selfModel.cannotClaimYet, ...selfModel.systemsIncomplete].slice(0, 8),
    evidenceGaps: snapshot.evidenceGaps,
    intelligenceSourcesUsed: snapshot.sourcesUsed,
  };
}
