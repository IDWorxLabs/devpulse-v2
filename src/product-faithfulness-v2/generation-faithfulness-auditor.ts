/**
 * Product Faithfulness V2 — Generation Consistency Audit.
 *
 * Compares the Canonical Product Contract against every major generation stage's evidence
 * (architecture, feature contract, generated modules, routes, navigation, materialization
 * manifest, preview DOM) and detects concept disappearance, substitution, drift, and unexpected
 * dominant concepts — both within a single stage and across stage transitions.
 */

import { extractGeneratedConcepts } from '../product-faithfulness-v1/product-faithfulness-feature-extractor.js';
import type { ProductFaithfulnessInput } from '../product-faithfulness-v1/product-faithfulness-types.js';
import { auditStageConsistency } from './feature-contract-consistency.js';
import type {
  CanonicalProductContract,
  ConceptSubstitution,
  GenerationConsistencyVerdict,
  GenerationFaithfulnessAuditResult,
  GenerationStageEvidence,
  GenerationStageName,
  StageConsistencyResult,
} from './generation-faithfulness-types.js';
import { GENERATION_STAGE_ORDER } from './generation-faithfulness-types.js';

export interface GenerationStageRawEvidence {
  stage: GenerationStageName;
  input: ProductFaithfulnessInput;
}

function featureContractNames(input: ProductFaithfulnessInput): string[] {
  if (!input.featureContract) return [];
  return input.featureContract
    .map((entry) => (typeof entry === 'string' ? entry : entry.featureName ?? entry.name ?? entry.title ?? ''))
    .filter(Boolean);
}

function architectureSummaryLines(input: ProductFaithfulnessInput): string[] {
  const v = input.architectureSummary;
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * v1's `extractGeneratedConcepts` only reads direct-evidence fields (routes, components, feature
 * modules, navigation, DOM text, manifest hints) — by design it does not read `featureContract` or
 * `architectureSummary`, since v1 treats those as "requested/planning" evidence. Milestone 2 needs
 * the ARCHITECTURE and FEATURE_CONTRACT generation stages audited with the same direct-evidence
 * extraction as every other stage, so their raw text is folded into the generic buckets v1's
 * extractor already reads before extraction runs. Purely structural — no domain-specific mapping.
 */
function normalizeStageInputForExtraction(input: ProductFaithfulnessInput): ProductFaithfulnessInput {
  const extraFeatureModules = featureContractNames(input);
  const extraSummaryLines = architectureSummaryLines(input);
  if (extraFeatureModules.length === 0 && extraSummaryLines.length === 0) return input;
  return {
    ...input,
    generatedFeatureModules: [...(input.generatedFeatureModules ?? []), ...extraFeatureModules],
    workspaceManifestSummary: [...(input.workspaceManifestSummary ?? []), ...extraSummaryLines],
  };
}

/** Extracts concepts for each stage using the same direct-evidence-only extraction as Milestone 1. */
export function buildStageEvidence(raw: GenerationStageRawEvidence[]): GenerationStageEvidence[] {
  return raw.map((r) => ({
    readOnly: true,
    stage: r.stage,
    concepts: extractGeneratedConcepts(normalizeStageInputForExtraction(r.input)),
  }));
}

function auditSingleStage(contract: CanonicalProductContract, stage: GenerationStageEvidence): StageConsistencyResult {
  return auditStageConsistency(stage.stage, 'GENERAL', contract.allConceptNames, stage.concepts);
}

/**
 * Audits every evidenced stage (in canonical pipeline order) against the contract, then compares
 * consecutive stages to find concepts that disappeared between them and pairs each disappearance
 * with a newly-introduced unexpected concept at the same transition, when one exists — a
 * conservative, order-based signal of concept substitution (concept A replaced by concept B).
 */
export function auditGenerationPipeline(
  contract: CanonicalProductContract,
  stageEvidence: GenerationStageEvidence[],
): GenerationFaithfulnessAuditResult {
  const orderedStages = GENERATION_STAGE_ORDER.map((name) => stageEvidence.find((s) => s.stage === name)).filter(
    (s): s is GenerationStageEvidence => Boolean(s),
  );

  const stages = orderedStages.map((s) => auditSingleStage(contract, s));

  const disappeared = new Set<string>();
  const substitutions: ConceptSubstitution[] = [];
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1];
    const curr = stages[i];
    const currRetainedSet = new Set(curr.retained.map((c) => c.toLowerCase()));
    const newlyMissing = prev.retained.filter((c) => !currRetainedSet.has(c.toLowerCase()));
    newlyMissing.forEach((c) => disappeared.add(c));

    const prevUnexpectedSet = new Set(prev.unexpected.map((c) => c.toLowerCase()));
    const newlyUnexpected = curr.unexpected.filter((c) => !prevUnexpectedSet.has(c.toLowerCase()));
    newlyMissing.forEach((disappearedConcept, idx) => {
      const replacement = newlyUnexpected[idx];
      if (replacement) {
        substitutions.push({
          readOnly: true,
          fromStage: prev.stage,
          toStage: curr.stage,
          disappearedConcept,
          replacedByConcept: replacement,
        });
      }
    });
  }

  const finalStage = stages.length > 0 ? stages[stages.length - 1] : null;
  const conceptRetentionRatio = finalStage ? finalStage.retentionRatio : contract.allConceptNames.length === 0 ? 1 : 0;
  const conceptDriftRatio = 1 - conceptRetentionRatio;
  const unexpectedDominantConcepts = [...new Set(stages.flatMap((s) => s.unexpectedDominantConcepts))];
  const remainingMissingConcepts = finalStage ? finalStage.missing : [...contract.allConceptNames];

  let verdict: GenerationConsistencyVerdict;
  if (conceptRetentionRatio >= 0.85 && unexpectedDominantConcepts.length === 0) {
    verdict = 'CONSISTENT';
  } else if (unexpectedDominantConcepts.length > 0 && conceptRetentionRatio < 0.5) {
    verdict = 'INCONSISTENT';
  } else if (substitutions.length > 0 || (finalStage && finalStage.driftKind === 'SUBSTITUTION')) {
    verdict = 'SUBSTITUTED';
  } else if (conceptRetentionRatio < 0.34) {
    verdict = 'INCONSISTENT';
  } else {
    verdict = 'DRIFTED';
  }

  return {
    readOnly: true,
    contract,
    stages,
    conceptRetentionRatio,
    conceptDriftRatio,
    conceptsDisappearedBetweenStages: [...disappeared],
    conceptSubstitutions: substitutions,
    unexpectedDominantConcepts,
    remainingMissingConcepts,
    verdict,
  };
}
