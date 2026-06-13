/**
 * Requirements-to-Plan Execution Contract — public API.
 */

export {
  REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN,
  REQUIREMENTS_TO_PLAN_CONTRACT_OWNER_MODULE,
  REQUIREMENTS_TO_PLAN_CONTRACT_PHASE,
  REQUIREMENTS_TO_PLAN_CONTRACT_REPORT_TITLE,
  REQUIREMENTS_TO_PLAN_CONTRACT_CACHE_KEY_PREFIX,
  REQUIREMENTS_TO_PLAN_CONTRACT_CORE_QUESTION,
  EXECUTION_PROOF_REFERENCE_PROMPT,
  MAX_REQUIREMENTS_TO_PLAN_CONTRACT_HISTORY,
  CRITICAL_GAP_CATEGORIES,
  ORCHESTRATION_FLOW,
  VAGUE_PROMPT_PATTERNS,
} from './requirements-to-plan-contract-registry.js';

export type {
  UserIdeaStatus,
  RequirementType,
  RequirementStatus,
  PlanTaskLayer,
  PlanTaskStatus,
  ContractReadinessState,
  RequirementsToPlanProofLevel,
  UserIdeaContract,
  RequirementContractEntry,
  RequirementContract,
  ClarifyingGap,
  ClarifyingGapAnalysis,
  PlanTask,
  PlanContract,
  BuildUnit,
  BuildReadyExecutionContract,
  ContractLinkageAnalysis,
  RequirementsToPlanContractReport,
  RequirementsToPlanContractAssessment,
  AssessRequirementsToPlanContractInput,
  RequirementsToPlanContractHistoryEntry,
  RequirementsToPlanContractHistorySummary,
  RequirementsToPlanContractArtifacts,
  StoredBuildReadyContract,
} from './requirements-to-plan-contract-types.js';

export {
  resetRequirementsToPlanContractHistoryForTests,
  recordRequirementsToPlanContractAssessment,
  getRequirementsToPlanContractHistorySize,
  buildRequirementsToPlanContractHistorySummary,
} from './requirements-to-plan-contract-history.js';

export {
  assessRequirementsToPlanExecutionContract,
  buildRequirementsToPlanExecutionContractArtifacts,
  storeBuildReadyContractFromPrompt,
  getLastStoredBuildReadyContract,
  resetRequirementsToPlanContractCounterForTests,
  resetRequirementsToPlanContractModuleForTests,
  resetStoredBuildReadyContractForTests,
} from './requirements-to-plan-contract-authority.js';

export {
  buildRequirementsToPlanContractReportMarkdown,
  formatRequirementsToPlanContractSummary,
} from './requirements-to-plan-contract-report-builder.js';

export { buildUserIdeaContract } from './user-idea-contract-builder.js';
export { buildRequirementContract } from './requirement-contract-builder.js';
export { analyzeClarifyingGaps } from './clarifying-gap-analyzer.js';
export { buildPlanContract } from './plan-contract-builder.js';
export { buildBuildReadyExecutionContract } from './build-ready-contract-builder.js';
export { analyzeContractLinkage } from './contract-linkage-analyzer.js';
