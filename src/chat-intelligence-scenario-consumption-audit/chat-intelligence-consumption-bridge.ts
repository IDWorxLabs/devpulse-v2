/**
 * Phase 26.95 — Chat intelligence consumption bridge (registration → Founder Test).
 */

import { assessChatCapabilityAnswerQuality } from '../chat-capability-answer-quality/chat-capability-answer-quality-authority.js';
import {
  CHAT_CAPABILITY_ANSWER_QUALITY_PASS,
  CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE,
} from '../chat-capability-answer-quality/chat-capability-answer-quality-registry.js';
import type { ChatCapabilityAnswerQualityAssessment } from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import { buildOperationalEvidenceSnapshot } from '../chat-operational-self-knowledge/operational-evidence-snapshot.js';
import {
  CHAT_INTELLIGENCE_LAUNCH_BLOCK_SCORE,
  CHAT_INTELLIGENCE_LAUNCH_PASS_SCORE,
} from '../chat-intelligence-reality/chat-intelligence-reality-bounds.js';
import type {
  ChatIntelligenceRealityAssessment,
  ChatIntelligenceScenarioResult,
  ChatLaunchVerdict,
  ChatSelfEvolutionImprovementStep,
} from '../chat-intelligence-reality/chat-intelligence-reality-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { DeriveChatIntelligenceFromSourcesInput } from './chat-intelligence-scenario-consumption-types.js';

function mapStressImprovementPlan(recommendations: string[]): ChatSelfEvolutionImprovementStep[] {
  return recommendations.map((action) => ({
    priority: 'MEDIUM' as const,
    missingCapability: 'RESPONSE_POLICY' as const,
    action,
    rationale: 'Derived from chat stress simulation bridge evidence',
  }));
}

function deriveChatLaunchVerdict(score: number, blocksLaunchReadiness: boolean): ChatLaunchVerdict {
  if (blocksLaunchReadiness) return 'LAUNCH_BLOCKED';
  if (score >= CHAT_INTELLIGENCE_LAUNCH_PASS_SCORE) return 'OPERATIONAL_OK';
  return 'NEEDS_IMPROVEMENT';
}

export function deriveChatIntelligenceFromChatStress(
  chatStress: ChatStressSimulationReport | null,
): ChatIntelligenceRealityAssessment {
  if (!chatStress) {
    return emptyChatIntelligenceAssessment('launch-bridge-no-chat-stress');
  }

  const scenariosRun = chatStress.scenariosExecuted || chatStress.totalScenarios;
  const scenariosPassed = chatStress.passedCount;
  return {
    readOnly: true,
    chatIntelligenceScore: chatStress.overallScore,
    chatLaunchVerdict: chatStress.chatBlocksLaunchReadiness ? 'LAUNCH_BLOCKED' : 'OPERATIONAL_OK',
    blocksLaunchReadiness: chatStress.chatBlocksLaunchReadiness,
    scenariosRun,
    scenariosPassed,
    failedScenarios: [],
    scenarioResults: [],
    requiredFixesBeforeLaunch: chatStress.recommendedNextChatImprovements,
    founderProofNotes: [],
    selfEvolution: {
      triggered: chatStress.selfEvolutionRequired,
      repeatedCategory: null,
      failureCountInCategory: 0,
      stopRepeatingFixPath: false,
      missingCapabilities: [],
      improvementPlan: mapStressImprovementPlan(chatStress.recommendedNextChatImprovements),
      launchBlocked: chatStress.chatBlocksLaunchReadiness,
      advisoryOnly: true,
    },
    operationalSelfAwarenessStandard: 'derived-from-chat-stress-simulation',
    operationalEvidenceSnapshot: { readOnly: true, generatedAt: new Date().toISOString(), entries: [] } as never,
    cognitiveArchitecture: { readOnly: true, cognitiveScore: chatStress.overallScore, dimensions: [] } as never,
    cacheKey: `launch-bridge-chat-stress-${chatStress.runId}`,
  };
}

