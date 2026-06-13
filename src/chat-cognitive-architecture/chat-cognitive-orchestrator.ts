/**
 * Phase 25.37 — Chat Cognitive Architecture orchestrator.
 */

import { classifyChatCognitiveIntent } from './chat-cognitive-intent-understanding.js';
import {
  hasSelfDirectedSignals,
  looksLikeProjectStatusAnswer,
  type IntentSource,
} from './chat-intent-reconciliation.js';
import { buildChatSelfModel } from './chat-self-model.js';
import { buildChatProjectRealityContext } from './chat-project-reality-context.js';
import { assessChatCapabilityBoundaries } from './chat-capability-boundary-checker.js';
import { reasonAboutSoftwareCreation } from './software-creation-reasoner.js';
import { runOperationalSelfDiagnosis } from './operational-self-diagnosis-engine.js';
import { buildChatReasoningPlan, composeResponseFromPlan } from './chat-response-planner.js';
import { repairChatAnswer, reviewChatAnswerQuality } from './chat-answer-quality-reviewer.js';
import { isGenericOnboardingBlocked, containsGenericOnboarding } from './generic-fallback-guard.js';
import {
  evaluateSelfEvolutionRequired,
  recordCognitiveFailure,
} from './chat-cognitive-self-evolution.js';
import { CHAT_COGNITIVE_SCENARIOS } from './chat-cognitive-scenarios.js';
import {
  CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD,
  CHAT_COGNITIVE_QUALITY_PASS_THRESHOLD,
  INTENTS_REQUIRING_DIRECT_ANSWER,
} from './chat-cognitive-registry.js';
import type {
  ChatCognitiveArchitectureAssessment,
  ChatCognitiveInput,
  ChatCognitiveResponse,
  ChatCognitiveScenarioResult,
  ChatSelfDiagnosisResult,
  SourceConflictDiagnostics,
} from './chat-cognitive-types.js';
import type { ChatReasoningPlan } from './chat-cognitive-types.js';
import type { SoftwareCreationReasoning } from './software-creation-reasoner.js';
import type { ChatCapabilityBoundary } from './chat-cognitive-types.js';
import type { ChatProjectRealityContext } from './chat-cognitive-types.js';
import type { ChatSelfModel } from './chat-cognitive-types.js';

function shouldOverrideDraft(intent: ChatCognitiveResponse['intent'], draft: string): boolean {
  if (!draft.trim()) return true;
  if (isGenericOnboardingBlocked(intent, draft)) return true;
  return (INTENTS_REQUIRING_DIRECT_ANSWER as readonly string[]).includes(intent);
}

function buildComposedAnswer(input: {
  plan: ChatReasoningPlan;
  selfModel: ChatSelfModel;
  projectContext: ChatProjectRealityContext;
  boundaries: ChatCapabilityBoundary[];
  softwareReasoning: SoftwareCreationReasoning | null;
  diagnosis: ChatSelfDiagnosisResult;
}): string {
  return composeResponseFromPlan(input);
}

export function assessChatCognitiveResponse(input: ChatCognitiveInput): ChatCognitiveResponse {
  return generateChatCognitiveResponse(input);
}

function buildSourceConflict(input: {
  intentSource: IntentSource;
  draftResponse: string;
  finalUsedCompose: boolean;
  intent: ChatCognitiveResponse['intent'];
  message: string;
}): SourceConflictDiagnostics | undefined {
  const projectDraft = looksLikeProjectStatusAnswer(input.draftResponse);
  const selfIntent = [
    'SELF_AWARENESS',
    'IDENTITY',
    'CAPABILITY',
    'LIMITATION',
    'SELF_IMPROVEMENT',
    'HUMAN_QUALITY',
    'CREATOR_OR_ORIGIN',
    'TRUST',
  ].includes(input.intent);

  if (!projectDraft && !input.finalUsedCompose) return undefined;
  if (projectDraft && selfIntent && hasSelfDirectedSignals(input.message)) {
    return {
      readOnly: true,
      selectedSource: 'self-model',
      rejectedSource: 'project-context',
      conflictReason: 'Upstream draft carried project status while prompt was self-directed',
      winningReason: 'Self-model compose path selected via intent preservation',
      intentSource: input.intentSource,
    };
  }
  if (input.finalUsedCompose) {
    return {
      readOnly: true,
      selectedSource: 'composed',
      rejectedSource: containsGenericOnboarding(input.draftResponse) ? 'brain-draft-onboarding' : null,
      conflictReason: containsGenericOnboarding(input.draftResponse)
        ? 'Generic onboarding draft rejected'
        : null,
      winningReason: 'Composed self-model answer passed quality review',
      intentSource: input.intentSource,
    };
  }
  return undefined;
}

