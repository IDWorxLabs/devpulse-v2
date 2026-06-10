/**
 * Performance Hardening — orchestration and read-only integrations.
 * Hardens DevPulse performance visibility. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listPerformanceHardeningUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2UnifiedVerificationLabRuntime } from '../unified-verification-lab/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2ReliabilityHardening } from '../reliability-hardening/index.js';
import { EXECUTION_PASS_TOKEN } from '../execution-authority/index.js';
import { DevPulseV2TimelineIntelligence } from '../timeline-intelligence/index.js';
import { getDevPulseV2OperatorFeed } from '../operator-feed/index.js';
import { getDevPulseV2FounderInboxFoundation } from '../founder-inbox/index.js';
import { getDevPulseV2NotificationDeliveryFoundation } from '../notification-delivery/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { getDevPulseV2MobileCommandRuntimeFoundation } from '../mobile-command-runtime/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import type {
  PerformanceHardeningInput,
  PerformanceHardeningRecord,
  PerformanceHardeningResult,
  PerformanceHardeningRuntimeReport,
} from './performance-hardening-types.js';
import {
  PERFORMANCE_HARDENING_OWNER_MODULE,
  PERFORMANCE_HARDENING_PASS_TOKEN,
} from './performance-hardening-types.js';
import { analyzeStartupPerformance, getStartupAnalysisCount } from './startup-performance-analyzer.js';
import { analyzeValidationPerformance, getValidationAnalysisCount } from './validation-performance-analyzer.js';
import { analyzeCacheEfficiency, getCacheAnalysisCount } from './cache-efficiency-analyzer.js';
import { analyzeUiResponsiveness, getResponsivenessAnalysisCount } from './ui-responsiveness-analyzer.js';
import { detectPerformanceBottlenecks, getBottleneckDetectionCount } from './performance-bottleneck-detector.js';
import { buildUnifiedPerformanceHardeningAuthority, getAuthorityBuildCount } from './performance-authority-builder.js';
import { evaluatePerformanceHardening, getEvaluationCount } from './performance-hardening-evaluator.js';
import {
  registerPerformanceHardeningRecord,
  getPerformanceHardeningRecordCount,
} from './performance-hardening-registry.js';
import { recordPerformanceHardeningHistory } from './performance-hardening-history.js';
import { generatePerformanceHardeningReport } from './performance-hardening-reporting.js';
import { getPerformanceHardeningCacheStats } from './performance-hardening-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';
const MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN = 'MOBILE_VALIDATION_RUNTIME_OPTIMIZER_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface PerformanceHardeningSystemSnapshot {
  centralBrainSystems: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  unifiedTrustScoreToken: string;
  trustEngineCheckpointToken: string;
  uvlRuntimeToken: string;
  reliabilityHardeningToken: string;
  executionAuthorityToken: string;
  timelineIntelligenceToken: string;
  mobileValidationOptimizerToken: string;
  operatorFeedToken: string;
  founderInboxToken: string;
  notificationDeliveryToken: string;
  world2Token: string;
  mobileCommandToken: string;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  registeredAt: number;
}

let cachedSnapshot: PerformanceHardeningSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

function countValidationScripts(): number {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts?: Record<string, string> };
    return Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')).length;
  } catch {
    return 0;
  }
}

function enrichInput(input: PerformanceHardeningInput, snapshot: PerformanceHardeningSystemSnapshot): PerformanceHardeningInput {
  return {
    ...input,
    bootReadiness: input.bootReadiness ?? (snapshot.centralBrainSystems >= 0 ? 80 : 40),
    bootstrapWeight: input.bootstrapWeight ?? 30,
    firstVisibleDelayMs: input.firstVisibleDelayMs ?? 1200,
    firstClickableDelayMs: input.firstClickableDelayMs ?? 2000,
    chatUsableDelayMs: input.chatUsableDelayMs ?? 3000,
    mobileStartupPressure: input.mobileStartupPressure ?? false,
    missingTimeoutGuard: input.missingTimeoutGuard ?? false,
    missingProgressLogging: input.missingProgressLogging ?? false,
    missingSlowGroupReporting: input.missingSlowGroupReporting ?? false,
    missingEvictionTracking: input.missingEvictionTracking ?? false,
    missingHitMissTracking: input.missingHitMissTracking ?? false,
    reliabilityScore: input.reliabilityScore ?? 78,
    governanceBlocked: input.governanceBlocked ?? false,
  };
}

export function getDevPulseV2PerformanceHardening(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: PERFORMANCE_HARDENING_OWNER_MODULE,
    passToken: PERFORMANCE_HARDENING_PASS_TOKEN,
    phase: 23.2,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerPerformanceHardeningWithCentralBrain(): PerformanceHardeningSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    validationScripts: countValidationScripts(),
    unifiedTrustScoreToken: getDevPulseV2UnifiedTrustScore().passToken,
    trustEngineCheckpointToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN,
    uvlRuntimeToken: getDevPulseV2UnifiedVerificationLabRuntime().passToken,
    reliabilityHardeningToken: getDevPulseV2ReliabilityHardening().passToken,
    executionAuthorityToken: EXECUTION_PASS_TOKEN,
    timelineIntelligenceToken: DevPulseV2TimelineIntelligence.passToken,
    mobileValidationOptimizerToken: MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN,
    operatorFeedToken: getDevPulseV2OperatorFeed().passToken,
    founderInboxToken: getDevPulseV2FounderInboxFoundation().passToken,
    notificationDeliveryToken: getDevPulseV2NotificationDeliveryFoundation().passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    mobileCommandToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerPerformanceHardeningWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerPerformanceHardeningWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerPerformanceHardeningWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerPerformanceHardeningWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listPerformanceHardeningUvlRows().length, readOnly: true };
}

export function registerPerformanceHardeningWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerPerformanceHardeningWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerPerformanceHardeningWithUnifiedVerificationLab(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedVerificationLabRuntime().passToken, readOnly: true };
}

export function registerPerformanceHardeningWithReliabilityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ReliabilityHardening().passToken, readOnly: true };
}

export function registerPerformanceHardeningWithExecutionAuthority(): { passToken: string; readOnly: true } {
  return { passToken: EXECUTION_PASS_TOKEN, readOnly: true };
}

export function registerPerformanceHardeningWithTimelineIntelligence(): { passToken: string; readOnly: true } {
  return { passToken: DevPulseV2TimelineIntelligence.passToken, readOnly: true };
}

export function registerPerformanceHardeningWithMobileValidationOptimizer(): { passToken: string; readOnly: true } {
  return { passToken: MOBILE_VALIDATION_RUNTIME_OPTIMIZER_PASS_TOKEN, readOnly: true };
}

export function registerPerformanceHardeningWithOperatorFeed(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2OperatorFeed().passToken, readOnly: true };
}

export function registerPerformanceHardeningWithNotificationVault(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderInboxFoundation().passToken, readOnly: true };
}

export function registerPerformanceHardeningWithNotificationDelivery(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2NotificationDeliveryFoundation().passToken, readOnly: true };
}

export function registerPerformanceHardeningWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerPerformanceHardeningWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerPerformanceHardeningWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerPerformanceHardeningWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function evaluatePerformanceHardeningEngine(input: PerformanceHardeningInput): PerformanceHardeningResult {
  const snapshot = registerPerformanceHardeningWithCentralBrain();
  const enriched = enrichInput(input, snapshot);

  const startup = analyzeStartupPerformance(enriched);
  const validation = analyzeValidationPerformance(enriched);
  const cache = analyzeCacheEfficiency(enriched);
  const responsiveness = analyzeUiResponsiveness(enriched);
  const bottlenecks = detectPerformanceBottlenecks(enriched, startup, validation, cache, responsiveness);
  const authority = buildUnifiedPerformanceHardeningAuthority(
    input.requestId,
    startup,
    validation,
    cache,
    responsiveness,
    bottlenecks,
    enriched,
  );
  const evaluation = evaluatePerformanceHardening(authority);

  recordCounter += 1;
  const record: PerformanceHardeningRecord = {
    performanceId: `performance-hardening-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    riskLevel: evaluation.riskLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    performanceScore: evaluation.performanceScore,
    startupScore: evaluation.startupScore,
    validationScore: evaluation.validationScore,
    responsivenessScore: evaluation.responsivenessScore,
    generatedAt: Date.now(),
  };

  registerPerformanceHardeningRecord(record);
  recordPerformanceHardeningHistory(record);

  const missingSignals = [
    ...startup.missingSignals,
    ...validation.missingSignals,
  ];

  const report = generatePerformanceHardeningReport(
    record,
    evaluation,
    cache.cacheEfficiencyScore,
    bottlenecks.bottlenecks,
    validation.slowGroups,
    missingSignals,
  );

  return { record, report };
}

export function getPerformanceHardeningRuntimeReport(): PerformanceHardeningRuntimeReport {
  const cache = getPerformanceHardeningCacheStats();
  return {
    startupAnalysisCount: getStartupAnalysisCount(),
    validationAnalysisCount: getValidationAnalysisCount(),
    cacheAnalysisCount: getCacheAnalysisCount(),
    responsivenessAnalysisCount: getResponsivenessAnalysisCount(),
    bottleneckDetectionCount: getBottleneckDetectionCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getPerformanceHardeningRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetPerformanceHardeningOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
