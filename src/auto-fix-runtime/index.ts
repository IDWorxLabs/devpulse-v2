/**
 * DevPulse V2 Phase 14.5 — Auto-Fix Runtime Foundation public API.
 */

export {
  AUTO_FIX_RUNTIME_FOUNDATION_PASS_TOKEN,
  AUTO_FIX_RUNTIME_OWNER_MODULE,
  AUTO_FIX_QUESTION_SIGNALS,
  AUTO_FIX_INPUT_SOURCES,
  FORBIDDEN_AUTO_FIX_RUNTIME_DUPLICATES,
  isAutoFixRuntimeFoundationQuestion,
  isDuplicateAutoFixBrainQuestion,
  isAutoFixPlanningAdvisoryQuestion,
  type AutoFixState,
  type AutoFixConfidence,
  type SimulatedFixStatus,
  type AutoFixRequest,
  type FixProposal,
  type FixAlternative,
  type FixRisk,
  type FixRollbackPlan,
  type FixVerificationPlan,
  type SimulatedFixResult,
  type AutoFixPlan,
  type AutoFixRuntimeDiagnostics,
  type AutoFixRuntimeResult,
} from './auto-fix-runtime-types.js';

export {
  parseFixRequest,
  resetFixRequestCounterForTests,
} from './fix-request-parser.js';

export {
  buildFixProposals,
  recommendedFix,
  resetFixProposalCounterForTests,
} from './fix-proposal-builder.js';

export {
  analyzeFixAlternatives,
  resetFixAlternativeCounterForTests,
} from './fix-alternative-analyzer.js';

export {
  analyzeFixRisks,
  resetFixRiskCounterForTests,
} from './fix-risk-analyzer.js';

export {
  createFixRollbackPlan,
  resetFixRollbackCounterForTests,
} from './fix-rollback-plan.js';

export {
  createFixVerificationPlan,
  resetFixVerificationCounterForTests,
} from './fix-verification-plan.js';

export {
  buildSimulatedFixResults,
  simulatedFailedFixResults,
  resetSimulatedFixResultCounterForTests,
} from './simulated-fix-result-model.js';

export {
  buildAutoFixPlan,
  resetAutoFixPlanCounterForTests,
} from './auto-fix-plan-builder.js';

export {
  getAutoFixRuntimeDiagnostics,
  updateAutoFixRuntimeDiagnostics,
  resetAutoFixRuntimeDiagnostics,
  autoFixRuntimeKey,
} from './auto-fix-runtime-diagnostics.js';

export {
  processAutoFixRuntimeRequest,
  getAutoFixRuntimeContext,
} from './auto-fix-runtime.js';

export function getDevPulseV2AutoFixRuntime(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_auto_fix_runtime',
    passToken: 'DEVPULSE_V2_AUTO_FIX_RUNTIME_FOUNDATION_V1_PASS',
    phase: 14.5,
  };
}
