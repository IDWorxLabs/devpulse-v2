/**
 * Preview evidence consolidator — merges upstream intelligence inputs (V1).
 */

import type { AnalyzeMobilePreviewInput, PreviewEvidenceBundle, ProjectUnderstandingSnapshot } from './mobile-preview-types.js';

function dedupe(items: readonly string[]): string[] {
  return [...new Set(items.map((i) => i.trim()).filter(Boolean))];
}

export function consolidatePreviewEvidence(input: AnalyzeMobilePreviewInput): PreviewEvidenceBundle | null {
  const sources: string[] = [];
  const visual = input.visualReferenceAnalysis;
  const completeness = input.requirementCompletenessAnalysis;
  const understanding = input.projectUnderstanding;

  if (visual) sources.push('VISUAL_REFERENCE_INTELLIGENCE');
  if (completeness) sources.push('REQUIREMENT_COMPLETENESS_INTELLIGENCE');
  if (understanding) sources.push('PROJECT_UNDERSTANDING');

  const layoutRegions = dedupe([
    ...(input.uiLayoutStructures ?? []),
    ...(visual?.layoutRegions.map((r) => r.region) ?? []),
  ]);

  const components = dedupe([
    ...(visual?.detectedComponents.map((c) => c.token) ?? []),
    ...(completeness?.evidence.visualComponents ?? []),
  ]);

  const flows = dedupe([
    ...(input.screenFlowStructures ?? []),
    ...(visual?.inferredFlows.map((f) => f.flow) ?? []),
    ...(completeness?.evidence.inferredFlows ?? []),
    ...(understanding?.keyWorkflows ?? []),
  ]);

  const screens = dedupe([
    ...(completeness?.evidence.screens ?? []),
    ...(visual?.inferredFlows.map((f) => f.flow) ?? []),
  ]);

  const platformTargets = dedupe([
    ...(completeness?.evidence.platformTargets ?? []),
    ...(understanding?.platformTargets ?? []),
    ...(visual ? [visual.screenDetection.platform] : []),
  ]);

  const sourceWidth = visual?.imageMetadata.width ?? null;
  const sourceHeight = visual?.imageMetadata.height ?? null;

  if (sources.length === 0 && layoutRegions.length === 0 && components.length === 0) {
    return null;
  }

  if (sourceWidth === 0 && layoutRegions.length === 0 && screens.length === 0) {
    return null;
  }

  return {
    readOnly: true,
    sourceWidth: sourceWidth ?? 390,
    sourceHeight: sourceHeight ?? 844,
    sourcePlatform: visual?.screenDetection.platform ?? 'UNKNOWN',
    layoutRegions,
    components,
    flows,
    screens,
    platformTargets,
    screenCount: Math.max(screens.length, visual?.screenDetection.screenCountEstimate ?? 1),
    workflowCount: flows.length,
    sources: dedupe(sources),
  };
}

export function buildProjectUnderstandingFromInput(
  input: AnalyzeMobilePreviewInput,
): ProjectUnderstandingSnapshot | null {
  if (input.projectUnderstanding) return input.projectUnderstanding;
  const completeness = input.requirementCompletenessAnalysis;
  if (!completeness) return null;
  return {
    readOnly: true,
    productType: completeness.evidence.productType,
    platformTargets: completeness.evidence.platformTargets,
    keyWorkflows: completeness.evidence.workflows,
    featureInventory: [
      ...completeness.evidence.screens.map((s) => `Screen: ${s}`),
      ...completeness.evidence.integrations.map((i) => `Integration: ${i}`),
    ],
    confidenceScore: completeness.confidenceScore,
  };
}
