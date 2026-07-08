/**
 * Project Context Isolation V4 — report section builder.
 *
 * Produces the data object (and a human-readable text rendering) that build/failure reports
 * attach so it is obvious when AiDevEngine prevented stale context contamination.
 */

import type {
  BuildDecisionResult,
  ContextIsolationReportSection,
  ContextScope,
  PromptResetPlan,
  StaleContextCheckResult,
} from './project-context-isolation-types.js';

export function buildContextIsolationReportSection(input: {
  decision: BuildDecisionResult;
  scope: ContextScope;
  resetPlan?: PromptResetPlan | null;
  staleChecks?: StaleContextCheckResult[];
  productIdentity: string | null;
  activeProjectIdFallbackBlocked: boolean;
}): ContextIsolationReportSection {
  const staleChecks = input.staleChecks ?? [];
  // NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — a decision only carries overrideApplied/overrideRejected
  // when the caller explicitly answered a prior confirmation panel, so their presence is itself
  // the evidence that confirmation was required for this build (requirement 6 / scenario 17-18).
  const overrideApplied = input.decision.overrideApplied ?? null;
  const overrideRejected = input.decision.overrideRejected ?? null;
  return {
    readOnly: true,
    decision: input.decision.decision,
    isNewBuild: input.decision.decision === 'NEW_BUILD',
    productIdentity: input.productIdentity,
    inheritedProjectId: input.scope.inheritedProjectId,
    inheritedContextSources: input.scope.allowedContextSources.map((s) => s.source),
    blockedContextSources: input.scope.blockedContextSources.map((s) => s.source),
    staleContextDetections: staleChecks.flatMap((check) => check.detections.filter((d) => d.detected)),
    resetActionsPerformed: input.resetPlan?.actions ?? [],
    activeProjectIdFallbackBlocked: input.activeProjectIdFallbackBlocked,
    confirmationWasRequired: Boolean(overrideApplied) || Boolean(overrideRejected),
    buildIntentOverride: overrideApplied,
    overrideRejected,
  };
}

export function renderContextIsolationReportMarkdown(section: ContextIsolationReportSection): string {
  const lines: string[] = [];
  lines.push('### Project Context Isolation');
  lines.push('');
  lines.push(`- Build decision: **${section.decision}**${section.isNewBuild ? ' (fresh project scope, current prompt only)' : ''}`);
  lines.push(`- Product identity: ${section.productIdentity ?? '(none recorded)'}`);
  lines.push(`- Inherited project id: ${section.inheritedProjectId ?? 'none'}`);
  lines.push(`- activeProjectId fallback blocked: ${section.activeProjectIdFallbackBlocked ? 'yes' : 'no'}`);
  lines.push(`- Confirmation was required: ${section.confirmationWasRequired ? 'yes' : 'no'}`);
  if (section.buildIntentOverride) {
    lines.push(`- User selected: ${section.buildIntentOverride}`);
  }
  if (section.overrideRejected) {
    lines.push(
      `- Requested override rejected: ${section.overrideRejected.requested} — ${section.overrideRejected.reason}`,
    );
  }
  lines.push(
    `- Allowed context sources: ${section.inheritedContextSources.length ? section.inheritedContextSources.join(', ') : 'none'}`,
  );
  lines.push(
    `- Blocked stale context sources: ${section.blockedContextSources.length ? section.blockedContextSources.join(', ') : 'none'}`,
  );
  if (section.staleContextDetections.length) {
    lines.push('- Stale context detections:');
    for (const detection of section.staleContextDetections) {
      lines.push(`  - [${detection.kind}] ${detection.detail}`);
    }
  } else {
    lines.push('- Stale context detections: none');
  }
  if (section.resetActionsPerformed.length) {
    const cleared = section.resetActionsPerformed.filter((a) => a.cleared).length;
    lines.push(`- Reset actions performed: ${cleared}/${section.resetActionsPerformed.length} categories cleared`);
  }
  return lines.join('\n');
}
