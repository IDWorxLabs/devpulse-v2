/**
 * Autonomous Builder Execution Sandbox — public API.
 */

export {
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PASS_TOKEN,
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_OWNER_MODULE,
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_PHASE,
  AUTONOMOUS_BUILDER_EXECUTION_SANDBOX_REPORT_TITLE,
  SANDBOX_CACHE_KEY_PREFIX,
  MAX_SANDBOX_HISTORY,
  MAX_SANDBOX_REASONS,
  SANDBOX_CORE_QUESTION,
  SANDBOX_ELIGIBILITY_STATES,
  SANDBOX_FORBIDDEN_ACTIONS,
  SANDBOX_ALLOWED_ACTIONS,
  REQUIRED_SANDBOX_AUTHORITIES,
  isSandboxEligibilityState,
  clampReadinessPercent,
} from './autonomous-builder-execution-sandbox-registry.js';

export type {
  SandboxEligibilityState,
  SandboxReadinessReview,
  ExecutionContract,
  SandboxInputSnapshot,
  SandboxExecutionAssessment,
  SandboxExecutionReport,
  AssessAutonomousBuilderExecutionSandboxInput,
  SandboxExecutionHistorySummary,
} from './autonomous-builder-execution-sandbox-types.js';

export {
  resetAutonomousBuilderExecutionSandboxHistoryForTests,
  recordSandboxExecutionAssessment,
  getSandboxExecutionHistorySize,
  getLatestSandboxExecutionAssessment,
  getSandboxExecutionHistory,
  buildSandboxExecutionHistorySummary,
  countSandboxEligibilityState,
} from './autonomous-builder-execution-sandbox-history.js';

export {
  assessAutonomousBuilderExecutionSandbox,
  computeSandboxReadinessReview,
  deriveSandboxEligibilityState,
  buildAutonomousBuilderExecutionSandboxReport,
  buildAutonomousBuilderExecutionSandboxArtifacts,
  resetAutonomousBuilderExecutionSandboxCounterForTests,
  resetAutonomousBuilderExecutionSandboxModuleForTests,
} from './autonomous-builder-execution-sandbox-authority.js';

export type { SandboxEligibilityContext } from './autonomous-builder-execution-sandbox-authority.js';

export { buildAutonomousBuilderExecutionSandboxReportMarkdown } from './autonomous-builder-execution-sandbox-report-builder.js';
