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
import { isUvlRuntimeQuestion } from '../unified-verification-lab/types.js';
import { isVerificationRegistryQuestion } from '../verification-registry/types.js';
import { isVerificationOrchestratorQuestion } from '../verification-orchestrator/types.js';
import { isVerificationEvidenceQuestion } from '../verification-evidence-engine/verification-evidence-types.js';
import { isVerificationReportingQuestion } from '../verification-reporting-engine/verification-report-types.js';
import { isUnifiedVerificationQuestion } from '../unified-verification-entry/unified-verification-types.js';
import { isCloudRuntimeFoundationQuestion } from '../cloud-runtime/cloud-runtime-types.js';
import { isWorkspaceHostingFoundationQuestion } from '../workspace-hosting/workspace-hosting-types.js';
import { isPersistentBuildRuntimeFoundationQuestion } from '../persistent-build-runtime/persistent-build-types.js';
import { isCloudVerificationFoundationQuestion } from '../cloud-verification/cloud-verification-types.js';
import { isCloudRecoveryFoundationQuestion } from '../cloud-recovery/cloud-recovery-types.js';
import { isCloudMonitoringFoundationQuestion } from '../cloud-monitoring/cloud-monitoring-types.js';
import { isMobileCommandRuntimeFoundationQuestion } from '../mobile-command-runtime/mobile-command-types.js';
import { isMobileChatRuntimeFoundationQuestion } from '../mobile-chat-runtime/mobile-chat-types.js';
import { isMobilePreviewRuntimeFoundationQuestion } from '../mobile-preview-runtime/mobile-preview-types.js';
import { isMobileApprovalRuntimeFoundationQuestion } from '../mobile-approval-runtime/mobile-approval-types.js';
import { isCrossDeviceRuntimeFoundationQuestion } from '../cross-device-runtime/cross-device-types.js';
import { isFounderNotificationRuntimeFoundationQuestion } from '../founder-notification-runtime/founder-notification-types.js';
import { isFounderInboxFoundationQuestion } from '../founder-inbox/founder-inbox-types.js';
import { isMobilePushFoundationQuestion } from '../mobile-push/mobile-push-types.js';
import { isNotificationDeliveryFoundationQuestion } from '../notification-delivery/notification-delivery-types.js';
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

  if (isUvlRuntimeQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      uvlRuntimeState: 'COMPLETED',
      uvlRuntimeNote: 'Unified Verification Lab Runtime Ready — provider registration and session lifecycle only',
    };
  }

  if (isVerificationRegistryQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      verificationRegistryState: 'READY',
      verificationRegistryNote: 'Verification Registry Ready — targets, ownership, dependencies, and requirements defined; no execution',
    };
  }

  if (isVerificationOrchestratorQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      verificationOrchestrationState: 'READY',
      verificationOrchestrationNote: 'Verification Orchestration Ready — execution plan and schedule defined; no provider execution',
    };
  }

  if (isVerificationEvidenceQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      verificationEvidenceState: 'READY',
      verificationEvidenceNote: 'Verification Evidence Ready — evidence registered, ownership assigned, lineage and traceability linked; no provider execution',
    };
  }

  if (isVerificationReportingQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      verificationReportingState: 'READY',
      verificationReportingNote: 'Verification Reporting Ready — structured reports generated from evidence and orchestration; no provider execution',
    };
  }

  if (isUnifiedVerificationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      unifiedVerificationEntryState: 'READY',
      unifiedVerificationEntryNote: 'Unified Verification Entry Ready — single authority surface via requestVerification(); no direct subsystem access',
    };
  }

  if (isCloudRuntimeFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      cloudRuntimeFoundationState: 'READY',
      cloudRuntimeFoundationNote: 'Cloud Runtime Foundation Ready — authority surface for registration, ownership, state, lifecycle, and history; no builds or cloud execution',
    };
  }

  if (isWorkspaceHostingFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      workspaceHostingFoundationState: 'READY',
      workspaceHostingFoundationNote: 'Workspace Hosting Foundation Ready — hosted workspace authority with runtime links via Cloud Runtime Foundation; no cloud workers or builds',
    };
  }

  if (isPersistentBuildRuntimeFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      persistentBuildRuntimeFoundationState: 'READY',
      persistentBuildRuntimeFoundationNote: 'Persistent Build Runtime Foundation Ready — long-running build session authority with runtime and workspace links; no real builds or file mutation',
    };
  }

  if (isCloudVerificationFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      cloudVerificationFoundationState: 'READY',
      cloudVerificationFoundationNote: 'Cloud Verification Foundation Ready — cloud-specific verification coordination via Unified Verification Entry; no provider execution',
    };
  }

  if (isCloudRecoveryFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      cloudRecoveryFoundationState: 'READY',
      cloudRecoveryFoundationNote: 'Cloud Recovery Foundation Ready — recovery coordination metadata with upstream runtime, workspace, build, and verification links; no recovery execution',
    };
  }

  if (isCloudMonitoringFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      cloudMonitoringFoundationState: 'READY',
      cloudMonitoringFoundationNote: 'Cloud Monitoring Foundation Ready — health and alert metadata with upstream cloud foundation links; no infrastructure polling or notifications',
    };
  }

  if (isMobileCommandRuntimeFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      mobileCommandRuntimeFoundationState: 'READY',
      mobileCommandRuntimeFoundationNote: 'Mobile Command Runtime Foundation Ready — mobile command session and permission authority with upstream cloud foundation links; no mobile UI, push notifications, or cloud execution',
    };
  }

  if (isMobileChatRuntimeFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      mobileChatRuntimeFoundationState: 'READY',
      mobileChatRuntimeFoundationNote: 'Mobile Chat Runtime Foundation Ready — mobile chat session, prompt, routing, and response-state authority; no mobile UI, LLM execution, or cloud execution',
    };
  }

  if (isMobilePreviewRuntimeFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      mobilePreviewRuntimeFoundationState: 'READY',
      mobilePreviewRuntimeFoundationNote: 'Mobile Preview Runtime Foundation Ready — mobile preview session, eligibility, safety, link, and desktop-recommendation authority; no mobile UI, preview streaming, or preview rendering',
    };
  }

  if (isMobileApprovalRuntimeFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      mobileApprovalRuntimeFoundationState: 'READY',
      mobileApprovalRuntimeFoundationNote: 'Mobile Approval Runtime Foundation Ready — mobile approval session, request, decision, governance, and context authority; no execution, push notifications, or real approvals',
    };
  }

  if (isCrossDeviceRuntimeFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      crossDeviceRuntimeFoundationState: 'READY',
      crossDeviceRuntimeFoundationNote: 'Cross Device Runtime Foundation Ready — cross device session, device link, handoff, and visibility authority; no real sync, connections, or device pairing',
    };
  }

  if (isFounderNotificationRuntimeFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      founderNotificationRuntimeFoundationState: 'READY',
      founderNotificationRuntimeFoundationNote: 'Founder Notification Runtime Foundation Ready — founder notification routing, visibility, priority, and channel authority; no real delivery, push, email, or SMS',
    };
  }

  if (isFounderInboxFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      founderInboxFoundationState: 'READY',
      founderInboxFoundationNote: 'Founder Inbox Foundation Ready — founder inbox visualization and organization layer referencing Founder Notification Runtime; no notification authority',
    };
  }

  if (isMobilePushFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      mobilePushFoundationState: 'READY',
      mobilePushFoundationNote: 'Mobile Push Foundation Ready — push planning, token metadata, payload planning, and platform targeting authority; no real push, FCM, APNS, or raw token storage',
    };
  }

  if (isNotificationDeliveryFoundationQuestion(query) && records.length > 0) {
    records[0] = {
      ...records[0],
      notificationDeliveryFoundationState: 'READY',
      notificationDeliveryFoundationNote: 'Notification Delivery Foundation Ready — delivery planning, routing, targeting, and channel eligibility authority; no real email, SMS, push, FCM, or APNS',
    };
  }

  return records;
}

export function resetProgressRecordCounterForTests(): void {
  progressCounter = 0;
}
