/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — post-repair validation.
 */

import type { RepoTypecheckScanResult } from './repo-typecheck-types.js';
import { runRepositoryTypecheckScan } from './repo-typecheck-scanner.js';

export interface RepoTypecheckValidationResult {
  readOnly: true;
  passed: boolean;
  regression: boolean;
  scan: RepoTypecheckScanResult;
  beforeErrorCount: number;
  afterErrorCount: number;
  errorsRemoved: number;
  detail: string;
}

export function validateRepoTypecheckAfterRepair(input: {
  projectRootDir: string;
  command?: string;
  beforeErrorCount: number;
}): RepoTypecheckValidationResult {
  const scan = runRepositoryTypecheckScan({
    projectRootDir: input.projectRootDir,
    command: input.command,
  });
  const afterErrorCount = scan.errorCount;
  const errorsRemoved = Math.max(0, input.beforeErrorCount - afterErrorCount);
  const regression = afterErrorCount > input.beforeErrorCount;
  const passed = scan.passed;

  let detail = passed
    ? 'Repository typecheck passed'
    : regression
      ? `Regression detected: errors increased from ${input.beforeErrorCount} to ${afterErrorCount}`
      : `Errors reduced from ${input.beforeErrorCount} to ${afterErrorCount}`;

  return {
    readOnly: true,
    passed,
    regression,
    scan,
    beforeErrorCount: input.beforeErrorCount,
    afterErrorCount,
    errorsRemoved,
    detail,
  };
}

export function didTypecheckImprove(
  beforeErrorCount: number,
  afterErrorCount: number,
): boolean {
  return afterErrorCount < beforeErrorCount || afterErrorCount === 0;
}
