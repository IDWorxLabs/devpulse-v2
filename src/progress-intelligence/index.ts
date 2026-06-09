/**
 * DevPulse V2 Phase 13.4 — Progress Intelligence public API.
 */

export {
  PROGRESS_INTELLIGENCE_PASS_TOKEN,
  PROGRESS_INTELLIGENCE_OWNER_MODULE,
  PROGRESS_QUESTION_SIGNALS,
  FORBIDDEN_PROGRESS_DUPLICATES,
  isProgressIntelligenceQuestion,
  type ProgressConfidence,
  type ProgressStatusLevel,
  type ProgressMilestone,
  type ProgressBlocker,
  type ProgressStatus,
  type ProgressRecord,
  type ProgressAnalysis,
  type ProgressIntelligenceResult,
  type ProgressIntelligenceDiagnostics,
} from './progress-intelligence-types.js';

export { calculatePercentComplete, averageCompletion } from './progress-percentage-calculator.js';
export {
  analyzeProgressMilestones,
  resolveNextMilestone,
  resetProgressMilestoneCounterForTests,
} from './progress-milestone-analyzer.js';
export { analyzeProgressBlockers, resetProgressBlockerCounterForTests } from './progress-blocker-analyzer.js';
export { analyzeProgressStatuses, resetProgressStatusCounterForTests } from './progress-status-analyzer.js';
export { buildProgressRecords, resetProgressRecordCounterForTests } from './progress-model-builder.js';

export {
  getProgressIntelligenceDiagnostics,
  updateProgressIntelligenceDiagnostics,
  resetProgressIntelligenceDiagnostics,
  progressIntelligenceKey,
} from './progress-intelligence-diagnostics.js';

export {
  analyzeProgress,
  processProgressIntelligenceRequest,
  getProgressIntelligenceContext,
} from './progress-intelligence.js';

export function getDevPulseV2ProgressIntelligence(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_progress_intelligence',
    passToken: 'DEVPULSE_V2_PROGRESS_INTELLIGENCE_FOUNDATION_V1_PASS',
    phase: 13.4,
  };
}
