/**
 * Progress model builder — assembles progress records from intelligence sources.
 */

import { buildProjectHistorySnapshot } from '../project-history-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { readPortfolioProjects } from '../portfolio-intelligence/index.js';
import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { calculatePercentComplete } from './progress-percentage-calculator.js';
import { resolveNextMilestone } from './progress-milestone-analyzer.js';
import { isWorld2ExecutionActivationQuestion } from '../world2-execution-activation/world2-execution-activation-types.js';
import { isWorld2BuilderPacketExecutionQuestion } from '../world2-builder-packet-execution/types.js';
import { isWorld2ControlledApplyQuestion } from '../world2-controlled-apply-runtime/types.js';
import { isWorld2RollbackQuestion } from '../world2-rollback-runtime/types.js';
import { isWorld2RecoveryQuestion } from '../world2-recovery-runtime/types.js';
import { isWorld2CompletionQuestion } from '../world2-completion-runtime/types.js';
import { isLivePreviewQuestion } from '../live-preview-runtime/types.js';
import { isPreviewIntelligenceQuestion } from '../preview-intelligence/types.js';
import { isSelfVisionRuntimeQuestion } from '../self-vision-runtime/types.js';
import { isUiInspectionQuestion } from '../ui-inspection-engine/types.js';
import { isInteractionTestingQuestion } from '../interaction-testing-engine/types.js';
import { isVisualVerificationQuestion } from '../visual-verification-engine/types.js';
import type { ProgressRecord } from './progress-intelligence-types.js';

let progressCounter = 0;

function nextProgressId(): string {
  progressCounter += 1;
  return `pgr-${progressCounter.toString().padStart(4, '0')}`;
}

function buildRecordForProject(opts: {
  projectId: string;
  projectName: string;
  phase: string;
  completed: string[];
  remaining: string[];
  blocked: string[];
  nextMilestone: string;
  ahead: boolean;
  behind: boolean;
}): ProgressRecord {
  const { percentComplete, confidence } = calculatePercentComplete(
    opts.completed.length,
    opts.remaining.length,
    opts.blocked.length,
  );

  return {
    progressId: nextProgressId(),
    projectId: opts.projectId,
    projectName: opts.projectName,
    phase: opts.phase,
    completed: opts.completed,
    remaining: opts.remaining,
    blocked: opts.blocked,
    percentComplete,
    confidence,
    milestone: opts.completed[opts.completed.length - 1] ?? 'Foundation started',
    nextMilestone: opts.nextMilestone,
    summary: `${opts.projectName} is ${percentComplete}% complete (${opts.phase}).`,
    aheadOfSchedule: opts.ahead,
    behindSchedule: opts.behind,
    visibilityOnly: true,
  };
}

export function buildProgressRecords(query: string): ProgressRecord[] {
  buildProjectHistorySnapshot(query);
  const profile = getCurrentProjectProfile();
  const roadmap = getBrainRoadmapContext();
  const portfolio = readPortfolioProjects(query);
  const nextMilestone = resolveNextMilestone(query);

  const records: ProgressRecord[] = [];

  records.push(
    buildRecordForProject({
      projectId: profile.projectId,
      projectName: profile.name,
      phase: roadmap.currentPhase,
      completed: [...profile.completedMilestones],
      remaining: [...profile.missingCapabilities],
      blocked: [...profile.blockedItems],
      nextMilestone,
      ahead: profile.completedMilestones.length > 15,
      behind: profile.blockedItems.length > 2,
    }),
  );

  for (const project of portfolio) {
    if (project.projectId === profile.projectId) continue;
    records.push(
      buildRecordForProject({
        projectId: project.projectId,
        projectName: project.projectName,
        phase: project.phase,
        completed: project.health === 'EXCELLENT' || project.health === 'GOOD' ? ['Foundation milestones'] : [],
        remaining: project.blocked ? ['Blocked gates'] : ['Intelligence layers'],
        blocked: project.blocked ? ['Governance gate'] : [],
        nextMilestone: `${project.projectName} next phase`,
        ahead: project.health === 'EXCELLENT',
        behind: project.blocked || project.health === 'POOR',
      }),
    );
  }

  if (isWorld2ExecutionActivationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      world2ActivationReadiness:
        'Phase 15.1 World 2 activation foundation — simulation-only, World 1 protected, founder approval required before future execution',
    };
  }

  if (isWorld2BuilderPacketExecutionQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      builderPacketExecutionState: 'WAITING_APPROVAL',
      builderPacketExecutionNote: 'World 2 Builder Packet Execution Prepared — preparation only, no apply',
    };
  }

  if (isWorld2ControlledApplyQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      controlledApplyState: 'WAITING_APPROVAL',
      controlledApplyNote: 'World 2 Controlled Apply Prepared — apply plans only, applyAllowed false',
    };
  }

  if (isWorld2RollbackQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      rollbackState: 'WAITING_APPROVAL',
      rollbackNote: 'World 2 Rollback Plan Prepared — rollback plans only, rollbackAllowed false',
    };
  }

  if (isWorld2RecoveryQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      recoveryState: 'WAITING_APPROVAL',
      recoveryNote: 'World 2 Recovery Plan Prepared — recovery plans only, recoveryAllowed false',
    };
  }

  if (isWorld2CompletionQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      completionState: 'VERIFICATION_REQUIRED',
      completionNote: 'World 2 Completion Plan Prepared — completion plans only, completionAllowed false',
    };
  }

  if (isLivePreviewQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      previewState: 'REGISTERED',
      previewNote: 'Live Preview Runtime Ready — preview management only, no browser launch',
    };
  }

  if (isPreviewIntelligenceQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      previewIntelligenceState: 'PARTIALLY_READY',
      previewIntelligenceNote: 'Preview Intelligence Ready — reasoning about preview state only, no visual execution',
    };
  }

  if (isSelfVisionRuntimeQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      selfVisionState: 'PLANNED',
      selfVisionNote: 'Self Vision Runtime Ready — observation session runtime only, no capture execution',
    };
  }

  if (isUiInspectionQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      uiInspectionState: 'INSPECTION_READY',
      uiInspectionNote: 'UI Inspection Ready — structure inspection only, no interaction or verification',
    };
  }

  if (isInteractionTestingQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      interactionTestingState: 'COMPLETED',
      interactionTestingNote: 'Interaction Testing Ready — simulation and outcome recording only, no verdicts',
    };
  }

  if (isVisualVerificationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      visualVerificationState: 'VERIFIED',
      visualVerificationNote: 'Visual Verification Ready — outcome verification only, no UI modification or repairs',
    };
  }

  return records;
}

export function resetProgressRecordCounterForTests(): void {
  progressCounter = 0;
}
