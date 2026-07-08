/**
 * Autonomous Engineering Orchestrator V1 — missing capability router.
 *
 * When the repair-execution-planner refuses to auto-run anything, this module turns that refusal
 * into a structured, honest "missing capability" recommendation instead of a dead-end generic
 * build failure. It never implements the missing capability — it only names it, explains why
 * existing capabilities are insufficient, and proposes what a future milestone would need to
 * build.
 */

import type { AeoFailureClass } from './failure-taxonomy.js';
import type { AeoMissingCapabilityRecommendation, AeoRepairPlan } from './autonomous-engineering-orchestrator-types.js';

export const CONTRACT_BOUND_GENERATION_AUTHORITY_ID = 'CONTRACT_BOUND_GENERATION_AUTHORITY' as const;
export const CONTRACT_COMPLIANT_GENERATOR_REPAIR_ID = 'CONTRACT_COMPLIANT_GENERATOR_REPAIR' as const;

const GPCA_FAILURE_CLASSES: readonly AeoFailureClass[] = [
  'GENERATION_PIPELINE_NON_COMPLIANCE',
  'LEGACY_GENERATOR_DETECTED',
  'TEMPLATE_GENERATOR_DETECTED',
  'BLUEPRINT_BYPASS',
  'CONTRACT_TRACEABILITY_FAILURE',
  'GENERATOR_INPUT_BYPASS',
  'PIPELINE_COMPLIANCE_FAILURE',
];

function limitationsOf(plan: AeoRepairPlan): string[] {
  const limitations: string[] = [plan.reason];
  for (const candidate of plan.consideredCapabilities) {
    if (candidate.wiringStatus !== 'PRODUCTION_WIRED' || !candidate.safeToRunAutomatically) {
      limitations.push(`${candidate.displayName}: ${candidate.limitations.join(' ')}`);
    }
  }
  return limitations;
}

/**
 * True once Contract-Bound Generation Authority V4 is honestly registered in the repair-capability
 * registry as production-wired for this failure class — i.e. it is no longer missing, so this
 * router must stop recommending it and instead report the real reason (if any) automatic repair
 * was refused (e.g. max attempts exceeded, identity-change confirmation required).
 */
function contractBoundGenerationAuthorityIsPresent(plan: AeoRepairPlan): boolean {
  return plan.consideredCapabilities.some(
    (c) => c.capabilityId === 'contract-bound-generation-authority-v4' && c.wiringStatus === 'PRODUCTION_WIRED',
  );
}

/**
 * True once Generation Pipeline Compliance Authority V1 is honestly registered in the repair
 * registry as production-wired for this failure class. GPCA is an audit/gate authority, not a
 * repair — its presence here never means "the failure is fixable automatically," only that the
 * *diagnosis* (which stage/generator violated the contract) is already real and does not itself
 * need to be recommended as a missing capability.
 */
function generationPipelineComplianceAuthorityIsPresent(plan: AeoRepairPlan): boolean {
  return plan.consideredCapabilities.some(
    (c) => c.capabilityId === 'generation-pipeline-compliance-authority-v1' && c.wiringStatus === 'PRODUCTION_WIRED',
  );
}

