/**
 * Universal Capability Coverage Intelligence V1 — orchestrator.
 *
 * ApprovedProductionBuildEnvelope → capability extraction → B8 evidence →
 * coverage engine → engineering report → autonomous diagnosis.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { UniversalBehaviorVerificationReport } from '../universal-behavioral-verification/universal-behavior-types.js';
import {
  augmentWorkspaceFilesWithCapabilityCoverage,
  buildCapabilityCoverageMaterializationInputFromEnvelope,
  buildCapabilityCoverageSharedRuntimeFiles,
  materializeCapabilityCoverageForWorkspace,
  shouldMaterializeCapabilityCoverage,
} from './capability-coverage-pipeline.js';
import {
  buildCoverageSnapshot,
  calculateApplicationCoverage,
  calculateBehavioralCoverage,
  calculateCoverage,
  calculateEngineeringCoverage,
  calculateModuleCoverage,
  calculatePackCoverage,
  compareCoverage,
  detectCoverageRegression,
  extractCapabilitiesFromProductionTruth,
  fingerprintCoverage,
  rejectFalseCoverage,
} from './capability-coverage-engine.js';
import { buildCapabilityCoverageReport, renderCapabilityCoverageReportMarkdown } from './capability-coverage-report.js';
import { analyzeCapabilityGaps, unverifiedCapabilities, unsupportedCapabilities } from './capability-gap-analysis.js';
import { detectCoverageRegressions, coverageSilentlyDecreased } from './capability-regression-detector.js';
import { buildCapabilityTraceabilityChains } from './capability-traceability.js';
import { diagnoseCapabilityCoverage, detectFalseCoverage } from './capability-coverage-diagnostics.js';
import { buildCapabilityEngineeringScorecard, renderScorecardMarkdown } from './capability-scorecard.js';
import {
  classifyMaturityFromDimensions,
  classifySupportFromMaturity,
  maturityIndex,
} from './capability-maturity-classifier.js';
import {
  UNIVERSAL_CAPABILITY_COVERAGE_SOURCE,
  UNIVERSAL_CAPABILITY_COVERAGE_VERSION,
  stableCapabilityId,
  fingerprintCapability,
} from './universal-capability-coverage-types.js';
import type { CapabilityCoverageMaterializationInput } from './universal-capability-coverage-types.js';

export interface UniversalCapabilityCoverageResult {
  readonly capabilities: ReturnType<typeof extractCapabilitiesFromProductionTruth>;
  readonly snapshot: ReturnType<typeof buildCoverageSnapshot>;
  readonly report: ReturnType<typeof buildCapabilityCoverageReport>;
}

export function runUniversalCapabilityCoverage(input: {
  envelope: ApprovedProductionBuildEnvelope;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  materializationInput: CapabilityCoverageMaterializationInput;
  behaviorReport?: UniversalBehaviorVerificationReport | null;
}): UniversalCapabilityCoverageResult {
  const behaviorReport =
    input.behaviorReport ??
    (() => {
      const file = input.workspaceFiles.find((f) => f.relativePath.endsWith('behavior-verification-report.json'));
      if (!file) return null;
      try {
        return JSON.parse(file.content) as UniversalBehaviorVerificationReport;
      } catch {
        return null;
      }
    })();

  const capabilities = extractCapabilitiesFromProductionTruth({
    envelope: input.envelope,
    materializationInput: input.materializationInput,
    workspaceFiles: input.workspaceFiles,
    behaviorReport,
  });
  const snapshot = buildCoverageSnapshot({
    snapshotId: `${input.materializationInput.contractId}-coverage`,
    capabilities,
  });
  const report = buildCapabilityCoverageReport({
    reportId: `${input.materializationInput.contractId}-coverage-report`,
    snapshot,
  });
  return { capabilities, snapshot, report };
}

export {
  UNIVERSAL_CAPABILITY_COVERAGE_SOURCE,
  UNIVERSAL_CAPABILITY_COVERAGE_VERSION,
  stableCapabilityId,
  fingerprintCapability,
  extractCapabilitiesFromProductionTruth,
  buildCoverageSnapshot,
  calculateCoverage,
  calculateBehavioralCoverage,
  calculateEngineeringCoverage,
  calculatePackCoverage,
  calculateModuleCoverage,
  calculateApplicationCoverage,
  compareCoverage,
  detectCoverageRegression,
  fingerprintCoverage,
  rejectFalseCoverage,
  buildCapabilityCoverageReport,
  renderCapabilityCoverageReportMarkdown,
  analyzeCapabilityGaps,
  unverifiedCapabilities,
  unsupportedCapabilities,
  detectCoverageRegressions,
  coverageSilentlyDecreased,
  buildCapabilityTraceabilityChains,
  diagnoseCapabilityCoverage,
  detectFalseCoverage,
  buildCapabilityEngineeringScorecard,
  renderScorecardMarkdown,
  classifyMaturityFromDimensions,
  classifySupportFromMaturity,
  maturityIndex,
  augmentWorkspaceFilesWithCapabilityCoverage,
  buildCapabilityCoverageMaterializationInputFromEnvelope,
  materializeCapabilityCoverageForWorkspace,
  shouldMaterializeCapabilityCoverage,
  buildCapabilityCoverageSharedRuntimeFiles,
};
