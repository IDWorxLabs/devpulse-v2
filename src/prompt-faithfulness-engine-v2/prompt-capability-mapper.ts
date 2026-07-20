/**
 * Prompt Faithfulness Engine V2 — requirement to capability mapping.
 */

import type { CapabilityMappingEntry, PromptRequirement } from './prompt-faithfulness-v2-types.js';

const CAPABILITY_PATTERNS: Array<{ pattern: RegExp; chain: string[] }> = [
  { pattern: /offline|local edit/i, chain: ['Local Storage', 'Synchronization Engine', 'Conflict Resolution', 'Retry Queue', 'Validation'] },
  // Synchronization is a data-consistency behavior, not proof that a separate "Cloud API"
  // platform capability is required. Remote providers are represented by the generic integration
  // adapter chain below; provider credentials remain deployment configuration.
  { pattern: /\bsync(?:hroniz(?:e|ed|es|ing|ation))?\b/i, chain: ['Synchronization Engine', 'Conflict Resolution', 'Retry Queue'] },
  { pattern: /\b(?:cloud|remote|third[\s-]?party)\s+(?:api|service|provider|storage|backend)\b/i, chain: ['API Client', 'Integration Adapter', 'Error Handling', 'Retry Logic'] },
  { pattern: /auth|login|sign[\s-]?in/i, chain: ['Authentication Service', 'Session Management', 'Authorization'] },
  { pattern: /notif/i, chain: ['Notification Service', 'Push Gateway', 'User Preferences'] },
  { pattern: /search|filter/i, chain: ['Search Index', 'Query Engine', 'Filter UI'] },
  { pattern: /export|csv|report/i, chain: ['Export Service', 'File Generation', 'Download Handler'] },
  { pattern: /eye[\s-]?track|gaze|blink/i, chain: ['Input Simulation', 'Gaze Selection', 'Accessibility Layer', 'Validation'] },
  { pattern: /speech|tts|voice/i, chain: ['Text-to-Speech Engine', 'Audio Output', 'Emergency Speech Handler'] },
  { pattern: /accessib|wcag|contrast/i, chain: ['Accessibility Settings', 'High Contrast Theme', 'Keyboard Navigation'] },
  { pattern: /dark mode|theme/i, chain: ['Theme Provider', 'CSS Variables', 'User Preference Storage'] },
  { pattern: /api|integration|webhook/i, chain: ['API Client', 'Integration Adapter', 'Error Handling', 'Retry Logic'] },
  { pattern: /encrypt|security/i, chain: ['Encryption Layer', 'Secure Storage', 'Access Control'] },
];

const KNOWN_CAPABILITIES = new Set([
  'Local Storage', 'Synchronization Engine', 'Conflict Resolution', 'Retry Queue', 'Validation',
  'Cloud API', 'Authentication Service', 'Session Management', 'Authorization',
  'Notification Service', 'Push Gateway', 'User Preferences', 'Search Index', 'Query Engine',
  'Filter UI', 'Export Service', 'File Generation', 'Download Handler',
  'Input Simulation', 'Gaze Selection', 'Accessibility Layer',
  'Text-to-Speech Engine', 'Audio Output', 'Emergency Speech Handler',
  'Accessibility Settings', 'High Contrast Theme', 'Keyboard Navigation',
  'Theme Provider', 'CSS Variables', 'User Preference Storage',
  'API Client', 'Integration Adapter', 'Error Handling', 'Retry Logic',
  'Encryption Layer', 'Secure Storage', 'Access Control',
  'CRUD Service', 'Form Validation', 'Navigation Router',
]);

let mappingCounter = 0;

export function resetPromptCapabilityMapperForTests(): void {
  mappingCounter = 0;
}

export function mapRequirementsToCapabilities(
  requirements: readonly PromptRequirement[],
): CapabilityMappingEntry[] {
  const mappings: CapabilityMappingEntry[] = [];

  for (const req of requirements) {
    let matched = false;
    for (const entry of CAPABILITY_PATTERNS) {
      if (entry.pattern.test(req.description)) {
        mappingCounter += 1;
        const missing = entry.chain.filter((c) => !KNOWN_CAPABILITIES.has(c));
        mappings.push({
          readOnly: true,
          mappingId: `cap-map-${mappingCounter}`,
          requirementId: req.requirementId,
          capabilityChain: entry.chain,
          capabilitiesExist: missing.length === 0,
          forwardedToCapabilityPlanning: missing.length > 0,
        });
        matched = true;
        break;
      }
    }

    if (!matched && req.category === 'FUNCTIONAL') {
      mappingCounter += 1;
      mappings.push({
        readOnly: true,
        mappingId: `cap-map-${mappingCounter}`,
        requirementId: req.requirementId,
        capabilityChain: ['CRUD Service', 'Form Validation', 'Navigation Router'],
        capabilitiesExist: true,
        forwardedToCapabilityPlanning: false,
      });
    }
  }

  return mappings;
}

export function getMissingCapabilities(mappings: readonly CapabilityMappingEntry[]): string[] {
  const missing = new Set<string>();
  for (const mapping of mappings) {
    if (mapping.forwardedToCapabilityPlanning) {
      for (const cap of mapping.capabilityChain) {
        if (!KNOWN_CAPABILITIES.has(cap)) missing.add(cap);
      }
    }
  }
  return [...missing];
}
