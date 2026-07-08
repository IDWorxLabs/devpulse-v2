/**
 * Live Preview Interaction Proof V1 — planner.
 *
 * Derives generic candidate "primary feature" text terms and plans a small, ordered set of
 * generic interactions to attempt. No app-specific logic: everything here works the same for
 * any generated app, driven only by prompt words, feature contract hints, and manifest hints.
 */

import type {
  FeatureContractHints,
  MaterializationManifestHints,
  PlannedInteraction,
} from './live-preview-interaction-proof-types.js';

const GENERIC_STOPWORDS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'and', 'or', 'but', 'if', 'then',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'they', 'them', 'their',
  'app', 'application', 'build', 'create', 'simple', 'want', 'like', 'can', 'where', 'when',
  'with', 'for', 'to', 'of', 'in', 'on', 'is', 'are', 'be', 'each', 'so', 'as', 'per', 'user',
  'users', 'add', 'show', 'showing', 'let', 'lets', 'from', 'have', 'has', 'also', 'get',
]);

function extractPromptKeywords(prompt: string, limit: number): string[] {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !GENERIC_STOPWORDS.has(word));

  const seen = new Set<string>();
  const result: string[] = [];
  for (const word of words) {
    if (seen.has(word)) continue;
    seen.add(word);
    result.push(word);
    if (result.length >= limit) break;
  }
  return result;
}

export interface PrimaryFeatureCandidates {
  candidateTerms: string[];
  candidateRoutes: string[];
  primaryModuleName: string | null;
}

export function derivePrimaryFeatureCandidates(input: {
  prompt: string;
  featureContractHints?: FeatureContractHints | null;
  materializationManifestHints?: MaterializationManifestHints | null;
}): PrimaryFeatureCandidates {
  const terms: string[] = [];
  const routes: string[] = [];
  let primaryModuleName: string | null = null;

  if (input.featureContractHints) {
    primaryModuleName = input.featureContractHints.primaryModuleName ?? primaryModuleName;
    terms.push(...input.featureContractHints.featureTerms);
    routes.push(...input.featureContractHints.routes);
  }

  if (input.materializationManifestHints) {
    primaryModuleName = primaryModuleName ?? input.materializationManifestHints.featureModuleNames[0] ?? null;
    terms.push(...input.materializationManifestHints.featureModuleNames);
    terms.push(...input.materializationManifestHints.promptTerms);
    routes.push(...input.materializationManifestHints.routes);
  }

  // Always blend in generic prompt-derived keywords as a fallback / supplement — this keeps the
  // proof working even when no contract/manifest hints are available.
  terms.push(...extractPromptKeywords(input.prompt, 8));

  const dedupedTerms = Array.from(new Set(terms.map((t) => t.trim()).filter(Boolean))).slice(0, 10);
  const dedupedRoutes = Array.from(new Set(routes.map((r) => r.trim()).filter(Boolean))).slice(0, 5);

  return {
    candidateTerms: dedupedTerms,
    candidateRoutes: dedupedRoutes,
    primaryModuleName,
  };
}

/**
 * Plans a small, ordered, generic interaction sequence. The runner resolves each planned
 * interaction against whatever generic elements actually exist on the page at proof time —
 * this function never assumes a specific app type exists.
 */
export function planInteractions(maxInteractionAttempts: number): PlannedInteraction[] {
  const plan: PlannedInteraction[] = [
    { readOnly: true, id: 'button-click-1', type: 'BUTTON_CLICK', label: 'Click the first visible button' },
    { readOnly: true, id: 'input-submit-1', type: 'INPUT_SUBMIT', label: 'Fill the first visible text input and submit it' },
    { readOnly: true, id: 'checkbox-toggle-1', type: 'CHECKBOX_TOGGLE', label: 'Toggle the first visible checkbox' },
    { readOnly: true, id: 'select-change-1', type: 'SELECT_CHANGE', label: 'Change the first visible dropdown selection' },
    { readOnly: true, id: 'link-navigation-1', type: 'LINK_NAVIGATION', label: 'Click the first visible internal link' },
  ];
  return plan.slice(0, Math.max(1, maxInteractionAttempts));
}
