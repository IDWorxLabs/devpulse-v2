/**
 * Phase 25.39 — Read-only pipeline tracer for Self Model Reality Audit.
 * NOT wired into production chat — validation and audit reporting only.
 */

import { classifyBrainRequest } from '../../src/command-center-brain/brain-request-classifier.js';
import { matchProductIdentityIntent } from '../../src/command-center-brain/product-identity-responses.js';
import { generateBrainResponse } from '../../src/command-center-brain/brain-response-generator.js';
import { getBrainRoadmapContext } from '../../src/command-center-brain/brain-roadmap-awareness.js';
import { getCommandCenterAwareSystems } from '../../src/command-center-brain/brain-system-awareness.js';
import { understandGeneralQuestion, shouldGeneralRouterOwnRequest } from '../../src/command-center-brain/general-question-understanding/index.js';
import { classifyChatCognitiveIntent } from '../../src/chat-cognitive-architecture/chat-cognitive-intent-understanding.js';
import { buildChatReasoningPlan } from '../../src/chat-cognitive-architecture/chat-response-planner.js';
import { buildChatSelfModel } from '../../src/chat-cognitive-architecture/chat-self-model.js';
import { buildChatProjectRealityContext } from '../../src/chat-cognitive-architecture/chat-project-reality-context.js';
import { assessChatCapabilityBoundaries } from '../../src/chat-cognitive-architecture/chat-capability-boundary-checker.js';
import { generateChatCognitiveResponse } from '../../src/chat-cognitive-architecture/index.js';
import { classifyChatBrainIntent } from '../../src/world-class-chat-brain/chat-brain-orchestrator.js';
import { generateWorldClassChatResponse } from '../../src/world-class-chat-brain/chat-brain-orchestrator.js';
import { judgeChatBrainAnswer } from '../../src/world-class-chat-brain/chat-brain-answer-judge.js';
import { containsGenericOnboarding } from '../../src/chat-cognitive-architecture/generic-fallback-guard.js';
import { GENERIC_ONBOARDING_SIGNATURE } from '../../src/chat-cognitive-architecture/chat-cognitive-registry.js';
import { processBrainRequest } from '../../src/command-center-brain/index.js';

export type SelfModelFailureClass =
  | 'INTENT_FAILURE'
  | 'FRAME_FAILURE'
  | 'CONTEXT_SELECTION_FAILURE'
  | 'SELF_MODEL_FAILURE'
  | 'CAPABILITY_MODEL_FAILURE'
  | 'RESPONSE_PLANNER_FAILURE'
  | 'JUDGE_FAILURE'
  | 'REPAIR_FAILURE'
  | 'PROJECT_CONTEXT_OVERRIDE'
  | 'MULTIPLE_SOURCE_CONFLICT';

export interface PipelineStageTrace {
  stage: string;
  route: string;
  contextSource: string;
  evidence: string[];
  answerSource: string;
  detail: string;
}

export interface SelfModelAuditScenarioResult {
  id: string;
  prompt: string;
  expectedAnswerType: string;
  stages: PipelineStageTrace[];
  firstFailureLocation: string;
  firstFailureClass: SelfModelFailureClass;
  rootCause: string;
  whyPhases2537_2538Missed: string;
  smallestFix: string;
  brainDraftPreview: string;
  cognitiveDraftPreview: string;
  finalAnswerPreview: string;
  failureClasses: SelfModelFailureClass[];
  selfIntentDetected: boolean;
  projectContextDominates: boolean;
  genericOnboardingInFinal: boolean;
}

function frameForCognitiveIntent(intent: string): string {
  switch (intent) {
    case 'SELF_AWARENESS':
    case 'IDENTITY':
    case 'CREATOR_OR_ORIGIN':
    case 'LIMITATION':
    case 'TRUST':
      return 'SELF_MODEL';
    case 'PROJECT_STATUS':
    case 'VERIFICATION':
    case 'LAUNCH_READINESS':
      return 'PROJECT_REALITY';
    case 'NEXT_ACTION':
      return 'NEXT_ACTION';
    case 'CAPABILITY':
      return 'GENERAL_HELP';
    default:
      return intent === 'UNKNOWN' ? 'CLARIFICATION' : 'GENERAL_HELP';
  }
}

