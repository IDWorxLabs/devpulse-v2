/**
 * Verification Reality — read-only analyzers (Phase 24A.3).
 * Validator count, pass tokens, NPM scripts, URL/route/panel ≠ proof.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AssessVerificationRealityInput,
  VerificationAnalyzerResults,
  VerificationModulePresenceEvidence,
  VerificationRealityEvidence,
  VerificationWorkspaceSignals,
} from './verification-reality-types.js';
import type {
  BuildOutputLinkLevel,
  EvidenceChainBreakPoint,
  EvidenceChainLevel,
  PreviewLinkLevel,
  RuntimeLinkLevel,
  VerificationInventoryLevel,
} from './verification-reality-analyzer-types.js';
import type { ProductWorkspaceSnapshot } from '../../server/product-workspace-snapshot.js';

export function detectVerificationModulePresenceEvidence(rootDir: string): VerificationModulePresenceEvidence {
  const pathExists = (rel: string) => existsSync(join(rootDir, rel));
  const pkg = JSON.parse(
    pathExists('package.json') ? readFileSync(join(rootDir, 'package.json'), 'utf8') : '{}',
  ) as { scripts?: Record<string, string> };
  const validatorScriptCount = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')).length;

  let architectureReportCount = 0;
  const archDir = join(rootDir, 'architecture');
  if (existsSync(archDir)) {
    architectureReportCount = readdirSync(archDir).filter((f) => f.endsWith('.md')).length;
  }

  const hasFounderTestingMode = pathExists('src/founder-testing-mode/index.ts');
  const hasExecutionRealityEngine = pathExists('src/founder-testing-mode/execution-reality-engine.ts');
  const hasVerificationResultsVisibility = pathExists('src/verification-results-visibility/index.ts');
  const hasAutonomousBuilderReality = pathExists('src/autonomous-builder-reality/index.ts');

  return {
    hasFounderTestingMode,
    hasExecutionRealityEngine,
    hasVerificationResultsVisibility,
    hasLivePreviewReality: pathExists('src/live-preview-reality/index.ts'),
    hasAutonomousBuilderReality,
    hasValidationBudgetPolicy: pathExists('src/validation-budget-policy/index.ts'),
    hasVerificationRealityModule: pathExists('src/verification-reality/index.ts'),
    validatorScriptCount,
    architectureReportCount,
    founderTestingConsumesPreview: hasExecutionRealityEngine,
    founderTestingConsumesBuild: hasExecutionRealityEngine && hasAutonomousBuilderReality,
    verificationResultsLinked: hasVerificationResultsVisibility && hasFounderTestingMode,
  };
}

/** Leaf-validator workspace signals — no snapshot, no brain, no nested validation. */
export function buildVerificationWorkspaceSignalsForValidation(
  moduleEvidence: VerificationModulePresenceEvidence,
  overrides: Partial<VerificationWorkspaceSignals> = {},
): VerificationWorkspaceSignals {
  return {
    executionConnected: false,
    world2FoundationComplete: true,
    validatorCount: moduleEvidence.validatorScriptCount,
    verificationReadiness: moduleEvidence.validatorScriptCount > 0 ? 'ready' : 'idle',
    uvlCheckCount: 0,
    previewValidationReady: false,
    previewRuntimeActive: false,
    previewRealityState: 'NO_PREVIEW',
    founderTestingConsumesPreview: moduleEvidence.founderTestingConsumesPreview,
    founderTestingConsumesBuild: moduleEvidence.founderTestingConsumesBuild,
    verificationResultsLinked: moduleEvidence.verificationResultsLinked,
    runtimeDiagnosticsActive: false,
    verificationSurfacePresent: true,
    ...overrides,
  };
}