export function generateChatCognitiveResponse(input: ChatCognitiveInput): ChatCognitiveResponse {
  const message = input.message?.trim() ?? '';
  const rootDir = input.rootDir ?? process.cwd();
  const draftResponse = input.draftResponse ?? '';

  const classification = classifyChatCognitiveIntent(message, {
    resolvedIntentOverride: input.resolvedIntentOverride,
  });
  const intentSource = classification.intentSource ?? 'local-classifier';
  const selfModel = buildChatSelfModel();
  const projectContext = buildChatProjectRealityContext(rootDir);
  const boundaries = assessChatCapabilityBoundaries(rootDir);
  const softwareReasoning = reasonAboutSoftwareCreation(
    message,
    classification.intent,
    projectContext,
  );

  const plan = buildChatReasoningPlan({
    classification,
    selfModel,
    projectContext,
    boundaries,
    softwareReasoning,
  });

  let candidate = draftResponse;
  let usedExistingBrainDraft = Boolean(draftResponse.trim());
  let repaired = false;

  if (shouldOverrideDraft(classification.intent, draftResponse)) {
    const preliminaryDiagnosis = runOperationalSelfDiagnosis({
      message,
      intent: classification.intent,
      draftText: draftResponse,
      selfModel,
      projectContext,
      boundaries,
      intentConfidence: classification.confidence,
    });
    candidate = buildComposedAnswer({
      plan,
      selfModel,
      projectContext,
      boundaries,
      softwareReasoning,
      diagnosis: preliminaryDiagnosis,
    });
    usedExistingBrainDraft = false;
    repaired = true;
  }

  let diagnosis = runOperationalSelfDiagnosis({
    message,
    intent: classification.intent,
    draftText: candidate,
    selfModel,
    projectContext,
    boundaries,
    intentConfidence: classification.confidence,
  });

  let quality = reviewChatAnswerQuality({
    message,
    intent: classification.intent,
    answer: candidate,
    diagnosis,
  });

  if (!quality.passed) {
    const repairedText = buildComposedAnswer({
      plan,
      selfModel,
      projectContext,
      boundaries,
      softwareReasoning,
      diagnosis,
    });
    candidate = repairChatAnswer({
      message,
      intent: classification.intent,
      draft: candidate,
      repaired: repairedText,
      quality,
    });
    repaired = true;
    usedExistingBrainDraft = false;
    diagnosis = runOperationalSelfDiagnosis({
      message,
      intent: classification.intent,
      draftText: candidate,
      selfModel,
      projectContext,
      boundaries,
      intentConfidence: classification.confidence,
    });
    quality = reviewChatAnswerQuality({
      message,
      intent: classification.intent,
      answer: candidate,
      diagnosis,
    });
  }

  if (!quality.passed) {
    recordCognitiveFailure(classification.intent, quality.failureReasons);
  }

  const evolution = evaluateSelfEvolutionRequired(classification.intent, quality.failureReasons);

  const sourceConflict = buildSourceConflict({
    intentSource,
    draftResponse,
    finalUsedCompose: !usedExistingBrainDraft || repaired,
    intent: classification.intent,
    message,
  });

  return {
    readOnly: true,
    finalAnswer: candidate.trim(),
    intent: classification.intent,
    intentConfidence: classification.confidence,
    frame: plan.frame,
    selfDiagnosis: diagnosis,
    quality,
    reasoningPlan: plan,
    usedExistingBrainDraft,
    repaired,
    blockedGenericFallback: isGenericOnboardingBlocked(classification.intent, draftResponse),
    selfEvolutionRequired: evolution.required,
    selfEvolutionReason: evolution.reason,
    sourceConflict,
  };
}

export function assessChatCognitiveArchitecture(
  input: ChatCognitiveInput & {
    responseProvider?: (message: string) => string;
  } = {},
): ChatCognitiveArchitectureAssessment {
  const results: ChatCognitiveScenarioResult[] = [];

  for (const scenario of CHAT_COGNITIVE_SCENARIOS) {
    const draft = input.responseProvider ? input.responseProvider(scenario.prompt) : '';
    const cognitive = generateChatCognitiveResponse({
      message: scenario.prompt,
      draftResponse: draft,
      rootDir: input.rootDir,
    });

    const intentCorrect = cognitive.intent === scenario.expectedIntent;
    const genericFallbackViolation =
      containsGenericOnboarding(cognitive.finalAnswer) &&
      isGenericOnboardingBlocked(scenario.expectedIntent, cognitive.finalAnswer);
    const passed =
      intentCorrect &&
      cognitive.quality.passed &&
      cognitive.quality.score >= CHAT_COGNITIVE_QUALITY_PASS_THRESHOLD &&
      !genericFallbackViolation;

    if (!passed) {
      recordCognitiveFailure(scenario.expectedIntent, cognitive.quality.failureReasons);
    }

    results.push({
      id: scenario.id,
      prompt: scenario.prompt,
      expectedIntent: scenario.expectedIntent,
      actualIntent: cognitive.intent,
      intentCorrect,
      passed,
      score: cognitive.quality.score,
      genericFallbackViolation,
      responsePreview: cognitive.finalAnswer.slice(0, 200),
      failureReasons: cognitive.quality.failureReasons,
    });
  }

  const cognitiveScore =
    results.length === 0
      ? 0
      : Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

  const reviewerReliability =
    cognitiveScore >= CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD ? 'RELIABLE' : 'NOT_RELIABLE_YET';

  return {
    readOnly: true,
    cognitiveScore,
    reviewerReliability,
    genericFallbackViolations: results.filter((r) => r.genericFallbackViolation).length,
    selfAwarenessFailures: results.filter((r) => r.expectedIntent === 'SELF_AWARENESS' && !r.passed).length,
    capabilityOverclaimFailures: results.filter((r) => r.expectedIntent === 'CAPABILITY' && !r.passed).length,
    softwareReasoningFailures: results.filter((r) => r.expectedIntent === 'SOFTWARE_CREATION' && !r.passed).length,
    missingKnowledgeCategories: [...new Set(results.flatMap((r) => (r.passed ? [] : r.failureReasons)))].slice(
      0,
      8,
    ),
    selfEvolutionRequired: results.some((r) => !r.passed),
    selfEvolutionReason: results.some((r) => !r.passed)
      ? 'SELF_EVOLUTION_REQUIRED — cognitive scenario failures detected'
      : null,
    scenarioResults: results,
    scenariosPassed: results.filter((r) => r.passed).length,
    scenariosRun: results.length,
    founderTestingMessage:
      reviewerReliability === 'NOT_RELIABLE_YET'
        ? 'Reviewer intelligence is not reliable enough yet.'
        : null,
  };
}
