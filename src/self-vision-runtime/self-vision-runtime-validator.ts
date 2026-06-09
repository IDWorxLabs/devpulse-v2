/**
 * Self Vision runtime validator — gate evaluation without capture or analysis.
 */

import { getPreviewTarget, hasPreviewTarget } from '../live-preview-runtime/preview-target-registry.js';
import type { PrepareSelfVisionRuntimeInput } from './types.js';

export interface SelfVisionGateReport {
  gates: Array<{ name: string; satisfied: boolean; summary: string }>;
  blockers: string[];
}

export interface SelfVisionValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateSelfVisionGates(
  input: PrepareSelfVisionRuntimeInput,
  opts: {
    previewSessionExists: boolean;
    previewTargetExists: boolean;
    duplicateSession: boolean;
  },
): SelfVisionGateReport {
  const targetExists =
    opts.previewTargetExists ||
    hasPreviewTarget(input.projectId, input.workspaceId, input.targetName) ||
    getPreviewTarget(input.projectId, input.workspaceId, input.targetName) !== null;

  const gates = [
    {
      name: 'Project Exists',
      satisfied: input.projectExists,
      summary: 'Project must exist for self vision association',
    },
    {
      name: 'Workspace Exists',
      satisfied: input.workspaceExists,
      summary: 'Workspace must exist for observation isolation',
    },
    {
      name: 'Preview Session Exists',
      satisfied: opts.previewSessionExists,
      summary: 'Preview session must exist before self vision session creation',
    },
    {
      name: 'Preview Target Exists',
      satisfied: targetExists,
      summary: 'Preview target must be registered',
    },
    {
      name: 'Ownership Valid',
      satisfied: input.ownershipValid,
      summary: 'Self vision runtime ownership must be registered',
    },
    {
      name: 'No Duplicate Self Vision Session',
      satisfied: !opts.duplicateSession && !input.forceDuplicateSession,
      summary: 'Duplicate self vision sessions per preview session are blocked',
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

export function validateSelfVisionRuntime(opts: {
  gateReport: SelfVisionGateReport;
}): SelfVisionValidationResult {
  const blockers = [...opts.gateReport.blockers];
  const warnings: string[] = [
    'Phase 16.3 — observation session runtime only, no capture execution',
    'No layout inspection, screenshot analysis, interaction testing, or visual verification',
    'Capture plan and observation targets are planning-only',
  ];

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
  };
}
