/**
 * Universal Prompt-to-App Materialization V1 — prompt-derived app metadata.
 */

import { shouldUseCustomFeatureDefinition } from '../prompt-faithful-generation/custom-feature-contract-builder.js';
import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import {
  detectSimpleUtilityAppKind,
  simpleUtilityFeatureModules,
} from '../simple-utility-app/simple-utility-app-registry.js';
import {
  dedupeModuleIds,
  suppressFallbackModulesWhenCustomExists,
} from '../prompt-faithful-generation/prompt-module-name-normalizer.js';
import { promptExplicitlyRequiresAuth } from '../universal-build-pipeline-verification/build-profile-policy.js';

/**
 * Identity Computation Collapse V1 — DRAFT / PRE-CONTRACT ONLY. Independent raw-prompt title
 * derivation. Every real production materialization call site now supplies `approvedIdentity`
 * (the CBGA-repaired identity — PPC-1207 No Parallel Truth) and this function is only reached as a
 * fallback for pre-CBGA/isolated/test-only callers that intentionally omit it. No production stage
 * downstream of Contract-Bound Generation Authority V4 may treat this function's output as
 * authoritative.
 */
export function extractPromptAppTitle(rawPrompt: string): string {
  const called = rawPrompt.match(/\bcalled\s+([A-Za-z][A-Za-z0-9]*)/i);
  if (called?.[1]) return called[1];

  const named = rawPrompt.match(/\bnamed\s+([A-Za-z][A-Za-z0-9]*)/i);
  if (named?.[1]) return named[1];

  // Longest-first articles `(?:an|a|the)` — never `(?:a|an|the)` which truncates "an" to leftover "n".
  const buildMatch = rawPrompt.match(
    /\b(?:build|create|make|generate|develop|provision|scaffold)\s+(?:an|a|the)?\s*(?:modern\s+|simple\s+|full-featured\s+|small-business\s+)?([A-Za-z][A-Za-z0-9\s-]{2,48}?)(?:\s+(?:web|mobile)\s+(?:app|application)|\s+app|\s+application|\s+system|\s+platform|\s+console|\s+software|\s+manager|\s+tool)/i,
  );
  if (buildMatch?.[1]) {
    const title = buildMatch[1]
      .trim()
      .split(/\s+/)
      .map((word) => {
        if (/^[A-Z0-9]{2,6}$/.test(word)) return word;
        if (word.includes('-')) {
          return word
            .split('-')
            .map((part) =>
              !part
                ? part
                : /^[A-Z0-9]{2,6}$/.test(part)
                  ? part
                  : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
            )
            .join('-');
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    if (title.length >= 2 && !/^n\b/i.test(title) && !/\brelationships?\b/i.test(title)) return title;
  }

  return 'Custom App';
}

export function deriveNeutralAppTagline(appName: string): string {
  return `${appName} — modular application workspace`;
}

/** Prompt-derived metadata — domain language in app names is allowed here only. */
export function buildPromptAppMetadataTs(
  appName: string,
  tagline?: string,
  landingSummary?: string,
  homeSummary?: string,
): string {
  const resolvedTagline = tagline ?? deriveNeutralAppTagline(appName);
  const resolvedLandingSummary = landingSummary ?? `${appName}.`;
  const resolvedHomeSummary = homeSummary ?? `${appName} is ready.`;
  return `/** Prompt-derived app metadata — not part of the universal blueprint shell */
export const APP_NAME = ${JSON.stringify(appName)};
export const APP_TAGLINE = ${JSON.stringify(resolvedTagline)};
export const APP_LANDING_SUMMARY = ${JSON.stringify(resolvedLandingSummary)};
export const APP_HOME_SUMMARY = ${JSON.stringify(resolvedHomeSummary)};
`;
}

export function summarizePrompt(rawPrompt: string, maxLength = 160): string {
  const trimmed = rawPrompt.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

export function derivePromptFeatureTerms(rawPrompt: string): string[] {
  const lower = rawPrompt.toLowerCase();
  const candidates = [
    'habit',
    'streak',
    'daily routine',
    'routine',
    'dashboard',
    'reports',
    'charts',
    'analytics',
    'export',
    'csv',
    'categories',
    'income',
    'expenses',
    'balance',
    'customers',
    'leads',
    'pipeline',
    'deals',
    'contacts',
    'inventory',
    'stock',
    'products',
    'suppliers',
    'reorder',
    'booking',
    'appointments',
    'schedule',
    'qr',
    'scan',
    'generate',
    'tasks',
    'projects',
    'due dates',
    'notes',
    'records',
    'settings',
    'labels',
    'calendar',
    'workspace',
    'custom',
  ];
  return candidates.filter((term) => lower.includes(term));
}

export function deriveGenericCustomFeatureModules(rawPrompt: string): string[] {
  const simpleUtilityKind = detectSimpleUtilityAppKind(rawPrompt);
  if (simpleUtilityKind) {
    return simpleUtilityFeatureModules(simpleUtilityKind);
  }

  const extraction = extractPromptFeatures(rawPrompt);
  if (shouldUseCustomFeatureDefinition(extraction, 'GENERIC_CUSTOM_APP_V1')) {
    const productModules = extraction.requiredModules.filter((m) => m !== 'auth');
    return dedupeModuleIds(
      promptExplicitlyRequiresAuth(rawPrompt) ? ['auth', ...productModules] : productModules,
    );
  }

  const terms = derivePromptFeatureTerms(rawPrompt);
  const modules = new Set<string>(['dashboard']);
  if (promptExplicitlyRequiresAuth(rawPrompt)) {
    modules.add('auth');
  }
  const bannedTerms = new Set(['tasks', 'projects', 'team', 'timeline', 'deals', 'leads', 'expenses', 'inventory']);
  for (const term of terms) {
    if (bannedTerms.has(term)) continue;
    if (/habit|streak|routine/.test(term)) {
      modules.add('habits');
      modules.add('streaks');
    }
    if (/dashboard|report|chart|analytics/.test(term)) modules.add('analytics');
    if (/export|csv/.test(term) && /\bexport|csv\b/i.test(rawPrompt)) modules.add('export');
    if (/category|categories/.test(term)) modules.add('categories');
    if (term.length > 2) modules.add(term.replace(/\s+/g, '-'));
  }
  if (modules.size <= 2) {
    modules.add('records');
    modules.add('settings');
  }
  return suppressFallbackModulesWhenCustomExists([...modules], extraction.requiredModules);
}