function emptyChatIntelligenceAssessment(cacheKey: string): ChatIntelligenceRealityAssessment {
  return {
    readOnly: true,
    chatIntelligenceScore: 0,
    chatLaunchVerdict: 'NEEDS_IMPROVEMENT',
    blocksLaunchReadiness: false,
    scenariosRun: 0,
    scenariosPassed: 0,
    failedScenarios: [],
    scenarioResults: [],
    requiredFixesBeforeLaunch: [],
    founderProofNotes: [],
    selfEvolution: {
      triggered: false,
      repeatedCategory: null,
      failureCountInCategory: 0,
      stopRepeatingFixPath: false,
      missingCapabilities: [],
      improvementPlan: [],
      launchBlocked: false,
      advisoryOnly: true,
    },
    operationalSelfAwarenessStandard: 'derived-from-launch-readiness-bridge',
    operationalEvidenceSnapshot: { readOnly: true, generatedAt: new Date().toISOString(), entries: [] } as never,
    cognitiveArchitecture: { readOnly: true, cognitiveScore: 0, dimensions: [] } as never,
    cacheKey,
  };
}

export function deriveChatIntelligenceFromCapabilityAnswerQuality(
  assessment: ChatCapabilityAnswerQualityAssessment,
): ChatIntelligenceRealityAssessment {
  const audits = assessment.report.audits;
  const scenariosRun = audits.length;
  const scenariosPassed = audits.filter((a) => a.passed).length;
  const score = assessment.report.averageScore;
  const blocksLaunch =
    score < CHAT_INTELLIGENCE_LAUNCH_BLOCK_SCORE ||
    !assessment.report.allScenariosPassed;

  const scenarioResults: ChatIntelligenceScenarioResult[] = audits.map((audit) => ({
    id: audit.scenarioId,
    prompt: audit.prompt,
    passed: audit.passed,
    score: audit.scores.overallCapabilityAnswerScore,
    criteria: {
      answered_question: audit.scores.completeness >= 70,
      avoided_generic_onboarding: audit.scores.identityClarity >= 70,
      purpose_awareness: audit.scores.capabilityAccuracy >= 70,
      honesty: audit.scores.honesty >= 85,
      useful_next_step: audit.scores.usefulness >= 70,
      no_fake_claims: audit.honestyViolations.length === 0,
      self_diagnosis_present: audit.scores.boundaryAwareness >= 70,
      launch_readiness_signal: audit.passed,
    },
    failureCategories: [],
    whyFailed: audit.failureClass ? [audit.failureClass] : [],
    responsePreview: audit.answer.slice(0, 240),
  }));

  const failedScenarios = scenarioResults.filter((s) => !s.passed);

  return {
    readOnly: true,
    chatIntelligenceScore: score,
    chatLaunchVerdict: deriveChatLaunchVerdict(score, blocksLaunch),
    blocksLaunchReadiness: blocksLaunch,
    scenariosRun,
    scenariosPassed,
    failedScenarios,
    scenarioResults,
    requiredFixesBeforeLaunch: failedScenarios.flatMap((s) => s.whyFailed),
    founderProofNotes: [
      `Capability answer quality consumed by Founder Test (${assessment.report.passToken ?? 'no-pass-token'})`,
      `${scenariosPassed}/${scenariosRun} capability scenarios passed at average ${score}/100`,
    ],
    selfEvolution: {
      triggered: failedScenarios.length >= 2,
      repeatedCategory: null,
      failureCountInCategory: failedScenarios.length,
      stopRepeatingFixPath: false,
      missingCapabilities: [],
      improvementPlan: failedScenarios.map((s) => ({
        priority: 'HIGH' as const,
        missingCapability: 'RESPONSE_POLICY' as const,
        action: `Repair capability answer for "${s.prompt}"`,
        rationale: s.whyFailed.join('; ') || 'Below target score',
      })),
      launchBlocked: blocksLaunch,
      advisoryOnly: true,
    },
    operationalSelfAwarenessStandard: 'derived-from-capability-answer-quality',
    operationalEvidenceSnapshot: { readOnly: true, generatedAt: new Date().toISOString(), entries: [] } as never,
    cognitiveArchitecture: { readOnly: true, cognitiveScore: score, dimensions: [] } as never,
    cacheKey: `launch-bridge-capability-quality-${assessment.report.qualityId}`,
  };
}

