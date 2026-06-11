/**
 * AiDev / Requirement Extractor bridge — clarifying live gate before extraction.
 */

import type { AiDevRequest } from '../aidev-engine/types.js';
import { extractRequirements } from '../requirement-extractor/requirement-extraction-engine.js';
import type { RequirementExtractionResult } from '../requirement-extractor/types.js';
import {
  applyClarifyingAnswersToPrompt,
  evaluateClarifyingLiveGate,
} from './clarifying-question-live-gate.js';
import { buildClarifyingEvidenceText } from './clarifying-question-live-gate-memory.js';
import type { ClarifyingLiveGateResult, LiveGateCategoryId } from './clarifying-question-live-gate-types.js';

export interface RequirementExtractionGateResult {
  blocked: boolean;
  gate: ClarifyingLiveGateResult;
  extraction?: RequirementExtractionResult;
}

export function evaluateRequirementExtractionGate(input: {
  request: AiDevRequest;
  projectId?: string;
}): ClarifyingLiveGateResult {
  return evaluateClarifyingLiveGate({
    userPrompt: input.request.normalizedInput || input.request.userInput,
    requestId: input.request.requestId,
    projectId: input.projectId,
    requiresBuildIntent: true,
  });
}

export function extractRequirementsWithClarifyingGate(input: {
  request: AiDevRequest;
  projectId?: string;
}): RequirementExtractionGateResult {
  const gate = evaluateRequirementExtractionGate(input);
  if (gate.planningBlocked) {
    return {
      blocked: true,
      gate,
      extraction: {
        extractionId: `blocked-${input.request.requestId}`,
        requestId: input.request.requestId,
        requirements: [],
        warnings: [
          'Requirement extraction blocked — clarifying questions must be answered before planning.',
          gate.clarificationMessage,
        ],
        errors: ['CLARIFICATION_REQUIRED'],
      },
    };
  }

  const evidenceText = buildClarifyingEvidenceText({
    userPrompt: input.request.normalizedInput || input.request.userInput,
    requestId: input.request.requestId,
    projectId: input.projectId,
  });
  const extraction = extractRequirements({
    requestId: input.request.requestId,
    userInput: evidenceText,
  });

  return { blocked: false, gate, extraction };
}

export function resolveRequirementGateWithAnswers(input: {
  request: AiDevRequest;
  projectId?: string;
  answers: ReadonlyArray<{ categoryId: LiveGateCategoryId; answer: string }>;
}): RequirementExtractionGateResult {
  applyClarifyingAnswersToPrompt({
    userPrompt: input.request.normalizedInput || input.request.userInput,
    requestId: input.request.requestId,
    projectId: input.projectId,
    answers: input.answers,
  });
  return extractRequirementsWithClarifyingGate(input);
}
