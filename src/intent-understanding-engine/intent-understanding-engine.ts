/**
 * Intent Understanding Engine V1 — main orchestrator and integration authority.
 * Generation must not begin until Product Intelligence Model is complete and verified.
 */

import { getDevPulseV2AiDevEngineAuthority } from '../aidev-engine/aidev-engine-authority.js';
import { getDevPulseV2CapabilityPlanningEngine } from '../capability-planning-engine/index.js';
import type {
  IntentUnderstandingInput,
  IntentUnderstandingResult,
  IntentUnderstandingRuntimeReport,
  ProductIntelligenceModel,
} from './intent-understanding-types.js';
import {
  DEFAULT_CATEGORY_CONFIDENCE_THRESHOLD,
  DEFAULT_INTENT_CONFIDENCE_THRESHOLD,
  INTENT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN,
} from './intent-understanding-types.js';
import { buildProductIntelligenceModel, resetProductModelBuilderForTests } from './product-model-builder.js';
import { buildIntentUnderstandingReportMarkdown } from './intent-report-builder.js';
import { buildIntentUnderstandingTraceEvents } from './intent-trace-events.js';
import {
  getIntentHistory,
  getIntentHistorySize,
  getLastIntentHistoryEntry,
  recordIntentUnderstandingHistory,
  resetIntentHistoryForTests,
} from './intent-history.js';

let understandingCounter = 0;
let modelsBuilt = 0;
let generationBlockedCount = 0;
let confidenceSum = 0;
let activeProductIntelligenceModel: ProductIntelligenceModel | null = null;
let lastUnderstandingResult: IntentUnderstandingResult | null = null;

export function resetIntentUnderstandingEngineForTests(): void {
  understandingCounter = 0;
  modelsBuilt = 0;
  generationBlockedCount = 0;
  confidenceSum = 0;
  activeProductIntelligenceModel = null;
  lastUnderstandingResult = null;
  resetProductModelBuilderForTests();
  resetIntentHistoryForTests();
}

export function getDevPulseV2IntentUnderstandingEngine(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  understandingBeforeGeneration: true;
} {
  return {
    ownerModule: INTENT_UNDERSTANDING_ENGINE_OWNER_MODULE,
    passToken: INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN,
    phase: 1,
    understandingBeforeGeneration: true,
  };
}

export function getActiveProductIntelligenceModel(): ProductIntelligenceModel | null {
  return activeProductIntelligenceModel;
}

export function getLastIntentUnderstandingResult(): IntentUnderstandingResult | null {
  return lastUnderstandingResult;
}

export function assertGenerationUsesProductIntelligenceModel(): boolean {
  return activeProductIntelligenceModel !== null;
}

function nextUnderstandingId(): string {
  understandingCounter += 1;
  return `intent-understanding-${understandingCounter}`;
}

function deriveBlockedReason(model: ProductIntelligenceModel): string | null {
  if (model.confidence.meetsOverallThreshold) return null;
  const failing = model.confidence.categories.filter((c) => !c.meetsThreshold);
  if (failing.length) {
    return `Confidence below threshold for: ${failing.map((c) => c.category).join(', ')}`;
  }
  return `Overall confidence ${Math.round(model.confidence.overallConfidence * 100)}% below threshold ${Math.round(model.confidence.thresholdUsed * 100)}%`;
}

export function runIntentUnderstandingEngine(input: IntentUnderstandingInput): IntentUnderstandingResult {
  const rawPrompt = input.rawPrompt.trim();
  const confidenceThreshold = input.confidenceThreshold ?? DEFAULT_INTENT_CONFIDENCE_THRESHOLD;
  const categoryThreshold = input.categoryThreshold ?? DEFAULT_CATEGORY_CONFIDENCE_THRESHOLD;

  const productIntelligenceModel = buildProductIntelligenceModel(rawPrompt, {
    confidenceThreshold,
    categoryThreshold,
  });

  const readyForGeneration = productIntelligenceModel.confidence.meetsOverallThreshold;
  const blockedReason = deriveBlockedReason(productIntelligenceModel);
  const traceEvents = buildIntentUnderstandingTraceEvents(productIntelligenceModel);

  const result: IntentUnderstandingResult = {
    readOnly: true,
    understandingId: input.understandingId ?? nextUnderstandingId(),
    rawPrompt,
    productIntelligenceModel,
    readyForGeneration,
    blockedReason,
    traceEventCount: traceEvents.length,
    reportMarkdown: buildIntentUnderstandingReportMarkdown(productIntelligenceModel, {
      readyForGeneration,
      blockedReason,
    }),
    completedAt: Date.now(),
  };

  activeProductIntelligenceModel = productIntelligenceModel;
  lastUnderstandingResult = result;
  modelsBuilt += 1;
  confidenceSum += productIntelligenceModel.confidence.overallConfidence;
  if (!readyForGeneration) generationBlockedCount += 1;
  recordIntentUnderstandingHistory(result);

  return result;
}

export function requireProductIntelligenceModelForGeneration(rawPrompt: string): ProductIntelligenceModel {
  const existing = getActiveProductIntelligenceModel();
  if (existing && existing.sourcePromptHash === hashPromptQuick(rawPrompt)) {
    return existing;
  }
  const result = runIntentUnderstandingEngine({ rawPrompt });
  if (!result.readyForGeneration) {
    throw new Error(
      result.blockedReason ??
        'Generation blocked: Product Intelligence Model confidence below threshold.',
    );
  }
  return result.productIntelligenceModel;
}

function hashPromptQuick(rawPrompt: string): string {
  let hash = 0;
  for (let i = 0; i < rawPrompt.length; i += 1) {
    hash = (hash * 31 + rawPrompt.charCodeAt(i)) | 0;
  }
  return String(hash);
}

export function getIntentUnderstandingRuntimeReport(): IntentUnderstandingRuntimeReport {
  return {
    understandingsCompleted: understandingCounter,
    modelsBuilt,
    generationBlocked: generationBlockedCount,
    averageConfidence: modelsBuilt > 0 ? Math.round((confidenceSum / modelsBuilt) * 100) / 100 : 0,
    historySize: getIntentHistorySize(),
  };
}

// ─── Integration bridges ───────────────────────────────────────────────────

export function registerIntentUnderstandingWithAiDevEngine(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2AiDevEngineAuthority().passToken, readOnly: true };
}

export function registerIntentUnderstandingWithRequirementsToPlan(): {
  passToken: string;
  readOnly: true;
} {
  return {
    passToken: 'REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_V1',
    readOnly: true,
  };
}

export function registerIntentUnderstandingWithCapabilityPlanning(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CapabilityPlanningEngine().passToken, readOnly: true };
}

export function registerIntentUnderstandingWithPromptFaithfulness(): { connected: true; readOnly: true } {
  return { connected: true, readOnly: true };
}

export function registerIntentUnderstandingWithFeatureContracts(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithFounderTest(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithExecutionTrace(): { traceEventTypes: number; readOnly: true } {
  return { traceEventTypes: 11, readOnly: true };
}

export function registerIntentUnderstandingWithLaunchAuthority(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithUniversalProductionProof(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithMaterializationQuality(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithWorkspaceReality(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithUvl(): { passToken: string; readOnly: true } {
  return { passToken: INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN, readOnly: true };
}

export function registerIntentUnderstandingWithAutoFix(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithBlueprintGeneration(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithArchitecturePlanning(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}

export function registerIntentUnderstandingWithUniversalPromptToApp(): { usesProductModel: true; readOnly: true } {
  return { usesProductModel: true, readOnly: true };
}
