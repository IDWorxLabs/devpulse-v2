/**
 * Prompt-Faithful Generation V1 — module name normalization and sanitization.
 */

import { BANNED_FALLBACK_MODULES } from './prompt-faithful-generation-types.js';

export type ModulePhraseClassification =
  | 'module'
  | 'interaction'
  | 'design-requirement'
  | 'platform-requirement'
  | 'safety-note'
  | 'implementation-note'
  | 'rejected';

export const ADJECTIVE_STYLE_MODULE_PHRASES = new Set([
  'mobile-first',
  'phone-sized',
  'accessibility-first',
  'caregiver-assisted',
  'gaze-selectable',
  'blink-to-select',
  'dwell-to-select',
  'gaze-friendly',
  'caregiver-friendly',
  'medical-assistive',
  'medical-grade',
  'gaze-based',
  'camera-based',
  'locked-in',
  'accessibility-first',
]);

export const WEAK_MODULE_PHRASES = new Set([
  'output',
  'history',
  'own',
  'to-speech',
  'eye-tracking',
  ...ADJECTIVE_STYLE_MODULE_PHRASES,
  ...BANNED_FALLBACK_MODULES,
]);

const MODULE_SYNONYM_TO_CANONICAL: Record<string, string | null> = {
  history: 'communication-history',
  output: 'text-to-speech',
  'to-speech': 'text-to-speech',
  'eye-tracking': 'eye-tracking-board',
  'communication-board': 'eye-tracking-board',
  settings: 'accessibility-settings',
  calibration: 'onboarding-calibration',
};

const INTERACTION_PHRASES = [
  'blink simulation control',
  'blink simulation',
  'gaze selection simulation',
  'gaze selection',
  'phrase selection',
  'message composition',
  'speak button',
  'emergency speech button',
  'emergency speech',
  'calibration controls',
  'calibration control',
  'settings controls',
  'settings control',
  'history filtering',
  'history filter',
  'blink-to-select',
  'dwell-to-select',
  'gaze-selectable',
];

const DESIGN_REQUIREMENT_PHRASES = [
  'mobile-first',
  'accessibility-first',
  'gaze-friendly',
  'caregiver-friendly',
  'medical-assistive',
  'high contrast',
  'large touch targets',
  'large accessible',
  'phone-sized preview',
  'phone-sized',
];

const PLATFORM_REQUIREMENT_PHRASES = [
  'android-first',
  'android phone',
  'mobile-first',
  'phone-sized preview',
  'phone-sized',
];

const IMPLEMENTATION_NOTE_PHRASES = [
  'camera-based',
  'medical-grade',
  'gaze-based',
  'simulated preview',
];

export function normalizeModuleId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function isValidModuleId(moduleId: string): boolean {
  return moduleId.length >= 2 && /^[a-z][a-z0-9-]*$/.test(moduleId);
}

