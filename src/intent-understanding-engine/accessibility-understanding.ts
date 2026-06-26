/**
 * Intent Understanding Engine — accessibility understanding extraction.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { AccessibilityUnderstanding, UnderstandingEvidence } from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

export function extractAccessibilityUnderstanding(rawPrompt: string): AccessibilityUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const requirements: string[] = [];
  const mandatoryConstraints: string[] = [];
  const evidenceItems: UnderstandingEvidence[] = [];

  const signals: Array<{ pattern: RegExp; requirement: string; mandatory?: boolean }> = [
    { pattern: /\bscreen[\s-]?reader/i, requirement: 'Screen reader compatibility', mandatory: true },
    { pattern: /\bhigh[\s-]?contrast/i, requirement: 'High contrast mode', mandatory: true },
    { pattern: /\blarge[\s-]?text|font[\s-]?size/i, requirement: 'Large text support', mandatory: true },
    { pattern: /\bkeyboard[\s-]?nav/i, requirement: 'Keyboard navigation', mandatory: true },
    { pattern: /\bmotor[\s-]?accessib/i, requirement: 'Motor accessibility support', mandatory: true },
    { pattern: /\beye[\s-]?track|gaze/i, requirement: 'Eye tracking accessibility', mandatory: true },
    { pattern: /\bswitch[\s-]?device/i, requirement: 'Switch device support', mandatory: true },
    { pattern: /\bvoice[\s-]?control/i, requirement: 'Voice control', mandatory: true },
    { pattern: /\bwcag/i, requirement: 'WCAG compliance', mandatory: true },
    { pattern: /\baccessibility[\s-]?first/i, requirement: 'Accessibility-first design', mandatory: true },
    { pattern: /\bmedical[\s-]?assistive/i, requirement: 'Medical assistive accessibility', mandatory: true },
    { pattern: /\blarge touch targets/i, requirement: 'Large touch targets', mandatory: true },
    { pattern: /\bgaze[\s-]?friendly/i, requirement: 'Gaze-friendly UI elements', mandatory: true },
  ];

  for (const signal of signals) {
    if (signal.pattern.test(rawPrompt)) {
      requirements.push(signal.requirement);
      if (signal.mandatory) mandatoryConstraints.push(signal.requirement);
      evidenceItems.push(evidence('accessibility_signal', signal.requirement, 1));
    }
  }

  for (const design of extraction.designRequirements) {
    requirements.push(design);
    evidenceItems.push(evidence('design_requirement', design, 0.9));
    if (/accessib|contrast|gaze|medical/i.test(design)) {
      mandatoryConstraints.push(design);
    }
  }

  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    const lisaRequirements = [
      'Eye tracking board accessibility',
      'Blink input motor accessibility',
      'High contrast assistive UI',
      'Large accessible touch targets',
      'Caregiver-accessible settings',
      'Emergency speech accessibility',
    ];
    for (const req of lisaRequirements) {
      if (!requirements.includes(req)) requirements.push(req);
      mandatoryConstraints.push(req);
    }
    evidenceItems.push(evidence('domain_template', 'LISA mandatory accessibility constraints', 1));
  }

  const wcagMatch = rawPrompt.match(/\bwcag\s*(\d(?:\.\d)?[a-z]?)/i);
  const wcagLevel = wcagMatch?.[1] ? `WCAG ${wcagMatch[1]}` : requirements.some((r) => /wcag/i.test(r)) ? 'WCAG 2.1 AA' : null;

  return {
    readOnly: true,
    requirements: [...new Set(requirements)],
    wcagLevel,
    motorAccessibility: /motor|blink|gaze|switch|assistive/i.test(rawPrompt),
    screenReaderSupport: /screen[\s-]?reader|aria|wcag/i.test(rawPrompt),
    highContrast: /high[\s-]?contrast|accessibility[\s-]?first/i.test(rawPrompt),
    largeText: /large[\s-]?text|font[\s-]?size|large touch/i.test(rawPrompt),
    eyeTrackingSupport: /eye[\s-]?track|gaze/i.test(rawPrompt),
    voiceSupport: /voice|speech|tts/i.test(rawPrompt),
    medicalAccessibility: /medical|assistive|locked[\s-]?in|lisa/i.test(rawPrompt),
    mandatoryConstraints: [...new Set(mandatoryConstraints)],
    evidence: evidenceItems,
  };
}
