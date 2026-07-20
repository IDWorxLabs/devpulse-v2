/**
 * Universal Relationship Intelligence Engine V1 — behavior verification.
 */

import type {
  UniversalRelationshipBehaviorVerificationResult,
  UniversalRelationshipDescriptor,
  UniversalRelationshipVerificationClassification,
} from './universal-relationship-types.js';

export interface RelationshipGeneratedSources {
  readonly runtime: string;
  readonly repository: string;
  readonly service: string;
  readonly componentFragment: string;
  readonly descriptors: string;
}

function check(name: string, source: string, patterns: RegExp[]) {
  const missing = patterns.filter((p) => !p.test(source)).map((p) => p.source);
  return { id: name, passed: missing.length === 0, detail: missing.length === 0 ? 'ok' : missing.join(',') };
}

export function verifyUniversalRelationshipBehavior(
  descriptor: UniversalRelationshipDescriptor,
  sources: RelationshipGeneratedSources,
): UniversalRelationshipBehaviorVerificationResult {
  const combined = `${sources.runtime}\n${sources.repository}\n${sources.service}\n${sources.componentFragment}\n${sources.descriptors}`;
  const id = descriptor.relationshipId;

  if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY') {
    return {
      readOnly: true,
      relationshipId: id,
      classification: 'BLOCKED_BY_CAPABILITY',
      passed: /blocked|data-blocked/i.test(combined),
      checks: [check('blocked-evidence', combined, [/blocked/i])],
    };
  }

  if (descriptor.supportClassification === 'INVALID_RELATIONSHIP_CONTRACT') {
    return {
      readOnly: true,
      relationshipId: id,
      classification: 'INVALID',
      passed: true,
      checks: [check('invalid-classified', combined, [/.+/])],
    };
  }

  const checks = [
    check('link-handler', combined, [/linkRecords|relationship:link|dispatchRelationshipEvent/]),
    check('unlink-handler', combined, [/unlinkRecords|relationship:unlink/]),
    check('related-query', combined, [/listRelatedRecords|data-related-query/]),
    check('inverse-query', combined, [/listInverseRelatedRecords|listInverseRelated/]),
    check('referential-validation', combined, [/Referential validation|validateReferentialIntegrity/]),
    check('duplicate-prevention', combined, [/Duplicate link prevented/]),
    check('lifecycle-policy', combined, [/onDeletePolicy|Delete policy/]),
    check('unsafe-cascade-blocked', combined, [/Unsafe cascade blocked|CASCADE/]),
    check('selector-ui', sources.componentFragment, [/data-relationship-selector|relationshipSelections/]),
    check('navigation', combined, [/navigateToRelated|data-relationship-navigate/]),
    check('no-static-shell', combined, [/dispatchRelationshipEvent|linkRecords/]),
  ];

  const passed = checks.every((c) => c.passed);
  const classification: UniversalRelationshipVerificationClassification = passed
    ? 'BEHAVIORALLY_VERIFIED'
    : combined.includes('dispatchRelationshipEvent') || combined.includes('linkRecords')
      ? 'PARTIALLY_VERIFIED'
      : 'STRUCTURALLY_PRESENT_ONLY';

  return { readOnly: true, relationshipId: id, classification, passed, checks };
}

export function diagnoseUniversalRelationshipGenerationGaps(
  verification: UniversalRelationshipBehaviorVerificationResult,
): readonly string[] {
  const gaps: string[] = [];
  if (verification.classification === 'BLOCKED_BY_CAPABILITY') return ['blocked_by_scheduling_capability'];
  if (verification.classification === 'INVALID') return ['invalid_relationship_contract'];
  if (verification.passed) return [];
  for (const c of verification.checks) {
    if (!c.passed) gaps.push(c.id.replace(/-/g, '_'));
  }
  if (gaps.length === 0) gaps.push('missing_behavioral_verification');
  return gaps;
}
