/**
 * DevPulse V2 Phase 16.9 — Verification Orchestrator public API.
 */

export {
  VERIFICATION_ORCHESTRATOR_PASS_TOKEN,
  VERIFICATION_ORCHESTRATOR_OWNER_MODULE,
  VERIFICATION_ORCHESTRATOR_QUESTION_SIGNALS,
  FORBIDDEN_VERIFICATION_ORCHESTRATOR_DUPLICATES,
  isVerificationOrchestratorQuestion,
  isVerificationOrchestratorAdvisoryQuestion,
  isDuplicateVerificationOrchestratorQuestion,
  type OrchestrationExecutionState,
  type OrchestrationState,
  type VerificationExecutionPlan,
  type ParallelGroup,
  type VerificationOrchestrationReport,
  type VerificationOrchestratorDiagnostics,
  type PrepareVerificationOrchestrationInput,
  type PrepareVerificationOrchestrationResult,
} from './types.js';

export {
  buildVerificationExecutionPlan,
  buildVerificationExecutionPlans,
  buildFutureExecutionPlan,
  resetVerificationPlanCounterForTests,
} from './verification-plan-builder.js';

export {
  resolveVerificationDependencies,
  detectDependencyCycle,
  detectInjectedCycle,
  type DependencyResolution,
} from './verification-dependency-resolver.js';

export {
  scheduleVerificationExecution,
  type ScheduleResult,
} from './verification-scheduler.js';

export {
  evaluateVerificationReadiness,
  type ReadinessResult,
} from './verification-readiness-evaluator.js';

export {
  identifyParallelGroups,
  listParallelSafeTargets,
  resetParallelGroupCounterForTests,
} from './verification-parallelization-engine.js';

export {
  analyzeVerificationBlockers,
  type BlockerAnalysis,
} from './verification-blocker-analyzer.js';

export {
  evaluateOrchestratorGates,
  validateVerificationOrchestration,
  type OrchestratorGateReport,
  type OrchestratorValidationResult,
} from './verification-orchestrator-validator.js';

export {
  buildVerificationOrchestrationReport,
  composeVerificationOrchestrationResponse,
  buildVerificationOrchestratorFailureContext,
  deriveOrchestrationState,
  nextOrchestrationId,
  resetVerificationOrchestratorReportCounterForTests,
  type VerificationOrchestratorFailureContext,
} from './verification-orchestrator-report.js';

export {
  getVerificationOrchestratorDiagnostics,
  updateVerificationOrchestratorDiagnostics,
  resetVerificationOrchestratorDiagnostics,
  verificationOrchestratorKey,
} from './verification-orchestrator-diagnostics.js';

export {
  prepareVerificationOrchestration,
  processVerificationOrchestratorRequest,
  getVerificationOrchestratorContext,
} from './verification-orchestrator.js';

export function getDevPulseV2VerificationOrchestrator(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  extensionOnly: true;
} {
  return {
    ownerModule: 'devpulse_v2_verification_orchestrator',
    passToken: 'VERIFICATION_ORCHESTRATOR_V1_PASS',
    phase: 16.9,
    extensionOnly: true,
  };
}
