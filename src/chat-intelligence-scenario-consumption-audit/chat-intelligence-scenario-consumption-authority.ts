/**
 * Phase 26.95 — Chat Intelligence Scenario Consumption authority (V1).
 * Read-only. No nested validators.
 */

import { createHash } from 'node:crypto';
import { assessChatCapabilityAnswerQuality } from '../chat-capability-answer-quality/chat-capability-answer-quality-authority.js';
import { CHAT_CAPABILITY_ANSWER_QUALITY_PASS } from '../chat-capability-answer-quality/chat-capability-answer-quality-registry.js';
import { buildOperationalEvidenceSnapshot } from '../chat-operational-self-knowledge/operational-evidence-snapshot.js';
import {
  detectChatIntelligenceConsumptionContradiction,
  deriveChatIntelligenceFromRegisteredSources,
} from './chat-intelligence-consumption-bridge.js';
import {
  CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CACHE_KEY_PREFIX,
  CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CORE_QUESTION,
  CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS,
} from './chat-intelligence-scenario-consumption-registry.js';
import {
  recordChatIntelligenceScenarioConsumptionReport,
  resetChatIntelligenceScenarioConsumptionHistoryForTests,
} from './chat-intelligence-scenario-consumption-history.js';
import { auditScenarioDiscovery, countDiscoveredScenarios } from './scenario-discovery-auditor.js';
import { auditScenarioExecution, countExecutedScenarios } from './scenario-execution-auditor.js';
import { auditScenarioRegistration, countRegisteredScenarios } from './scenario-registration-auditor.js';
import { auditScenarioResultCapture, countResultCapturedScenarios } from './scenario-result-capture-auditor.js';
import {
  auditScenarioScorePropagation,
  auditScenarioScoring,
  countPropagatedScenarios,
  countScoredScenarios,
} from './scenario-score-propagation-auditor.js';
import { auditScenarioSelection, countSelectedScenarios } from './scenario-selection-auditor.js';
import type {
  AssessChatIntelligenceScenarioConsumptionInput,
  ChatIntelligenceScenarioConsumptionAssessment,
  ChatIntelligenceScenarioConsumptionReport,
} from './chat-intelligence-scenario-consumption-types.js';

let auditCounter = 0;

export function resetChatIntelligenceScenarioConsumptionCounterForTests(): void {
  auditCounter = 0;
}

export function resetChatIntelligenceScenarioConsumptionModuleForTests(): void {
  resetChatIntelligenceScenarioConsumptionCounterForTests();
  resetChatIntelligenceScenarioConsumptionHistoryForTests();
}

function nextAuditId(): string {
  auditCounter += 1;
  return `chat-intelligence-scenario-consumption-${auditCounter}-${Date.now()}`;
}