function shouldWorldClassReplaceDraft(category: string, draft: string): boolean {
  if (!draft.trim()) return true;
  if (containsGenericOnboarding(draft)) return true;
  return ['SELF', 'CAPABILITY', 'HUMAN_QUALITY', 'LAUNCH', 'PROJECT_REALITY', 'VERIFICATION', 'SOFTWARE_CREATION'].includes(
    category,
  );
}

function classifyFailures(input: {
  prompt: string;
  cognitiveIntent: string;
  worldClassIntent: string;
  frame: string;
  brainDraft: string;
  finalAnswer: string;
  generalRouterActive: boolean;
}): SelfModelFailureClass[] {
  const failures: SelfModelFailureClass[] = [];
  const lower = input.prompt.toLowerCase();
  const wantsSelfWeakness = /\bweakness/i.test(lower);
  const wantsSelfCapabilities = /\bcapabilit/i.test(lower);
  const wantsHowToSelfAware = /\bhow do i make you self aware\b/i.test(lower);

  if (wantsSelfWeakness && input.cognitiveIntent === 'UNKNOWN') {
    failures.push('INTENT_FAILURE');
    failures.push('PROJECT_CONTEXT_OVERRIDE');
  }

  if (wantsHowToSelfAware && input.cognitiveIntent === 'SELF_AWARENESS') {
    failures.push('RESPONSE_PLANNER_FAILURE');
  }

  if (input.cognitiveIntent === 'CAPABILITY' && input.frame === 'GENERAL_HELP') {
    failures.push('FRAME_FAILURE');
  }

  if (wantsSelfCapabilities && input.cognitiveIntent === 'UNKNOWN' && input.worldClassIntent === 'CAPABILITY') {
    failures.push('INTENT_FAILURE');
    failures.push('MULTIPLE_SOURCE_CONFLICT');
  }

  if (wantsSelfCapabilities && containsGenericOnboarding(input.brainDraft) && input.worldClassIntent !== 'CAPABILITY') {
    failures.push('INTENT_FAILURE');
    failures.push('CAPABILITY_MODEL_FAILURE');
  }

  if (input.generalRouterActive && input.cognitiveIntent === 'UNKNOWN') {
    failures.push('MULTIPLE_SOURCE_CONFLICT');
  }

  if (!shouldWorldClassReplaceDraft(input.worldClassIntent, input.brainDraft) && input.cognitiveIntent === 'UNKNOWN') {
    failures.push('CONTEXT_SELECTION_FAILURE');
  }

  if (wantsSelfWeakness && /execution runtime|biggest weakness is|project understanding/i.test(input.finalAnswer)) {
    failures.push('PROJECT_CONTEXT_OVERRIDE');
  }

  if (wantsSelfCapabilities && containsGenericOnboarding(input.finalAnswer)) {
    failures.push('JUDGE_FAILURE');
  }

  if (wantsHowToSelfAware && /I am not fully self-aware/i.test(input.finalAnswer) && !/memory|learning|evidence|improve/i.test(input.finalAnswer)) {
    failures.push('RESPONSE_PLANNER_FAILURE');
  }

  return [...new Set(failures)];
}

function failureLocation(classification: SelfModelFailureClass): string {
  switch (classification) {
    case 'INTENT_FAILURE':
      return 'src/chat-cognitive-architecture/chat-cognitive-intent-understanding.ts → classifyChatCognitiveIntent()';
    case 'FRAME_FAILURE':
      return 'src/chat-cognitive-architecture/chat-response-planner.ts → selectFrame()';
    case 'CONTEXT_SELECTION_FAILURE':
      return 'src/world-class-chat-brain/chat-brain-orchestrator.ts → shouldReplaceDraft()';
    case 'RESPONSE_PLANNER_FAILURE':
      return 'src/chat-cognitive-architecture/chat-response-planner.ts → composeResponseFromPlan()';
    case 'PROJECT_CONTEXT_OVERRIDE':
      return 'src/command-center-brain/general-question-understanding/general-answer-composer.ts → pickPrimaryConclusion()';
    case 'MULTIPLE_SOURCE_CONFLICT':
      return 'src/command-center-brain/command-center-brain.ts → brainResponse owner precedence chain';
    case 'JUDGE_FAILURE':
      return 'src/world-class-chat-brain/chat-brain-answer-judge.ts → judgeChatBrainAnswer()';
    default:
      return 'pipeline';
  }
}

