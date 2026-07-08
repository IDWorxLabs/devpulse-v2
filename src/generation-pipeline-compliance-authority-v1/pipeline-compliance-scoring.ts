/**
 * Generation Pipeline Compliance Authority V1 — per-stage compliance scoring.
 *
 * Deterministic, weighted percentages per stage: Contract Compliance, Input Compliance, Output
 * Compliance, Traceability, Template Leakage, Legacy Usage, Blueprint Usage, and an Overall
 * Compliance rollup. A stage's status is PASS only when it has no unresolved contract-bypass flag
 * and its overall compliance meets the pass threshold.
 */

import type {
  GpcaStageComplianceScore,
  GpcaStageDescriptor,
  GpcaStageId,
  GpcaTraceabilityResult,
} from './generation-pipeline-compliance-types.js';

export const GPCA_PASS_THRESHOLD_PERCENT = 85;

const CONTRACT_BYPASS_FLAGS: Array<keyof GpcaStageDescriptor['flags']> = [
  'usesModuleOutsideContract',
  'usesRouteOutsideContract',
  'usesNavigationOutsideContract',
  'usesSurfaceOutsideContract',
  'usesTitleOutsideContract',
];

const TEMPLATE_LEAKAGE_FLAGS: Array<keyof GpcaStageDescriptor['flags']> = [
  'usesHardcodedTemplate',
  'usesGenericUiCopy',
  'usesReusableComponentShell',
];

const LEGACY_USAGE_FLAGS: Array<keyof GpcaStageDescriptor['flags']> = [
  'usesLegacyPlanner',
  'usesRegexExtraction',
  'usesFallbackModules',
];

const BLUEPRINT_USAGE_FLAGS: Array<keyof GpcaStageDescriptor['flags']> = [
  'usesBlueprintDefaults',
  'usesGenericShell',
  'usesDefaultNavigation',
  'usesDefaultRoutes',
];

function percentFromFlagCount(flags: GpcaStageDescriptor['flags'], keys: Array<keyof GpcaStageDescriptor['flags']>): number {
  if (keys.length === 0) return 100;
  const trueCount = keys.filter((k) => flags[k]).length;
  return Math.round(100 - (trueCount / keys.length) * 100);
}

function inputCompliancePercent(flags: GpcaStageDescriptor['flags']): number {
  const consumesContractBoundInput = flags.usesCbga || flags.usesCanonicalContract || flags.usesPromptBoundedModulePlan;
  const bypassedInput = CONTRACT_BYPASS_FLAGS.some((k) => flags[k]);
  if (bypassedInput) return 0;
  return consumesContractBoundInput ? 100 : 60;
}

function traceabilityPercentForStage(stageId: GpcaStageId, traceability: readonly GpcaTraceabilityResult[]): number {
  const kindByStage: Partial<Record<GpcaStageId, GpcaTraceabilityResult['artifactKind']>> = {
    MODULE_GENERATOR: 'MODULE',
    ROUTE_GENERATOR: 'ROUTE',
    NAVIGATION_GENERATOR: 'NAVIGATION_ITEM',
    SURFACE_GENERATOR: 'SURFACE',
    MATERIALIZATION: 'TITLE',
  };
  const kind = kindByStage[stageId];
  if (!kind) return 100;
  const relevant = traceability.filter((t) => t.artifactKind === kind);
  if (relevant.length === 0) return 100;
  const proven = relevant.filter((t) => t.proven).length;
  return Math.round((proven / relevant.length) * 100);
}

export function scoreStage(
  descriptor: GpcaStageDescriptor,
  traceability: readonly GpcaTraceabilityResult[],
): GpcaStageComplianceScore {
  const { flags } = descriptor;
  const contractCompliancePercent = percentFromFlagCount(flags, CONTRACT_BYPASS_FLAGS);
  const inputPercent = inputCompliancePercent(flags);
  const traceabilityPercent = traceabilityPercentForStage(descriptor.stageId, traceability);
  const outputCompliancePercent = Math.round((contractCompliancePercent + traceabilityPercent) / 2);
  const templateLeakagePercent = percentFromFlagCount(flags, TEMPLATE_LEAKAGE_FLAGS);
  const legacyUsagePercent = percentFromFlagCount(flags, LEGACY_USAGE_FLAGS);
  const blueprintUsagePercent = percentFromFlagCount(flags, BLUEPRINT_USAGE_FLAGS);

  const overallCompliancePercent = Math.round(
    (contractCompliancePercent +
      inputPercent +
      outputCompliancePercent +
      traceabilityPercent +
      templateLeakagePercent +
      legacyUsagePercent +
      blueprintUsagePercent) /
      7,
  );

  const hasBypass = CONTRACT_BYPASS_FLAGS.some((k) => flags[k]);
  const status: GpcaStageComplianceScore['status'] =
    !hasBypass && overallCompliancePercent >= GPCA_PASS_THRESHOLD_PERCENT ? 'PASS' : 'FAIL';

  const reasons: string[] = [];
  if (hasBypass) {
    reasons.push(`${descriptor.stageName} generates output that bypasses the contract-bound plan.`);
  }
  if (traceabilityPercent < 100) {
    reasons.push(`${descriptor.stageName} produced artifacts that could not be fully traced to the contract.`);
  }
  if (templateLeakagePercent < 100) {
    reasons.push(`${descriptor.stageName} relies on hardcoded/template/reusable-shell content.`);
  }
  if (legacyUsagePercent < 100) {
    reasons.push(`${descriptor.stageName} relies on a legacy planner, regex extraction, or fallback modules.`);
  }
  if (blueprintUsagePercent < 100) {
    reasons.push(`${descriptor.stageName} relies on default blueprint shell/navigation/route defaults.`);
  }
  if (reasons.length === 0) {
    reasons.push(`${descriptor.stageName} is fully contract-bound and traceable.`);
  }

  return {
    readOnly: true,
    stageId: descriptor.stageId,
    stageName: descriptor.stageName,
    contractCompliancePercent,
    inputCompliancePercent: inputPercent,
    outputCompliancePercent,
    traceabilityPercent,
    templateLeakagePercent,
    legacyUsagePercent,
    blueprintUsagePercent,
    overallCompliancePercent,
    status,
    reasons,
  };
}

export function scorePipeline(
  stages: readonly GpcaStageDescriptor[],
  traceability: readonly GpcaTraceabilityResult[],
): { scores: GpcaStageComplianceScore[]; overallCompliancePercent: number } {
  const scores = stages.map((s) => scoreStage(s, traceability));
  const overallCompliancePercent =
    scores.length === 0 ? 100 : Math.round(scores.reduce((sum, s) => sum + s.overallCompliancePercent, 0) / scores.length);
  return { scores, overallCompliancePercent };
}
