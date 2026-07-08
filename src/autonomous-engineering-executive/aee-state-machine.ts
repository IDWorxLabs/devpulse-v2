/**
 * Autonomous Engineering Executive V1 — build spine state machine.
 */

import { isOverstrictPreBuildBlocker } from '../universal-build-pipeline-verification/build-continuation-policy.js';
import type { AeeStage } from './aee-types.js';

export const AEE_STAGE_ORDER: readonly AeeStage[] = [
  'PROMPT_RECEIVED',
  'UNDERSTOOD',
  'PLANNING',
  'GENERATING',
  'WORKSPACE_READY',
  'INSTALLING',
  'BUILDING',
  'AUTO_REPAIRING',
  'PREVIEWING',
  'VERIFYING',
  'FINAL_REPORT',
  'STOPPED',
] as const;

const FORWARD_STAGES_AFTER_WORKSPACE: ReadonlySet<AeeStage> = new Set([
  'WORKSPACE_READY',
  'INSTALLING',
  'BUILDING',
  'AUTO_REPAIRING',
  'PREVIEWING',
  'VERIFYING',
  'FINAL_REPORT',
]);

export function isAfterWorkspaceReady(stage: AeeStage): boolean {
  const idx = AEE_STAGE_ORDER.indexOf(stage);
  const workspaceIdx = AEE_STAGE_ORDER.indexOf('WORKSPACE_READY');
  return idx >= workspaceIdx && stage !== 'STOPPED';
}

export function aeeStageAllowsForwardDefault(stage: AeeStage): boolean {
  return FORWARD_STAGES_AFTER_WORKSPACE.has(stage);
}

export function resolveAeeStageFromForensicStage(forensicStage: string): AeeStage {
  switch (forensicStage) {
    case 'PROMPT_RECEIVED':
      return 'PROMPT_RECEIVED';
    case 'PROFILE_SELECTED':
      return 'UNDERSTOOD';
    case 'PLANNING':
    case 'WORKSPACE_CREATED':
    case 'ASE_AUTHORIZATION':
    case 'AEE_EXECUTIVE_COORDINATION':
      return 'PLANNING';
    case 'MATERIALIZATION':
    case 'MATERIALIZATION_VALIDATION':
      return 'GENERATING';
    case 'NPM_INSTALL':
      return 'INSTALLING';
    case 'NPM_BUILD':
      return 'BUILDING';
    case 'PREVIEW':
      return 'PREVIEWING';
    case 'FINAL_VALIDATION':
    case 'COMPLETE':
      return 'FINAL_REPORT';
    default:
      return 'PLANNING';
  }
}

export function aeeForbidsAbortAfterWorkspaceEvidence(
  hasGeneratedSource: boolean,
  proposedFailureLabel: string,
): boolean {
  if (!hasGeneratedSource) return false;
  if (/planning/i.test(proposedFailureLabel)) return true;
  if (/ase denied|materialization authorization/i.test(proposedFailureLabel)) return true;
  return isOverstrictPreBuildBlocker(proposedFailureLabel);
}

export function aeeForbidsPlanningFailedAfterWorkspace(
  stage: AeeStage,
  hasGeneratedSource: boolean,
  proposedFailureLabel: string,
): boolean {
  if (!hasGeneratedSource) return false;
  if (!isAfterWorkspaceReady(stage) && stage !== 'GENERATING' && stage !== 'PLANNING') return false;
  return aeeForbidsAbortAfterWorkspaceEvidence(hasGeneratedSource, proposedFailureLabel);
}

export function advanceAeeStage(current: AeeStage, target: AeeStage): AeeStage {
  const currentIdx = AEE_STAGE_ORDER.indexOf(current);
  const targetIdx = AEE_STAGE_ORDER.indexOf(target);
  if (targetIdx < currentIdx) return current;
  return target;
}
