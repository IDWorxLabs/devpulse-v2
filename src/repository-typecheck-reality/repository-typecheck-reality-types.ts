/**
 * Repository Typecheck Reality — assessment types.
 */

export type RepositoryTypecheckReadinessState =
  | 'TYPECHECK_CLEAN'
  | 'TYPECHECK_WARNINGS'
  | 'TYPECHECK_FAILED'
  | 'TYPECHECK_NOT_RUN';

export type RepositoryTypecheckFindingSeverity = 'ERROR' | 'WARNING';

export interface RepositoryTypecheckFinding {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  severity: RepositoryTypecheckFindingSeverity;
  recommendedAction: string;
}

export interface RepositoryTypecheckAssessment {
  readOnly: true;
  typecheckClean: boolean;
  errorCount: number;
  warningCount: number;
  checkedCommand: string;
  checkedAt: number;
  blocksLaunchReadiness: boolean;
  readinessState: RepositoryTypecheckReadinessState;
  findings: RepositoryTypecheckFinding[];
  recommendations: string[];
  founderProofNotes: readonly string[];
  cacheKey: string;
}

export interface AssessRepositoryTypecheckRealityInput {
  findings?: RepositoryTypecheckFinding[];
  errorCount?: number;
  warningCount?: number;
  checkedCommand?: string;
  checkedAt?: number;
  source?: 'BASELINE' | 'SUPPLIED' | 'NOT_RUN';
}

export interface RepositoryTypecheckVisibilityScore {
  score: number;
  readinessState: RepositoryTypecheckReadinessState;
  typecheckClean: boolean;
  blocksLaunchReadiness: boolean;
  errorCount: number;
  warningCount: number;
  findingCount: number;
  recommendations: string[];
}
