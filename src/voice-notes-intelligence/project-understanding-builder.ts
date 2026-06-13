/**
 * Project Understanding Builder — aggregate project summary from transcript evidence (V1).
 */

import { normalizeConfidence } from './audio-metadata-reader.js';
import type {
  ExtractedRequirements,
  IntentDetectionResult,
  PlatformTarget,
  ProductType,
  ProjectUnderstandingSummary,
  VoiceTranscript,
} from './voice-notes-types.js';

function detectProductType(transcript: string, requirements: ExtractedRequirements): ProductType {
  const text = transcript.toLowerCase();
  if (/\bmarketplace\b/i.test(text)) return 'MARKETPLACE';
  if (/\binternal tool\b/i.test(text) || /\badmin panel\b/i.test(text)) return 'INTERNAL_TOOL';
  if (/\bsaas\b/i.test(text) || /\bsubscription\b/i.test(text)) return 'SAAS_PLATFORM';
  if (/\bmobile app\b/i.test(text) || /\bios\b/i.test(text) || /\bandroid\b/i.test(text)) return 'MOBILE_APP';
  if (/\bweb app\b/i.test(text) || requirements.screens.some((s) => /dashboard|landing/i.test(s))) {
    return 'WEB_APP';
  }
  return 'UNKNOWN';
}

function detectPlatformTargets(transcript: string): PlatformTarget[] {
  const text = transcript.toLowerCase();
  const targets = new Set<PlatformTarget>();

  if (/\bios\b/i.test(text) || /\biphone\b/i.test(text)) targets.add('IOS');
  if (/\bandroid\b/i.test(text)) targets.add('ANDROID');
  if (/\bweb\b/i.test(text) || /\bbrowser\b/i.test(text)) targets.add('WEB');
  if (/\bdesktop\b/i.test(text)) targets.add('DESKTOP');
  if (/\bcross[- ]platform\b/i.test(text) || (targets.has('IOS') && targets.has('ANDROID'))) {
    targets.add('CROSS_PLATFORM');
  }

  if (targets.size === 0 && /\bapp\b/i.test(text)) {
    targets.add('CROSS_PLATFORM');
  }

  return targets.size > 0 ? [...targets] : ['UNKNOWN'];
}

function buildFeatureInventory(
  requirements: ExtractedRequirements,
  intents: IntentDetectionResult,
): string[] {
  const features = new Set<string>();

  for (const screen of requirements.screens) features.add(`Screen: ${screen}`);
  for (const workflow of requirements.workflows) features.add(`Workflow: ${workflow}`);
  for (const integration of requirements.integrations) features.add(`Integration: ${integration}`);
  for (const auth of requirements.authentication) features.add(`Auth: ${auth}`);
  for (const notification of requirements.notifications) features.add(`Notification: ${notification}`);
  for (const entity of requirements.dataEntities) features.add(`Entity: ${entity}`);

  if (intents.primaryIntent === 'BUG_REPORT') features.add('Bug remediation scope');
  if (intents.primaryIntent === 'DESIGN_REQUEST') features.add('Design system / UI refinement');
  if (intents.primaryIntent === 'ROADMAP_REQUEST') features.add('Roadmap prioritization item');

  return [...features];
}

export function buildProjectUnderstandingSummary(input: {
  transcript: VoiceTranscript;
  requirements: ExtractedRequirements;
  intents: IntentDetectionResult;
}): ProjectUnderstandingSummary {
  const productType = detectProductType(input.transcript.transcriptText, input.requirements);
  const platformTargets = detectPlatformTargets(input.transcript.transcriptText);
  const keyWorkflows =
    input.requirements.workflows.length > 0
      ? input.requirements.workflows
      : input.requirements.screens.map((s) => `Navigate to ${s}`);
  const featureInventory = buildFeatureInventory(input.requirements, input.intents);

  let confidence = 40;
  confidence += Math.min(20, input.transcript.confidence / 5);
  confidence += Math.min(15, input.requirements.screens.length * 3);
  confidence += Math.min(10, input.requirements.workflows.length * 4);
  confidence += Math.min(10, input.intents.detectedIntents.length * 3);
  if (productType !== 'UNKNOWN') confidence += 5;
  if (!platformTargets.includes('UNKNOWN')) confidence += 5;

  return {
    readOnly: true,
    productType,
    platformTargets,
    keyWorkflows: keyWorkflows.slice(0, 12),
    featureInventory: featureInventory.slice(0, 20),
    confidenceScore: normalizeConfidence(confidence),
  };
}
