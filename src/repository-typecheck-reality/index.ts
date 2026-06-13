/**
 * Repository Typecheck Reality — public API.
 */

export {
  REPOSITORY_TYPECHECK_REALITY_PASS_TOKEN,
  REPOSITORY_TYPECHECK_REALITY_REPAIR_V1_PASS,
  REPOSITORY_TYPECHECK_REALITY_OWNER_MODULE,
  MAX_TYPECHECK_FINDINGS,
  MAX_TYPECHECK_HISTORY,
  TYPECHECK_COMMAND,
  NPM_TYPECHECK_SCRIPT,
  MAX_TYPECHECK_OUTPUT_SUMMARY_CHARS,
  REPOSITORY_TYPECHECK_CACHE_KEY_PREFIX,
  REPOSITORY_TYPECHECK_PROOF_NOTES,
} from './repository-typecheck-reality-bounds.js';

export type {
  RepositoryTypecheckReadinessState,
  RepositoryTypecheckFindingSeverity,
  RepositoryTypecheckFinding,
  RepositoryTypecheckAssessment,
  AssessRepositoryTypecheckRealityInput,
  RepositoryTypecheckVisibilityScore,
} from './repository-typecheck-reality-types.js';

export {
  resetRepositoryTypecheckHistoryForTests,
  recordRepositoryTypecheckAssessment,
  getLatestRepositoryTypecheckBaseline,
  getRepositoryTypecheckHistorySize,
} from './repository-typecheck-reality-history.js';

export { parseBoundedTypecheckOutput } from './repository-typecheck-reality-validator.js';
export { buildRepositoryTypecheckReportMarkdown } from './repository-typecheck-reality-report-builder.js';
export {
  assessRepositoryTypecheckReality,
  evaluateRepositoryTypecheckVisibility,
  buildRepositoryTypecheckRealityReport,
} from './repository-typecheck-reality-authority.js';
export {
  runRepositoryTypecheckBaseline,
  type RunRepositoryTypecheckBaselineInput,
  type RepositoryTypecheckBaselineResult,
} from './repository-typecheck-reality-runner.js';
