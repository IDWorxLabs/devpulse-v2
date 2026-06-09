/**
 * Visual verification validator — gate evaluation for verification readiness.
 */

import type { InteractionTestingReport } from '../interaction-testing-engine/types.js';
import type { UiInspectionReport } from '../ui-inspection-engine/types.js';
import type { SelfVisionSession } from '../self-vision-runtime/types.js';
import type { VerifyVisualOutcomeInput } from './types.js';

export interface VisualVerificationGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface VisualVerificationValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateVisualVerificationGates(
  input: VerifyVisualOutcomeInput,
  opts: {
    inspectionReportExists: boolean;
    interactionReportExists: boolean;
    selfVisionSessionExists: boolean;
    previewContextExists: boolean;
  },
): VisualVerificationGateReport {
  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists ?? true,
      summary: 'Project must exist for verification association',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists ?? true,
      summary: 'Workspace must exist for verification isolation',
    },
    {
      name: 'Inspection Report Exists',
      satisfied: opts.inspectionReportExists,
      summary: 'UI inspection report required before visual verification',
    },
    {
      name: 'Interaction Report Exists',
      satisfied: opts.interactionReportExists,
      summary: 'Interaction testing report required before outcome verification',
    },
    {
      name: 'Self Vision Session Exists',
      satisfied: opts.selfVisionSessionExists,
      summary: 'Self vision session required for verification evidence',
    },
    {
      name: 'Preview Context Exists',
      satisfied: opts.previewContextExists,
      summary: 'Preview context required for verification linkage',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid ?? true,
      summary: 'Visual verification engine ownership must be registered',
    },
    {
      name: 'World 1 Protection',
      satisfied: input.world1Protected ?? true,
      summary: 'World 1 protection must be maintained',
    },
  ];

  const blockers = gates.filter((g) => !g.satisfied).map((g) => `Gate unsatisfied: ${g.name} — ${g.summary}`);

  return { gates, blockers };
}

export function validateVisualVerification(opts: {
  gateReport: VisualVerificationGateReport;
  inspectionReport: UiInspectionReport | null;
  interactionReport: InteractionTestingReport | null;
  session: SelfVisionSession | null;
}): VisualVerificationValidationResult {
  const blockers = [...opts.gateReport.blockers];

  if (opts.inspectionReport?.inspectionState === 'INSPECTION_BLOCKED') {
    blockers.push('UI inspection report is blocked — visual verification cannot proceed');
  }

  if (opts.interactionReport?.interactionState === 'BLOCKED') {
    blockers.push('Interaction testing report is blocked — outcome verification cannot proceed');
  }

  if (opts.session?.observationState === 'OBSERVATION_BLOCKED') {
    blockers.push('Self vision session is blocked — visual verification cannot proceed');
  }

  const warnings: string[] = [
    'Phase 16.6 — visual outcome verification only',
    'No UI modification, code changes, patch application, or auto-fix',
    'No interaction execution or repair operations',
  ];

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
  };
}

export function deriveVerificationStatus(
  results: Array<{ status: string }>,
  blocked: boolean,
): import('./types.js').VerificationStatus {
  if (blocked) return 'VERIFICATION_BLOCKED';
  if (results.length === 0) return 'VERIFICATION_REQUIRED';

  const statuses = results.map((r) => r.status);
  if (statuses.every((s) => s === 'VERIFIED')) return 'VERIFIED';
  if (statuses.some((s) => s === 'FAILED_VERIFICATION')) return 'FAILED_VERIFICATION';
  if (statuses.some((s) => s === 'VERIFICATION_BLOCKED')) return 'VERIFICATION_BLOCKED';
  if (statuses.some((s) => s === 'VERIFIED') || statuses.some((s) => s === 'PARTIALLY_VERIFIED')) {
    return 'PARTIALLY_VERIFIED';
  }
  return 'VERIFICATION_REQUIRED';
}
