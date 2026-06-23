/**
 * AiDevEngine Capability Audit V1 — high duplicate-risk remediation decisions.
 * Every capability flagged HIGH duplicate risk must have an explicit decision here.
 */

import type { HighDuplicateRiskRemediation } from './capability-audit-types.js';

export type { HighDuplicateRiskRemediation };

export const HIGH_DUPLICATE_RISK_REMEDIATIONS: readonly HighDuplicateRiskRemediation[] = [
  {
    capabilityName: 'Requirement Completeness Intelligence',
    decision: 'MERGE',
    target: 'Clarifying Question Intelligence',
    rationale:
      'Completeness scoring and question generation overlap ~65% with CQI. Absorb as a completeness-scoring module inside CQI; retire parallel question engine.',
  },
  {
    capabilityName: 'Clarifying Question Intelligence',
    decision: 'KEEP',
    target: 'Clarifying Question Intelligence',
    rationale:
      'Authoritative requirement-readiness owner and Launch Council member. Absorbs Requirement Completeness Intelligence; no new authority needed.',
  },
  {
    capabilityName: 'Unified Verification Lab (UVL)',
    decision: 'EXTEND',
    target: 'Unified Verification Lab (UVL)',
    rationale:
      'UVL becomes the unified verification hub. Absorb Verification Orchestrator scheduling and wire full execution; Feature/Engineering Reality remain specialized runners.',
  },
  {
    capabilityName: 'Verification Orchestrator',
    decision: 'MERGE',
    target: 'Unified Verification Lab (UVL)',
    rationale:
      'Planning-only orchestrator duplicates UVL session lifecycle. Delegate scheduling and provider routing to UVL; remove standalone orchestrator authority.',
  },
  {
    capabilityName: 'Launch Readiness Authority',
    decision: 'MERGE',
    target: 'Autonomous Founder Launch Authority',
    rationale:
      'Readiness scoring overlaps ~50% with AFLA. Thresholds become AFLA input signals; Launch Council consumes AFLA verdict instead of parallel readiness scoring.',
  },
  {
    capabilityName: 'Founder Launch Decision Authority',
    decision: 'EXTEND',
    target: 'Autonomous Founder Launch Authority',
    rationale:
      'Decision layer should consume AFLA + Launch Council outputs. Extend to delegate scoring to AFLA capstone rather than re-implementing readiness checks.',
  },
  {
    capabilityName: 'Founder Acceptance Stack (24.8)',
    decision: 'KEEP',
    target: 'Founder Acceptance Stack (24.8)',
    rationale:
      'Authoritative acceptance orchestrator with 8 validated sub-modules. Founder Testing Mode V1–V5 and Founder Test Integration should delegate, not duplicate.',
  },
  {
    capabilityName: 'Navigation Review (Dedicated)',
    decision: 'REMOVE',
    rationale:
      'Phantom capability — not present in codebase. Do not build a standalone navigation authority; navigation checks remain in UI Reviewer Authority and Blueprint Visual.',
  },
  {
    capabilityName: 'World2 Execution Engine',
    decision: 'MERGE',
    target: 'World2 Disposable Workspace Pipeline (24E–24Y)',
    rationale:
      'Phase 7 execution modes duplicate Phase 24E–24Y disposable pipeline. Absorb queue modes and scope boundaries into the 24E–24Y capstone.',
  },
  {
    capabilityName: 'World2 Disposable Workspace Pipeline (24E–24Y)',
    decision: 'EXTEND',
    target: 'World2 Disposable Workspace Pipeline (24E–24Y)',
    rationale:
      'Canonical World2 execution path. Extend to absorb Phase 7 and Phase 15 eras, register in ownership registry, and delegate to execution_package_runtime.',
  },
] as const;

export function listHighDuplicateRiskRemediations(): readonly HighDuplicateRiskRemediation[] {
  return HIGH_DUPLICATE_RISK_REMEDIATIONS;
}
