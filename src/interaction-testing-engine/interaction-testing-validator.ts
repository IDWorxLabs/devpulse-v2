/**
 * Interaction testing validator — gate evaluation without verdicts.
 */

import type { ExecuteInteractionTestingInput } from './types.js';
import type { SelfVisionSession } from '../self-vision-runtime/types.js';
import type { UiInspectionReport } from '../ui-inspection-engine/types.js';

export interface InteractionTestingGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface InteractionTestingValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateInteractionTestingGates(
  input: ExecuteInteractionTestingInput,
  opts: {
    inspectionReportExists: boolean;
    selfVisionSessionExists: boolean;
    previewContextExists: boolean;
  },
): InteractionTestingGateReport {
  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists ?? true,
      summary: 'Project must exist for interaction testing association',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists ?? true,
      summary: 'Workspace must exist for interaction isolation',
    },
    {
      name: 'Inspection Report Exists',
      satisfied: opts.inspectionReportExists,
      summary: 'UI inspection report required before interaction testing',
    },
    {
      name: 'Self Vision Session Exists',
      satisfied: opts.selfVisionSessionExists,
      summary: 'Self vision session required for interaction context',
    },
    {
      name: 'Preview Context Exists',
      satisfied: opts.previewContextExists,
      summary: 'Preview context required for interaction linkage',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid ?? true,
      summary: 'Interaction testing engine ownership must be registered',
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

export function validateInteractionTesting(opts: {
  gateReport: InteractionTestingGateReport;
  inspectionReport: UiInspectionReport | null;
  session: SelfVisionSession | null;
}): InteractionTestingValidationResult {
  const blockers = [...opts.gateReport.blockers];

  if (opts.inspectionReport?.inspectionState === 'INSPECTION_BLOCKED') {
    blockers.push('UI inspection report is blocked — interaction testing cannot proceed');
  }

  if (opts.session?.observationState === 'OBSERVATION_BLOCKED') {
    blockers.push('Self vision session is blocked — interaction testing cannot proceed');
  }

  const warnings: string[] = [
    'Phase 16.5 — interaction simulation and outcome recording only',
    'No correctness verdicts, quality scoring, or visual regression pass/fail',
    'No visual verification or UI goodness determination',
  ];

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
  };
}
