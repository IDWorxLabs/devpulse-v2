/**
 * New Build Decision Authority V2 — evidence scoring primitives.
 *
 * Every signal is evaluated independently as a named, weighted piece of evidence (reason +
 * confidence + source) rather than a binary keyword hit. This is what makes the decision
 * evidence-driven instead of keyword-driven: a single incidental word inside a large, complete
 * product description (e.g. a feature list that happens to mention "update the delivery address")
 * can never, by itself, outweigh overwhelming new-build evidence the way a binary
 * "any keyword match => continuation" rule could.
 *
 * Purely generic, evidence-only: nothing here branches on product domain. Callers supply the raw
 * prompt / project evidence; this module only measures how strongly that evidence points toward
 * NEW_BUILD, CONTINUATION, or genuine AMBIGUITY.
 */

export type EvidenceSource = 'PROMPT_TEXT' | 'PROJECT_CONTEXT' | 'REQUEST_METADATA';

export interface DecisionEvidenceItem {
  id: string;
  reason: string;
  confidence: number;
  source: EvidenceSource;
}

/**
 * Words that describe *categories* of software product rather than any specific product — they
 * must never, by themselves, create continuation evidence or drive identity-compatibility
 * decisions. Two completely unrelated "X management platform" products can share every one of
 * these words while describing entirely different products.
 */
export const GENERIC_PRODUCT_WORDS: ReadonlySet<string> = new Set([
  'app',
  'application',
  'platform',
  'management',
  'system',
  'dashboard',
  'user',
  'users',
  'feature',
  'features',
  'module',
  'modules',
  'project',
  'product',
  'tool',
  'website',
  'site',
  'service',
  'software',
  'build',
  'new',
]);

/**
 * Ordinary English function/stop words — purely linguistic, not product-domain vocabulary. Left
 * unfiltered they would inflate token-overlap denominators with noise unrelated to what the
 * product actually is, which can dilute a real (small) amount of shared meaningful vocabulary
 * below the compatibility threshold. Stripping them is generic grammar handling, not
 * application-specific logic.
 */
const ENGLISH_STOPWORDS: ReadonlySet<string> = new Set([
  'and',
  'the',
  'with',
  'for',
  'from',
  'into',
  'onto',
  'that',
  'this',
  'are',
  'was',
  'were',
  'has',
  'have',
  'had',
  'not',
  'but',
  'all',
  'any',
  'its',
  'our',
  'per',
  'via',
  'you',
  'your',
  'they',
  'their',
  'them',
  'can',
  'will',
  'shall',
  'should',
  'would',
  'could',
  'also',
  'more',
  'than',
  'then',
  'when',
  'where',
  'while',
  'about',
  'over',
  'under',
  'after',
  'before',
  'between',
  'these',
  'those',
  'each',
  'who',
  'whom',
  'which',
  'what',
]);

export const NEW_BUILD_STRONG_THRESHOLD = 0.5;
export const NEW_BUILD_MODERATE_THRESHOLD = 0.3;
export const CONTINUATION_STRONG_THRESHOLD = 0.5;
export const CONTINUATION_MODERATE_THRESHOLD = 0.3;
export const LOW_THRESHOLD = 0.2;
export const CLOSE_SCORE_MARGIN = 0.15;
export const IDENTITY_COMPATIBILITY_THRESHOLD = 0.2;

function wordTokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function tokenizeMeaningful(text: string | null | undefined): string[] {
  if (!text) return [];
  return wordTokens(text).filter((t) => t.length > 2 && !GENERIC_PRODUCT_WORDS.has(t) && !ENGLISH_STOPWORDS.has(t));
}

