/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — public API.
 */

export {
  REPO_TYPECHECK_FIXTURE_REGRESSION_MARKER,
  REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS,
  REPO_TYPECHECK_MAX_REPAIR_CYCLES,
} from './repo-typecheck-types.js';

export type {
  RepoTypecheckDiagnostic,
  RepoTypecheckFailureClass,
  RepoTypecheckPatchRecord,
  RepoTypecheckRepairPlan,
  RepoTypecheckRootCauseGroup,
  RepoTypecheckScanResult,
  RepoTypecheckStabilizationReport,
  RepoTypecheckVerdict,
  RunRepositoryTypecheckStabilizationInput,
  RunRepositoryTypecheckStabilizationResult,
} from './repo-typecheck-types.js';

export {
  classifyDiagnostics,
  classifyTypeScriptDiagnostic,
  extractRootSymbol,
  isRepairableFailureClass,
  isUnsafeFailureClass,
} from './repo-typecheck-classifier.js';

export {
  discoverRepositoryTypecheckCommand,
  parseTypeScriptCompilerOutput,
  runRepositoryTypecheckScan,
} from './repo-typecheck-scanner.js';

export {
  countDownstreamForExport,
  groupDiagnosticsByRootCause,
  planRepoTypecheckRepair,
  selectPrimaryRootCause,
} from './repo-typecheck-repair-planner.js';

export {
  applyRepoTypecheckRepairPatch,
  capturePatchSnapshot,
  finalizePatchRecord,
  rollbackPatchSnapshot,
} from './repo-typecheck-safe-patcher.js';

export {
  didTypecheckImprove,
  validateRepoTypecheckAfterRepair,
} from './repo-typecheck-validator.js';

export {
  buildRepoTypecheckStabilizationReport,
  formatRepoTypecheckStabilizationReportMarkdown,
} from './repo-typecheck-report.js';

export {
  runRepositoryTypecheckStabilization,
  summarizeRepoTypecheckFailureClasses,
} from './repo-typecheck-engine.js';

export {
  createRepoTypecheckFixtureWorkspace,
  injectBrokenImportPathFixture,
  injectCleanFixture,
  injectDuplicateIdentifierFixture,
  injectMissingExportFixture,
  injectMultipleDownstreamFixture,
  injectReadonlyMutationFixture,
  injectRegressionTrapFixture,
  injectUnsafeFixture,
  injectUnusedImportFixture,
} from './repo-typecheck-test-fixtures.js';

import type { RunRepositoryTypecheckStabilizationResult } from './repo-typecheck-types.js';

/**
 * Optional integration hook for launch readiness and founder testing.
 * One-way import — callers invoke stabilization without circular deps.
 */
export async function runOptionalRepositoryTypecheckStabilization(input: {
  projectRootDir: string;
  enabled?: boolean;
}): Promise<RunRepositoryTypecheckStabilizationResult | null> {
  if (input.enabled === false) return null;
  const { runRepositoryTypecheckStabilization } = await import('./repo-typecheck-engine.js');
  return runRepositoryTypecheckStabilization({ projectRootDir: input.projectRootDir });
}
