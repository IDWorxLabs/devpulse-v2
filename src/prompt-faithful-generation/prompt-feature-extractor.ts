/**
 * Prompt-Faithful Generation V1 — extract features from custom prompts.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { PromptFeatureExtraction } from './prompt-faithful-generation-types.js';
import { dedupeModuleIds, normalizeModuleId } from './prompt-module-name-normalizer.js';

const EXPLICIT_MODULE_PATTERNS = [
  /(?:^|\n|\*)\s*([a-z][a-z0-9-]{2,40})\s*(?:\n|$)/gim,
  /\b([a-z]+(?:-[a-z]+){1,6})\b/g,
];

const CAPABILITY_TO_MODULE: Array<{ pattern: RegExp; module: string }> = [
  { pattern: /\beye[\s-]?track/i, module: 'eye-tracking-board' },
  { pattern: /\bblink/i, module: 'blink-input-engine' },
  { pattern: /\bgaze/i, module: 'gaze-keyboard' },
  { pattern: /\btext[\s-]?to[\s-]?speech|tts\b/i, module: 'text-to-speech' },
  { pattern: /\bquick[\s-]?phrase/i, module: 'quick-phrases' },
  { pattern: /\bcaregiver/i, module: 'caregiver-dashboard' },
  { pattern: /\bcommunication[\s-]?history|message[\s-]?history/i, module: 'communication-history' },
  { pattern: /\baccessibility[\s-]?setting/i, module: 'accessibility-settings' },
  { pattern: /\bemergency[\s-]?speech/i, module: 'emergency-speech' },
  { pattern: /\bcalibrat/i, module: 'onboarding-calibration' },
  { pattern: /\bcommunication[\s-]?board/i, module: 'communication-board' },
  { pattern: /\bspeech\b/i, module: 'text-to-speech' },
  { pattern: /\bsettings\b/i, module: 'accessibility-settings' },
  { pattern: /\bhistory\b/i, module: 'communication-history' },
];

const LISA_REQUIRED_MODULES = [
  'onboarding-calibration',
  'eye-tracking-board',
  'blink-input-engine',
  'gaze-keyboard',
  'text-to-speech',
  'quick-phrases',
  'caregiver-dashboard',
  'communication-history',
  'accessibility-settings',
  'emergency-speech',
];

const LISA_INTERACTIONS = [
  'blink simulation control',
  'gaze selection simulation',
  'phrase selection',
  'message composition',
  'speak button',
  'emergency speech button',
  'calibration controls',
  'settings controls',
  'history filtering',
];

function extractAppName(rawPrompt: string): string {
  const emDash = rawPrompt.match(/\b([A-Z][A-Za-z0-9]*)\s*[—–-]\s*([^.\n]+)/);
  if (emDash) {
    return `${emDash[1]} — ${emDash[2].trim()}`;
  }
  const called = rawPrompt.match(/\bcalled\s+([^\n.]+)/i);
  if (called?.[1]) return called[1].trim();
  const buildNamed = rawPrompt.match(
    /\bbuild\s+(?:a|an|the)?\s*([A-Z][^\n.]{2,80}?)(?:\s+(?:web|mobile)\s+(?:app|application)|\s+app|\s+application)/i,
  );
  if (buildNamed?.[1]) return buildNamed[1].trim();
  if (/\blisa\b/i.test(rawPrompt)) return 'LISA — Locked In Syndrome App';
  return 'Custom App';
}

function extractExplicitModules(rawPrompt: string): string[] {
  const modules: string[] = [];
  const bulletLines = rawPrompt.split(/\n/);
  for (const line of bulletLines) {
    const bullet = line.match(/^\s*[*•-]\s*([a-z][a-z0-9-]{2,40})\s*$/i);
    if (bullet?.[1]) modules.push(normalizeModuleId(bullet[1]));
  }
  for (const match of rawPrompt.matchAll(/\b([a-z][a-z0-9-]*)\s+module\b/gi)) {
    if (match[1]) modules.push(normalizeModuleId(match[1]));
  }
  for (const match of rawPrompt.matchAll(/\b([a-z]+(?:-[a-z]+){1,5})\b/g)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    if (candidate.includes('-') && candidate.length >= 5) {
      modules.push(candidate);
    }
  }
  return dedupeModuleIds(modules);
}

function deriveModulesFromCapabilities(rawPrompt: string): string[] {
  const modules: string[] = [];
  for (const entry of CAPABILITY_TO_MODULE) {
    if (entry.pattern.test(rawPrompt)) modules.push(entry.module);
  }
  return dedupeModuleIds(modules);
}

function inferDomain(rawPrompt: string): string {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    return 'assistive communication / accessibility / health accessibility';
  }
  const lower = rawPrompt.toLowerCase();
  if (/recipe|meal|cook/.test(lower)) return 'culinary / recipe management';
  if (/pet|veterinar/.test(lower)) return 'pet care';
  if (/meditation|mindful/.test(lower)) return 'wellness / mindfulness';
  if (/farm|agricultur|crop/.test(lower)) return 'agriculture';
  return 'custom application domain';
}

function inferTargetUsers(rawPrompt: string): string[] {
  const users: string[] = [];
  if (/caregiver/i.test(rawPrompt)) users.push('caregivers');
  if (/locked[\s-]?in|patient|user with/i.test(rawPrompt)) users.push('assistive communication users');
  if (/android|mobile/i.test(rawPrompt)) users.push('mobile users');
  if (!users.length) users.push('end users');
  return users;
}

function inferPlatform(rawPrompt: string): string {
  if (/android[\s-]?first|android phone/i.test(rawPrompt)) return 'mobile-first / Android-first';
  if (/mobile[\s-]?first/i.test(rawPrompt)) return 'mobile-first';
  if (/ios|iphone/i.test(rawPrompt)) return 'mobile-first / iOS';
  return 'web-first';
}

function inferCorePurpose(rawPrompt: string): string {
  const purpose = rawPrompt.match(
    /(?:that|to)\s+((?:convert|enable|help|allow|provide)[^.]{8,120})/i,
  );
  if (purpose?.[1]) return purpose[1].trim().replace(/\s+/g, ' ');
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    return 'convert eye movement, gaze, and blinks into speech';
  }
  const buildPurpose = rawPrompt.match(/\bbuild\s+[^.]{10,120}\./i);
  return buildPurpose?.[0]?.replace(/^build\s+/i, '').replace(/\.$/, '') ?? 'deliver prompt-specific capabilities';
}

function extractInteractions(rawPrompt: string): string[] {
  const interactions: string[] = [];
  const patterns = [
    /\bblink simulation\b/i,
    /\bgaze selection\b/i,
    /\bphrase selection\b/i,
    /\bmessage composition\b/i,
    /\bspeak button\b/i,
    /\bemergency speech\b/i,
    /\bcalibration control/i,
    /\bsettings control/i,
    /\bhistory filter/i,
    /\bcommunication board\b/i,
  ];
  for (const pattern of patterns) {
    const match = rawPrompt.match(pattern);
    if (match) interactions.push(match[0].toLowerCase());
  }
  if (promptMentionsLisaOrAccessibility(rawPrompt) && interactions.length < 3) {
    return [...LISA_INTERACTIONS];
  }
  return [...new Set(interactions)];
}

function extractSafetyNotes(rawPrompt: string): string[] {
  const notes: string[] = [];
  if (/safety|emergency|urgent/i.test(rawPrompt)) {
    notes.push('Include visible safety and emergency affordances.');
  }
  if (/accessibility|assistive/i.test(rawPrompt)) {
    notes.push('Large accessible controls and high-contrast UI required.');
  }
  return notes;
}

function extractPreviewRequirements(rawPrompt: string): string[] {
  const reqs: string[] = [];
  if (/android|mobile[\s-]?first/i.test(rawPrompt)) {
    reqs.push('Android phone-sized preview container');
  }
  if (/communication board/i.test(rawPrompt)) {
    reqs.push('Communication board visible on first screen');
  }
  return reqs;
}

function isCustomDomainPrompt(rawPrompt: string, explicitModules: string[]): boolean {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) return true;
  if (explicitModules.length >= 3) return true;
  const capabilityModules = deriveModulesFromCapabilities(rawPrompt);
  if (capabilityModules.length >= 3) return true;
  return /custom app|unsupported|unique|specialized|niche/i.test(rawPrompt);
}

export function extractPromptFeatures(rawPrompt: string): PromptFeatureExtraction {
  const explicit = extractExplicitModules(rawPrompt);
  const capability = deriveModulesFromCapabilities(rawPrompt);
  let requiredModules = explicit.length >= 2 ? explicit : capability;

  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    requiredModules = dedupeModuleIds([...LISA_REQUIRED_MODULES, ...requiredModules]);
  }

  if (requiredModules.length < 2) {
    requiredModules = dedupeModuleIds([...requiredModules, 'dashboard', 'settings']);
  }

  const androidPhonePreviewRequired = /android[\s-]?first|android phone|mobile[\s-]?first/i.test(rawPrompt);

  return {
    readOnly: true,
    appName: extractAppName(rawPrompt),
    domain: inferDomain(rawPrompt),
    targetUsers: inferTargetUsers(rawPrompt),
    primaryPlatform: inferPlatform(rawPrompt),
    corePurpose: inferCorePurpose(rawPrompt),
    requiredModules,
    requiredInteractions: extractInteractions(rawPrompt),
    safetyNotes: extractSafetyNotes(rawPrompt),
    previewRequirements: extractPreviewRequirements(rawPrompt),
    androidPhonePreviewRequired,
    isCustomDomainPrompt: isCustomDomainPrompt(rawPrompt, explicit),
    explicitModulesProvided: explicit.length >= 2,
  };
}
