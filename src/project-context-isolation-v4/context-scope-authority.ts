/**
 * Context Scope Authority — builds a deterministic, evidence-backed ContextScope object for
 * every build, listing exactly which context sources are allowed vs blocked, and why.
 */

import type {
  BuildContextScopeInput,
  ContextScope,
  ContextSourceDecision,
  ContextSourceId,
} from './project-context-isolation-types.js';

const ALL_PREVIOUS_SOURCES: ContextSourceId[] = [
  'PREVIOUS_ACTIVE_PROJECT',
  'PREVIOUS_PROJECT_METADATA',
  'PREVIOUS_CONCEPTS',
  'PREVIOUS_CANONICAL_CONTRACT',
  'PREVIOUS_CONCEPT_GRAPH',
  'PREVIOUS_MODULE_PLAN',
  'PREVIOUS_FEATURE_CONTRACT',
  'PREVIOUS_ROUTES_NAVIGATION',
  'PREVIOUS_MATERIALIZATION_MANIFEST',
  'PREVIOUS_PREVIEW_EVIDENCE',
  'PREVIOUS_FAITHFULNESS_REPORT',
  'PREVIOUS_RECOVERED_CONCEPTS',
  'PREVIOUS_FALLBACK_MODULE_EVIDENCE',
  'PREVIOUS_BUILD_RESULT',
  'PREVIOUS_RUNTIME_ACTIVATION_STATE',
  'PREVIOUS_LIVE_PREVIEW_PROOF',
];

export function buildContextScope(input: BuildContextScopeInput): ContextScope {
  const allowed: ContextSourceDecision[] = [
    { source: 'CURRENT_PROMPT', allowed: true, reason: 'Current prompt is always the primary evidence source for the build.' },
  ];
  const blocked: ContextSourceDecision[] = [];
  let inheritedProjectId: string | null = null;

  if (input.decision === 'NEW_BUILD') {
    for (const source of ALL_PREVIOUS_SOURCES) {
      blocked.push({
        source,
        allowed: false,
        reason: 'Build decision is NEW_BUILD — previous-project sources are excluded to prevent stale context contamination.',
      });
    }
  } else if (input.decision === 'CONTINUE_EXISTING_PROJECT') {
    const explicitId = input.explicitlyReferencedProjectId?.trim() || null;
    inheritedProjectId = explicitId;
    for (const source of ALL_PREVIOUS_SOURCES) {
      if (source === 'PREVIOUS_ACTIVE_PROJECT') {
        const activeCandidate = input.activeProjectIdCandidate ?? null;
        if (explicitId && activeCandidate === explicitId) {
          allowed.push({
            source,
            allowed: true,
            reason: `Continuation explicitly justified: active project (${activeCandidate}) matches the explicitly continued project.`,
          });
        } else if (explicitId) {
          blocked.push({
            source,
            allowed: false,
            reason: `Active project candidate (${activeCandidate ?? 'none'}) does not match the explicitly continued project (${explicitId}); blocked as stale/unrelated.`,
          });
        } else {
          blocked.push({
            source,
            allowed: false,
            reason: 'CONTINUE_EXISTING_PROJECT decision did not explicitly reference a project id; active project source blocked pending explicit reference.',
          });
        }
        continue;
      }
      if (explicitId) {
        allowed.push({
          source,
          allowed: true,
          reason: `Continuation explicitly justified for project ${explicitId}; product identity remains compatible with the current prompt.`,
        });
      } else {
        blocked.push({
          source,
          allowed: false,
          reason: 'CONTINUE_EXISTING_PROJECT decision lacks an explicit project reference; source blocked pending explicit reference.',
        });
      }
    }
  } else {
    for (const source of ALL_PREVIOUS_SOURCES) {
      blocked.push({
        source,
        allowed: false,
        reason: 'Build decision is AMBIGUOUS_REQUIRES_CONFIRMATION — generation must stop before using any inherited context.',
      });
    }
  }

  return {
    readOnly: true,
    requestId: input.requestId,
    buildId: input.buildId,
    projectId: input.projectId,
    decision: input.decision,
    currentPromptHash: input.currentPromptHash,
    allowedContextSources: allowed,
    blockedContextSources: blocked,
    inheritedProjectId,
    inheritedConcepts: input.decision === 'CONTINUE_EXISTING_PROJECT' ? (input.inheritedConcepts ?? []) : [],
  };
}

export function isSourceBlocked(scope: ContextScope, source: ContextSourceId): boolean {
  return scope.blockedContextSources.some((entry) => entry.source === source);
}

export function isSourceAllowed(scope: ContextScope, source: ContextSourceId): boolean {
  return scope.allowedContextSources.some((entry) => entry.source === source);
}
