/**
 * CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1 — read-only runtime trace from source evidence.
 * Does not invoke LLM or execute builds; parses authoritative modules only.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1_PASS_TOKEN = 'CHAT_RESPONSE_INTELLIGENCE_AUDIT_V1_PASS';

export type ChatIntelligenceVerdict =
  | 'CHAT_INTELLIGENCE_OK'
  | 'CHAT_INTELLIGENCE_PARTIAL'
  | 'CHAT_INTELLIGENCE_BYPASSED';

export type LlmInvocationStatus = 'YES' | 'NO' | 'PARTIAL';

export type ChatResponseSource =
  | 'LLM'
  | 'TEMPLATE'
  | 'HARDCODED_FORMATTER'
  | 'RUNTIME_SUMMARY_OBJECT'
  | 'OTHER';

export interface ExecutionChainStep {
  step: number;
  name: string;
  module: string;
  function: string;
  file: string;
  input: string;
  output: string;
  evidence: string;
}

export interface ChatResponseSourceFinding {
  buildCompletionSource: ChatResponseSource;
  nonBuildSource: ChatResponseSource;
  buildChatFunction: string;
  buildChatFile: string;
  clientRenderFunction: string;
  clientRenderFile: string;
  callStack: string[];
  evidenceLines: string[];
}

export interface LlmInvocationFinding {
  buildCompletionStatus: LlmInvocationStatus;
  nonBuildStatus: LlmInvocationStatus;
  buildPathEvidence: string[];
  nonBuildPathEvidence: string[];
  chainBreakLocation: string;
}

export interface BuildResultPayloadField {
  field: string;
  availableInBuildResult: boolean;
  passedToLlmOnBuildPath: boolean;
  passedToChatTemplate: boolean;
  evidence: string;
}

export interface ClassificationExplainabilityFinding {
  hasClassificationEvidence: boolean;
  hasConfidence: boolean;
  hasMatchedKeywords: boolean;
  hasFallbackRules: boolean;
  hasProfileRanking: boolean;
  llmCanAccessOnBuildPath: boolean;
  missing: string[];
  evidence: string[];
}

export interface ChatResponseIntelligenceAuditV1 {
  generatedAt: string;
  executionChain: ExecutionChainStep[];
  chatResponseSource: ChatResponseSourceFinding;
  llmInvocation: LlmInvocationFinding;
  buildResultPayload: BuildResultPayloadField[];
  classificationExplainability: ClassificationExplainabilityFinding;
  humanization: {
    buildPathActive: 'TEMPLATE_RESPONSE' | 'CONVERSATIONAL_RESPONSE';
    evidence: string[];
  };
  explainability: {
    canExplainProfileChoice: boolean;
    canExplainBuildFailure: boolean;
    canExplainBuildSuccess: boolean;
    canExplainFallback: boolean;
    canExplainBlueprint: boolean;
    canExplainFeatureContract: boolean;
    missingConnectionPoints: string[];
  };
  architectureGap: {
    actualPath: string;
    intendedPath: string;
    gapLocation: string;
    evidence: string[];
  };
  verdict: ChatIntelligenceVerdict;
  verdictRationale: string;
  recommendedRepairPlan: string[];
}

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

function readSource(relativePath: string): string {
  const path = join(ROOT, relativePath);
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function snippet(source: string, needle: string, radius = 120): string {
  const index = source.indexOf(needle);
  if (index < 0) return '';
  const start = Math.max(0, index - radius);
  const end = Math.min(source.length, index + needle.length + radius);
  return source.slice(start, end).replace(/\s+/g, ' ').trim();
}

function has(source: string, needle: string): boolean {
  return source.includes(needle);
}

export function traceBuildCompletionExecutionChain(): ExecutionChainStep[] {
  return [
    {
      step: 1,
      name: 'User Prompt Submit',
      module: 'founder-reality-ui',
      function: 'submitBrainRequest',
      file: 'public/founder-reality/app.js',
      input: 'message, activeProjectId, projectName',
      output: 'POST /api/brain/respond JSON body',
      evidence: snippet(readSource('public/founder-reality/app.js'), "fetch('/api/brain/respond'"),
    },
    {
      step: 2,
      name: 'Build Intent Detection',
      module: 'build-intent-routing',
      function: 'isBuildIntentRequest',
      file: 'src/build-intent-routing/build-intent-detector.ts',
      input: 'body.message',
      output: 'boolean isBuildIntent',
      evidence: snippet(readSource('src/build-intent-routing/build-intent-detector.ts'), 'export function isBuildIntentRequest'),
    },
    {
      step: 3,
      name: 'Profile Classification',
      module: 'build-intent-routing + universal-feature-contract-intelligence',
      function: 'resolveBuildIntentProfile → detectUniversalAppProfile',
      file: 'src/build-intent-routing/build-intent-detector.ts',
      input: 'rawPrompt string',
      output: 'GeneratedAppProfile | null (e.g. CRM_WEB_V1)',
      evidence: snippet(readSource('src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts'), 'export function detectUniversalAppProfile'),
    },
    {
      step: 4,
      name: 'Build Execution',
      module: 'one-prompt-live-preview',
      function: 'runOnePromptLivePreviewBuild',
      file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
      input: 'rawPrompt, projectRootDir, projectId, projectName',
      output: 'OnePromptLivePreviewBuildResult',
      evidence: snippet(readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'export async function runOnePromptLivePreviewBuild'),
    },
    {
      step: 5,
      name: 'Build Result → Brain API Payload',
      module: 'one-prompt-live-preview',
      function: 'composeOnePromptBuildBrainApiPayload',
      file: 'src/one-prompt-live-preview/one-prompt-build-chat-response.ts',
      input: 'message, buildResult',
      output: 'brainResponse + operatorFeedEvents + buildExecution + onePromptLivePreview',
      evidence: snippet(readSource('src/one-prompt-live-preview/one-prompt-build-chat-response.ts'), 'composeOnePromptBuildBrainApiPayload'),
    },
    {
      step: 6,
      name: 'Chat Response Formatting (build path)',
      module: 'one-prompt-live-preview',
      function: 'composeOnePromptBuildChatResponse',
      file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
      input: 'OnePromptLivePreviewBuildResult',
      output: 'multi-line template string (brainResponse)',
      evidence: snippet(readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'export function composeOnePromptBuildChatResponse'),
    },
    {
      step: 7,
      name: 'Build Result Conversational Intelligence',
      module: 'build-result-conversational-intelligence',
      function: 'applyBuildResultConversationalIntelligence',
      file: 'src/build-result-conversational-intelligence/apply-build-result-conversational-intelligence.ts',
      input: 'payload + buildResult + user message',
      output: 'brainResponse (LLM or template fallback) + llmChatBrainDiagnostics',
      evidence: snippet(readSource('server/brain-api-handler.ts'), 'applyBuildResultConversationalIntelligence'),
    },
    {
      step: 8,
      name: 'HTTP Response',
      module: 'server',
      function: 'handleBrainRespondRequest → sendBuildBrainResponse',
      file: 'server/brain-api-handler.ts',
      input: 'enriched payload',
      output: 'JSON { brainResponse, operatorFeedEvents, ... }',
      evidence: snippet(readSource('server/brain-api-handler.ts'), 'sendBuildBrainResponse(res, enrichedPayload'),
    },
    {
      step: 9,
      name: 'Client Chat Render',
      module: 'founder-reality-ui',
      function: 'appendChatMessage(result.brainResponse, "brain")',
      file: 'public/founder-reality/app.js',
      input: 'brainResponse string from API',
      output: 'DOM chat bubble',
      evidence: snippet(readSource('public/founder-reality/app.js'), "appendChatMessage(result.brainResponse, 'brain')"),
    },
  ];
}

export function auditChatResponseSource(): ChatResponseSourceFinding {
  const orchestrator = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const buildPayload = readSource('src/one-prompt-live-preview/one-prompt-build-chat-response.ts');
  const brainHandler = readSource('server/brain-api-handler.ts');
  const appJs = readSource('public/founder-reality/app.js');

  const templateMarkers = [
    'Build run:',
    'Workspace:',
    'Profile:',
    'Build execution started for project',
  ];
  const templateEvidence = templateMarkers.filter((m) => has(orchestrator, m));

  return {
    buildCompletionSource: 'HARDCODED_FORMATTER',
    nonBuildSource: has(brainHandler, 'applyLlmBrainLayer') ? 'TEMPLATE' : 'HARDCODED_FORMATTER',
    buildChatFunction: 'composeOnePromptBuildChatResponse',
    buildChatFile: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    clientRenderFunction: 'appendChatMessage',
    clientRenderFile: 'public/founder-reality/app.js',
    callStack: [
      'public/founder-reality/app.js → submitBrainRequest → fetch(/api/brain/respond)',
      'server/brain-api-handler.ts → handleBrainRespondRequest',
      'server/brain-api-handler.ts → runOnePromptLivePreviewBuild (build intent)',
      'src/one-prompt-live-preview/one-prompt-build-chat-response.ts → composeOnePromptBuildBrainApiPayload',
      'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts → composeOnePromptBuildChatResponse',
      'server/brain-api-handler.ts → sendBuildBrainResponse (no applyLlmBrainLayer)',
      'public/founder-reality/app.js → appendChatMessage(result.brainResponse, "brain")',
    ],
    evidenceLines: [
      `composeOnePromptBuildChatResponse joins fixed lines: ${templateEvidence.join(', ')}`,
      has(buildPayload, 'composeOnePromptBuildChatResponse(input.buildResult)')
        ? 'composeOnePromptBuildBrainApiPayload assigns brainResponse from composeOnePromptBuildChatResponse'
        : 'composeOnePromptBuildBrainApiPayload brainResponse assignment not found',
      has(appJs, "appendChatMessage(result.brainResponse, 'brain')")
        ? 'Client renders brainResponse verbatim — no client-side LLM'
        : 'Client brainResponse render not found',
    ],
  };
}

export function auditLlmInvocation(): LlmInvocationFinding {
  const brainHandler = readSource('server/brain-api-handler.ts');
  const buildConversational = readSource(
    'src/build-result-conversational-intelligence/apply-build-result-conversational-intelligence.ts',
  );

  const buildUsesConversationalLayer = has(brainHandler, 'applyBuildResultConversationalIntelligence');
  const buildCallsLlmWhenConnected = has(buildConversational, 'provider.chat');

  const nonBuildCallsLlm = has(brainHandler, 'result = await applyLlmBrainLayer(result, body.message)');

  return {
    buildCompletionStatus: buildUsesConversationalLayer && buildCallsLlmWhenConnected ? 'PARTIAL' : 'NO',
    nonBuildStatus: nonBuildCallsLlm ? 'PARTIAL' : 'NO',
    buildPathEvidence: [
      buildUsesConversationalLayer
        ? 'Build path invokes applyBuildResultConversationalIntelligence after composeOnePromptBuildBrainApiPayload'
        : 'Build conversational layer not found',
      buildCallsLlmWhenConnected
        ? 'applyBuildResultConversationalIntelligence calls LLM provider when connected'
        : 'LLM provider call not found in build conversational module',
      has(buildConversational, '[Template fallback — LLM unavailable]')
        ? 'Template fallback marker used when LLM unavailable'
        : 'Template fallback marker not found',
    ],
    nonBuildPathEvidence: [
      nonBuildCallsLlm
        ? 'Non-build path: processBrainRequest then applyLlmBrainLayer'
        : 'applyLlmBrainLayer call not found on non-build path',
      has(brainHandler, 'generateLlmBackedChatResponseAsync')
        ? 'applyLlmBrainLayer invokes generateLlmBackedChatResponseAsync when LLM connected'
        : 'LLM async generator not referenced in brain handler',
    ],
    chainBreakLocation: buildUsesConversationalLayer
      ? 'No full bypass — build path uses applyBuildResultConversationalIntelligence; falls back to template when LLM disconnected'
      : 'server/brain-api-handler.ts — build-intent branch returns without conversational intelligence layer',
  };
}

export function auditBuildResultPayload(): BuildResultPayloadField[] {
  const types = readSource('src/one-prompt-live-preview/one-prompt-live-preview-types.ts');
  const payload = readSource('src/one-prompt-live-preview/one-prompt-build-chat-response.ts');
  const chatTemplate = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const brainHandler = readSource('server/brain-api-handler.ts');
  const buildConversational = readSource(
    'src/build-result-conversational-intelligence/build-result-llm-instructions.ts',
  );

  const fields: Array<{ field: string; typeMarker: string; inPayload: string; inTemplate: string }> = [
    { field: 'buildRunId', typeMarker: 'buildId', inPayload: 'buildRunId', inTemplate: 'Build run:' },
    { field: 'workspacePath', typeMarker: 'workspacePath', inPayload: 'workspacePath', inTemplate: 'Workspace:' },
    { field: 'profile', typeMarker: 'generatedProfile', inPayload: 'generatedProfile', inTemplate: 'Profile:' },
    { field: 'blueprint', typeMarker: 'architectureSummary', inPayload: 'architectureSummary', inTemplate: 'architectureSummary' },
    { field: 'featureContracts', typeMarker: 'featureSignals', inPayload: 'featureSignals', inTemplate: 'featureSignals' },
    { field: 'previewUrl', typeMarker: 'previewUrl', inPayload: 'previewUrl', inTemplate: 'Live Preview:' },
    { field: 'buildStatus', typeMarker: 'buildResult', inPayload: 'status', inTemplate: 'Build:' },
    { field: 'failureReason', typeMarker: 'failureReason', inPayload: 'failureReason', inTemplate: 'Reason:' },
    { field: 'classificationEvidence', typeMarker: 'classification', inPayload: 'classification', inTemplate: 'matchedKeywords' },
  ];

  return fields.map(({ field, typeMarker, inPayload, inTemplate }) => ({
    field,
    availableInBuildResult: has(types, typeMarker),
    passedToLlmOnBuildPath:
      has(brainHandler, 'applyBuildResultConversationalIntelligence') &&
      has(buildConversational, 'buildBuildResultConversationalUserMessage'),
    passedToChatTemplate: has(payload, inPayload) || has(chatTemplate, inTemplate),
    evidence: `Type: ${typeMarker}; API payload field: ${inPayload}; template uses: ${inTemplate}`,
  }));
}

export function auditClassificationExplainability(): ClassificationExplainabilityFinding {
  const profileDetector = readSource('src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts');
  const buildPayload = readSource('src/one-prompt-live-preview/one-prompt-build-chat-response.ts');
  const classificationModule = readSource(
    'src/build-result-conversational-intelligence/build-result-classification-evidence.ts',
  );
  const brainHandler = readSource('server/brain-api-handler.ts');

  const hasKeywordMatching = has(profileDetector, 'includesAny(lower,') || has(classificationModule, 'collectMatchedKeywords');
  const hasRealClassification = has(buildPayload, 'analyzeBuildProfileClassification');
  const hasConfidenceInPayload = has(classificationModule, "confidence:");
  const hasProfileRanking = has(profileDetector, 'ranking') || has(profileDetector, 'scores');
  const llmOnBuild = has(brainHandler, 'applyBuildResultConversationalIntelligence');

  const missing: string[] = [];
  if (!hasProfileRanking) missing.push('Profile ranking results (no ranked alternatives stored from detectUniversalAppProfile)');
  if (!has(profileDetector, 'confidence')) missing.push('Per-match confidence from legacy profile detector (returns profile or null only)');
  if (!llmOnBuild) missing.push('LLM access on build-completion path (conversational layer not wired)');

  return {
    hasClassificationEvidence: hasRealClassification,
    hasConfidence: hasConfidenceInPayload,
    hasMatchedKeywords: has(classificationModule, 'matchedKeywords'),
    hasFallbackRules: has(profileDetector, 'return null'),
    hasProfileRanking: hasProfileRanking,
    llmCanAccessOnBuildPath: llmOnBuild,
    missing,
    evidence: [
      'analyzeBuildProfileClassification derives matchedKeywords and profileMismatchWarnings from prompt + selected profile',
      has(classificationModule, 'profileMismatchWarnings') ? 'Profile mismatch warnings available to LLM context' : '',
    ].filter(Boolean),
  };
}

export function determineVerdict(
  llm: LlmInvocationFinding,
  chatSource: ChatResponseSourceFinding,
): { verdict: ChatIntelligenceVerdict; rationale: string } {
  if (llm.buildCompletionStatus === 'PARTIAL') {
    return {
      verdict: 'CHAT_INTELLIGENCE_PARTIAL',
      rationale:
        'Build completions route through applyBuildResultConversationalIntelligence with LLM when connected and template fallback when unavailable. Non-build chat also uses optional applyLlmBrainLayer.',
    };
  }
  if (llm.buildCompletionStatus === 'NO' && chatSource.buildCompletionSource !== 'LLM') {
    return {
      verdict: 'CHAT_INTELLIGENCE_BYPASSED',
      rationale:
        'Build completions still format chat via composeOnePromptBuildChatResponse without a conversational intelligence layer.',
    };
  }
  return {
    verdict: 'CHAT_INTELLIGENCE_OK',
    rationale: 'Build and chat paths both route through LLM-backed response generation.',
  };
}

export function runChatResponseIntelligenceAuditV1(): ChatResponseIntelligenceAuditV1 {
  const executionChain = traceBuildCompletionExecutionChain();
  const chatResponseSource = auditChatResponseSource();
  const llmInvocation = auditLlmInvocation();
  const buildResultPayload = auditBuildResultPayload();
  const classificationExplainability = auditClassificationExplainability();
  const { verdict, rationale } = determineVerdict(llmInvocation, chatResponseSource);

  const orchestrator = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const brainHandler = readSource('server/brain-api-handler.ts');
  const buildConversational = has(brainHandler, 'applyBuildResultConversationalIntelligence');

  return {
    generatedAt: new Date().toISOString(),
    executionChain,
    chatResponseSource,
    llmInvocation,
    buildResultPayload,
    classificationExplainability,
    humanization: {
      buildPathActive: buildConversational ? 'CONVERSATIONAL_RESPONSE' : 'TEMPLATE_RESPONSE',
      evidence: buildConversational
        ? [
            'applyBuildResultConversationalIntelligence produces founder-friendly LLM summary when connected',
            'composeOnePromptBuildChatResponse retained as template fallback only',
          ]
        : [
            'composeOnePromptBuildChatResponse returns joined lines: Build run / Project / Workspace / Profile / Build / Live Preview',
          ],
    },
    explainability: {
      canExplainProfileChoice: has(classificationExplainability.evidence.join(' '), 'profileMismatchWarnings'),
      canExplainBuildFailure: has(orchestrator, 'failureReason'),
      canExplainBuildSuccess: has(orchestrator, 'materialization complete'),
      canExplainFallback: has(orchestrator, 'failureReason'),
      canExplainBlueprint: has(orchestrator, 'architectureSummary'),
      canExplainFeatureContract: has(orchestrator, 'featureSignals'),
      missingConnectionPoints: buildConversational
        ? ['Profile ranking alternatives still not stored — only mismatch warnings']
        : [
            'Profile detector keyword hits are not serialized into brainResponse or LLM context',
            'Conversational intelligence layer not wired on build-intent path',
          ],
    },
    architectureGap: {
      actualPath: buildConversational
        ? 'User → Build → composeOnePromptBuildBrainApiPayload → applyBuildResultConversationalIntelligence → Chat'
        : 'User → Build → composeOnePromptBuildChatResponse → Chat',
      intendedPath:
        'User → Runtime → Build Result → LLM Reasoning Layer → Conversational Response → Chat',
      gapLocation: buildConversational
        ? 'Partial — template fallback still used when LLM disconnected; profile ranking not yet implemented'
        : 'server/brain-api-handler.ts between composeOnePromptBuildBrainApiPayload and sendBuildBrainResponse',
      evidence: buildConversational
        ? [llmInvocation.chainBreakLocation]
        : [llmInvocation.chainBreakLocation, 'applyBuildResultConversationalIntelligence not found'],
    },
    verdict,
    verdictRationale: rationale,
    recommendedRepairPlan: buildConversational
      ? [
          'Add profile ranking alternatives to analyzeBuildProfileClassification.',
          'Ground buildDevPulseContextPackage with live buildExecution state for richer LLM context.',
        ]
      : [
          'After runOnePromptLivePreviewBuild, invoke applyBuildResultConversationalIntelligence with structured build result.',
          'Extend classification evidence with matchedKeywords and profileMismatchWarnings.',
          'Keep template as fallback when LLM disconnected.',
        ],
  };
}
