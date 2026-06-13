/**
 * Phase 25.37 — Operational self-diagnosis before final chat response.
 */

import type {
  ChatCognitiveIntent,
  ChatProjectRealityContext,
  ChatSelfDiagnosisResult,
  ChatSelfModel,
} from './chat-cognitive-types.js';
import type { ChatCapabilityBoundary } from './chat-cognitive-types.js';
import { isGenericOnboardingBlocked } from './generic-fallback-guard.js';

export function runOperationalSelfDiagnosis(input: {
  message: string;
  intent: ChatCognitiveIntent;
  draftText: string;
  selfModel: ChatSelfModel;
  projectContext: ChatProjectRealityContext;
  boundaries: ChatCapabilityBoundary[];
  intentConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
}): ChatSelfDiagnosisResult {
  const { message, intent, draftText, selfModel, projectContext, boundaries, intentConfidence } =
    input;
  const lower = draftText.toLowerCase();
  const promptLower = message.toLowerCase();

  const knows: string[] = [
    selfModel.whatItIs,
    ...projectContext.signals.filter((s) => s.confidence !== 'UNKNOWN').map((s) => `${s.label}: ${s.value}`),
  ].slice(0, 6);

  const doesNotKnow: string[] = [
    ...projectContext.evidenceGaps,
    ...boundaries.filter((b) => b.level === 'UNKNOWN' || b.level === 'UNPROVEN').map((b) => b.capability),
  ].slice(0, 6);

  const positiveOverclaimPatterns = [
    /\bi am fully self-aware\b/i,
    /\bi am conscious\b/i,
    /\bi am sentient\b/i,
    /\bhuman-like consciousness\b/i,
    /\b100%\b/i,
    /\balways ready\b/i,
    /\bcomplete your app from one prompt\b/i,
    /\bi guarantee\b/i,
    /\bwe guarantee\b/i,
    /\bfully ready to launch\b/i,
    /\bbuild your complete app from one prompt\b/i,
  ];

  const overclaiming = positiveOverclaimPatterns.some((pattern) => {
    const match = draftText.match(pattern);
    if (!match || match.index === undefined) return false;
    const before = draftText.slice(Math.max(0, match.index - 40), match.index);
    return !/\b(not|no|cannot|can't|don't|do not|should not|without|never|avoid)\b/i.test(before);
  });

  const genericViolation = isGenericOnboardingBlocked(intent, draftText);
  const answeredActualQuestion =
    !genericViolation &&
    draftText.trim().length >= 40 &&
    (intentConfidence === 'HIGH' ||
      promptLower.split(/\W+/).filter((w) => w.length > 3).some((w) => lower.includes(w)) ||
      ['SELF_AWARENESS', 'CREATOR_OR_ORIGIN', 'LIMITATION', 'TRUST'].includes(intent));

  const shouldAdmitLimitation =
    overclaiming ||
    intent === 'LIMITATION' ||
    intent === 'SELF_AWARENESS' ||
    projectContext.evidenceGaps.length > 0;

  const missingCapability =
    boundaries.find((b) => b.level === 'CONTRADICTED')?.capability ??
    boundaries.find((b) => b.level === 'UNPROVEN' && ['autonomous_build_execution', 'launch_readiness'].includes(b.capability))
      ?.capability ??
    null;

  return {
    readOnly: true,
    knows: knows.slice(0, 5),
    doesNotKnow: doesNotKnow.slice(0, 5),
    evidenceUsed: [
      ...projectContext.signals.map((s) => s.source),
      ...boundaries.flatMap((b) => b.evidenceUsed),
    ].slice(0, 8),
    missingCapability,
    overclaiming,
    answeredActualQuestion,
    useful: answeredActualQuestion && !overclaiming && !genericViolation,
    shouldAskClarifyingQuestion: intentConfidence === 'LOW' && intent === 'UNKNOWN',
    shouldAdmitLimitation,
    clarifyingQuestion:
      intentConfidence === 'LOW'
        ? 'Are you asking about AiDevEngine itself, your project status, or a product you want to build?'
        : null,
  };
}