export function buildVerificationWorkspaceSignalsFromSnapshot(
  snapshot: ProductWorkspaceSnapshot,
  moduleEvidence: VerificationModulePresenceEvidence,
  options: { verificationSurfacePresent?: boolean; founderTestingConsumesPreview?: boolean } = {},
): VerificationWorkspaceSignals {
  return {
    executionConnected: snapshot.autonomousBuilder.executionConnected,
    world2FoundationComplete: snapshot.autonomousBuilder.world2FoundationComplete,
    validatorCount: snapshot.verification.validatorCount,
    verificationReadiness: snapshot.verification.readiness,
    uvlCheckCount: snapshot.verification.uvlCheckCount,
    previewValidationReady: snapshot.livePreview.reality?.validationReady === true,
    previewRuntimeActive: snapshot.livePreview.diagnostics?.previewRuntimeActive === true,
    previewRealityState: snapshot.livePreview.reality?.state ?? 'NO_PREVIEW',
    founderTestingConsumesPreview:
      options.founderTestingConsumesPreview ?? moduleEvidence.founderTestingConsumesPreview,
    founderTestingConsumesBuild: moduleEvidence.founderTestingConsumesBuild,
    verificationResultsLinked: moduleEvidence.verificationResultsLinked,
    runtimeDiagnosticsActive:
      snapshot.livePreview.diagnostics?.previewRuntimeActive === true ||
      Boolean((snapshot.runtime as { selfVisionActive?: boolean } | undefined)?.selfVisionActive),
    verificationSurfacePresent: options.verificationSurfacePresent ?? true,
  };
}

export function analyzeValidationInventory(input: AssessVerificationRealityInput): VerificationInventoryLevel {
  const runtime = analyzeRuntimeLink(input);
  const build = analyzeBuildOutputLink(input);
  const preview = analyzePreviewLink(input);
  const { workspace, moduleEvidence } = input;

  if (
    runtime === 'RUNTIME_LINK_PROVEN' &&
    build === 'BUILD_OUTPUT_LINK_PROVEN' &&
    preview === 'PREVIEW_LINK_PROVEN' &&
    workspace.verificationResultsLinked
  ) {
    return 'VERIFICATION_PROVEN';
  }

  if (
    moduleEvidence.validatorScriptCount > 0 &&
    (moduleEvidence.hasFounderTestingMode ||
      moduleEvidence.hasExecutionRealityEngine ||
      moduleEvidence.hasVerificationResultsVisibility)
  ) {
    return 'VERIFICATION_OBSERVED';
  }

  if (workspace.validatorCount > 0 || workspace.verificationSurfacePresent) {
    return 'VERIFICATION_CLAIMED';
  }

  return 'VERIFICATION_CLAIMED';
}

export function analyzeRuntimeLink(input: AssessVerificationRealityInput): RuntimeLinkLevel {
  const { workspace, moduleEvidence } = input;

  const runtimeProven =
    workspace.executionConnected &&
    workspace.runtimeDiagnosticsActive &&
    workspace.founderTestingConsumesBuild &&
    workspace.verificationResultsLinked &&
    moduleEvidence.hasExecutionRealityEngine;

  if (runtimeProven) return 'RUNTIME_LINK_PROVEN';

  const runtimePartial =
    moduleEvidence.hasExecutionRealityEngine &&
    (workspace.runtimeDiagnosticsActive ||
      workspace.previewRuntimeActive ||
      workspace.founderTestingConsumesPreview);

  if (runtimePartial) return 'RUNTIME_LINK_PARTIAL';

  return 'RUNTIME_LINK_MISSING';
}

export function analyzeBuildOutputLink(input: AssessVerificationRealityInput): BuildOutputLinkLevel {
  const { workspace, moduleEvidence } = input;

  if (
    workspace.executionConnected &&
    moduleEvidence.hasAutonomousBuilderReality &&
    workspace.founderTestingConsumesBuild
  ) {
    return 'BUILD_OUTPUT_LINK_PROVEN';
  }

  if (
    workspace.world2FoundationComplete ||
    moduleEvidence.hasAutonomousBuilderReality ||
    workspace.founderTestingConsumesBuild
  ) {
    return 'BUILD_OUTPUT_LINK_PARTIAL';
  }

  return 'BUILD_OUTPUT_LINK_MISSING';
}

export function analyzePreviewLink(input: AssessVerificationRealityInput): PreviewLinkLevel {
  const { workspace, moduleEvidence } = input;

  if (
    workspace.verificationResultsLinked &&
    workspace.previewValidationReady &&
    workspace.founderTestingConsumesPreview &&
    moduleEvidence.hasLivePreviewReality
  ) {
    return 'PREVIEW_LINK_PROVEN';
  }

  if (
    moduleEvidence.hasLivePreviewReality &&
    (workspace.founderTestingConsumesPreview || workspace.previewValidationReady)
  ) {
    return 'PREVIEW_LINK_PARTIAL';
  }

  return 'PREVIEW_LINK_MISSING';
}

