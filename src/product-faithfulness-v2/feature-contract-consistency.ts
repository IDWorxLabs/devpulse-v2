/**
 * Product Faithfulness V2 — Feature Contract / stage consistency comparison.
 *
 * Generic set comparison between a slice of the Canonical Product Contract's concepts and a
 * generation stage's evidenced concepts. Used both for the whole-contract audit (`GENERAL`) and
 * for role-scoped drift detection (navigation, entity, workflow, feature-group).
 */

import type { ExtractedProductConcept } from '../product-faithfulness-v1/product-faithfulness-types.js';
import type { CanonicalProductContract, DriftCategory, GenerationStageName, StageConsistencyResult, StageDriftKind } from './generation-faithfulness-types.js';
import {
  capabilityIdentitiesMatch,
  normalizeCapabilityIdentity,
  suppressLexicalFragmentsOfCapabilities,
} from './verification-accuracy.js';

function canonicalName(name: string): string {
  return normalizeCapabilityIdentity(name) || name.trim().toLowerCase();
}

export interface ConceptSetComparison {
  retained: string[];
  missing: string[];
  unexpected: string[];
  retentionRatio: number;
}

/** Pure set comparison — canonical concept names vs. what a stage's evidence actually contains. */
export function compareConceptSets(canonicalConceptNames: string[], stageConcepts: ExtractedProductConcept[]): ConceptSetComparison {
  const canonicalSet = new Set(canonicalConceptNames.map(canonicalName));
  const stageByCanonicalName = new Map<string, string>();
  for (const c of stageConcepts) stageByCanonicalName.set(canonicalName(c.concept), c.concept);

  const retained: string[] = [];
  const missing: string[] = [];
  for (const name of canonicalConceptNames) {
    const key = canonicalName(name);
    const hit =
      stageByCanonicalName.has(key) ||
      [...stageByCanonicalName.keys()].some((stageKey) => capabilityIdentitiesMatch(key, stageKey));
    if (hit) retained.push(name);
    else missing.push(name);
  }

  const retainedIds = new Set(retained.map(canonicalName));
  const unexpectedRaw: string[] = [];
  for (const [key, display] of stageByCanonicalName) {
    if (canonicalSet.has(key) || retainedIds.has(key)) continue;
    if ([...canonicalSet].some((canonicalKey) => capabilityIdentitiesMatch(key, canonicalKey))) continue;
    unexpectedRaw.push(display);
  }
  const unexpected = suppressLexicalFragmentsOfCapabilities(unexpectedRaw, [
    ...canonicalConceptNames,
    ...retained,
  ]);

  const retentionRatio = canonicalConceptNames.length === 0 ? 1 : retained.length / canonicalConceptNames.length;
  return { retained, missing, unexpected, retentionRatio };
}

function classifyDrift(retentionRatio: number, unexpectedCount: number): StageDriftKind {
  if (retentionRatio >= 0.85) return 'NONE';
  if (retentionRatio >= 0.5) return 'DRIFT';
  if (unexpectedCount === 0) return 'DISAPPEARANCE';
  return 'SUBSTITUTION';
}

/**
 * Generic dominant-concept rule: a stage's evidence is "dominated" by unsupported concepts when
 * the number of concepts NOT justified by the canonical contract is at least as large as the
 * number of canonical concepts actually retained. This never hardcodes which words count as
 * "dominant" — it is purely a comparison of counts between generated evidence and the contract.
 */
function detectDominance(retainedCount: number, unexpected: string[]): { dominanceDetected: boolean; unexpectedDominantConcepts: string[] } {
  const dominanceDetected = unexpected.length > 0 && unexpected.length >= Math.max(1, retainedCount);
  return { dominanceDetected, unexpectedDominantConcepts: dominanceDetected ? unexpected : [] };
}

export function auditStageConsistency(
  stage: GenerationStageName,
  driftCategory: DriftCategory,
  canonicalConceptNames: string[],
  stageConcepts: ExtractedProductConcept[],
): StageConsistencyResult {
  const { retained, missing, unexpected, retentionRatio } = compareConceptSets(canonicalConceptNames, stageConcepts);
  const driftKind = classifyDrift(retentionRatio, unexpected.length);
  const { dominanceDetected, unexpectedDominantConcepts } = detectDominance(retained.length, unexpected);

  return {
    readOnly: true,
    stage,
    driftCategory,
    retained,
    missing,
    unexpected,
    retentionRatio,
    driftKind,
    dominanceDetected,
    unexpectedDominantConcepts,
  };
}

export function detectNavigationDrift(
  contract: CanonicalProductContract,
  stage: GenerationStageName,
  navigationConcepts: ExtractedProductConcept[],
): StageConsistencyResult {
  return auditStageConsistency(stage, 'NAVIGATION', contract.navigationExpectations, navigationConcepts);
}

export function detectEntityDrift(
  contract: CanonicalProductContract,
  stage: GenerationStageName,
  concepts: ExtractedProductConcept[],
): StageConsistencyResult {
  return auditStageConsistency(stage, 'ENTITY', contract.coreEntities, concepts);
}

export function detectWorkflowDrift(
  contract: CanonicalProductContract,
  stage: GenerationStageName,
  concepts: ExtractedProductConcept[],
): StageConsistencyResult {
  return auditStageConsistency(stage, 'WORKFLOW', contract.primaryWorkflows, concepts);
}

export function detectFeatureDrift(
  contract: CanonicalProductContract,
  stage: GenerationStageName,
  concepts: ExtractedProductConcept[],
): StageConsistencyResult {
  return auditStageConsistency(stage, 'FEATURE', contract.majorFeatureGroups, concepts);
}
