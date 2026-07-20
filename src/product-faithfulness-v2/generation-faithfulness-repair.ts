/**
 * Product Faithfulness V2 — minimal repair strategy.
 *
 * Repairs are minimal and evidence-driven: a canonical concept missing from one stage but
 * genuinely present in another stage's evidence (proof it really was produced somewhere in the
 * pipeline, just not registered/wired into this particular stage) is reintroduced into the broken
 * stage only. A concept missing from every stage cannot be mechanically manufactured here — this
 * module never invokes a code-generation engine or LLM — so it is recorded as a planned-but-not-
 * applied "regenerate feature module" action instead of a fake success.
 *
 * Minimality guarantee: only stage-evidence entries the audit actually flagged are ever replaced;
 * every other stage's evidence object is passed through by reference, unmodified. Repairs never
 * touch unrelated modules.
 */

import type { ExtractedProductConcept } from '../product-faithfulness-v1/product-faithfulness-types.js';
import { auditGenerationPipeline } from './generation-faithfulness-auditor.js';
import { GENERATION_STAGE_ORDER } from './generation-faithfulness-types.js';
import type {
  CanonicalProductContract,
  GenerationFaithfulnessAuditResult,
  GenerationStageEvidence,
  GenerationStageName,
  RepairAction,
  RepairActionType,
} from './generation-faithfulness-types.js';

function repairActionTypeForStage(stage: GenerationStageName): RepairActionType {
  switch (stage) {
    case 'NAVIGATION':
      return 'REPAIR_NAVIGATION';
    case 'FEATURE_CONTRACT':
      return 'REPAIR_FEATURE_CONTRACT_REFERENCE';
    case 'GENERATED_MODULES':
      return 'REPAIR_MODULE_SELECTION';
    case 'ROUTES':
      return 'REPAIR_FEATURE_REGISTRATION';
    case 'MANIFEST':
      return 'REPAIR_MANIFEST';
    default:
      return 'RERUN_STAGE';
  }
}

export function applyMinimalRepairs(
  contract: CanonicalProductContract,
  stageEvidence: GenerationStageEvidence[],
  audit: GenerationFaithfulnessAuditResult,
): { repairedStages: GenerationStageEvidence[]; actions: RepairAction[] } {
  const actions: RepairAction[] = [];
  const canonicalConcepts = new Set(contract.allConceptNames.map((concept) => concept.toLowerCase()));

  // Pass-through by reference by default — only stages the audit flags are ever replaced.
  const repairedStages: GenerationStageEvidence[] = [...stageEvidence];

  for (const stageResult of audit.stages) {
    if (stageResult.driftKind === 'NONE' || stageResult.missing.length === 0) continue;
    const stageIndex = repairedStages.findIndex((s) => s.stage === stageResult.stage);
    if (stageIndex === -1) continue;

    const original = repairedStages[stageIndex];
    const newConcepts = [...original.concepts];
    let mutated = false;

    for (const missingConcept of stageResult.missing) {
      const targetStageIndex = GENERATION_STAGE_ORDER.indexOf(stageResult.stage);
      let evidenceElsewhere: ExtractedProductConcept | undefined;
      let ancestryStage: GenerationStageName | undefined;
      for (let index = targetStageIndex - 1; index >= 0; index -= 1) {
        const candidateStage = stageEvidence.find((stage) => stage.stage === GENERATION_STAGE_ORDER[index]);
        const candidate = candidateStage?.concepts.find(
          (concept) => concept.concept.toLowerCase() === missingConcept.toLowerCase(),
        );
        if (candidate) {
          evidenceElsewhere = candidate;
          ancestryStage = candidateStage?.stage;
          break;
        }
      }
      const actionType = repairActionTypeForStage(stageResult.stage);
      const hasCanonicalAncestry = canonicalConcepts.has(missingConcept.toLowerCase());

      if (hasCanonicalAncestry && evidenceElsewhere && ancestryStage) {
        newConcepts.push({ readOnly: true, concept: missingConcept, sources: evidenceElsewhere.sources });
        mutated = true;
        actions.push({
          readOnly: true,
          type: actionType,
          stage: stageResult.stage,
          concept: missingConcept,
          detail: `Recovered "${missingConcept}" into ${stageResult.stage.toLowerCase().replace(/_/g, ' ')} — its canonical-contract ancestry was verified in the preceding ${ancestryStage.toLowerCase().replace(/_/g, ' ')} stage.`,
          applied: true,
        });
      } else {
        actions.push({
          readOnly: true,
          type: 'REGENERATE_FEATURE_MODULE',
          stage: stageResult.stage,
          concept: missingConcept,
          detail: hasCanonicalAncestry
            ? `"${missingConcept}" has no verified preceding-stage ancestry for ${stageResult.stage.toLowerCase().replace(/_/g, ' ')} and would require regenerating its feature module — not applied by this evaluation-time repair.`
            : `"${missingConcept}" is not present in the current canonical product contract and cannot be recovered into this build.`,
          applied: false,
        });
      }
    }

    if (mutated) {
      repairedStages[stageIndex] = { readOnly: true, stage: original.stage, concepts: newConcepts };
    }
  }

  return { repairedStages, actions };
}

/**
 * Applies minimal repairs then re-audits. `improved` is only true when the re-audit's retention
 * ratio is strictly better than before — repair plans that could not be mechanically applied never
 * fake an improvement.
 */
export function repairAndReaudit(
  contract: CanonicalProductContract,
  stageEvidence: GenerationStageEvidence[],
  initialAudit: GenerationFaithfulnessAuditResult,
): { finalAudit: GenerationFaithfulnessAuditResult; actions: RepairAction[]; improved: boolean } {
  const { repairedStages, actions } = applyMinimalRepairs(contract, stageEvidence, initialAudit);
  const finalAudit = auditGenerationPipeline(contract, repairedStages);
  const improved = finalAudit.conceptRetentionRatio > initialAudit.conceptRetentionRatio;
  return { finalAudit, actions, improved };
}