export function analyzeEvidenceChain(input: AssessVerificationRealityInput): EvidenceChainLevel {
  const breakPoint = resolveEvidenceChainBreakPoint(input);
  if (breakPoint === 'NONE') return 'EVIDENCE_CHAIN_PROVEN';
  if (breakPoint === 'VERIFICATION') return 'EVIDENCE_CHAIN_PARTIAL';
  if (breakPoint === 'PREVIEW' || breakPoint === 'RUNTIME') return 'EVIDENCE_CHAIN_PARTIAL';
  return 'EVIDENCE_CHAIN_MISSING';
}

export function resolveEvidenceChainBreakPoint(input: AssessVerificationRealityInput): EvidenceChainBreakPoint {
  const { workspace, moduleEvidence } = input;

  if (!moduleEvidence.hasFounderTestingMode && workspace.validatorCount === 0) {
    return 'REQUIREMENT';
  }

  if (!moduleEvidence.hasExecutionRealityEngine && !moduleEvidence.hasAutonomousBuilderReality) {
    return 'PLAN';
  }

  if (!workspace.executionConnected) {
    return 'BUILD';
  }

  const runtimeLink = analyzeRuntimeLink(input);
  if (runtimeLink === 'RUNTIME_LINK_MISSING') {
    return 'RUNTIME';
  }

  const previewLink = analyzePreviewLink(input);
  if (previewLink !== 'PREVIEW_LINK_PROVEN' && !workspace.previewValidationReady) {
    return 'PREVIEW';
  }

  const buildLink = analyzeBuildOutputLink(input);
  const chainProven =
    runtimeLink === 'RUNTIME_LINK_PROVEN' &&
    buildLink === 'BUILD_OUTPUT_LINK_PROVEN' &&
    previewLink === 'PREVIEW_LINK_PROVEN' &&
    workspace.verificationResultsLinked;

  if (!chainProven) {
    return 'VERIFICATION';
  }

  return 'NONE';
}

export function runAllVerificationRealityAnalyzers(
  input: AssessVerificationRealityInput,
): VerificationAnalyzerResults {
  const evidenceChainBreakPoint = resolveEvidenceChainBreakPoint(input);
  return {
    validationInventory: analyzeValidationInventory(input),
    runtimeLink: analyzeRuntimeLink(input),
    buildOutputLink: analyzeBuildOutputLink(input),
    previewLink: analyzePreviewLink(input),
    evidenceChain: analyzeEvidenceChain(input),
    evidenceChainBreakPoint,
  };
}

export function collectVerificationRealityEvidence(input: AssessVerificationRealityInput): VerificationRealityEvidence[] {
  const { workspace, moduleEvidence } = input;
  const evidence: VerificationRealityEvidence[] = [];
  let counter = 0;

  const push = (level: VerificationRealityEvidence['level'], description: string, source: string) => {
    counter += 1;
    evidence.push({ id: `verification-evidence-${counter}`, level, description, source });
  };

  if (moduleEvidence.validatorScriptCount > 0) {
    push(
      'CLAIMED',
      `${moduleEvidence.validatorScriptCount} validate:* scripts — validator count is not proof of execution verification`,
      'package.json',
    );
  }
  if (moduleEvidence.hasFounderTestingMode) {
    push('OBSERVED', 'Founder Testing Mode module present', 'founder-testing-mode');
  }
  if (moduleEvidence.hasExecutionRealityEngine) {
    push('OBSERVED', 'Execution Reality Engine consumes workspace preview/build signals', 'execution-reality-engine');
  }
  if (moduleEvidence.hasVerificationResultsVisibility) {
    push('OBSERVED', 'Verification Results Visibility consumes Founder Test V4 report', 'verification-results-visibility');
  }
  if (workspace.previewValidationReady) {
    push('OBSERVED', 'Preview validation-ready signal in workspace', 'livePreview.reality');
  }
  if (workspace.verificationResultsLinked && workspace.previewValidationReady) {
    push('OBSERVED', 'Verification results module reads previewReality from V4 report', 'verification-results-visibility');
  }
  if (workspace.executionConnected) {
    push('PROVEN', 'Builder execution connected — build output linkage possible', 'autonomousBuilder');
  }
  if (workspace.verificationSurfacePresent) {
    push('CLAIMED', 'Verification UI surface exists — panel presence is not proof', 'founder-reality-ui');
  }
  if (moduleEvidence.architectureReportCount > 0) {
    push('CLAIMED', `${moduleEvidence.architectureReportCount} architecture reports — report exists ≠ execution proof`, 'architecture/');
  }

  return evidence;
}
