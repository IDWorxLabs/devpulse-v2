/**
 * Chat Intelligence Reality Authority — read-only evaluation of chat response quality.
 */

import { createHash } from 'node:crypto';
import { processBrainRequest } from '../command-center-brain/index.js';
import {
  assessChatCognitiveArchitecture,
  resetChatCognitiveSelfEvolutionForTests,
} from '../chat-cognitive-architecture/index.js';
import {
  CHAT_INTELLIGENCE_CACHE_KEY_PREFIX,
  CHAT_INTELLIGENCE_LAUNCH_BLOCK_SCORE,
  CHAT_INTELLIGENCE_LAUNCH_PASS_SCORE,
  CHAT_INTELLIGENCE_PROOF_NOTES,
  MAX_CHAT_INTELLIGENCE_SCENARIOS,
} from './chat-intelligence-reality-bounds.js';
import { CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD } from '../chat-cognitive-architecture/chat-cognitive-registry.js';
import { evaluateChatIntelligenceScenario } from './chat-intelligence-analyzers.js';
import { CHAT_INTELLIGENCE_SCENARIOS } from './chat-intelligence-scenarios.js';
import { evaluateChatSelfEvolutionTrigger } from './chat-self-evolution-trigger.js';
import {
  getOperationalEvidenceSnapshot,
  resetOperationalEvidenceSnapshotCacheForTests,
  resolveOperationalSelfKnowledgeChatResponse,
} from '../chat-operational-self-knowledge/index.js';
import type { OperationalEvidenceSnapshot } from '../chat-operational-self-knowledge/chat-operational-self-knowledge-types.js';
import type {
  AssessChatIntelligenceRealityInput,
  ChatIntelligenceRealityAssessment,
  ChatIntelligenceScenarioResult,
  ChatIntelligenceVisibilityScore,
  ChatLaunchVerdict,
} from './chat-intelligence-reality-types.js';