function rootCauseForScenario(id: string): string {
  if (id === 'scenario-a') {
    return 'World-class classifyChatBrainIntent() maps to CAPABILITY, but buildDraft() calls generateChatCognitiveResponse() which re-classifies as UNKNOWN (no cognitive pattern for "what are your capabilities"). Cognitive UNKNOWN compose returns a clarifying question instead of self capability model; brain draft still carries PRODUCT_INTRO onboarding bullets from generateGeneralResponse().';
  }
  if (id === 'scenario-b') {
    return 'Imperative "how do I make you…" matches SELF_AWARENESS declarative regex ("self aware") and routes to composeResponseFromPlan SELF_AWARENESS branch, which defines current state instead of answering how bounded self-awareness could improve via memory, evidence, and learning.';
  }
  return '"weaknesses" triggers general-question RISK_ASSESSMENT + PROJECT_KNOWLEDGE_REASONING. Cognitive intent is UNKNOWN. World-class shouldReplaceDraft() omits UNKNOWN, so project weakness text from general-answer-composer survives unless the exact generic onboarding signature appears in the draft.';
}

function smallestFixForScenario(id: string): string {
  if (id === 'scenario-a') {
    return 'Add "what are your capabilities" to cognitive CAPABILITY patterns in chat-cognitive-intent-understanding.ts; pass resolved world-class intent into generateChatCognitiveResponse() to prevent re-classification drift; map CAPABILITY frame to SELF_MODEL in selectFrame().';
  }
  if (id === 'scenario-b') {
    return 'Add imperative self-improvement intent ("how do I make you / how could you become") distinct from SELF_AWARENESS; compose branch covering memory, learning, evidence integration — not the declarative self-awareness template.';
  }
  return 'Map weaknesses/flaws to LIMITATION or SELF_WEAKNESS; include UNKNOWN + self-keyword prompts in shouldReplaceDraft(); compose from selfModel.cannotClaimYet and systemsIncomplete instead of general-answer-composer project RISK facts.';
}

export const SELF_MODEL_AUDIT_SCENARIOS = [
  {
    id: 'scenario-a',
    prompt: 'What are your capabilities?',
    expectedAnswerType: 'Self capability model (honest proven/partial/unproven)',
  },
  {
    id: 'scenario-b',
    prompt: 'How do I make you self aware like a human?',
    expectedAnswerType: 'Reasoning about bounded self-awareness improvement — not identity definition',
  },
  {
    id: 'scenario-c',
    prompt: 'What are your weaknesses?',
    expectedAnswerType: 'AiDevEngine self weaknesses from self model',
  },
] as const;

