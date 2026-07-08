/**
 * Prompt-Faithful Generation V1 — extract features from custom prompts.
 */

import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import {
  detectSimpleUtilityAppKind,
  isSimpleUtilityAppPrompt,
  simpleUtilityFeatureModules,
} from '../simple-utility-app/simple-utility-app-registry.js';
import type { PromptFeatureExtraction } from './prompt-faithful-generation-types.js';
import {
  classifyModulePhrase,
  dedupeModuleIds,
  isValidModuleId,
  normalizeModuleId,
  resolveModuleSynonym,
  sanitizeModuleIds,
} from './prompt-module-name-normalizer.js';

const CAPABILITY_TO_MODULE: Array<{ pattern: RegExp; module: string }> = [
  { pattern: /\beye[\s-]?track(?:ing)?(?:\s+board)?/i, module: 'eye-tracking-board' },
  { pattern: /\bblink[\s-]?(?:input|engine)/i, module: 'blink-input-engine' },
  { pattern: /\bgaze[\s-]?keyboard/i, module: 'gaze-keyboard' },
  { pattern: /\btext[\s-]?to[\s-]?speech|tts\b/i, module: 'text-to-speech' },
  { pattern: /\bquick[\s-]?phrase/i, module: 'quick-phrases' },
  { pattern: /\bcaregiver[\s-]?dashboard/i, module: 'caregiver-dashboard' },
  { pattern: /\bcommunication[\s-]?history|message[\s-]?history/i, module: 'communication-history' },
  { pattern: /\baccessibility[\s-]?settings/i, module: 'accessibility-settings' },
  { pattern: /\bemergency[\s-]?speech/i, module: 'emergency-speech' },
  { pattern: /\bonboarding[\s/-]?calibration|calibration[\s-]?flow/i, module: 'onboarding-calibration' },
  { pattern: /\bcommunication[\s-]?board/i, module: 'eye-tracking-board' },
];

export const LISA_REQUIRED_MODULES = [
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

const MODULE_PROSE_STOPWORDS = new Set(['history', 'output', 'own', 'speech', 'a', 'the', 'its']);

function extractAppName(rawPrompt: string): string {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    const lisaNamed = rawPrompt.match(/\bBuild\s+(LISA\b[^.\n]*)/i);
    if (lisaNamed?.[1]) return lisaNamed[1].trim();
    return 'LISA — Locked In Syndrome App';
  }
  const buildNamed = rawPrompt.match(
    /\bbuild\s+(?:a|an|the)?\s*([A-Z][^\n.]{2,80}?)(?:\s+(?:web|mobile)\s+(?:app|application)|\s+app|\s+application)/i,
  );
  if (buildNamed?.[1]) return buildNamed[1].trim();
  const emDash = rawPrompt.match(/\b([A-Z][A-Za-z0-9]*)\s*[—–-]\s*([^.\n]+)/);
  if (emDash) {
    return `${emDash[1]} — ${emDash[2].trim()}`;
  }
  const called = rawPrompt.match(/\bcalled\s+([^\n.]+)/i);
  if (called?.[1]) return called[1].trim();
  return 'Custom App';
}

function parseModuleLines(section: string): string[] {
  const modules: string[] = [];
  for (const line of section.split('\n')) {
    const bullet = line.match(/^\s*[*•-]?\s*([a-z][a-z0-9-]{2,40})\s*$/i);
    if (bullet?.[1]) modules.push(normalizeModuleId(bullet[1]));
  }
  return modules;
}

function extractRequiredModulesSection(rawPrompt: string): string[] {
  let best: string[] = [];
  const sectionPattern =
    /required\s+modules?\s*:?\s*([\s\S]*?)(?=\n\s*\n|\n(?:interaction|design|architecture|text-to-speech|camera|safety|live preview|final report)\b[^\n]*:|\nThe generated\b)/gi;
  for (const match of rawPrompt.matchAll(sectionPattern)) {
    const modules = parseModuleLines(match[1] ?? '');
    if (modules.length > best.length) best = modules;
  }
  const inline = rawPrompt.match(
    /required\s+modules?\s*:?\s*([a-z][a-z0-9-]+(?:\s+[a-z][a-z0-9-]+){1,24})/i,
  );
  if (inline?.[1]) {
    const modules = inline[1]
      .split(/\s+/)
      .map((token) => normalizeModuleId(token))
      .filter((token) => isValidModuleId(token));
    if (modules.length > best.length) best = modules;
  }
  return dedupeModuleIds(best);
}

function extractExplicitBulletModules(rawPrompt: string): string[] {
  const modules: string[] = [];
  for (const line of rawPrompt.split('\n')) {
    const bullet = line.match(/^\s*[*•-]\s*([a-z][a-z0-9-]{2,40})\s*$/i);
    if (bullet?.[1]) modules.push(normalizeModuleId(bullet[1]));
  }
  return dedupeModuleIds(modules);
}