export function routeMissingCapability(
  failureClass: AeoFailureClass,
  plan: AeoRepairPlan,
): AeoMissingCapabilityRecommendation {
  // Known historical pattern (now resolved — see Contract-Bound Generation Authority V4): unauthorized
  // fallback modules + product identity drift, where the only wired repair (generation-faithfulness-repair)
  // was report/evidence-only. Once CBGA V4 is registered as a production-wired, safe repair for these
  // classes, `planRepair` matches it directly and this branch is only reached for the (now rare) case
  // where CBGA itself refused — never used to claim CBGA is missing when it plainly exists.
  if (
    (failureClass === 'UNAUTHORIZED_FALLBACK_MODULES' ||
      failureClass === 'PRODUCT_IDENTITY_DRIFT' ||
      failureClass === 'CONTRACT_INCONSISTENCY') &&
    !contractBoundGenerationAuthorityIsPresent(plan)
  ) {
    return {
      readOnly: true,
      missingCapabilityId: CONTRACT_BOUND_GENERATION_AUTHORITY_ID,
      missingCapabilityName: 'Contract-Bound Generation Authority',
      failureClassRequiringIt: failureClass,
      whyExistingCapabilitiesAreInsufficient: [
        'generation-faithfulness-repair (product-faithfulness-v2) only reconciles in-memory concept evidence after the fact — it never invokes a code-generation engine or LLM, so it cannot stop an unauthorized fallback module from being written or regenerate a substituted concept.',
        'capability-planning-engine and missing-capability-evolution-engine gate what to build before generation starts, not what module-selection/fallback decisions are made mid-generation.',
        'None of the currently registered repair capabilities can gate materialization/module-selection decisions against the Canonical Product Contract in real time.',
        ...limitationsOf(plan),
      ],
      requiredInputs: [
        'CanonicalProductContract (already built by product-faithfulness-v2)',
        'the live module-selection/fallback decision about to be materialized',
        'GenerationStageEvidence for the stage currently generating',
      ],
      expectedOutputs: [
        'an ALLOW / BLOCK / SUBSTITUTE decision made before a fallback module or drifted concept is ever written to disk',
        'a structured reason for any block, citing the contract clause it would have violated',
      ],
      targetIntegrationPoint: 'universal-prompt-to-app-materialization module-selection step, gated before src/product-faithfulness-v2 audits the result after the fact',
      validationNeeded: [
        'a validator proving the authority blocks a synthetic unauthorized-fallback-module scenario before materialization, not after',
        'a validator proving it does not block legitimate product-faithful module selection',
      ],
      recommendedNextMilestonePromptSummary:
        'Implement Contract-Bound Generation Authority V1: a pre-materialization gate that reads the Canonical Product Contract (product-faithfulness-v2) and the proposed module-selection/fallback decision, and blocks/substitutes it in real time when it would introduce an unauthorized fallback module or drift product identity — instead of only auditing/reporting after generation completes.',
    };
  }

  // GPCA (see Generation Pipeline Compliance Authority V1) is a real, production-wired audit/gate
  // — it is never the missing piece. What is genuinely missing, when GPCA blocks one of its own
  // failure classes, is a *repair* for the specific generator GPCA proved is non-compliant (e.g.
  // the blueprint generator's unconditional shell pages, or a hardcoded coreFeatureLabel). This
  // branch names that real gap instead of ever claiming GPCA itself does not exist.
  if (GPCA_FAILURE_CLASSES.includes(failureClass) && generationPipelineComplianceAuthorityIsPresent(plan)) {
    return {
      readOnly: true,
      missingCapabilityId: CONTRACT_COMPLIANT_GENERATOR_REPAIR_ID,
      missingCapabilityName: 'Contract-Compliant Generator Repair',
      failureClassRequiringIt: failureClass,
      whyExistingCapabilitiesAreInsufficient: [
        'Generation Pipeline Compliance Authority V1 (generation-pipeline-compliance-authority-v1) proves exactly which stage/generator is non-compliant and blocks generation before preview, but it never generates code and never repairs a generator by design.',
        'Contract-Bound Generation Authority V4 only repairs the module/route/navigation/title *inputs* handed to the generator — it cannot rewrite a downstream generator (e.g. the blueprint generator) that ignores those inputs or injects unconditional generic content.',
        'None of the currently registered repair capabilities can regenerate a non-compliant generator itself.',
        ...limitationsOf(plan),
      ],
      requiredInputs: [
        'GpcaComplianceReport citing exactly which stage/artifact failed (generation-pipeline-compliance-authority-v1)',
        'CbgaGenerationReport (contract-bound-generation-authority-v4)',
        'the source of the non-compliant generator itself',
      ],
      expectedOutputs: [
        'a rewritten (or newly parameterized) generator that only emits content GPCA can trace back to the canonical product contract',
        'a validator proving the same generator now passes GPCA for a variety of product domains, not just one',
      ],
      targetIntegrationPoint:
        'the specific generator GPCA cited (see GpcaComplianceReport.stages[].responsibleModule) — most commonly src/universal-app-blueprint/universal-app-blueprint-generator.ts or src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
      validationNeeded: [
        'a validator proving the repaired generator no longer triggers the specific GPCA gate outcome that blocked this build',
        'a validator proving it does not regress CBGA, AEO, EIAA, or Product Faithfulness',
      ],
      recommendedNextMilestonePromptSummary:
        'Implement a Contract-Compliant Generator Repair capability: given a GpcaComplianceReport that cites a specific non-compliant stage, rewrite (or parameterize) that one generator so it only ever emits contract-traceable output — instead of a legacy template, a hardcoded blueprint default, or a regex-derived title.',
    };
  }

  const genericName = failureClass
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    readOnly: true,
    missingCapabilityId: `${failureClass}_REPAIR_CAPABILITY`,
    missingCapabilityName: `${genericName} Repair Capability`,
    failureClassRequiringIt: failureClass,
    whyExistingCapabilitiesAreInsufficient: limitationsOf(plan),
    requiredInputs: ['the diagnosed AeoFailureClassification and its evidence citations'],
    expectedOutputs: ['a production-wired, safe, targeted repair for this failure class'],
    targetIntegrationPoint: 'one-prompt-live-preview/one-prompt-build-orchestrator.ts, at the AEO integration point for this failure class',
    validationNeeded: [
      'a validator proving the new capability is production-wired (not planning-only/simulated/validator-only)',
      'a validator proving it only performs a targeted retry, never a full rebuild, unless explicitly required',
    ],
    recommendedNextMilestonePromptSummary: `Design and wire a production-safe, targeted repair capability for ${failureClass}, honestly registered in the AEO repair-capability-registry once it is real and production-wired.`,
  };
}
