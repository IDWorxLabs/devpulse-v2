/**
 * Preview runtime validator — gate evaluation without side effects.
 */

import { getPreviewTarget, hasPreviewTarget } from './preview-target-registry.js';
import type { PrepareLivePreviewRuntimeInput } from './types.js';

export interface PreviewGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface PreviewValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluatePreviewGates(
  input: PrepareLivePreviewRuntimeInput,
  opts: {
    targetRegistered: boolean;
    duplicateTarget: boolean;
    duplicateSession: boolean;
  },
): PreviewGateReport {
  const targetExists =
    opts.targetRegistered ||
    hasPreviewTarget(input.projectId, input.workspaceId, input.targetName) ||
    getPreviewTarget(input.projectId, input.workspaceId, input.targetName) !== null;

  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists,
      summary: 'Project must exist for preview association',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists,
      summary: 'Workspace must exist for preview isolation',
    },
    {
      name: 'Preview Target Exists',
      satisfied: targetExists,
      summary: 'Preview target must be registered',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid,
      summary: 'Preview runtime ownership must be registered',
    },
    {
      name: 'No Duplicate Target',
      satisfied: !opts.duplicateTarget && !input.forceDuplicateTarget,
      summary: 'Duplicate preview targets are blocked',
    },
    {
      name: 'No Duplicate Session',
      satisfied: !opts.duplicateSession && !input.forceDuplicateSession,
      summary: 'Duplicate preview sessions are blocked',
    },
    {
      name: 'World 1 Protection',
      satisfied: input.world1Protected,
      summary: 'World 1 protection must be maintained',
    },
  ];

  const blockers = gates.filter((g) => !g.satisfied).map((g) => `Gate unsatisfied: ${g.name} — ${g.summary}`);

  return { gates, blockers };
}

export function validatePreviewRuntime(opts: {
  gateReport: PreviewGateReport;
}): PreviewValidationResult {
  const blockers = [...opts.gateReport.blockers];
  const warnings: string[] = [
    'Phase 16.1 — capability tracking only, no LIVE_VIEW/SCREEN_CAPTURE/SELF_VISION implementation',
    'No browser launch, screenshots, or interaction testing in this phase',
  ];

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
  };
}
