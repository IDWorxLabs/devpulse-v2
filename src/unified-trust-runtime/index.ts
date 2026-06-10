/**
 * Unified Trust Runtime — public exports.
 */

import { resetTrustSourceRegistryForTests } from './trust-source-registry.js';
import { resetTrustRuntimeCacheForTests } from './trust-runtime-cache.js';
import { resetTrustSignalNormalizerForTests } from './trust-signal-normalizer.js';
import { resetTrustAuthorityBuilderForTests } from './trust-authority-builder.js';
import { resetTrustRuntimeEvaluatorForTests } from './trust-runtime-evaluator.js';
import { resetTrustRuntimeHistoryForTests } from './trust-runtime-history.js';
import { resetTrustRuntimeReportingForTests } from './trust-runtime-reporting.js';
import { resetTrustRuntimeRegistryForTests } from './trust-runtime-registry.js';
import { resetUnifiedTrustRuntimeForTests } from './unified-trust-runtime.js';
import { resetSelfEvolutionGovernanceModuleForTests } from '../self-evolution-governance/index.js';

export {
  UNIFIED_TRUST_RUNTIME_PASS_TOKEN,
  UNIFIED_TRUST_RUNTIME_OWNER_MODULE,
  DEFAULT_MAX_TRUST_RUNTIME_HISTORY_SIZE,
  TRUST_RUNTIME_QUESTION_SIGNALS,
  isUnifiedTrustRuntimeQuestion,
} from './trust-runtime-types.js';

export type {
  TrustSourceId,
  TrustState,
  TrustSignalStatus,
  TrustSourceRegistration,
  RawTrustSignalInput,
  NormalizedTrustSignal,
  UnifiedTrustAuthority,
  TrustRuntimeEvaluation,
  TrustRuntimeRecord,
  TrustRuntimeHistoryEntry,
  TrustRuntimeReport,
  TrustRuntimeInput,
  TrustRuntimeResult,
  TrustRuntimeRuntimeReport,
} from './trust-runtime-types.js';

export {
  registerTrustSource,
  getTrustSource,
  listTrustSources,
  getTrustSourceCount,
  isKnownTrustSource,
  resetTrustSourceRegistryForTests,
} from './trust-source-registry.js';

export {
  normalizeTrustSignal,
  normalizeTrustSignals,
  getNormalizationCount,
  listKnownTrustSourceIds,
  resetTrustSignalNormalizerForTests,
} from './trust-signal-normalizer.js';

export {
  computeAggregateTrustLevel,
  computeAggregateRisk,
  computeAggregateConfidence,
  resolveTrustState,
  transitionTrustState,
} from './trust-state-manager.js';

export {
  buildUnifiedTrustAuthority,
  getAuthorityBuildCount,
  resetTrustAuthorityBuilderForTests,
} from './trust-authority-builder.js';

export {
  evaluateTrustRuntime,
  getEvaluationCount,
  resetTrustRuntimeEvaluatorForTests,
} from './trust-runtime-evaluator.js';

export {
  recordTrustRuntimeHistory,
  getTrustRuntimeHistory,
  getTrustRuntimeHistorySize,
  clearTrustRuntimeHistory,
  resetTrustRuntimeHistoryForTests,
} from './trust-runtime-history.js';

export {
  generateTrustRuntimeReport,
  getReportCount,
  resetTrustRuntimeReportingForTests,
} from './trust-runtime-reporting.js';

export {
  registerTrustRuntimeRecord,
  getTrustRuntimeRecord,
  listTrustRuntimeRecords,
  getTrustRuntimeRecordCount,
  resetTrustRuntimeRegistryForTests,
} from './trust-runtime-registry.js';

export { getTrustRuntimeCacheStats, resetTrustRuntimeCacheForTests } from './trust-runtime-cache.js';

export {
  getDevPulseV2UnifiedTrustRuntime,
  registerUnifiedTrustRuntimeWithCentralBrain,
  registerUnifiedTrustRuntimeWithTrustEngine,
  registerUnifiedTrustRuntimeWithAutonomousTesting,
  registerUnifiedTrustRuntimeWithAutonomousFixing,
  registerUnifiedTrustRuntimeWithAutonomousVerification,
  registerUnifiedTrustRuntimeWithCompletionEngine,
  registerUnifiedTrustRuntimeWithVerificationStrategyCore,
  registerUnifiedTrustRuntimeWithVerificationIntelligence,
  registerUnifiedTrustRuntimeWithVerificationIntegration,
  registerUnifiedTrustRuntimeWithMultiProjectVerification,
  registerUnifiedTrustRuntimeWithMultiProjectMonitoring,
  registerUnifiedTrustRuntimeWithSelfEvolutionGovernance,
  registerUnifiedTrustRuntimeWithWorld2,
  registerUnifiedTrustRuntimeWithUvl,
  evaluateUnifiedTrustRuntime,
  getUnifiedTrustRuntimeRuntimeReport,
  resetUnifiedTrustRuntimeForTests,
} from './unified-trust-runtime.js';

export type { UnifiedTrustRuntimeSystemSnapshot } from './unified-trust-runtime.js';

export function resetUnifiedTrustRuntimeModuleForTests(): void {
  resetTrustRuntimeRegistryForTests();
  resetTrustRuntimeCacheForTests();
  resetTrustSourceRegistryForTests();
  resetTrustSignalNormalizerForTests();
  resetTrustAuthorityBuilderForTests();
  resetTrustRuntimeEvaluatorForTests();
  resetTrustRuntimeHistoryForTests();
  resetTrustRuntimeReportingForTests();
  resetUnifiedTrustRuntimeForTests();
  resetSelfEvolutionGovernanceModuleForTests();
}