import { OPERATIONAL_SELF_AWARENESS_STANDARD } from '../chat-operational-self-knowledge/chat-operational-self-knowledge-registry.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function buildCacheKey(results: ChatIntelligenceScenarioResult[]): string {
  const digest = results.map((r) => `${r.id}:${r.passed ? '1' : '0'}:${r.score}`).join('|');
  return `${CHAT_INTELLIGENCE_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

function deriveChatLaunchVerdict(
  score: number,
  blocksLaunchReadiness: boolean,
): ChatLaunchVerdict {
  if (blocksLaunchReadiness) return 'LAUNCH_BLOCKED';
  if (score >= CHAT_INTELLIGENCE_LAUNCH_PASS_SCORE) return 'OPERATIONAL_OK';
  return 'NEEDS_IMPROVEMENT';
}

function buildRequiredFixes(
  failedScenarios: ChatIntelligenceScenarioResult[],
  selfEvolutionPlan: string[],
): string[] {
  const fixes = failedScenarios.flatMap((s) =>
    s.whyFailed.map((reason) => `[${s.prompt}] ${reason}`),
  );
  return [...new Set([...fixes, ...selfEvolutionPlan])].slice(0, 12);
}

export function assessChatIntelligenceReality(
  input: AssessChatIntelligenceRealityInput = {},
): ChatIntelligenceRealityAssessment {
  const deadlineMs = input.deadlineMs ?? 20_000;
  const rootDir = input.rootDir ?? process.cwd();
  const start = Date.now();
  const scenarioResults: ChatIntelligenceScenarioResult[] = [];

  resetOperationalEvidenceSnapshotCacheForTests();
  const operationalSnapshot: OperationalEvidenceSnapshot = input.operationalEvidenceSnapshot ??
    getOperationalEvidenceSnapshot(rootDir);

  const responseProvider =
    input.responseProvider ??
    ((prompt: string) => {
      const brain = processBrainRequest({ message: prompt, timestamp: Date.now() });
      return resolveOperationalSelfKnowledgeChatResponse({
        message: prompt,
        draftResponse: brain.brainResponse,
        rootDir,
        snapshot: operationalSnapshot,
      });
    });

  resetChatCognitiveSelfEvolutionForTests();

  for (const scenario of CHAT_INTELLIGENCE_SCENARIOS.slice(0, MAX_CHAT_INTELLIGENCE_SCENARIOS)) {
    if (Date.now() - start > deadlineMs) break;

    let response = '';
    try {
      response = responseProvider(scenario.prompt);
    } catch {
      response = '';
    }

    const evaluation = evaluateChatIntelligenceScenario(scenario, response);
    scenarioResults.push({
      id: scenario.id,
      prompt: scenario.prompt,
      passed: evaluation.passed,
      score: evaluation.score,
      criteria: evaluation.criteria,
      failureCategories: evaluation.failureCategories,
      whyFailed: evaluation.whyFailed,
      responsePreview: response.slice(0, 240) + (response.length > 240 ? '…' : ''),
    });
  }

  const cognitiveArchitecture = assessChatCognitiveArchitecture({
    responseProvider,
  });

  const failedScenarios = scenarioResults.filter((s) => !s.passed);
  const chatIntelligenceScore =
    scenarioResults.length > 0
      ? clamp(scenarioResults.reduce((sum, s) => sum + s.score, 0) / scenarioResults.length)
      : 0;

  const criticalFailures = failedScenarios.filter((s) => {
    const def = CHAT_INTELLIGENCE_SCENARIOS.find((d) => d.id === s.id);
    return def?.criticalForLaunch === true;
  });

  const selfEvolution = evaluateChatSelfEvolutionTrigger(failedScenarios);
  const selfEvolutionFixes = selfEvolution.improvementPlan.map(
    (step) => `[${step.missingCapability}] ${step.action}`,
  );

  const cognitiveUnreliable =
    cognitiveArchitecture.cognitiveScore < CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD;

  const blocksLaunchReadiness =
    chatIntelligenceScore < CHAT_INTELLIGENCE_LAUNCH_BLOCK_SCORE ||
    criticalFailures.length > 0 ||
    failedScenarios.length >= 4 ||
    selfEvolution.launchBlocked ||
    cognitiveUnreliable;

  const chatLaunchVerdict = deriveChatLaunchVerdict(chatIntelligenceScore, blocksLaunchReadiness);
  const cognitiveFixes = cognitiveArchitecture.founderTestingMessage
    ? [cognitiveArchitecture.founderTestingMessage]
    : cognitiveArchitecture.selfEvolutionRequired
      ? [cognitiveArchitecture.selfEvolutionReason ?? 'Chat cognitive architecture requires evolution']
      : [];
  const requiredFixesBeforeLaunch = buildRequiredFixes(failedScenarios, [
    ...selfEvolutionFixes,
    ...cognitiveFixes,
  ]);

  return {
    readOnly: true,
    chatIntelligenceScore,
    chatLaunchVerdict,
    blocksLaunchReadiness,
    scenariosRun: scenarioResults.length,
    scenariosPassed: scenarioResults.filter((s) => s.passed).length,
    failedScenarios,
    scenarioResults,
    requiredFixesBeforeLaunch,
    founderProofNotes: CHAT_INTELLIGENCE_PROOF_NOTES,
    selfEvolution,
    operationalSelfAwarenessStandard: OPERATIONAL_SELF_AWARENESS_STANDARD,
    operationalEvidenceSnapshot: operationalSnapshot,
    cognitiveArchitecture,
    cacheKey: buildCacheKey(scenarioResults),
  };
}

export function evaluateChatIntelligenceVisibility(
  assessment: ChatIntelligenceRealityAssessment,
): ChatIntelligenceVisibilityScore {
  return {
    score: assessment.chatIntelligenceScore,
    chatLaunchVerdict: assessment.chatLaunchVerdict,
    blocksLaunchReadiness: assessment.blocksLaunchReadiness,
    scenariosPassed: assessment.scenariosPassed,
    scenariosRun: assessment.scenariosRun,
    failedScenarioCount: assessment.failedScenarios.length,
    requiredFixesBeforeLaunch: assessment.requiredFixesBeforeLaunch,
    selfEvolutionTriggered: assessment.selfEvolution.triggered,
  };
}
