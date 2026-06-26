/**
 * Intent Understanding Engine — user goals and feature requirement extraction.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type {
  FeatureRequirementUnderstanding,
  FeaturePriority,
  UserGoalsUnderstanding,
  UnderstandingEvidence,
} from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

export function extractUserGoals(rawPrompt: string): UserGoalsUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const accomplishments: string[] = [extraction.corePurpose];

  const goalPatterns = [
    /(?:help|enable|allow)\s+([^.]{10,100})/gi,
    /(?:users? can|user should)\s+([^.]{10,100})/gi,
    /(?:goal|objective):\s*([^\n.]{5,100})/gi,
  ];
  for (const pattern of goalPatterns) {
    for (const match of rawPrompt.matchAll(pattern)) {
      if (match[1]) accomplishments.push(match[1].trim().replace(/\s+/g, ' '));
    }
  }

  const successCriteria: string[] = [];
  if (extraction.requiredModules.length) {
    successCriteria.push(`All required modules implemented: ${extraction.requiredModules.join(', ')}`);
  }
  if (extraction.requiredInteractions.length) {
    successCriteria.push(
      `Required interactions functional: ${extraction.requiredInteractions.slice(0, 5).join(', ')}`,
    );
  }
  if (/speak|speech|tts/i.test(rawPrompt)) {
    successCriteria.push('Text-to-speech output works for composed messages');
  }
  if (/emergency/i.test(rawPrompt)) {
    successCriteria.push('Emergency speech accessible within one interaction');
  }
  successCriteria.push('Application loads and primary workflow is completable');
  successCriteria.push('Prompt-faithful feature set matches requested capabilities');

  const openingReason = extraction.corePurpose
    ? `User opens the application to ${extraction.corePurpose.toLowerCase()}`
    : `User opens ${extraction.appName} to accomplish their primary task`;

  return {
    readOnly: true,
    openingReason,
    accomplishments: [...new Set(accomplishments)].slice(0, 12),
    successCriteria: [...new Set(successCriteria)],
    evidence: [
      evidence('prompt_extraction', extraction.corePurpose, 1),
      evidence('prompt_extraction', `Target users: ${extraction.targetUsers.join(', ')}`, 0.9),
    ],
  };
}

function classifyPriority(rawPrompt: string, moduleId: string): FeaturePriority {
  const requiredSection = new RegExp(`required[^\\n]*${moduleId}`, 'i').test(rawPrompt);
  if (requiredSection || /required modules?/i.test(rawPrompt)) return 'REQUIRED';
  if (/optional|nice to have|future/i.test(rawPrompt)) return 'OPTIONAL';
  if (/experimental|prototype/i.test(rawPrompt)) return 'EXPERIMENTAL';
  if (/blocked|deferred|out of scope/i.test(rawPrompt)) return 'BLOCKED';
  return 'REQUIRED';
}

export function extractFeatureRequirements(rawPrompt: string): FeatureRequirementUnderstanding[] {
  const extraction = extractPromptFeatures(rawPrompt);
  const features: FeatureRequirementUnderstanding[] = [];
  let featureIndex = 0;

  for (const moduleId of extraction.requiredModules) {
    featureIndex += 1;
    features.push({
      readOnly: true,
      featureId: `feature-${featureIndex}`,
      label: moduleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      moduleId,
      priority: classifyPriority(rawPrompt, moduleId),
      evidence: [evidence('module_extraction', `Module: ${moduleId}`, 1)],
    });
  }

  const capabilityPatterns: Array<{ pattern: RegExp; label: string; moduleId: string | null }> = [
    { pattern: /\bauth(?:entication)?\b/i, label: 'Authentication', moduleId: 'auth' },
    { pattern: /\bnotif/i, label: 'Notifications', moduleId: 'notifications' },
    { pattern: /\bsettings\b/i, label: 'Settings', moduleId: 'settings' },
    { pattern: /\bprofile\b/i, label: 'User Profile', moduleId: 'profile' },
    { pattern: /\bsearch\b/i, label: 'Search', moduleId: 'search' },
    { pattern: /\bdashboard\b/i, label: 'Dashboard', moduleId: 'dashboard' },
  ];

  for (const cap of capabilityPatterns) {
    if (cap.pattern.test(rawPrompt) && !features.some((f) => f.moduleId === cap.moduleId)) {
      featureIndex += 1;
      features.push({
        readOnly: true,
        featureId: `feature-${featureIndex}`,
        label: cap.label,
        moduleId: cap.moduleId,
        priority: 'OPTIONAL',
        evidence: [evidence('capability_inference', `Detected capability: ${cap.label}`, 0.7)],
      });
    }
  }

  if (!features.length) {
    features.push({
      readOnly: true,
      featureId: 'feature-1',
      label: 'Core Application',
      moduleId: 'dashboard',
      priority: 'REQUIRED',
      evidence: [evidence('default', 'Default core feature for unrecognized prompt', 0.5)],
    });
  }

  return features;
}