function stableCacheKey(auditId: string, score: number, run: number): string {
  const digest = createHash('sha256')
    .update([CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS, auditId, String(score), String(run)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CACHE_KEY_PREFIX}:${digest}`;
}

function issuePassToken(input: {
  contradictionDetected: boolean;
  founderTestConsumed: boolean;
  executedScenarioCount: number;
  scoredScenarioCount: number;
  chatIntelligenceScore: number;
  scenariosRun: number;
  capabilityAnswerQualityPass: boolean;
}): string | null {
  if (input.contradictionDetected) return null;
  if (input.scenariosRun === 0 && input.executedScenarioCount > 0) return null;
  if (input.executedScenarioCount > 0 && input.scenariosRun === 0) return null;
  if (input.capabilityAnswerQualityPass && input.scenariosRun === 0) return null;
  if (!input.founderTestConsumed && input.executedScenarioCount > 0) return null;
  if (input.executedScenarioCount > 0 && input.scoredScenarioCount === 0) return null;
  if (input.executedScenarioCount > 0 && input.chatIntelligenceScore === 0) return null;
  return CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS;
}

export function assessChatIntelligenceScenarioConsumption(
  input: AssessChatIntelligenceScenarioConsumptionInput = {},
): ChatIntelligenceScenarioConsumptionAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const auditId = nextAuditId();
  const generatedAt = new Date().toISOString();

  const capabilityAnswerQuality =
    input.chatCapabilityAnswerQuality ??
    assessChatCapabilityAnswerQuality({
      rootDir,
      snapshot: buildOperationalEvidenceSnapshot({ rootDir, skipHeavyAuthorities: true }),
      skipHistoryRecording: true,
    });

  const derivedChatIntelligence = deriveChatIntelligenceFromRegisteredSources({
    rootDir,
    chatStressSimulation: input.chatStressSimulation ?? null,
    chatCapabilityAnswerQuality: capabilityAnswerQuality,
    chatIntelligenceReality: input.chatIntelligenceReality ?? null,
  });

  const { registeredIds, traces: registrationTraces } = auditScenarioRegistration();
  let traces = auditScenarioDiscovery(registrationTraces);
  traces = auditScenarioSelection(traces, {
    capabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation ?? null,
  });
  traces = auditScenarioExecution(traces, {
    capabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation ?? null,
  });
  traces = auditScenarioResultCapture(traces, {
    capabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation ?? null,
  });
  traces = auditScenarioScoring(traces, {
    capabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation ?? null,
  });
  traces = auditScenarioScorePropagation(traces, derivedChatIntelligence, {
    capabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation ?? null,
  });

  const contradiction = detectChatIntelligenceConsumptionContradiction({
    derived: derivedChatIntelligence,
    capabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation ?? null,
  });

  const capabilityAnswerQualityPass =
    capabilityAnswerQuality.report.passToken === CHAT_CAPABILITY_ANSWER_QUALITY_PASS;
  const founderTestConsumed =
    derivedChatIntelligence.scenariosRun > 0 && derivedChatIntelligence.chatIntelligenceScore > 0;

  const report: ChatIntelligenceScenarioConsumptionReport = {
    readOnly: true,
    auditId,
    generatedAt,
    coreQuestion: CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_CORE_QUESTION,
    traces,
    registeredScenarioCount: registeredIds.length || countRegisteredScenarios(),
    discoveredScenarioCount: countDiscoveredScenarios(traces),
    executedScenarioCount: countExecutedScenarios(traces),
    scoredScenarioCount: countScoredScenarios(traces),
    propagatedScenarioCount: countPropagatedScenarios(traces),
    founderTestConsumed,
    chatIntelligenceScore: derivedChatIntelligence.chatIntelligenceScore,
    scenariosRun: derivedChatIntelligence.scenariosRun,
    scenariosPassed: derivedChatIntelligence.scenariosPassed,
    capabilityAnswerQualityPass,
    capabilityAnswerQualityScore: capabilityAnswerQuality.report.averageScore,
    chatStressAvailable: Boolean(input.chatStressSimulation),
    chatStressScore: input.chatStressSimulation?.overallScore ?? null,
    contradictionDetected: contradiction.contradictionDetected,
    contradictionDetail: contradiction.detail,
    passToken: issuePassToken({
      contradictionDetected: contradiction.contradictionDetected,
      founderTestConsumed,
      executedScenarioCount: countExecutedScenarios(traces),
      scoredScenarioCount: countScoredScenarios(traces),
      chatIntelligenceScore: derivedChatIntelligence.chatIntelligenceScore,
      scenariosRun: derivedChatIntelligence.scenariosRun,
      capabilityAnswerQualityPass,
    }),
  };

  if (!input.skipHistoryRecording) {
    recordChatIntelligenceScenarioConsumptionReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_COMPLETE',
    report,
    derivedChatIntelligence,
    cacheKey: stableCacheKey(
      auditId,
      derivedChatIntelligence.chatIntelligenceScore,
      derivedChatIntelligence.scenariosRun,
    ),
  };
}

export function applyChatIntelligenceScenarioConsumptionSync(input: {
  rootDir?: string;
  chatStressSimulation?: AssessChatIntelligenceScenarioConsumptionInput['chatStressSimulation'];
  chatCapabilityAnswerQuality?: AssessChatIntelligenceScenarioConsumptionInput['chatCapabilityAnswerQuality'];
  chatIntelligenceReality?: AssessChatIntelligenceScenarioConsumptionInput['chatIntelligenceReality'];
  skipHistoryRecording?: boolean;
}): ChatIntelligenceScenarioConsumptionAssessment {
  return assessChatIntelligenceScenarioConsumption({
    rootDir: input.rootDir,
    chatStressSimulation: input.chatStressSimulation,
    chatCapabilityAnswerQuality: input.chatCapabilityAnswerQuality,
    chatIntelligenceReality: input.chatIntelligenceReality,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });
}
