/**
 * Autonomous Verification — public exports.
 */

import { resetVerificationDecisionCounterForTests } from './verification-decision-builder.js';
import { resetVerificationHistoryForTests } from './verification-history.js';
import { resetVerificationReportCounterForTests } from './verification-reporting.js';
import { resetAutonomousVerificationForTests } from './autonomous-verification.js';
import { resetAutonomousFixingModuleForTests } from '../autonomous-fixing/index.js';

export {
  AUTONOMOUS_VERIFICATION_PASS_TOKEN,
  AUTONOMOUS_VERIFICATION_OWNER_MODULE,
  MAX_VERIFICATION_HISTORY_SIZE,
  AUTONOMOUS_VERIFICATION_QUESTION_SIGNALS,
  isAutonomousVerificationQuestion,
} from './autonomous-verification-types.js';

export type {
  VerificationDecision,
  VerificationEvidenceType,
  VerificationReadiness,
  AutonomousVerificationResult,
  VerificationInput,
  EvidenceAnalysis,
  VerificationReport,
  VerificationHistoryEntry,
  VerificationRuntimeReport,
} from './autonomous-verification-types.js';

export {
  VERIFICATION_DECISION_REGISTRY,
  getVerificationDecisionEntry,
  listVerificationDecisionEntries,
} from './verification-registry.js';
export type { VerificationDecisionEntry } from './verification-registry.js';

export { analyzeVerificationEvidence } from './evidence-analyzer.js';
export { analyzeVerificationTrust } from './verification-trust-analyzer.js';
export { analyzeVerificationRisk } from './verification-risk-analyzer.js';
export { analyzeVerificationConfidence } from './verification-confidence-analyzer.js';
export { selectVerificationDecision } from './verification-strategy-selector.js';
export { evaluateVerificationReadiness } from './verification-readiness-evaluator.js';
export { buildVerificationDecision, resetVerificationDecisionCounterForTests } from './verification-decision-builder.js';
export { generateVerificationReport, resetVerificationReportCounterForTests } from './verification-reporting.js';
export {
  recordVerificationHistory,
  getLatestVerificationDecisions,
  lookupVerificationHistoryByDecision,
  lookupVerificationHistoryByReadiness,
  getVerificationHistorySize,
  resetVerificationHistoryForTests,
} from './verification-history.js';

export {
  getDevPulseV2AutonomousVerification,
  registerAutonomousVerificationWithCentralBrain,
  registerAutonomousVerificationWithProjectVault,
  registerAutonomousVerificationWithTrustEngine,
  registerAutonomousVerificationWithWorld2Coordinator,
  registerAutonomousVerificationWithUvl,
  registerAutonomousVerificationWithAutonomousBuilder,
  registerAutonomousVerificationWithBuildStrategyEngine,
  registerAutonomousVerificationWithAutonomousFixing,
  strategyInputToVerificationInput,
  generateVerificationDecisionFromUpstream,
  getAutonomousVerificationRuntimeReport,
  getAutonomousVerificationInputCacheStats,
  resetAutonomousVerificationForTests,
} from './autonomous-verification.js';

export type {
  AutonomousVerificationSystemSnapshot,
  AutonomousVerificationPipelineResult,
} from './autonomous-verification.js';

export function resetAutonomousVerificationModuleForTests(): void {
  resetVerificationDecisionCounterForTests();
  resetVerificationHistoryForTests();
  resetVerificationReportCounterForTests();
  resetAutonomousVerificationForTests();
  resetAutonomousFixingModuleForTests();
}
