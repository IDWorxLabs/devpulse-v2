/**
 * AEE Build AutoFix Loop V1 — types.
 * Bounded npm build repair after install succeeds but compile fails.
 */

export const AEE_BUILD_AUTOFIX_LOOP_V1_PASS_TOKEN = 'AEE_BUILD_AUTOFIX_LOOP_V1_PASS' as const;

export const AEE_BUILD_AUTOFIX_LOOP_EVENT = 'AEE_BUILD_AUTOFIX_LOOP_V1' as const;

/** Matches product budget: maxBuildRepairAttempts */
export const AEE_BUILD_AUTOFIX_MAX_ATTEMPTS = 3 as const;

/** Matches product budget: maxDependencyInstallRetry */
export const AEE_BUILD_AUTOFIX_MAX_DEPENDENCY_RETRY = 2 as const;

export const AEE_BUILD_AUTOFIX_INJECT_MARKER = 'AEE_BUILD_AUTOFIX_INJECTED_FAULT' as const;

export type AeeBuildFailureClass =
  | 'TYPESCRIPT_ERROR'
  | 'MISSING_IMPORT_EXPORT'
  | 'MISSING_DEPENDENCY'
  | 'INVALID_JSX_TSX'
  | 'ROUTE_REGISTRY_MISMATCH'
  | 'PACKAGE_SCRIPT_FAILURE'
  | 'UNKNOWN_BUILD_FAILURE';

export type AeeBuildAutofixPhase =
  | 'FAILURE_CLASSIFICATION'
  | 'AUTOFIX_REPAIR'
  | 'DEPENDENCY_INSTALL_RETRY'
  | 'NPM_BUILD_RERUN';

export interface AeeBuildAutofixAttemptRecord {
  readOnly: true;
  attempt: number;
  phases: readonly AeeBuildAutofixPhase[];
  failureClass: AeeBuildFailureClass;
  repairApplied: boolean;
  filesChanged: readonly string[];
  dependencyInstallAttempts: number;
  buildRerunOk: boolean;
  buildOutputExcerpt: string;
  detail: string;
}

export interface AeeBuildAutofixLoopInput {
  workspaceDir: string;
  projectId: string;
  initialBuildOk: boolean;
  initialBuildOutput: string;
  maxAttempts?: number;
  maxDependencyInstallRetry?: number;
  /** Validator-only: inject and repair a simulated compile fault on first pass */
  simulateBuildAutofixRepair?: boolean;
  /** Validator-only: repair attempts do not resolve injected fault */
  simulateBuildAutofixExhausted?: boolean;
  rerunBuild?: () => { ok: boolean; output: string };
  onAttempt?: (record: AeeBuildAutofixAttemptRecord) => void;
}

export interface AeeBuildAutofixReport {
  readOnly: true;
  npmBuildInitialResult: 'PASS' | 'FAIL';
  initialFailureClass: AeeBuildFailureClass;
  initialBuildError: string;
  autofixAttempts: readonly AeeBuildAutofixAttemptRecord[];
  filesChanged: readonly string[];
  finalBuildStatus: 'PASS' | 'FAIL';
  finalBuildError: string | null;
  remainingErrors: readonly string[];
  exhausted: boolean;
  summary: string;
}

export interface AeeBuildAutofixLoopResult {
  readOnly: true;
  finalBuildOk: boolean;
  exhausted: boolean;
  skipped: boolean;
  skipReason: string | null;
  attempts: readonly AeeBuildAutofixAttemptRecord[];
  report: AeeBuildAutofixReport;
  summary: string;
}