export function jaccardOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const tok of setA) {
    if (setB.has(tok)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * True when there is no identity to compare against (nothing to conflict with), when the
 * existing identity carried no meaningful vocabulary, or when the *meaningful* (non-generic)
 * vocabulary overlaps enough to plausibly be the same product. Generic product-category words
 * (platform/management/system/dashboard/...) are stripped before comparing, so two unrelated
 * products that both happen to be "a management platform" are never treated as the same product
 * on that basis alone (requirement: generic words must never independently create continuation
 * evidence or false compatibility).
 */
export function isIdentityCompatible(
  rawPrompt: string,
  currentProjectIdentitySummary: string | null | undefined,
): boolean {
  if (!currentProjectIdentitySummary || !currentProjectIdentitySummary.trim()) return true;
  const identityTokens = tokenizeMeaningful(currentProjectIdentitySummary);
  if (identityTokens.length === 0) return true;
  const promptTokens = tokenizeMeaningful(rawPrompt);
  return jaccardOverlap(promptTokens, identityTokens) >= IDENTITY_COMPATIBILITY_THRESHOLD;
}

export function sumConfidence(items: DecisionEvidenceItem[]): number {
  return Math.min(1, items.reduce((sum, item) => sum + item.confidence, 0));
}

function referencesProjectByName(rawPrompt: string, projectName: string | null | undefined): boolean {
  const trimmed = projectName?.trim().toLowerCase();
  if (!trimmed || trimmed.length < 3) return false;
  return rawPrompt.toLowerCase().includes(trimmed);
}

// ---------------------------------------------------------------------------------------------
// NEW_BUILD evidence
// ---------------------------------------------------------------------------------------------

// Deliberately requires the verb to govern an object article (a/an/the/another/more/new), not
// just any occurrence of the word — "make it nicer" or "fix the build" must NOT count as an
// explicit build request, only "make/build/create/generate a|an|the|another|more|new ...".
const EXPLICIT_BUILD_VERB_PATTERN =
  /\b(?:build|create|generate|make)\b(?:\s+\w+){0,2}?\s+\b(?:a|an|the|another|more|new)\b/i;
const EXPLICIT_BUILD_VERB_WITH_PRODUCT_NOUN_PATTERN =
  /\b(?:build|create|generate|make)\b(?:\s+\w+){0,4}?\s+\b(?:app|application|website|site|tool|platform|system|dashboard|service|product)\b/i;
const PRODUCT_NOUN_PATTERN = /\b(app|application|website|site|tool|platform|system|dashboard|service|product)\b/i;
const MIN_WORDS_FOR_FULL_DESCRIPTION = 6;
const MIN_WORDS_FOR_LARGE_SPEC = 30;

export interface NewBuildEvidenceInput {
  rawPrompt: string;
  requestedProjectId?: string | null;
  requestedProjectName?: string | null;
  currentProjectIdentitySummary?: string | null;
  /** Number of continuation evidence items already computed for this same prompt (evidence
   * categories are evaluated independently, but "no continuation language at all" needs to know
   * the continuation side's result). */
  continuationEvidenceCount: number;
}

export function computeNewBuildEvidence(input: NewBuildEvidenceInput): DecisionEvidenceItem[] {
  const rawPrompt = input.rawPrompt ?? '';
  const words = wordTokens(rawPrompt);
  const evidence: DecisionEvidenceItem[] = [];

  if (EXPLICIT_BUILD_VERB_PATTERN.test(rawPrompt)) {
    evidence.push({
      id: 'EXPLICIT_BUILD_VERB',
      reason: 'Prompt explicitly uses a build/create/generate/make verb.',
      confidence: 0.25,
      source: 'PROMPT_TEXT',
    });
  }
  if (EXPLICIT_BUILD_VERB_WITH_PRODUCT_NOUN_PATTERN.test(rawPrompt)) {
    evidence.push({
      id: 'EXPLICIT_BUILD_VERB_WITH_PRODUCT_NOUN',
      reason: 'Prompt explicitly asks to build/create/generate/make a named kind of product (app/platform/system/tool/...).',
      confidence: 0.2,
      source: 'PROMPT_TEXT',
    });
  }
  if (words.length >= MIN_WORDS_FOR_FULL_DESCRIPTION && PRODUCT_NOUN_PATTERN.test(rawPrompt)) {
    evidence.push({
      id: 'COMPLETE_STANDALONE_DESCRIPTION',
      reason: `Prompt reads as a complete, standalone product description (${words.length} words, names a product type).`,
      confidence: 0.25,
      source: 'PROMPT_TEXT',
    });
  }
  if (words.length >= MIN_WORDS_FOR_LARGE_SPEC) {
    evidence.push({
      id: 'LARGE_FEATURE_SPECIFICATION',
      reason: `Prompt is a large feature specification (${words.length} words) — the kind of detail typically only present in a fresh product brief.`,
      confidence: 0.3,
      source: 'PROMPT_TEXT',
    });
  }
  if (
    input.currentProjectIdentitySummary &&
    input.currentProjectIdentitySummary.trim() &&
    !isIdentityCompatible(rawPrompt, input.currentProjectIdentitySummary)
  ) {
    evidence.push({
      id: 'FRESH_PRODUCT_IDENTITY',
      reason:
        "Prompt introduces a product identity with no meaningful (non-generic) vocabulary overlap with the current project's identity summary.",
      confidence: 0.5,
      source: 'PROJECT_CONTEXT',
    });
  }
  const hasExplicitProjectReference =
    Boolean(input.requestedProjectId?.trim()) || referencesProjectByName(rawPrompt, input.requestedProjectName);
  if (!hasExplicitProjectReference) {
    evidence.push({
      id: 'NO_EXISTING_PROJECT_REFERENCE',
      reason: 'Prompt does not reference any existing project by id or name.',
      confidence: 0.1,
      source: 'REQUEST_METADATA',
    });
  }
  if (input.continuationEvidenceCount === 0) {
    evidence.push({
      id: 'NO_CONTINUATION_LANGUAGE',
      reason: 'Prompt contains no continuation, resume, or modification language at all.',
      confidence: 0.15,
      source: 'PROMPT_TEXT',
    });
  }
  return evidence;
}

// ---------------------------------------------------------------------------------------------
// CONTINUATION evidence
// ---------------------------------------------------------------------------------------------

const EXPLICIT_CONTINUATION_VERB_PATTERN = /\b(continue|resume|keep (?:on )?working on|pick up where)\b/i;
const EXPLICIT_MODIFICATION_VERB_PATTERN = /\b(modify|update|fix|improve|enhance|extend|change|adjust|repair)\b/i;
const EXPLICIT_PROJECT_REFERENCE_PATTERN = /\b(?:current|existing|this|my|our|same)\s+(?:app|project|build)\b/i;

export interface ContinuationEvidenceInput {
  rawPrompt: string;
  requestedProjectId?: string | null;
  requestedProjectName?: string | null;
}

/**
 * Deliberately narrow and phrase-based: continuation evidence never comes from generic
 * product-category vocabulary (platform/application/management/system/dashboard/...), only from
 * explicit continuation/modification verbs or explicit references to "the current/existing/this
 * project", so a single incidental occurrence deep inside a large new-build spec (e.g. a feature
 * bullet like "staff can update order status") contributes only a small, capped amount of
 * evidence rather than unconditionally flipping the decision.
 */
export function computeContinuationEvidence(input: ContinuationEvidenceInput): DecisionEvidenceItem[] {
  const rawPrompt = input.rawPrompt ?? '';
  const evidence: DecisionEvidenceItem[] = [];

  if (EXPLICIT_CONTINUATION_VERB_PATTERN.test(rawPrompt)) {
    evidence.push({
      id: 'EXPLICIT_CONTINUATION_VERB',
      reason: 'Prompt explicitly uses continuation language (continue/resume/keep working on/pick up where).',
      confidence: 0.4,
      source: 'PROMPT_TEXT',
    });
  }
  if (EXPLICIT_MODIFICATION_VERB_PATTERN.test(rawPrompt)) {
    evidence.push({
      id: 'EXPLICIT_MODIFICATION_VERB',
      reason: 'Prompt uses modification language (modify/update/fix/improve/enhance/extend/change/adjust/repair).',
      confidence: 0.15,
      source: 'PROMPT_TEXT',
    });
  }
  if (EXPLICIT_PROJECT_REFERENCE_PATTERN.test(rawPrompt)) {
    evidence.push({
      id: 'EXPLICIT_PROJECT_REFERENCE',
      reason: 'Prompt explicitly refers to "the current/existing/this/my/our/same app/project/build".',
      confidence: 0.35,
      source: 'PROMPT_TEXT',
    });
  }
  // Deliberately text-only: an activeProjectId merely being present on the request (e.g. a
  // project happens to be selected in the session) is not, by itself, continuation intent — it is
  // the "compatible existing project" half of the requirement, gated separately by
  // hasKnownExistingProject in the decision algorithm. Only the prompt *text* naming the project
  // counts as continuation evidence here.
  if (referencesProjectByName(rawPrompt, input.requestedProjectName)) {
    evidence.push({
      id: 'EXPLICIT_PROJECT_NAME_MATCH',
      reason: 'Prompt text explicitly names the known existing project.',
      confidence: 0.35,
      source: 'REQUEST_METADATA',
    });
  }
  return evidence;
}

// ---------------------------------------------------------------------------------------------
// AMBIGUITY evidence
// ---------------------------------------------------------------------------------------------

export interface AmbiguityEvidenceInput {
  newBuildScore: number;
  continuationScore: number;
  hasKnownExistingProject: boolean;
}

export function computeAmbiguityEvidence(input: AmbiguityEvidenceInput): DecisionEvidenceItem[] {
  const evidence: DecisionEvidenceItem[] = [];
  const gap = Math.abs(input.newBuildScore - input.continuationScore);
  const strongestSide = Math.max(input.newBuildScore, input.continuationScore);

  if (gap <= CLOSE_SCORE_MARGIN && strongestSide >= NEW_BUILD_MODERATE_THRESHOLD) {
    evidence.push({
      id: 'CLOSE_COMPETING_SCORES',
      reason: `New-build evidence (${input.newBuildScore.toFixed(2)}) and continuation evidence (${input.continuationScore.toFixed(2)}) are close enough that both interpretations are genuinely plausible.`,
      confidence: 0.5,
      source: 'PROMPT_TEXT',
    });
  }
  if (input.newBuildScore < LOW_THRESHOLD && input.continuationScore < LOW_THRESHOLD) {
    evidence.push({
      id: 'BOTH_SCORES_LOW',
      reason: 'Neither new-build nor continuation evidence reaches even a low confidence bar — the prompt is too vague to classify safely.',
      confidence: 0.5,
      source: 'PROMPT_TEXT',
    });
  }
  if (
    input.continuationScore >= CONTINUATION_MODERATE_THRESHOLD &&
    !input.hasKnownExistingProject &&
    input.newBuildScore < NEW_BUILD_MODERATE_THRESHOLD
  ) {
    evidence.push({
      id: 'CONTINUATION_INTENT_WITHOUT_VALID_PROJECT',
      reason:
        'Prompt reads like a continuation request, but no existing project is known, and there is not enough standalone product content to safely default to a new build.',
      confidence: 0.6,
      source: 'PROJECT_CONTEXT',
    });
  }
  return evidence;
}
