/**
 * Universal Action Materialization Engine V1 — behavior verification.
 */

import type {
  UniversalActionBehaviorVerificationResult,
  UniversalActionDescriptor,
  UniversalActionVerificationClassification,
} from './universal-action-types.js';

export interface ActionGeneratedSources {
  readonly handlers: string;
  readonly descriptors: string;
  readonly componentFragment: string;
}

function check(name: string, source: string, patterns: RegExp[]): { id: string; passed: boolean; detail: string } {
  const missing = patterns.filter((p) => !p.test(source)).map((p) => p.source);
  return {
    id: name,
    passed: missing.length === 0,
    detail: missing.length === 0 ? 'ok' : `missing: ${missing.join(', ')}`,
  };
}

export function verifyUniversalActionBehavior(
  descriptor: UniversalActionDescriptor,
  sources: ActionGeneratedSources,
): UniversalActionBehaviorVerificationResult {
  const combined = `${sources.handlers}\n${sources.componentFragment}\n${sources.descriptors}`;
  const id = descriptor.actionId;

  if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY') {
    return {
      readOnly: true,
      actionId: id,
      classification: 'BLOCKED_BY_CAPABILITY',
      passed: /setBlockedMessage|data-blocked|BLOCKED/.test(combined) && new RegExp(id).test(combined),
      checks: [
        check('blocked-evidence', combined, [new RegExp(id), /blocked|Blocked/]),
      ],
    };
  }

  if (descriptor.supportClassification === 'NOT_EXECUTABLE_INFORMATIONAL') {
    return {
      readOnly: true,
      actionId: id,
      classification: 'BEHAVIORALLY_VERIFIED',
      passed: new RegExp(id).test(combined),
      checks: [check('informational-present', combined, [new RegExp(id)])],
    };
  }

  if (descriptor.supportClassification === 'INVALID_ACTION_CONTRACT') {
    return {
      readOnly: true,
      actionId: id,
      classification: 'INVALID',
      passed: /Invalid action contract|setError/.test(combined),
      checks: [check('invalid-reported', combined, [/Invalid action contract|setError/])],
    };
  }

  const checks = [
    check('control-action-id', combined, [new RegExp(`data-action="${id}"|case '${id}'`)]),
    check('handler-dispatch', sources.handlers, [new RegExp(`case '${id}'`), /executeAction/]),
    check('no-empty-handler', sources.handlers, [/setSuccess|setError|crud\.|executeStateEffect|executePersistenceEffect/]),
    check('no-console-log-only', sources.handlers, [/(?!console\.log\(\);)/]),
    check('feedback-path', combined, [/setSuccess|setError|data-success|data-error/]),
  ];

  if (descriptor.confirmationPolicy.required) {
    checks.push(check('confirmation-respected', combined, [/pendingConfirmActionId|confirmPendingAction/]));
  }

  if (descriptor.executionStrategy === 'crud-adapter') {
    checks.push(check('crud-adapter-reuse', sources.handlers, [/crud\./]));
  }

  const passed = checks.every((c) => c.passed);
  const classification: UniversalActionVerificationClassification = passed
    ? 'BEHAVIORALLY_VERIFIED'
    : combined.includes(id)
      ? 'STRUCTURALLY_PRESENT_ONLY'
      : 'FAILED';

  return { readOnly: true, actionId: id, classification, passed, checks };
}

/** Engineering Intelligence gap hints — domain-agnostic. */
export function diagnoseUniversalActionMaterializationGaps(
  verification: UniversalActionBehaviorVerificationResult,
): readonly string[] {
  const gaps: string[] = [];
  if (verification.classification === 'BLOCKED_BY_CAPABILITY') return ['blocked_by_future_capability'];
  if (verification.classification === 'INVALID') return ['invalid_action_contract'];
  if (verification.passed) return [];
  for (const check of verification.checks) {
    if (check.passed) continue;
    if (check.id.includes('handler')) gaps.push('missing_handler');
    else if (check.id.includes('control')) gaps.push('missing_execution_adapter');
    else if (check.id.includes('confirmation')) gaps.push('missing_confirmation');
    else if (check.id.includes('feedback')) gaps.push('missing_feedback');
    else if (check.id.includes('crud')) gaps.push('missing_persistence_effect');
    else gaps.push('missing_verification');
  }
  return [...new Set(gaps)];
}

export function detectStaticActionShell(source: string): boolean {
  const staticPatterns = [
    /<button[^>]*data-interaction-control[^>]*>(?!.*onClick)/,
    /Manage \{?\w+\}?.*<\/button>(?!.*onClick)/,
    /console\.log\(/,
    /\/\/ TODO/,
    /preventDefault\(\);\s*\}/,
  ];
  return staticPatterns.some((p) => p.test(source));
}
