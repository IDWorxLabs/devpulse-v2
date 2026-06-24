/**
 * Canonical Capability Ownership V1 — consolidation groups (Phase Next).
 */

import type { ConsolidationGroup } from './canonical-capability-ownership-types.js';

export const CONSOLIDATION_GROUPS: readonly ConsolidationGroup[] = [
  {
    id: 'LAUNCH_READINESS_AUTHORITY',
    auditDecision: 'MERGE',
    target: 'Autonomous Founder Launch Authority',
    reason:
      'Launch readiness and launch decision making are now effectively the same responsibility.',
    canonicalOwner: 'Autonomous Founder Launch Authority',
    canonicalOwnerPath: 'src/autonomous-founder-launch-authority/',
    mergedCapabilities: ['Launch Readiness Authority'],
    responsibilities: [
      'Launch Decision',
      'Launch Approval',
      'Launch Blockers',
      'Launch Verdicts',
      'Launch Confidence',
      'Launch Readiness State',
    ],
    validationCriterion: 'No duplicated launch verdict generation remains.',
  },
  {
    id: 'VERIFICATION_ORCHESTRATOR',
    auditDecision: 'MERGE',
    target: 'Unified Verification Lab (UVL)',
    reason: 'UVL is already the verification hub. Verification orchestration should not exist as a separate capability.',
    canonicalOwner: 'Unified Verification Lab (UVL)',
    canonicalOwnerPath: 'src/unified-verification-lab/',
    mergedCapabilities: ['Verification Orchestrator'],
    responsibilities: [
      'Verification Execution',
      'Verification Scheduling',
      'Verification Coordination',
      'Verification Status',
      'Verification Aggregation',
    ],
    validationCriterion: 'Verification Orchestrator no longer acts as a separate authority.',
  },
  {
    id: 'REQUIREMENT_COMPLETENESS_INTELLIGENCE',
    auditDecision: 'MERGE',
    target: 'Clarifying Question Intelligence',
    reason: 'Both systems attempt to determine missing information.',
    canonicalOwner: 'Clarifying Question Intelligence',
    canonicalOwnerPath: 'src/clarifying-question-intelligence/',
    mergedCapabilities: ['Requirement Completeness Intelligence'],
    responsibilities: [
      'Missing Requirement Detection',
      'Requirement Completeness',
      'Requirement Gaps',
      'Question Generation',
      'Requirement Confidence',
    ],
    validationCriterion: 'Single requirement-intelligence ownership path exists.',
  },
  {
    id: 'NAVIGATION_REVIEW',
    auditDecision: 'REMOVE',
    target: 'Blueprint Visual Validation + Founder UX Review',
    reason: 'Covered by Blueprint Visual Validation and Founder UX Review.',
    canonicalOwner: 'Blueprint Visual Validation + Founder UX Review',
    canonicalOwnerPath: 'src/universal-app-blueprint-visual/, src/ui-reviewer-authority/',
    mergedCapabilities: ['Navigation Review (Dedicated)'],
    responsibilities: ['Navigation UX checks (distributed)'],
    validationCriterion: 'Navigation Review capability status = REMOVED.',
  },
  {
    id: 'WORLD2_EXECUTION_ENGINE',
    auditDecision: 'MERGE',
    target: 'World2 Disposable Workspace Pipeline (24E–24Y)',
    reason: 'World2 should have a single execution architecture.',
    canonicalOwner: 'World2 Disposable Workspace Pipeline (24E–24Y)',
    canonicalOwnerPath: 'src/world2-disposable-workspace/',
    mergedCapabilities: ['World2 Execution Engine'],
    responsibilities: [
      'Workspace Creation',
      'Workspace Isolation',
      'Workspace Execution',
      'Workspace Disposal',
      'Workspace Lifecycle',
    ],
    validationCriterion: 'Single World2 execution ownership path exists.',
  },
] as const;

export function listConsolidationGroups(): readonly ConsolidationGroup[] {
  return CONSOLIDATION_GROUPS;
}

export function getConsolidationGroup(
  id: ConsolidationGroup['id'],
): ConsolidationGroup | undefined {
  return CONSOLIDATION_GROUPS.find((group) => group.id === id);
}