export function deriveChatIntelligenceFromRegisteredSources(
  input: DeriveChatIntelligenceFromSourcesInput,
): ChatIntelligenceRealityAssessment {
  const explicit = input.chatIntelligenceReality;
  if (explicit && explicit.scenariosRun > 0 && explicit.chatIntelligenceScore > 0) {
    return explicit;
  }

  const chatStress = input.chatStressSimulation ?? null;
  if (chatStress && (chatStress.scenariosExecuted > 0 || chatStress.evaluations.length > 0)) {
    return deriveChatIntelligenceFromChatStress(chatStress);
  }

  const capability =
    input.chatCapabilityAnswerQuality ??
    (input.rootDir
      ? assessChatCapabilityAnswerQuality({
          rootDir: input.rootDir,
          snapshot: buildOperationalEvidenceSnapshot({ rootDir: input.rootDir, skipHeavyAuthorities: true }),
          skipHistoryRecording: true,
        })
      : null);

  if (capability && capability.report.audits.length > 0) {
    const derived = deriveChatIntelligenceFromCapabilityAnswerQuality(capability);
    if (
      derived.chatIntelligenceScore >= CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE ||
      capability.report.passToken === CHAT_CAPABILITY_ANSWER_QUALITY_PASS
    ) {
      return derived;
    }
    if (!explicit || explicit.scenariosRun === 0) {
      return derived;
    }
  }

  if (explicit) {
    return explicit;
  }

  return deriveChatIntelligenceFromChatStress(chatStress);
}

export function reconcileChatIntelligenceForFounderTest(
  input: DeriveChatIntelligenceFromSourcesInput,
): ChatIntelligenceRealityAssessment {
  return deriveChatIntelligenceFromRegisteredSources(input);
}

export function detectChatIntelligenceConsumptionContradiction(input: {
  derived: ChatIntelligenceRealityAssessment;
  capabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
  chatStressSimulation?: ChatStressSimulationReport | null;
}): { contradictionDetected: boolean; detail: string | null } {
  const capabilityPass =
    input.capabilityAnswerQuality?.report.passToken === CHAT_CAPABILITY_ANSWER_QUALITY_PASS;
  const capabilityScore = input.capabilityAnswerQuality?.report.averageScore ?? null;
  const stressScore = input.chatStressSimulation?.overallScore ?? null;

  if (
    capabilityPass &&
    capabilityScore !== null &&
    capabilityScore >= CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE &&
    input.derived.scenariosRun === 0
  ) {
    return {
      contradictionDetected: true,
      detail: `CHAT_CAPABILITY_ANSWER_QUALITY_PASS at ${capabilityScore}/100 but Founder Test shows 0/${input.derived.scenariosRun} scenarios`,
    };
  }

  if (
    capabilityScore !== null &&
    capabilityScore >= CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE &&
    input.derived.chatIntelligenceScore === 0 &&
    (input.capabilityAnswerQuality?.report.audits.length ?? 0) > 0
  ) {
    return {
      contradictionDetected: true,
      detail: `Capability answer quality average ${capabilityScore}/100 but Chat Intelligence score is 0`,
    };
  }

  if (
    stressScore !== null &&
    stressScore >= CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE &&
    input.derived.chatIntelligenceScore === 0 &&
    (input.chatStressSimulation?.scenariosExecuted ?? 0) > 0
  ) {
    return {
      contradictionDetected: true,
      detail: `Chat stress score ${stressScore}/100 with executed scenarios but Chat Intelligence score is 0`,
    };
  }

  return { contradictionDetected: false, detail: null };
}
