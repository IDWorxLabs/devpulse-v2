/**
 * Build Result Conversational Intelligence V1 — deterministic profile mismatch chat responses.
 */

import type { BuildResultConversationalContext } from './build-result-conversational-types.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import { shouldSuppressProfileMismatchForBuild } from '../autonomous-engineering-executive/index.js';

const EXPENSE_PROFILES = new Set(['EXPENSE_TRACKER_WEB_V1', 'FINANCE_TRACKER_WEB_V1']);

export function resolveExpectedProfileLabel(context: BuildResultConversationalContext): string {
  const intent = context.classification.inferredProductIntent;
  if (intent === 'expense tracking' || intent === 'finance tracking') {
    return 'EXPENSE_TRACKER_WEB_V1 or FINANCE_TRACKER_WEB_V1';
  }
  if (context.classification.rejectedProfiles.length > 0) {
    return context.classification.rejectedProfiles[0] ?? 'a matching application profile';
  }
  return 'an application profile that matches your request';
}

export function composeProfileMismatchChatResponse(context: BuildResultConversationalContext): string {
  const projectName = context.activeProjectName || 'your project';
  const selected = context.selectedProfile ?? 'unknown profile';
  const expected = resolveExpectedProfileLabel(context);
  const previewNote =
    context.previewUrl && context.buildStatus === 'READY'
      ? ` The preview is available at ${context.previewUrl}, but this build should not be treated as correct until profile selection is fixed.`
      : context.buildStatus === 'READY'
        ? ' A preview may be available, but this build should not be treated as correct until profile selection is fixed.'
        : '';

  if (
    /expensetracker/i.test(projectName) ||
    /expensetracker/i.test(context.userPrompt) ||
    context.classification.inferredProductIntent === 'expense tracking'
  ) {
    if (selected === 'CRM_WEB_V1' || !EXPENSE_PROFILES.has(selected)) {
      return [
        `${projectName} build ran, but I detected a profile mismatch: the system selected ${selected} instead of an expense-tracking profile (${expected}).${previewNote}`,
        '',
        'What to review next:',
        '- Confirm the build profile before signing off on this app.',
        '- Re-run the build after profile classification is corrected, or adjust the prompt to emphasize expense/finance keywords.',
        context.classification.profileMismatchWarnings[0]
          ? `- ${context.classification.profileMismatchWarnings[0]}`
          : `- Keyword evidence: ${context.classification.matchedKeywords.join(', ') || 'weak'}`,
      ].join('\n');
    }
  }

  const statusLine =
    context.buildStatus === 'READY'
      ? `${projectName} finished building.`
      : context.buildStatus === 'FAILED'
        ? `${projectName} build failed during execution.`
        : `${projectName} build is in progress.`;

  return [
    `${statusLine} I detected a profile alignment issue: selected ${selected}, but the request looks like it wanted ${expected}.${previewNote}`,
    '',
    context.classification.alignmentReason,
    '',
    'What to review next:',
    '- Verify the selected profile matches your product intent.',
    '- Check Operator Feed classification evidence before treating output as correct.',
    ...(context.classification.profileMismatchWarnings.length
      ? context.classification.profileMismatchWarnings.map((warning) => `- ${warning}`)
      : []),
  ].join('\n');
}

/** True when profile mismatch evidence exists (passed to LLM; fallback only when LLM unavailable). */
export function hasProfileMismatchEvidence(
  context: BuildResultConversationalContext,
  buildResult?: OnePromptLivePreviewBuildResult | null,
): boolean {
  if (
    buildResult &&
    shouldSuppressProfileMismatchForBuild(buildResult, context.classification)
  ) {
    return false;
  }
  return (
    context.classification.alignmentVerdict === 'PROFILE_MISMATCH' ||
    context.classification.profileMismatchWarnings.length > 0
  );
}

/** @deprecated Use hasProfileMismatchEvidence — mismatch no longer bypasses LLM. */
export function shouldUseProfileMismatchChatResponse(context: BuildResultConversationalContext): boolean {
  return hasProfileMismatchEvidence(context);
}