export function dedupeModuleIds(moduleIds: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of moduleIds) {
    const normalized = normalizeModuleId(raw);
    if (!isValidModuleId(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function classifyModulePhrase(raw: string): ModulePhraseClassification {
  const normalized = normalizeModuleId(raw);
  if (!normalized) return 'rejected';

  const lowerRaw = raw.trim().toLowerCase();
  if (/not a certified medical device|not certified medical/i.test(lowerRaw)) return 'safety-note';
  if (INTERACTION_PHRASES.some((phrase) => lowerRaw.includes(phrase) || normalized === normalizeModuleId(phrase))) {
    return 'interaction';
  }
  if (DESIGN_REQUIREMENT_PHRASES.some((phrase) => lowerRaw.includes(phrase) || normalized === normalizeModuleId(phrase))) {
    return 'design-requirement';
  }
  if (PLATFORM_REQUIREMENT_PHRASES.some((phrase) => lowerRaw.includes(phrase) || normalized === normalizeModuleId(phrase))) {
    return 'platform-requirement';
  }
  if (IMPLEMENTATION_NOTE_PHRASES.some((phrase) => lowerRaw.includes(phrase) || normalized === normalizeModuleId(phrase))) {
    return 'implementation-note';
  }
  if (WEAK_MODULE_PHRASES.has(normalized) || ADJECTIVE_STYLE_MODULE_PHRASES.has(normalized)) {
    return normalized in MODULE_SYNONYM_TO_CANONICAL ? 'module' : 'rejected';
  }
  if (normalized.includes('-') && normalized.length >= 5) return 'module';
  if (isValidModuleId(normalized) && normalized.length >= 8) return 'module';
  return 'rejected';
}

export function resolveModuleSynonym(moduleId: string): string | null {
  const normalized = normalizeModuleId(moduleId);
  if (!normalized) return null;
  if (Object.prototype.hasOwnProperty.call(MODULE_SYNONYM_TO_CANONICAL, normalized)) {
    return MODULE_SYNONYM_TO_CANONICAL[normalized];
  }
  if (WEAK_MODULE_PHRASES.has(normalized) && !(normalized in MODULE_SYNONYM_TO_CANONICAL)) {
    return null;
  }
  if (BANNED_FALLBACK_MODULES.includes(normalized as (typeof BANNED_FALLBACK_MODULES)[number])) {
    return null;
  }
  return normalized;
}

export function sanitizeModuleIds(
  moduleIds: string[],
  options?: { allowInfrastructure?: string[] },
): {
  sanitized: string[];
  rejected: string[];
} {
  const allow = new Set(options?.allowInfrastructure ?? ['auth', 'dashboard', 'settings', 'persistence']);
  const rejected: string[] = [];
  const canonicalSeen = new Set<string>();
  const sanitized: string[] = [];

  for (const raw of moduleIds) {
    const classification = classifyModulePhrase(raw);
    const canonical = resolveModuleSynonym(raw);
    if (classification !== 'module' && !canonical) {
      if (classification === 'rejected' || WEAK_MODULE_PHRASES.has(normalizeModuleId(raw))) {
        rejected.push(normalizeModuleId(raw));
      }
      continue;
    }
    const resolved = canonical ?? normalizeModuleId(raw);
    if (!isValidModuleId(resolved)) {
      rejected.push(normalizeModuleId(raw));
      continue;
    }
    if (BANNED_FALLBACK_MODULES.includes(resolved as (typeof BANNED_FALLBACK_MODULES)[number]) && !allow.has(resolved)) {
      rejected.push(resolved);
      continue;
    }
    if (canonicalSeen.has(resolved)) continue;
    canonicalSeen.add(resolved);
    sanitized.push(resolved);
  }

  return { sanitized, rejected: dedupeModuleIds(rejected) };
}

export function suppressFallbackModulesWhenCustomExists(
  modules: string[],
  customModules: string[],
): string[] {
  if (customModules.length < 2) return modules;
  const banned = new Set<string>(BANNED_FALLBACK_MODULES);
  return modules.filter((moduleId) => !banned.has(moduleId));
}

export function isRejectedNonModulePhrase(moduleId: string): boolean {
  const normalized = normalizeModuleId(moduleId);
  if (!normalized || normalized === 'auth') return false;
  if (BANNED_FALLBACK_MODULES.includes(normalized as (typeof BANNED_FALLBACK_MODULES)[number])) {
    return true;
  }
  if (WEAK_MODULE_PHRASES.has(normalized)) {
    return !(normalized in MODULE_SYNONYM_TO_CANONICAL);
  }
  return classifyModulePhrase(normalized) === 'rejected';
}

export function moduleIdsInclude(modules: string[], target: string): boolean {
  const normalized = normalizeModuleId(target);
  return modules.some(
    (moduleId) =>
      moduleId === normalized ||
      moduleId.includes(normalized) ||
      normalized.includes(moduleId),
  );
}

/** @deprecated use sanitizeModuleIds */
export function sanitizePromptProductModules(moduleIds: string[]): string[] {
  return sanitizeModuleIds(moduleIds).sanitized;
}

export function filterBannedModulesFromDefinition(moduleIds: string[]): string[] {
  return moduleIds.filter(
    (moduleId) => !BANNED_FALLBACK_MODULES.includes(moduleId as (typeof BANNED_FALLBACK_MODULES)[number]),
  );
}

export function isBannedFallbackModuleId(moduleId: string): boolean {
  const normalized = normalizeModuleId(moduleId);
  return BANNED_FALLBACK_MODULES.includes(normalized as (typeof BANNED_FALLBACK_MODULES)[number]);
}

/** @deprecated use classifyModulePhrase */
export const classifyPromptPhrase = classifyModulePhrase;

export const REJECTED_NON_MODULE_PHRASES = [...WEAK_MODULE_PHRASES];
