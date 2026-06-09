/**
 * UI inspection validator — gate evaluation without interaction or verification.
 */

import type { InspectUiSurfaceInput } from './types.js';
import type { ObservationTargetItem } from '../self-vision-runtime/types.js';
import type { SelfVisionSession } from '../self-vision-runtime/types.js';

export interface UiInspectionGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface UiInspectionValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateUiInspectionGates(
  input: InspectUiSurfaceInput,
  opts: {
    selfVisionSessionExists: boolean;
    observationTargetsExist: boolean;
    previewContextExists: boolean;
  },
): UiInspectionGateReport {
  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists ?? true,
      summary: 'Project must exist for UI inspection association',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists ?? true,
      summary: 'Workspace must exist for inspection isolation',
    },
    {
      name: 'Self Vision Session Exists',
      satisfied: opts.selfVisionSessionExists,
      summary: 'Self vision session required before UI inspection',
    },
    {
      name: 'Observation Targets Exist',
      satisfied: opts.observationTargetsExist,
      summary: 'Observation targets required for surface inspection',
    },
    {
      name: 'Preview Context Exists',
      satisfied: opts.previewContextExists,
      summary: 'Preview context required for inspection linkage',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid ?? true,
      summary: 'UI inspection engine ownership must be registered',
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

export function validateUiInspection(opts: {
  gateReport: UiInspectionGateReport;
  session: SelfVisionSession | null;
  observationTargets: ObservationTargetItem[];
}): UiInspectionValidationResult {
  const blockers = [...opts.gateReport.blockers];

  if (opts.session?.observationState === 'OBSERVATION_BLOCKED') {
    blockers.push('Self vision session is blocked — UI inspection cannot proceed');
  }

  if (opts.observationTargets.length === 0) {
    blockers.push('No observation targets available for inspection');
  }

  const warnings: string[] = [
    'Phase 16.4 — structure inspection only, no clicking or interaction testing',
    'No visual verification, quality scoring, or visual regression verdicts',
    'Layout/navigation/loading/responsive structures identified without correctness judgment',
  ];

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
  };
}
