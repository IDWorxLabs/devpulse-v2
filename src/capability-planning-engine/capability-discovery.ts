/**
 * Capability Planning Engine Era 3 — required capability discovery.
 */

import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { RequiredCapability } from './capability-planning-types.js';

let requiredCounter = 0;

export function resetCapabilityDiscoveryForTests(): void {
  requiredCounter = 0;
}

function nextRequiredId(): string {
  requiredCounter += 1;
  return `req-cap-${requiredCounter}`;
}

const CAPABILITY_PATTERNS: Array<{
  pattern: RegExp;
  name: string;
  description: string;
  category: string;
  mandatory?: boolean;
}> = [
  { pattern: /\bblink|gaze|eye[\s-]?track/i, name: 'Blink Communication', description: 'Blink and gaze-based communication input', category: 'INTERACTION', mandatory: true },
  { pattern: /\bemergency[\s-]?speech|emergency phrase/i, name: 'Emergency Phrase Workflow', description: 'Emergency speech phrase capability', category: 'USER_WORKFLOW', mandatory: true },
  { pattern: /\bspeech|tts|text[\s-]?to[\s-]?speech|speak/i, name: 'Speech Output', description: 'Text-to-speech output capability', category: 'INTERACTION', mandatory: true },
  { pattern: /\bcommunication[\s-]?history|message history/i, name: 'Message History', description: 'Persistent communication history', category: 'STORAGE' },
  { pattern: /\baccessib|wcag|gaze[\s-]?friendly|high contrast|large touch/i, name: 'Accessibility-First Interaction', description: 'Accessibility-first interaction patterns', category: 'ACCESSIBILITY', mandatory: true },
  { pattern: /\bkeyboard[\s-]?nav/i, name: 'Keyboard Navigation', description: 'Keyboard navigation support', category: 'ACCESSIBILITY' },
  { pattern: /\boffline|local[\s-]?first/i, name: 'Offline Persistence', description: 'Offline data persistence', category: 'OFFLINE_BEHAVIOR' },
  { pattern: /\bsettings|persist/i, name: 'Settings Persistence', description: 'User settings persistence', category: 'STORAGE' },
  { pattern: /\bcaregiver/i, name: 'Caregiver Communication Workflow', description: 'Caregiver monitoring workflow', category: 'USER_WORKFLOW' },
  { pattern: /\bcrud|create|edit|delete|record/i, name: 'CRUD Operations', description: 'Create read update delete operations', category: 'FUNCTIONAL' },
  { pattern: /\bexport|csv/i, name: 'CSV Export', description: 'CSV export capability', category: 'API' },
  { pattern: /\breport|chart|dashboard/i, name: 'Reporting Dashboard', description: 'Reporting and dashboard views', category: 'FUNCTIONAL' },
  { pattern: /\bauth|login|sign[\s-]?in/i, name: 'Authentication', description: 'User authentication', category: 'AUTHENTICATION' },
  { pattern: /\bpayment|billing|stripe|checkout/i, name: 'Payment Processing', description: 'Real payment processing', category: 'SECURITY', mandatory: true },
  { pattern: /\bsync|cloud|real[\s-]?time/i, name: 'Cloud Synchronization', description: 'Cloud sync capability', category: 'SYNCHRONIZATION' },
  { pattern: /\bai\b.*\bassistant|\bmachine learning\b/i, name: 'AI Assistant', description: 'AI assistant capability', category: 'FUNCTIONAL' },
];

export function discoverRequiredCapabilities(input: {
  rawPrompt: string;
  productIntelligenceModel?: ProductIntelligenceModel;
  promptFaithfulness?: PromptFaithfulnessV2Result;
}): RequiredCapability[] {
  const required: RequiredCapability[] = [];
  const seen = new Set<string>();

  const add = (
    name: string,
    description: string,
    category: string,
    mandatory: boolean,
    sourceRequirementIds: string[] = [],
    sourceEvidenceIds: string[] = [],
  ): void => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    required.push({
      readOnly: true,
      requiredId: nextRequiredId(),
      name,
      description,
      sourceRequirementIds,
      sourceEvidenceIds,
      category,
      mandatory,
    });
  };

  for (const entry of CAPABILITY_PATTERNS) {
    if (entry.pattern.test(input.rawPrompt)) {
      add(entry.name, entry.description, entry.category, entry.mandatory ?? false);
    }
  }

  if (input.promptFaithfulness) {
    for (const req of input.promptFaithfulness.requirements) {
      for (const entry of CAPABILITY_PATTERNS) {
        if (entry.pattern.test(req.description)) {
          add(entry.name, req.description, entry.category, req.priority === 'MANDATORY' || req.priority === 'REQUIRED', [req.requirementId], req.sourceEvidenceIds);
        }
      }
    }
    for (const mapping of input.promptFaithfulness.capabilityMappings) {
      for (const capName of mapping.capabilityChain) {
        add(capName, `Required via capability mapping for ${mapping.requirementId}`, 'FUNCTIONAL', true, [mapping.requirementId]);
      }
    }
  }

  if (input.productIntelligenceModel) {
    const pim = input.productIntelligenceModel;
    if (pim.accessibility.mandatoryConstraints.length) {
      add('Accessibility-First Interaction', 'Mandatory accessibility constraints from PIM', 'ACCESSIBILITY', true);
    }
    if (pim.interactions.modes.includes('BLINK') || pim.interactions.modes.includes('EYE_TRACKING')) {
      add('Blink Communication', 'Required by PIM interaction model', 'INTERACTION', true);
    }
    if (pim.interactions.modes.includes('SPEECH') || pim.interactions.modes.includes('VOICE')) {
      add('Speech Output', 'Required by PIM interaction model', 'INTERACTION', true);
    }
    for (const feature of pim.features) {
      if (feature.moduleId) {
        add(
          feature.label,
          `Feature module: ${feature.moduleId}`,
          'FUNCTIONAL',
          feature.priority === 'REQUIRED' || feature.priority === 'MANDATORY',
        );
      }
    }
  }

  if (promptMentionsLisaOrAccessibility(input.rawPrompt)) {
    add('Blink Communication', 'LISA assistive communication', 'INTERACTION', true);
    add('Emergency Phrase Workflow', 'LISA emergency speech', 'USER_WORKFLOW', true);
    add('Speech Output', 'LISA TTS', 'INTERACTION', true);
    add('Message History', 'LISA communication history', 'STORAGE', true);
    add('Accessibility-First Interaction', 'LISA accessibility-first', 'ACCESSIBILITY', true);
    add('Large Touch Targets', 'LISA large touch targets', 'ACCESSIBILITY', true);
    add('Keyboard Navigation', 'LISA keyboard navigation', 'ACCESSIBILITY', false);
    add('Offline Persistence', 'LISA offline persistence', 'OFFLINE_BEHAVIOR', false);
    add('Settings Persistence', 'LISA settings', 'STORAGE', false);
    add('Caregiver Communication Workflow', 'LISA caregiver dashboard', 'USER_WORKFLOW', true);
  }

  if (/expense|finance|income/i.test(input.rawPrompt)) {
    add('CRUD Operations', 'Expense record management', 'FUNCTIONAL', true);
    add('CSV Export', 'Expense CSV export', 'API', false);
    add('Reporting Dashboard', 'Expense reporting', 'FUNCTIONAL', false);
    add('Local Storage Persistence', 'Expense data persistence', 'STORAGE', true);
  }

  return required;
}