function extractNamedModuleMentions(rawPrompt: string): string[] {
  const modules: string[] = [];
  for (const match of rawPrompt.matchAll(/\b([a-z][a-z0-9-]*(?:-[a-z0-9-]+)*)\s+module\b/gi)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    if (!candidate || MODULE_PROSE_STOPWORDS.has(candidate)) continue;
    const canonical = resolveModuleSynonym(candidate);
    if (canonical) {
      modules.push(canonical);
      continue;
    }
    if (classifyModulePhrase(candidate) === 'module') modules.push(candidate);
  }
  return dedupeModuleIds(modules);
}

function isRawCandidateToken(moduleId: string): boolean {
  const normalized = normalizeModuleId(moduleId);
  if (!isValidModuleId(normalized)) return false;
  if (MODULE_PROSE_STOPWORDS.has(normalized)) return false;
  if (!normalized.includes('-') && !LISA_REQUIRED_MODULES.includes(normalized)) return false;
  return true;
}

function collectRawModuleCandidates(rawPrompt: string): string[] {
  const explicit = extractExplicitModules(rawPrompt);
  const loose: string[] = [];
  for (const match of rawPrompt.matchAll(/\b([a-z]+(?:-[a-z]+){1,5})\b/g)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    if (isRawCandidateToken(candidate)) loose.push(candidate);
  }
  for (const match of rawPrompt.matchAll(/\b([a-z][a-z0-9-]*)\s+module\b/gi)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    if (isRawCandidateToken(candidate)) loose.push(candidate);
  }
  return dedupeModuleIds([...explicit, ...loose]);
}

function extractExplicitModules(rawPrompt: string): string[] {
  const sectionModules = extractRequiredModulesSection(rawPrompt);
  const bulletModules = extractExplicitBulletModules(rawPrompt);
  const namedModuleMentions = extractNamedModuleMentions(rawPrompt);
  return dedupeModuleIds([...sectionModules, ...bulletModules, ...namedModuleMentions]);
}

function deriveModulesFromCapabilities(rawPrompt: string): string[] {
  const modules: string[] = [];
  for (const entry of CAPABILITY_TO_MODULE) {
    if (entry.pattern.test(rawPrompt)) modules.push(entry.module);
  }
  return dedupeModuleIds(modules);
}

function extractClassifiedPhrases(rawPrompt: string): {
  interactions: string[];
  designRequirements: string[];
  platformRequirements: string[];
  safetyNotes: string[];
  rejectedPhrases: string[];
} {
  const interactions: string[] = [];
  const designRequirements: string[] = [];
  const platformRequirements: string[] = [];
  const safetyNotes: string[] = [];
  const rejectedPhrases: string[] = [];

  const interactionPatterns = [
    /\bblink simulation(?:\s+control)?\b/gi,
    /\bgaze selection(?:\s+simulation)?\b/gi,
    /\bphrase selection\b/gi,
    /\bmessage composition\b/gi,
    /\bspeak button\b/gi,
    /\bemergency speech(?:\s+button)?\b/gi,
    /\bcalibration controls?\b/gi,
    /\bsettings controls?\b/gi,
    /\bhistory filter(?:ing)?\b/gi,
    /\bblink-to-select\b/gi,
    /\bdwell-to-select\b/gi,
    /\bgaze-selectable\b/gi,
  ];
  for (const pattern of interactionPatterns) {
    for (const match of rawPrompt.matchAll(pattern)) {
      interactions.push(match[0].toLowerCase());
    }
  }

  const designPatterns = [
    /\bmobile-first\b/gi,
    /\baccessibility-first\b/gi,
    /\bgaze-friendly\b/gi,
    /\bcaregiver-friendly\b/gi,
    /\bmedical-assistive\b/gi,
    /\bhigh contrast\b/gi,
    /\blarge (?:touch targets|accessible (?:ui )?elements)\b/gi,
    /\bphone-sized(?:\s+preview)?\b/gi,
  ];
  for (const pattern of designPatterns) {
    for (const match of rawPrompt.matchAll(pattern)) {
      designRequirements.push(match[0].toLowerCase());
    }
  }

  const platformPatterns = [
    /\bandroid-first\b/gi,
    /\bandroid phone(?:-sized)?\b/gi,
    /\bmobile-first\b/gi,
    /\bphone-sized preview\b/gi,
  ];
  for (const pattern of platformPatterns) {
    for (const match of rawPrompt.matchAll(pattern)) {
      platformRequirements.push(match[0].toLowerCase());
    }
  }

  if (/not a certified medical device|not certified medical/i.test(rawPrompt)) {
    safetyNotes.push(
      'LISA is an assistive communication tool and not a certified medical device unless formally validated and approved.',
    );
  }

  for (const match of rawPrompt.matchAll(/\b([a-z]+(?:-[a-z]+){1,5})\b/g)) {
    const candidate = normalizeModuleId(match[1] ?? '');
    const classification = classifyModulePhrase(candidate);
    if (classification === 'rejected' || classification === 'interaction' || classification === 'design-requirement') {
      rejectedPhrases.push(candidate);
    }
  }

  return {
    interactions: [...new Set(interactions)],
    designRequirements: [...new Set(designRequirements)],
    platformRequirements: [...new Set(platformRequirements)],
    safetyNotes: [...new Set(safetyNotes)],
    rejectedPhrases: dedupeModuleIds(rejectedPhrases),
  };
}

