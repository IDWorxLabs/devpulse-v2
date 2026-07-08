/**
 * Stale Context Detector — runs before planning, architecture, feature contract generation,
 * module generation, materialization, and preview proof. Compares candidate concepts about to
 * be used/generated against the sources the Context Scope Authority has blocked for this build.
 * If a blocked source's concepts show up in the candidates anyway, that is stale-context
 * contamination: the stage must stop and report the exact contaminated source rather than
 * proceeding silently.
 *
 * Pure, generic set-comparison logic. No product-domain knowledge.
 */

import { isSourceBlocked } from './context-scope-authority.js';
import type {
  ContextScope,
  ModuleOriginCandidate,
  StaleContextCheckInput,
  StaleContextCheckResult,
  StaleContextDetection,
  StaleContextLeakageKind,
} from './project-context-isolation-types.js';

function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 2);
}

function normalizeConceptList(concepts: readonly string[] | undefined): string[] {
  return (concepts ?? []).map((c) => c.toLowerCase().trim()).filter(Boolean);
}

/** Concepts present in `candidate` and in `staleSource`, but not explained by `prompt`. */
function findUnexplainedOverlap(candidate: string[], staleSource: string[], prompt: string[]): string[] {
  const promptSet = new Set(prompt);
  const staleSet = new Set(staleSource);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const token of candidate) {
    if (seen.has(token)) continue;
    seen.add(token);
    if (staleSet.has(token) && !promptSet.has(token)) {
      result.push(token);
    }
  }
  return result;
}

function detectTokenLeak(
  kind: StaleContextLeakageKind,
  gated: boolean,
  candidateTokens: string[],
  staleTokens: string[],
  promptTokens: string[],
  sourceLabel: string,
): StaleContextDetection {
  if (!gated || staleTokens.length === 0 || candidateTokens.length === 0) {
    return { kind, detected: false, contaminatedSource: null, detail: `${sourceLabel}: no unexplained overlap (gated=${gated}).` };
  }
  const unexplained = findUnexplainedOverlap(candidateTokens, staleTokens, promptTokens);
  if (unexplained.length === 0) {
    return { kind, detected: false, contaminatedSource: null, detail: `${sourceLabel}: candidate concepts fully explained by the current prompt.` };
  }
  return {
    kind,
    detected: true,
    contaminatedSource: sourceLabel,
    detail: `${sourceLabel} leaked into candidate concepts, unexplained by the current prompt: ${unexplained.join(', ')}.`,
  };
}

function detectStaleActiveProjectId(input: StaleContextCheckInput): StaleContextDetection {
  const kind: StaleContextLeakageKind = 'STALE_ACTIVE_PROJECT_ID';
  const active = input.activeProjectIdCandidate ?? null;
  const requested = input.requestedProjectId ?? null;
  const detected =
    input.scope.decision === 'NEW_BUILD' &&
    active !== null &&
    requested !== null &&
    active === requested &&
    isSourceBlocked(input.scope, 'PREVIOUS_ACTIVE_PROJECT');
  return {
    kind,
    detected,
    contaminatedSource: detected ? active : null,
    detail: detected
      ? `Build decision is NEW_BUILD but the resolved project id (${requested}) matches a stale active project id (${active}); the active-project fallback safeguard did not take effect.`
      : 'No stale active-project-id leak detected.',
  };
}

function detectUnjustifiedFallbackModules(candidates: ModuleOriginCandidate[] | undefined): StaleContextDetection {
  const kind: StaleContextLeakageKind = 'UNJUSTIFIED_FALLBACK_MODULE';
  const unjustified = (candidates ?? []).filter((m) => !m.justified);
  const detected = unjustified.length > 0;
  return {
    kind,
    detected,
    contaminatedSource: detected ? unjustified.map((m) => `${m.moduleId} (${m.origin})`).join(', ') : null,
    detail: detected
      ? `Module(s) included without prompt-evidence justification: ${unjustified.map((m) => m.moduleId).join(', ')}.`
      : 'No unjustified fallback modules detected.',
  };
}

export function runStaleContextCheck(input: StaleContextCheckInput): StaleContextCheckResult {
  const promptTokens = input.currentPromptConcepts.length
    ? normalizeConceptList(input.currentPromptConcepts)
    : tokenize(input.currentPromptConcepts.join(' '));
  const canonicalTokens = tokenize(input.canonicalIdentity);
  const inheritedTokens = normalizeConceptList(input.candidateInheritedConcepts);
  const generatedTokens = normalizeConceptList(input.candidateGeneratedConcepts);
  const candidateTokens = [...canonicalTokens, ...inheritedTokens, ...generatedTokens];

  const detections: StaleContextDetection[] = [
    detectTokenLeak(
      'PREVIOUS_PROJECT_IDENTITY',
      isSourceBlocked(input.scope, 'PREVIOUS_ACTIVE_PROJECT'),
      canonicalTokens,
      tokenize(input.previousProjectIdentity),
      promptTokens,
      'previous project identity',
    ),
    detectTokenLeak(
      'PREVIOUS_PRODUCT_CONCEPT',
      isSourceBlocked(input.scope, 'PREVIOUS_CONCEPTS'),
      inheritedTokens,
      inheritedTokens,
      promptTokens,
      'previous product concepts',
    ),
    detectStaleActiveProjectId(input),
    detectTokenLeak(
      'STALE_METADATA_KEYWORD',
      isSourceBlocked(input.scope, 'PREVIOUS_PROJECT_METADATA'),
      candidateTokens,
      normalizeConceptList(input.previousMetadataKeywords),
      promptTokens,
      'previous project metadata keywords',
    ),
    detectTokenLeak(
      'STALE_FEATURE_CONTRACT',
      isSourceBlocked(input.scope, 'PREVIOUS_FEATURE_CONTRACT'),
      candidateTokens,
      normalizeConceptList(input.previousFeatureContractConcepts),
      promptTokens,
      'previous feature contract',
    ),
    detectTokenLeak(
      'STALE_MANIFEST',
      isSourceBlocked(input.scope, 'PREVIOUS_MATERIALIZATION_MANIFEST'),
      candidateTokens,
      normalizeConceptList(input.previousManifestConcepts),
      promptTokens,
      'previous materialization manifest',
    ),
    detectTokenLeak(
      'STALE_PREVIEW_EVIDENCE',
      isSourceBlocked(input.scope, 'PREVIOUS_PREVIEW_EVIDENCE'),
      candidateTokens,
      normalizeConceptList(input.previousPreviewEvidenceConcepts),
      promptTokens,
      'previous live preview DOM evidence',
    ),
    detectUnjustifiedFallbackModules(input.candidateModuleOrigins),
  ];

  const passed = detections.every((d) => !d.detected);

  return {
    readOnly: true,
    stage: input.stage,
    passed,
    detections,
  };
}

export function assertNoStaleContext(result: StaleContextCheckResult): void {
  if (result.passed) return;
  const contaminated = result.detections.filter((d) => d.detected);
  const summary = contaminated.map((d) => `[${d.kind}] ${d.detail}`).join(' | ');
  throw new Error(`Stale context detected at stage "${result.stage}" — stopping. ${summary}`);
}

export function scopeToContextScope(scope: ContextScope): ContextScope {
  return scope;
}
