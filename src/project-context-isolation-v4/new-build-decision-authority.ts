/**
 * New Build Decision Authority — classifies each build request as NEW_BUILD,
 * CONTINUE_EXISTING_PROJECT, or AMBIGUOUS_REQUIRES_CONFIRMATION, using only evidence present in
 * the current request. Deterministic, generic (no product-domain branching), pure function.
 *
 * The prompt-heuristic classification itself is delegated to New Build Decision Authority V2
 * (new-build-decision-authority-v2.ts), which replaced the original binary keyword matching with
 * weighted evidence scoring to eliminate false-positive AMBIGUOUS_REQUIRES_CONFIRMATION decisions
 * for prompts that are clearly complete new-application requests. This file keeps the original
 * `classifyNewBuildDecision` name and `BuildDecisionResult` shape so every existing caller
 * (chat-to-build-execution-bridge-v1, one-prompt-live-preview, and their validators) keeps working
 * unchanged, while the explicit buildIntentOverride contract introduced by
 * NEW_BUILD_CONFIRMATION_REQUIRED UX V4 is preserved byte-for-byte: an override is the user's
 * direct answer to a prior confirmation panel and always takes precedence over prompt heuristics.
 */

import type { BuildDecisionInput, BuildDecisionResult } from './project-context-isolation-types.js';
import { classifyNewBuildDecisionV2 } from './new-build-decision-authority-v2.js';
import { isIdentityCompatible, IDENTITY_COMPATIBILITY_THRESHOLD } from './new-build-decision-score.js';

export function classifyNewBuildDecision(input: BuildDecisionInput): BuildDecisionResult {
  const rawPrompt = input.rawPrompt ?? '';

  const v2 = classifyNewBuildDecisionV2({
    rawPrompt,
    requestedProjectId: input.requestedProjectId,
    requestedProjectName: input.requestedProjectName,
    hasKnownExistingProject: input.hasKnownExistingProject,
    currentProjectIdentitySummary: input.currentProjectIdentitySummary,
  });
  const continuationSignals = v2.continuationEvidence.map((e) => e.reason);
  const newBuildSignals = v2.newBuildEvidence.map((e) => e.reason);
  const identityCompatible = isIdentityCompatible(rawPrompt, input.currentProjectIdentitySummary);

  // NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — an explicit buildIntentOverride is the user's direct
  // answer to a prior AMBIGUOUS_REQUIRES_CONFIRMATION panel and takes precedence over prompt-text
  // heuristics below. It is evaluated first, but it never skips the downstream Context Scope /
  // Stale Context Detector stages — it only changes which BuildDecisionKind those stages receive.
  if (input.buildIntentOverride === 'START_NEW_BUILD') {
    return {
      readOnly: true,
      decision: 'NEW_BUILD',
      confidence: 1,
      reasons: [
        'Explicit user buildIntentOverride=START_NEW_BUILD received from the confirmation panel — forces a new build, blocks activeProjectId fallback, and blocks all inherited context regardless of prompt wording.',
      ],
      continuationSignals,
      newBuildSignals,
      message: null,
      overrideApplied: 'START_NEW_BUILD',
      overrideRejected: null,
    };
  }

  if (input.buildIntentOverride === 'CONTINUE_EXISTING_PROJECT') {
    if (!input.hasKnownExistingProject) {
      const rejection = 'No existing/active project is available to continue — continuation is unsafe without a known project.';
      return {
        readOnly: true,
        decision: 'AMBIGUOUS_REQUIRES_CONFIRMATION',
        confidence: 0.3,
        reasons: [`Requested buildIntentOverride=CONTINUE_EXISTING_PROJECT rejected: ${rejection}`],
        continuationSignals,
        newBuildSignals,
        message:
          'There is no existing project available to continue. Start a brand-new app from this prompt instead, or specify which project to continue.',
        overrideApplied: null,
        overrideRejected: { requested: 'CONTINUE_EXISTING_PROJECT', reason: rejection },
      };
    }
    if (!identityCompatible) {
      const rejection = `The prompt's product identity is incompatible with the current project's identity summary (meaningful, non-generic overlap below ${IDENTITY_COMPATIBILITY_THRESHOLD}) — continuation is unsafe.`;
      return {
        readOnly: true,
        decision: 'AMBIGUOUS_REQUIRES_CONFIRMATION',
        confidence: 0.3,
        reasons: [`Requested buildIntentOverride=CONTINUE_EXISTING_PROJECT rejected: ${rejection}`],
        continuationSignals,
        newBuildSignals,
        message:
          'This prompt describes a different product than the current project, so continuing it is unsafe. Start a brand-new app from this prompt instead.',
        overrideApplied: null,
        overrideRejected: { requested: 'CONTINUE_EXISTING_PROJECT', reason: rejection },
      };
    }
    return {
      readOnly: true,
      decision: 'CONTINUE_EXISTING_PROJECT',
      confidence: 1,
      reasons: [
        'Explicit user buildIntentOverride=CONTINUE_EXISTING_PROJECT accepted from the confirmation panel — an existing, product-identity-compatible project is available.',
      ],
      continuationSignals,
      newBuildSignals,
      message: null,
      overrideApplied: 'CONTINUE_EXISTING_PROJECT',
      overrideRejected: null,
    };
  }

  // No override: the decision is entirely the evidence-weighted result of V2.
  return {
    readOnly: true,
    decision: v2.decision,
    confidence: v2.confidence,
    reasons: [v2.explanation],
    continuationSignals,
    newBuildSignals,
    message: v2.message,
    overrideApplied: null,
    overrideRejected: null,
  };
}
