/**
 * Missing Capability Escalation — public exports.
 */

import { resetEscalationRegistryForTests } from './escalation-registry.js';
import { resetEscalationCacheForTests } from './escalation-cache.js';
import { resetFailurePatternDetectorForTests } from './failure-pattern-detector.js';
import { resetStallPatternDetectorForTests } from './stall-pattern-detector.js';
import { resetBottleneckPatternDetectorForTests } from './bottleneck-pattern-detector.js';
import { resetBlockedStateDetectorForTests } from './blocked-state-detector.js';
import { resetEscalationDecisionCounterForTests } from './escalation-decision-engine.js';
import { resetEscalationHistoryForTests } from './escalation-history.js';
import { resetEscalationReportCounterForTests } from './escalation-reporting.js';
import { resetMissingCapabilityEscalationForTests } from './missing-capability-escalation.js';
import { resetMultiProjectMonitoringModuleForTests } from '../multi-project-monitoring/index.js';

export {
  MISSING_CAPABILITY_ESCALATION_PASS_TOKEN,
  MISSING_CAPABILITY_ESCALATION_OWNER_MODULE,
  DEFAULT_MAX_ESCALATION_HISTORY_SIZE,
  DEFAULT_FAILURE_THRESHOLD,
  DEFAULT_STALL_THRESHOLD_MS,
  ESCALATION_QUESTION_SIGNALS,
  isEscalationQuestion,
} from './escalation-types.js';

export type {
  EscalationTrigger,
  EscalationDecision,
  CapabilityEscalationRecord,
  FailureEvent,
  FailurePatternResult,
  StallEvent,
  StallPatternResult,
  BottleneckEvent,
  BottleneckPatternResult,
  BlockedStateEvent,
  BlockedStatePatternResult,
  CapabilityGapRootCause,
  CapabilityGapAnalysis,
  EscalationInput,
  EscalationReport,
  EscalationHistoryEntry,
  EscalationRuntimeReport,
} from './escalation-types.js';

export {
  registerEscalation,
  getEscalation,
  listEscalations,
  listEscalationsByTrigger,
  listEscalationsByDecision,
  getEscalationCount,
  resetEscalationRegistryForTests,
} from './escalation-registry.js';

export { detectRepeatedFailures, getFailurePatternCount, resetFailurePatternDetectorForTests } from './failure-pattern-detector.js';
export { detectRepeatedStalls, getStallPatternCount, resetStallPatternDetectorForTests } from './stall-pattern-detector.js';
export { detectRepeatedBottlenecks, getBottleneckPatternCount, resetBottleneckPatternDetectorForTests } from './bottleneck-pattern-detector.js';
export { detectRepeatedBlockedStates, getBlockedPatternCount, resetBlockedStateDetectorForTests } from './blocked-state-detector.js';
export { analyzeCapabilityGap } from './capability-gap-analyzer.js';
export { buildEscalationDecision, resetEscalationDecisionCounterForTests } from './escalation-decision-engine.js';
export type { EscalationDecisionResult } from './escalation-decision-engine.js';
export {
  recordEscalationHistory,
  getEscalationHistory,
  getEscalationHistorySize,
  resetEscalationHistoryForTests,
} from './escalation-history.js';
export { generateEscalationReport, resetEscalationReportCounterForTests } from './escalation-reporting.js';
export { getEscalationCacheStats, resetEscalationCacheForTests } from './escalation-cache.js';

export {
  getDevPulseV2MissingCapabilityEscalation,
  registerMissingCapabilityEscalationWithCentralBrain,
  registerMissingCapabilityEscalationWithProjectVault,
  registerMissingCapabilityEscalationWithTrustEngine,
  registerMissingCapabilityEscalationWithWorld2Coordinator,
  registerMissingCapabilityEscalationWithUvl,
  registerMissingCapabilityEscalationWithAutonomousTesting,
  registerMissingCapabilityEscalationWithAutonomousFixing,
  registerMissingCapabilityEscalationWithAutonomousVerification,
  registerMissingCapabilityEscalationWithCompletionEngine,
  registerMissingCapabilityEscalationWithMultiProjectMonitoring,
  evaluateCapabilityEscalation,
  getMissingCapabilityEscalationRuntimeReport,
  resetMissingCapabilityEscalationForTests,
} from './missing-capability-escalation.js';

export type { MissingCapabilityEscalationSystemSnapshot } from './missing-capability-escalation.js';

export function resetMissingCapabilityEscalationModuleForTests(): void {
  resetEscalationRegistryForTests();
  resetEscalationCacheForTests();
  resetFailurePatternDetectorForTests();
  resetStallPatternDetectorForTests();
  resetBottleneckPatternDetectorForTests();
  resetBlockedStateDetectorForTests();
  resetEscalationDecisionCounterForTests();
  resetEscalationHistoryForTests();
  resetEscalationReportCounterForTests();
  resetMissingCapabilityEscalationForTests();
  resetMultiProjectMonitoringModuleForTests();
}
