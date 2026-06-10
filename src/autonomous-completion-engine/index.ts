/**
 * Autonomous Completion Engine — public exports.
 */

import { resetCompletionDecisionCounterForTests } from './completion-decision-builder.js';
import { resetCompletionHistoryForTests } from './completion-history.js';
import { resetCompletionReportCounterForTests } from './completion-reporting.js';
import { resetCompletionStateCounterForTests } from './completion-state-model.js';
import { resetCompletionLoopGuardForTests } from './completion-loop-guard.js';
import { resetAutonomousCompletionEngineForTests } from './autonomous-completion-engine.js';
import { resetAutonomousVerificationModuleForTests } from '../autonomous-verification/index.js';

export {
  AUTONOMOUS_COMPLETION_ENGINE_PASS_TOKEN,
  AUTONOMOUS_COMPLETION_ENGINE_OWNER_MODULE,
  MAX_COMPLETION_HISTORY_SIZE,
  COMPLETION_LOOP_THRESHOLD,
  AUTONOMOUS_COMPLETION_QUESTION_SIGNALS,
  isAutonomousCompletionQuestion,
} from './autonomous-completion-engine-types.js';

export type {
  CompletionDecision,
  CompletionReadiness,
  CompletionResult,
  CompletionInput,
  CompletionEvidenceAnalysis,
  CompletionState,
  LoopGuardStatus,
  CompletionLoopGuardResult,
  CompletionReport,
  CompletionHistoryEntry,
  CompletionRuntimeReport,
} from './autonomous-completion-engine-types.js';

export {
  COMPLETION_DECISION_REGISTRY,
  getCompletionDecisionEntry,
  listCompletionDecisionEntries,
} from './completion-registry.js';
export type { CompletionDecisionEntry } from './completion-registry.js';

export { analyzeCompletionEvidence } from './completion-evidence-analyzer.js';
export { analyzeCompletionConfidence } from './completion-confidence-analyzer.js';
export { analyzeCompletionRisk } from './completion-risk-analyzer.js';
export { evaluateCompletionReadiness } from './completion-readiness-evaluator.js';
export { selectCompletionDecision } from './completion-decision-selector.js';
export { buildCompletionState, resetCompletionStateCounterForTests } from './completion-state-model.js';
export {
  evaluateCompletionLoopGuard,
  getCompletionLoopGuardDetectionCount,
  resetCompletionLoopGuardForTests,
} from './completion-loop-guard.js';
export {
  buildCompletionDecision,
  resetCompletionDecisionCounterForTests,
} from './completion-decision-builder.js';
export type { CompletionDecisionBuildResult } from './completion-decision-builder.js';
export { generateCompletionReport, resetCompletionReportCounterForTests } from './completion-reporting.js';
export {
  recordCompletionHistory,
  getLatestCompletionDecisions,
  lookupCompletionHistoryByDecision,
  lookupCompletionHistoryByReadiness,
  getCompletionHistorySize,
  resetCompletionHistoryForTests,
} from './completion-history.js';

export {
  getDevPulseV2AutonomousCompletionEngine,
  registerAutonomousCompletionEngineWithCentralBrain,
  registerAutonomousCompletionEngineWithProjectVault,
  registerAutonomousCompletionEngineWithTrustEngine,
  registerAutonomousCompletionEngineWithWorld2Coordinator,
  registerAutonomousCompletionEngineWithUvl,
  registerAutonomousCompletionEngineWithAutonomousBuilder,
  registerAutonomousCompletionEngineWithBuildStrategyEngine,
  registerAutonomousCompletionEngineWithAutonomousFixing,
  registerAutonomousCompletionEngineWithAutonomousVerification,
  strategyInputToCompletionInput,
  generateCompletionDecisionFromUpstream,
  getAutonomousCompletionEngineRuntimeReport,
  getAutonomousCompletionEngineInputCacheStats,
  resetAutonomousCompletionEngineForTests,
} from './autonomous-completion-engine.js';

export type {
  AutonomousCompletionEngineSystemSnapshot,
  AutonomousCompletionPipelineResult,
} from './autonomous-completion-engine.js';

export function resetAutonomousCompletionEngineModuleForTests(): void {
  resetCompletionDecisionCounterForTests();
  resetCompletionHistoryForTests();
  resetCompletionReportCounterForTests();
  resetCompletionStateCounterForTests();
  resetCompletionLoopGuardForTests();
  resetAutonomousCompletionEngineForTests();
  resetAutonomousVerificationModuleForTests();
}