export function traceSelfModelAuditScenario(input: {
  id: string;
  prompt: string;
  expectedAnswerType: string;
}): SelfModelAuditScenarioResult {
  const { id, prompt, expectedAnswerType } = input;
  const stages: PipelineStageTrace[] = [];

  const brainClassification = classifyBrainRequest({ message: prompt });
  stages.push({
    stage: '1-intent-brain-classifier',
    route: brainClassification.category,
    contextSource: 'brain-request-classifier.ts',
    evidence: brainClassification.matchedSignals,
    answerSource: 'pending',
    detail: brainClassification.reason ?? '',
  });

  const productIdentityIntent = matchProductIdentityIntent(prompt);
  stages.push({
    stage: '2-product-identity',
    route: productIdentityIntent ?? 'none',
    contextSource: 'product-identity-responses.ts',
    evidence: productIdentityIntent ? ['PRODUCT_INTRO path'] : [],
    answerSource: productIdentityIntent ? 'generateProductIdentityResponse' : 'skipped',
    detail: productIdentityIntent ? 'Product identity owns response before chat layers' : 'No product identity match',
  });

  const routingPlan = understandGeneralQuestion(prompt);
  const generalRouterActive = shouldGeneralRouterOwnRequest(routingPlan);
  stages.push({
    stage: '3-general-question-router',
    route: routingPlan.primaryCapability ?? 'none',
    contextSource: 'general-question-understanding',
    evidence: [...routingPlan.selectedCapabilities],
    answerSource: generalRouterActive ? 'general-answer-composer (project facts)' : 'skipped',
    detail: generalRouterActive
      ? `Owns response — dimensions: ${routingPlan.dimensions.join(', ')}`
      : 'Does not own response',
  });

  const cognitive = classifyChatCognitiveIntent(prompt);
  const frame = frameForCognitiveIntent(cognitive.intent);
  stages.push({
    stage: '4-cognitive-intent',
    route: cognitive.intent,
    contextSource: 'chat-cognitive-intent-understanding.ts',
    evidence: cognitive.matchedSignals,
    answerSource: 'classifyChatCognitiveIntent',
    detail: `confidence=${cognitive.confidence}`,
  });

  stages.push({
    stage: '5-cognitive-frame',
    route: frame,
    contextSource: 'chat-response-planner.ts → selectFrame()',
    evidence: [],
    answerSource: 'selectFrame',
    detail: frame === 'SELF_MODEL' ? 'Self model frame' : `Non-self frame: ${frame}`,
  });

  const worldClassIntent = classifyChatBrainIntent(prompt);
  stages.push({
    stage: '6-world-class-intent',
    route: worldClassIntent.category,
    contextSource: 'chat-brain-orchestrator.ts',
    evidence: worldClassIntent.matchedSignals,
    answerSource: 'classifyChatBrainIntent',
    detail: `reasoningMode=${worldClassIntent.reasoningMode}`,
  });

  const selfModel = buildChatSelfModel();
  const projectContext = buildChatProjectRealityContext(process.cwd());
  stages.push({
    stage: '7-self-model-retrieval',
    route: 'buildChatSelfModel()',
    contextSource: 'chat-self-model.ts',
    evidence: selfModel.canHelpWithToday.slice(0, 2),
    answerSource: 'static self model (always loaded)',
    detail: 'Retrieved every request; planner decides if used',
  });

  stages.push({
    stage: '8-project-context-retrieval',
    route: 'buildChatProjectRealityContext()',
    contextSource: 'chat-project-reality-context.ts',
    evidence: projectContext.signals.slice(0, 2).map((s) => s.label),
    answerSource: 'DevPulse session evidence',
    detail: `blockers=${projectContext.knownBlockers.length}`,
  });

  const boundaries = assessChatCapabilityBoundaries(process.cwd());
  const plan = buildChatReasoningPlan({
    classification: cognitive,
    selfModel,
    projectContext,
    boundaries,
    softwareReasoning: null,
  });
  stages.push({
    stage: '9-response-planner',
    route: plan.intent,
    contextSource: 'chat-response-planner.ts',
    evidence: plan.sections,
    answerSource: `composeResponseFromPlan(${plan.intent})`,
    detail: `frame=${plan.frame}; includeProjectState=${plan.includeProjectState}`,
  });

  const systems = getCommandCenterAwareSystems();
  const roadmap = getBrainRoadmapContext();
  const brainDraft = generateBrainResponse(prompt, brainClassification, systems, roadmap);
  stages.push({
    stage: '10-brain-draft',
    route: brainClassification.category,
    contextSource: 'brain-response-generator.ts',
    evidence: containsGenericOnboarding(brainDraft) ? [GENERIC_ONBOARDING_SIGNATURE] : [],
    answerSource: `generateBrainResponse(${brainClassification.category})`,
    detail: containsGenericOnboarding(brainDraft) ? 'Generic onboarding bullets' : 'Non-generic draft',
  });

  const cognitiveResponse = generateChatCognitiveResponse({ message: prompt, draftResponse: brainDraft });
  stages.push({
    stage: '11-cognitive-orchestrator',
    route: cognitiveResponse.intent,
    contextSource: 'chat-cognitive-orchestrator.ts',
    evidence: [`score=${cognitiveResponse.quality.score}`],
    answerSource: cognitiveResponse.usedExistingBrainDraft ? 'brain draft' : 'composeResponseFromPlan',
    detail: cognitiveResponse.repaired ? 'Repaired by quality reviewer' : 'Not repaired',
  });

  const replaceDraft = shouldWorldClassReplaceDraft(worldClassIntent.category, brainDraft);
  stages.push({
    stage: '12-world-class-draft-gate',
    route: replaceDraft ? 'REPLACE' : 'KEEP_UPSTREAM',
    contextSource: 'shouldReplaceDraft()',
    evidence: [worldClassIntent.category],
    answerSource: replaceDraft ? 'cognitive pipeline' : 'brain/general router draft',
    detail: replaceDraft ? 'Override upstream draft' : 'SELF loss risk — upstream draft kept',
  });

  const fullBrain = processBrainRequest({ message: prompt, timestamp: Date.now() });
  const worldClass = generateWorldClassChatResponse({ message: prompt, draftResponse: brainDraft });
  const judgement = judgeChatBrainAnswer({
    message: prompt,
    answer: worldClass.finalAnswer,
    intent: worldClassIntent.category,
    reasoningMode: worldClassIntent.reasoningMode,
  });
  stages.push({
    stage: '13-answer-judge',
    route: judgement.passed ? 'PASS' : 'FAIL',
    contextSource: 'chat-brain-answer-judge.ts',
    evidence: judgement.failureReasons,
    answerSource: 'judgeChatBrainAnswer',
    detail: `score=${judgement.score}`,
  });

  stages.push({
    stage: '14-final-answer',
    route: worldClass.repaired ? 'REPAIRED' : 'DRAFT',
    contextSource: 'generateWorldClassChatResponse()',
    evidence: [],
    answerSource: 'processBrainRequest integrated path',
    detail: `usedBrainDraft=${worldClass.usedBrainDraft}`,
  });

  const failureClasses = classifyFailures({
    prompt,
    cognitiveIntent: cognitive.intent,
    worldClassIntent: worldClassIntent.category,
    frame,
    brainDraft,
    finalAnswer: fullBrain.brainResponse,
    generalRouterActive,
  });

  const firstFailureClass = failureClasses[0] ?? 'INTENT_FAILURE';

  return {
    id,
    prompt,
    expectedAnswerType,
    stages,
    firstFailureLocation: failureLocation(firstFailureClass),
    firstFailureClass,
    rootCause: rootCauseForScenario(id),
    whyPhases2537_2538Missed:
      'Phase 25.37/25.38 validators used exact curated strings; paraphrases and general-router competition were not in scenario coverage, so manual phrasing exposed gaps.',
    smallestFix: smallestFixForScenario(id),
    brainDraftPreview: brainDraft.slice(0, 220),
    cognitiveDraftPreview: cognitiveResponse.finalAnswer.slice(0, 220),
    finalAnswerPreview: fullBrain.brainResponse.slice(0, 220),
    failureClasses,
    selfIntentDetected:
      ['SELF', 'CAPABILITY'].includes(worldClassIntent.category) ||
      ['SELF_AWARENESS', 'CAPABILITY', 'LIMITATION'].includes(cognitive.intent),
    projectContextDominates:
      /execution runtime|biggest weakness|Project understanding|Bounded project signals/i.test(fullBrain.brainResponse) &&
      /\bweakness/i.test(prompt),
    genericOnboardingInFinal: containsGenericOnboarding(fullBrain.brainResponse),
  };
}

export function runSelfModelRealityAudit(): SelfModelAuditScenarioResult[] {
  return SELF_MODEL_AUDIT_SCENARIOS.map((s) => traceSelfModelAuditScenario(s));
}

export const SELF_MODEL_REALITY_AUDIT_PASS_TOKEN = 'SELF_MODEL_REALITY_AUDIT_PASS';

export function architectureSufficiencyAssessment(): {
  verdict: 'TARGETED_FIXES_SUFFICIENT' | 'FUNDAMENTAL_CHANGE_REQUIRED';
  summary: string;
} {
  return {
    verdict: 'TARGETED_FIXES_SUFFICIENT',
    summary:
      'Phase 25.37 + 25.38 architecture is sufficient. Failures are misrouting at intent patterns, frame selection, shouldReplaceDraft gaps, and missing compose branches — not missing another chat layer.',
  };
}
