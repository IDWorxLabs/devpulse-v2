/**
 * REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1 — types.
 * Repository-wide TypeScript engineering correctness. No application-specific logic.
 */

export const REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS =
  'REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS' as const;

export const REPO_TYPECHECK_MAX_REPAIR_CYCLES = 3 as const;

/** Validation-only marker file name for regression trap fixtures. */
export const REPO_TYPECHECK_FIXTURE_REGRESSION_MARKER = '.repo-typecheck-fixture-regression';

export type RepoTypecheckFailureClass =
  | 'IMPORT_PATH_ERROR'
  | 'MODULE_NOT_FOUND'
  | 'EXPORT_NOT_FOUND'
  | 'DUPLICATE_IDENTIFIER'
  | 'READONLY_MUTATION'
  | 'TYPE_ASSIGNMENT'
  | 'OPTIONAL_PROPERTY'
  | 'NULL_UNDEFINED'
  | 'GENERIC_CONSTRAINT'
  | 'INTERFACE_MISMATCH'
  | 'FUNCTION_SIGNATURE'
  | 'ASYNC_RETURN_TYPE'
  | 'MISSING_TYPE'
  | 'ENUM_MISMATCH'
  | 'UNUSED_IMPORT'
  | 'UNUSED_VARIABLE'
  | 'CONFIGURATION_ERROR'
  | 'PROJECT_REFERENCE_ERROR'
  | 'UNKNOWN_TYPESCRIPT_FAILURE';

export type RepoTypecheckVerdict =
  | 'TYPECHECK_ALREADY_CLEAN'
  | 'TYPECHECK_REPAIRED'
  | 'TYPECHECK_PARTIALLY_REPAIRED'
  | 'TYPECHECK_BLOCKED'
  | 'TYPECHECK_UNSAFE'
  | 'TYPECHECK_REPAIR_REGRESSION'
  | 'TYPECHECK_EXHAUSTED';

export interface RepoTypecheckDiagnostic {
  readOnly: true;
  code: string;
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'ERROR' | 'WARNING';
  failureClass: RepoTypecheckFailureClass;
}

export interface RepoTypecheckScanResult {
  readOnly: true;
  command: string;
  passed: boolean;
  exitCode: number;
  errorCount: number;
  warningCount: number;
  diagnostics: RepoTypecheckDiagnostic[];
  rawOutput: string;
  durationMs: number;
}

export interface RepoTypecheckRootCauseGroup {
  readOnly: true;
  groupId: string;
  failureClass: RepoTypecheckFailureClass;
  primaryFile: string;
  primaryLine: number;
  primaryCode: string;
  primaryMessage: string;
  diagnostics: RepoTypecheckDiagnostic[];
  downstreamCount: number;
  rootSymbol: string | null;
  safe: boolean;
}

export interface RepoTypecheckRepairPlan {
  readOnly: true;
  rootCause: RepoTypecheckRootCauseGroup;
  description: string;
  targetFiles: string[];
  safe: boolean;
  blockedReason: string | null;
}

export interface RepoTypecheckPatchSnapshot {
  readOnly: true;
  files: Record<string, string>;
}

export interface RepoTypecheckPatchRecord {
  readOnly: true;
  cycle: number;
  plan: RepoTypecheckRepairPlan;
  filesModified: string[];
  beforeErrorCount: number;
  afterErrorCount: number;
  errorsRemoved: number;
  applied: boolean;
  rolledBack: boolean;
  detail: string;
}

export interface RepoTypecheckStabilizationReport {
  readOnly: true;
  initialDiagnostics: RepoTypecheckDiagnostic[];
  initialErrorCount: number;
  failureClasses: RepoTypecheckFailureClass[];
  rootCauseSelected: RepoTypecheckRootCauseGroup | null;
  patches: RepoTypecheckPatchRecord[];
  filesModified: string[];
  finalDiagnostics: RepoTypecheckDiagnostic[];
  finalErrorCount: number;
  errorsRemoved: number;
  errorsRemaining: number;
  repairCycles: number;
  command: string;
  durationMs: number;
  verdict: RepoTypecheckVerdict;
  passToken: typeof REPO_TYPECHECK_STABILIZATION_AUTHORITY_V1_PASS | null;
  generatedAt: string;
}

export interface RunRepositoryTypecheckStabilizationInput {
  projectRootDir?: string;
  command?: string;
  maxCycles?: number;
  dryRun?: boolean;
}

export interface RunRepositoryTypecheckStabilizationResult {
  readOnly: true;
  report: RepoTypecheckStabilizationReport;
  typecheckClean: boolean;
}