function inferDomain(rawPrompt: string): string {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    return 'assistive communication / accessibility / health accessibility';
  }
  const lower = rawPrompt.toLowerCase();
  if (/calculator/.test(lower)) return 'utility / calculator';
  if (/todo|to-do/.test(lower)) return 'utility / todo list';
  if (/notes?/.test(lower)) return 'utility / notes';
  if (/timer/.test(lower)) return 'utility / timer';
  if (/counter/.test(lower)) return 'utility / counter';
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

function extractInteractions(rawPrompt: string, classified: string[]): string[] {
  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    return [...new Set([...LISA_INTERACTIONS, ...classified])];
  }
  return classified.length > 0 ? classified : [];
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
  if (isSimpleUtilityAppPrompt(rawPrompt)) return true;
  if (promptMentionsLisaOrAccessibility(rawPrompt)) return true;
  if (explicitModules.length >= 3) return true;
  const capabilityModules = deriveModulesFromCapabilities(rawPrompt);
  if (capabilityModules.length >= 3) return true;
  return /custom app|unsupported|unique|specialized|niche/i.test(rawPrompt);
}

function resolveRequiredModules(
  rawPrompt: string,
  explicit: string[],
  capability: string[],
): { sanitized: string[]; raw: string[]; rejected: string[] } {
  const simpleUtilityKind = detectSimpleUtilityAppKind(rawPrompt);
  if (simpleUtilityKind) {
    const modules = simpleUtilityFeatureModules(simpleUtilityKind);
    return { sanitized: modules, raw: modules, rejected: [] };
  }

  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    const raw = collectRawModuleCandidates(rawPrompt);
    return {
      sanitized: [...LISA_REQUIRED_MODULES],
      raw,
      rejected: dedupeModuleIds([
        ...raw.filter((m) => !LISA_REQUIRED_MODULES.includes(m)),
        ...raw.filter((m) => classifyModulePhrase(m) === 'rejected'),
      ]),
    };
  }

  let candidateModules: string[];
  if (explicit.length >= 2) {
    candidateModules = explicit;
  } else if (capability.length >= 2) {
    candidateModules = capability;
  } else {
    candidateModules = dedupeModuleIds([...explicit, ...capability]);
  }

  const { sanitized, rejected } = sanitizeModuleIds(candidateModules);

  if (sanitized.length < 2 && !isCustomDomainPrompt(rawPrompt, explicit)) {
    return {
      sanitized: dedupeModuleIds([...sanitized, 'dashboard', 'settings']),
      raw: candidateModules,
      rejected,
    };
  }

  return { sanitized, raw: candidateModules, rejected };
}

export function extractPromptFeatures(rawPrompt: string): PromptFeatureExtraction {
  const explicit = extractExplicitModules(rawPrompt);
  const capability = deriveModulesFromCapabilities(rawPrompt);
  const classified = extractClassifiedPhrases(rawPrompt);
  const { sanitized, raw, rejected } = resolveRequiredModules(rawPrompt, explicit, capability);

  const androidPhonePreviewRequired = /android[\s-]?first|android phone|mobile[\s-]?first/i.test(rawPrompt);

  return {
    readOnly: true,
    appName: extractAppName(rawPrompt),
    domain: inferDomain(rawPrompt),
    targetUsers: inferTargetUsers(rawPrompt),
    primaryPlatform: inferPlatform(rawPrompt),
    corePurpose: inferCorePurpose(rawPrompt),
    requiredModules: sanitized,
    rawExtractedModules: raw,
    rejectedNonModulePhrases: dedupeModuleIds([...rejected, ...classified.rejectedPhrases]),
    requiredInteractions: extractInteractions(rawPrompt, classified.interactions),
    designRequirements: classified.designRequirements,
    platformRequirements: classified.platformRequirements,
    safetyNotes: classified.safetyNotes,
    previewRequirements: extractPreviewRequirements(rawPrompt),
    androidPhonePreviewRequired,
    isCustomDomainPrompt: isCustomDomainPrompt(rawPrompt, explicit),
    explicitModulesProvided: explicit.length >= 2,
    sanitizedModuleCount: sanitized.length,
    rawExtractedModuleCount: raw.length,
  };
}

// Preserve stopword export for tests that may reference module prose filtering.
export const MODULE_PROSE_STOPWORDS_FOR_TESTS = MODULE_PROSE_STOPWORDS;
