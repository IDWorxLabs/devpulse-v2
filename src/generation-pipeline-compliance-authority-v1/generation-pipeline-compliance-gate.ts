/**
 * Generation Pipeline Compliance Authority V1 — the compliance gate.
 *
 * Decides the single, deterministic gate outcome for a build: COMPLIANCE_ALLOWED, or one of six
 * specific blocked outcomes. GPCA never repairs — when it blocks, the build must actually fail
 * (never a fake success), and the reasons cite exactly which stage/artifact violated the contract.
 *
 * Ordering matters and is deterministic: a live generator-input bypass (proposed inputs that
 * differ from what CBGA approved) is the most severe and checked first, then broken traceability,
 * then blueprint/generic-shell injection (only meaningful once real post-materialization file
 * evidence exists), then legacy/template generator usage, then a final overall-compliance floor.
 */

import {
  detectBlueprintBypass,
  detectContractBypassedInputs,
  detectGenericShellInjection,
  detectLegacyGeneratorUsage,
  detectTemplateGeneratorUsage,
} from './generator-legacy-detection.js';
import { GPCA_PASS_THRESHOLD_PERCENT } from './pipeline-compliance-scoring.js';
import type {
  GpcaGenerationGateOutcome,
  GpcaPipelineEvidenceInput,
  GpcaStageComplianceScore,
  GpcaStageDescriptor,
  GpcaTraceabilityResult,
} from './generation-pipeline-compliance-types.js';

export interface GpcaGateResult {
  readonly outcome: GpcaGenerationGateOutcome;
  readonly reasons: readonly string[];
  readonly legacyGeneratorsDetected: readonly string[];
  readonly templateGeneratorsDetected: readonly string[];
  readonly genericShellSurfacesBlocked: readonly string[];
  readonly blueprintBypassDetected: readonly string[];
  readonly contractBypassDetected: readonly string[];
}

export function runGenerationPipelineComplianceGate(
  evidence: GpcaPipelineEvidenceInput,
  stages: readonly GpcaStageDescriptor[],
  scores: readonly GpcaStageComplianceScore[],
  traceability: readonly GpcaTraceabilityResult[],
  overallCompliancePercent: number,
): GpcaGateResult {
  const contractBypass = detectContractBypassedInputs(evidence);
  const contractBypassDetected: string[] = [
    ...contractBypass.moduleBypass.map((m) => `module "${m}" was not approved by CBGA`),
    ...contractBypass.routeBypass.map((r) => `route "${r}" was not approved by CBGA`),
    ...contractBypass.navigationBypass.map((n) => `navigation item "${n}" was not approved by CBGA`),
    ...(contractBypass.titleBypassed ? [`app title "${evidence.proposed.appTitle}" does not match CBGA's approved product identity`] : []),
  ];

  if (contractBypass.detected) {
    return {
      outcome: 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS',
      reasons: [
        'A generator is about to consume input that Contract-Bound Generation Authority V4 never approved.',
        ...contractBypassDetected,
      ],
      legacyGeneratorsDetected: [],
      templateGeneratorsDetected: [],
      genericShellSurfacesBlocked: [],
      blueprintBypassDetected: [],
      contractBypassDetected,
    };
  }

  const unprovenArtifacts = traceability.filter((t) => !t.proven);
  if (unprovenArtifacts.length > 0) {
    return {
      outcome: 'COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE',
      reasons: [
        'One or more generated artifacts cannot prove an unbroken ancestry chain back to the canonical product contract.',
        ...unprovenArtifacts.map((t) => `${t.artifactKind} "${t.artifact}": ${t.reason}`),
      ],
      legacyGeneratorsDetected: [],
      templateGeneratorsDetected: [],
      genericShellSurfacesBlocked: [],
      blueprintBypassDetected: [],
      contractBypassDetected,
    };
  }

  const blueprintBypassDetected = detectBlueprintBypass(evidence);
  if (blueprintBypassDetected.length > 0) {
    return {
      outcome: 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS',
      reasons: [
        'A reusable blueprint shell (welcome/onboarding) was written to the workspace ahead of the contract-specific product surface.',
        ...blueprintBypassDetected.map((p) => `generated: ${p}`),
      ],
      legacyGeneratorsDetected: [],
      templateGeneratorsDetected: [],
      genericShellSurfacesBlocked: [],
      blueprintBypassDetected,
      contractBypassDetected,
    };
  }

  const genericShell = detectGenericShellInjection(evidence);
  if (genericShell.detectedPaths.length > 0) {
    return {
      outcome: 'COMPLIANCE_BLOCKED_LEGACY_GENERATOR',
      reasons: [
        'A legacy/generic blueprint shell page was written to the workspace without contract justification.',
        ...genericShell.detectedPaths.map((p) => `generated: ${p}`),
      ],
      legacyGeneratorsDetected: genericShell.detectedPaths,
      templateGeneratorsDetected: [],
      genericShellSurfacesBlocked: genericShell.detectedPaths,
      blueprintBypassDetected,
      contractBypassDetected,
    };
  }

  const templateGeneratorsDetected = detectTemplateGeneratorUsage(stages).filter(
    (name) => scores.find((s) => s.stageName === name)?.status === 'FAIL',
  );
  if (evidence.proposed.generatedFilePaths.length > 0 && templateGeneratorsDetected.length > 0) {
    return {
      outcome: 'COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR',
      reasons: [
        'One or more generators produced content from a hardcoded template rather than the contract-bound plan.',
        ...templateGeneratorsDetected.map((name) => `stage: ${name}`),
      ],
      legacyGeneratorsDetected: [],
      templateGeneratorsDetected,
      genericShellSurfacesBlocked: genericShell.justifiedPaths,
      blueprintBypassDetected,
      contractBypassDetected,
    };
  }

  if (overallCompliancePercent < GPCA_PASS_THRESHOLD_PERCENT) {
    return {
      outcome: 'COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE',
      reasons: [
        `Overall pipeline compliance (${overallCompliancePercent}%) is below the required threshold (${GPCA_PASS_THRESHOLD_PERCENT}%).`,
        ...scores.filter((s) => s.status === 'FAIL').map((s) => `${s.stageName}: ${s.reasons.join(' ')}`),
      ],
      legacyGeneratorsDetected: detectLegacyGeneratorUsage(stages),
      templateGeneratorsDetected: detectTemplateGeneratorUsage(stages),
      genericShellSurfacesBlocked: genericShell.justifiedPaths,
      blueprintBypassDetected,
      contractBypassDetected,
    };
  }

  return {
    outcome: 'COMPLIANCE_ALLOWED',
    reasons: ['Every stage in the discovered pipeline consumes contract-bound input and produces traceable output.'],
    legacyGeneratorsDetected: [],
    templateGeneratorsDetected: [],
    genericShellSurfacesBlocked: genericShell.justifiedPaths,
    blueprintBypassDetected: [],
    contractBypassDetected: [],
  };
}
