/**
 * Failure record builder — assembles visible failures from intelligence sources.
 */

import { buildProjectHistorySnapshot } from '../project-history-intelligence/index.js';
import { analyzeProgressBlockers } from '../progress-intelligence/progress-blocker-analyzer.js';
import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { buildActionCandidates } from '../action-visibility-engine/action-candidate-builder.js';
import { analyzeReasoningBlockers } from '../reasoning-visibility-engine/reasoning-blocker-analyzer.js';
import { analyzeFailureDependencyImpacts } from './failure-dependency-analyzer.js';
import { collectBlockedCapabilities } from './failure-impact-analyzer.js';
import { classifyFailureSeverity } from './failure-severity-analyzer.js';
import {
  buildRecommendedNextStep,
  confidenceForSeverity,
} from './failure-next-step-builder.js';
import { buildTestingFailureContext } from '../testing-runtime/testing-failure-bridge.js';
import { buildVerificationFailureContext } from '../runtime-verification-layer/verification-failure-bridge.js';
import { buildWorld2ActivationFailureContext } from '../world2-execution-activation/world2-activation-failure-bridge.js';
import { buildBuilderPacketExecutionFailureContext } from '../world2-builder-packet-execution/builder-packet-execution-failure-bridge.js';
import { buildControlledApplyFailureContext } from '../world2-controlled-apply-runtime/controlled-apply-failure-bridge.js';
import { buildRollbackFailureContext } from '../world2-rollback-runtime/rollback-failure-bridge.js';
import { buildRecoveryFailureContext } from '../world2-recovery-runtime/recovery-failure-bridge.js';
import { buildCompletionFailureContext } from '../world2-completion-runtime/completion-failure-bridge.js';
import { buildPreviewFailureContext } from '../live-preview-runtime/preview-runtime-report.js';
import { buildPreviewIntelligenceFailureContext } from '../preview-intelligence/preview-intelligence-failure-bridge.js';
import { buildSelfVisionFailureContext } from '../self-vision-runtime/self-vision-failure-bridge.js';
import { buildUiInspectionFailureContext } from '../ui-inspection-engine/ui-inspection-failure-bridge.js';
import { buildInteractionTestingFailureContext } from '../interaction-testing-engine/interaction-testing-failure-bridge.js';
import { buildVisualVerificationFailureContext } from '../visual-verification-engine/visual-verification-failure-bridge.js';
import { buildVerificationRuntimeFailureContext } from '../unified-verification-lab/verification-failure-bridge.js';
import { buildVerificationRegistryFailureContext } from '../verification-registry/verification-registry-failure-bridge.js';
import { buildVerificationOrchestratorFailureContext } from '../verification-orchestrator/verification-orchestrator-failure-bridge.js';
import { buildVerificationEvidenceFailureContext } from '../verification-evidence-engine/verification-evidence-failure-bridge.js';
import { buildVerificationReportingFailureContext } from '../verification-reporting-engine/verification-report-builder.js';
import { buildUnifiedVerificationFailureContext } from '../unified-verification-entry/verification-entry-report.js';
import { buildCloudRuntimeFailureContext } from '../cloud-runtime/cloud-runtime-report-builder.js';
import { buildWorkspaceHostingFailureContext } from '../workspace-hosting/workspace-hosting-report-builder.js';
import { buildPersistentBuildFailureContext } from '../persistent-build-runtime/persistent-build-report-builder.js';
import { buildCloudVerificationFailureContext } from '../cloud-verification/cloud-verification-report-builder.js';
import { buildCloudRecoveryFailureContext } from '../cloud-recovery/cloud-recovery-report-builder.js';
import { buildCloudMonitoringFailureContext } from '../cloud-monitoring/cloud-monitoring-report-builder.js';
import { buildMobileCommandFailureContext } from '../mobile-command-runtime/mobile-command-report-builder.js';
import { buildMobileChatFailureContext } from '../mobile-chat-runtime/mobile-chat-report-builder.js';
import { buildMobilePreviewFailureContext } from '../mobile-preview-runtime/mobile-preview-report-builder.js';
import { buildMobileApprovalFailureContext } from '../mobile-approval-runtime/mobile-approval-report-builder.js';
import { buildCrossDeviceFailureContext } from '../cross-device-runtime/cross-device-report-builder.js';
import { buildNotificationFailureContext } from '../founder-notification-runtime/founder-notification-report-builder.js';
import { buildInboxFailureContext } from '../founder-inbox/founder-inbox-report-builder.js';
import { buildDeliveryFailureContext } from '../notification-delivery/notification-delivery-report-builder.js';
import { buildMobilePushFailureContext } from '../mobile-push/mobile-push-report-builder.js';
import type { FailureRecord } from './failure-visibility-types.js';

let failureCounter = 0;

function nextFailureId(): string {
  failureCounter += 1;
  return `fail-${failureCounter.toString().padStart(4, '0')}`;
}

function buildRecord(opts: {
  title: string;
  description: string;
  sourceSystem: string;
  affectedSystems: string[];
  blockedCapabilities: string[];
  dependencyImpacts: ReturnType<typeof analyzeFailureDependencyImpacts>;
}): FailureRecord {
  const severity = classifyFailureSeverity({
    title: opts.title,
    description: opts.description,
    sourceSystem: opts.sourceSystem,
    blockedCapabilities: opts.blockedCapabilities,
  });

  const record: FailureRecord = {
    failureId: nextFailureId(),
    title: opts.title,
    description: opts.description,
    severity,
    sourceSystem: opts.sourceSystem,
    affectedSystems: opts.affectedSystems,
    blockedCapabilities: opts.blockedCapabilities,
    dependencyImpact: opts.dependencyImpacts.slice(0, 3),
    recommendedNextStep: '',
    confidence: confidenceForSeverity(severity),
    visibilityOnly: true,
  };

  record.recommendedNextStep = buildRecommendedNextStep(record);
  return record;
}

export function buildFailureRecords(query: string): FailureRecord[] {
  buildProjectHistorySnapshot(query);
  const profile = getCurrentProjectProfile();
  const context = buildDecisionContext(query);
  const progressBlockers = analyzeProgressBlockers(query);
  const reasoningBlockers = analyzeReasoningBlockers(query);
  const blockedCaps = collectBlockedCapabilities(query);
  const depImpacts = analyzeFailureDependencyImpacts(query);
  const records: FailureRecord[] = [];

  for (const item of profile.blockedItems) {
    records.push(
      buildRecord({
        title: `Governance blocker: ${item}`,
        description: `Project profile reports blocked item affecting DevPulse V2 foundations.`,
        sourceSystem: 'project_understanding',
        affectedSystems: [profile.projectId, 'command_center_brain'],
        blockedCapabilities: [item],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const blocker of context.dependencyBlockers.slice(0, 5)) {
    records.push(
      buildRecord({
        title: `Dependency failure: ${blocker.slice(0, 60)}`,
        description: blocker,
        sourceSystem: 'dependency_intelligence',
        affectedSystems: context.relatedSystems.slice(0, 3),
        blockedCapabilities: blockedCaps.slice(0, 3),
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const pb of progressBlockers.slice(0, 4)) {
    records.push(
      buildRecord({
        title: `Progress blocker: ${pb.summary}`,
        description: `Blocked progress detected for project ${pb.projectId}.`,
        sourceSystem: 'progress_intelligence',
        affectedSystems: [pb.projectId, 'progress_intelligence'],
        blockedCapabilities: blockedCaps.slice(0, 2),
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const rb of reasoningBlockers.slice(0, 3)) {
    records.push(
      buildRecord({
        title: `Reasoning blocker: ${rb.summary}`,
        description: `Visible reasoning identified blocker from ${rb.sourceSystem}.`,
        sourceSystem: 'reasoning_visibility_engine',
        affectedSystems: [rb.sourceSystem, 'unified_decision_layer'],
        blockedCapabilities: [],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  const blockedActions = buildActionCandidates(query).filter((a) => a.blocked || a.status === 'Blocked');
  for (const action of blockedActions.slice(0, 3)) {
    records.push(
      buildRecord({
        title: `Blocked action: ${action.title}`,
        description: action.reason,
        sourceSystem: 'action_visibility_engine',
        affectedSystems: [action.sourceSystem],
        blockedCapabilities: [action.title],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const risk of context.riskFacts.slice(0, 2)) {
    records.push(
      buildRecord({
        title: `Risk failure signal: ${risk.slice(0, 50)}`,
        description: risk,
        sourceSystem: 'unified_decision_layer',
        affectedSystems: context.relatedSystems.slice(0, 2),
        blockedCapabilities: [],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const tf of buildTestingFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: tf.title,
        description: tf.description,
        sourceSystem: tf.sourceSystem,
        affectedSystems: ['testing_runtime', 'failure_visibility_engine'],
        blockedCapabilities: ['TESTING_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const vf of buildVerificationFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: vf.title,
        description: vf.description,
        sourceSystem: vf.sourceSystem,
        affectedSystems: ['runtime_verification_layer', 'failure_visibility_engine'],
        blockedCapabilities: ['RUNTIME_VERIFICATION_LAYER'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const wf of buildWorld2ActivationFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: wf.title,
        description: wf.description,
        sourceSystem: wf.sourceSystem,
        affectedSystems: ['world2_execution_activation', 'failure_visibility_engine'],
        blockedCapabilities: ['WORLD2_EXECUTION_ACTIVATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const bf of buildBuilderPacketExecutionFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: bf.title,
        description: bf.description,
        sourceSystem: bf.sourceSystem,
        affectedSystems: ['world2_builder_packet_execution', 'failure_visibility_engine'],
        blockedCapabilities: ['WORLD2_BUILDER_PACKET_EXECUTION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const cf of buildControlledApplyFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: cf.title,
        description: cf.description,
        sourceSystem: cf.sourceSystem,
        affectedSystems: ['world2_controlled_apply_runtime', 'failure_visibility_engine'],
        blockedCapabilities: ['WORLD2_CONTROLLED_APPLY_RUNTIME'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const rf of buildRollbackFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: rf.title,
        description: rf.description,
        sourceSystem: rf.sourceSystem,
        affectedSystems: ['world2_rollback_runtime', 'failure_visibility_engine'],
        blockedCapabilities: ['WORLD2_ROLLBACK_RUNTIME'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const rcf of buildRecoveryFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: rcf.title,
        description: rcf.description,
        sourceSystem: rcf.sourceSystem,
        affectedSystems: ['world2_recovery_runtime', 'failure_visibility_engine'],
        blockedCapabilities: ['WORLD2_RECOVERY_RUNTIME'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const cmf of buildCompletionFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: cmf.title,
        description: cmf.description,
        sourceSystem: cmf.sourceSystem,
        affectedSystems: ['world2_completion_runtime', 'failure_visibility_engine'],
        blockedCapabilities: ['WORLD2_COMPLETION_RUNTIME'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const pvf of buildPreviewFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: pvf.title,
        description: pvf.description,
        sourceSystem: pvf.sourceSystem,
        affectedSystems: ['live_preview_runtime', 'failure_visibility_engine'],
        blockedCapabilities: ['LIVE_PREVIEW_RUNTIME'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const pvif of buildPreviewIntelligenceFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: pvif.title,
        description: pvif.description,
        sourceSystem: pvif.sourceSystem,
        affectedSystems: ['preview_intelligence', 'failure_visibility_engine'],
        blockedCapabilities: ['PREVIEW_INTELLIGENCE'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const svf of buildSelfVisionFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: svf.title,
        description: svf.description,
        sourceSystem: svf.sourceSystem,
        affectedSystems: ['self_vision_runtime', 'failure_visibility_engine'],
        blockedCapabilities: ['SELF_VISION_RUNTIME'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const uif of buildUiInspectionFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: uif.title,
        description: uif.description,
        sourceSystem: uif.sourceSystem,
        affectedSystems: ['ui_inspection_engine', 'failure_visibility_engine'],
        blockedCapabilities: ['UI_INSPECTION_ENGINE'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const itf of buildInteractionTestingFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: itf.title,
        description: itf.description,
        sourceSystem: itf.sourceSystem,
        affectedSystems: ['interaction_testing_engine', 'failure_visibility_engine'],
        blockedCapabilities: ['INTERACTION_TESTING_ENGINE'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const vvf of buildVisualVerificationFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: vvf.title,
        description: vvf.description,
        sourceSystem: vvf.sourceSystem,
        affectedSystems: ['visual_verification_engine', 'failure_visibility_engine'],
        blockedCapabilities: ['VISUAL_VERIFICATION_ENGINE'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const uvlf of buildVerificationRuntimeFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: uvlf.title,
        description: uvlf.description,
        sourceSystem: uvlf.sourceSystem,
        affectedSystems: ['unified_verification_lab_runtime', 'failure_visibility_engine'],
        blockedCapabilities: ['UNIFIED_VERIFICATION_LAB_RUNTIME'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const vregf of buildVerificationRegistryFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: vregf.title,
        description: vregf.description,
        sourceSystem: vregf.sourceSystem,
        affectedSystems: ['verification_registry', 'failure_visibility_engine'],
        blockedCapabilities: ['VERIFICATION_REGISTRY'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const vorchf of buildVerificationOrchestratorFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: vorchf.title,
        description: vorchf.description,
        sourceSystem: vorchf.sourceSystem,
        affectedSystems: ['verification_orchestrator', 'failure_visibility_engine'],
        blockedCapabilities: ['VERIFICATION_ORCHESTRATOR'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const vevidf of buildVerificationEvidenceFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: vevidf.title,
        description: vevidf.description,
        sourceSystem: vevidf.sourceSystem,
        affectedSystems: ['verification_evidence_engine', 'failure_visibility_engine'],
        blockedCapabilities: ['VERIFICATION_EVIDENCE_ENGINE'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const vrptf of buildVerificationReportingFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: vrptf.title,
        description: vrptf.description,
        sourceSystem: vrptf.sourceSystem,
        affectedSystems: ['verification_reporting_engine', 'failure_visibility_engine'],
        blockedCapabilities: ['VERIFICATION_REPORTING_ENGINE'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const uventf of buildUnifiedVerificationFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: uventf.title,
        description: uventf.description,
        sourceSystem: uventf.sourceSystem,
        affectedSystems: ['unified_verification_entry', 'failure_visibility_engine'],
        blockedCapabilities: ['UNIFIED_VERIFICATION_ENTRY'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const crf of buildCloudRuntimeFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: crf.title,
        description: crf.description,
        sourceSystem: crf.sourceSystem,
        affectedSystems: ['cloud_runtime_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['CLOUD_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const whf of buildWorkspaceHostingFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: whf.title,
        description: whf.description,
        sourceSystem: whf.sourceSystem,
        affectedSystems: ['workspace_hosting_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['WORKSPACE_HOSTING_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const pbf of buildPersistentBuildFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: pbf.title,
        description: pbf.description,
        sourceSystem: pbf.sourceSystem,
        affectedSystems: ['persistent_build_runtime_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['PERSISTENT_BUILD_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const cvf of buildCloudVerificationFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: cvf.title,
        description: cvf.description,
        sourceSystem: cvf.sourceSystem,
        affectedSystems: ['cloud_verification_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['CLOUD_VERIFICATION_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const crf of buildCloudRecoveryFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: crf.title,
        description: crf.description,
        sourceSystem: crf.sourceSystem,
        affectedSystems: ['cloud_recovery_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['CLOUD_RECOVERY_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const cmf of buildCloudMonitoringFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: cmf.title,
        description: cmf.description,
        sourceSystem: cmf.sourceSystem,
        affectedSystems: ['cloud_monitoring_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['CLOUD_MONITORING_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const mcf of buildMobileCommandFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: mcf.title,
        description: mcf.description,
        sourceSystem: mcf.sourceSystem,
        affectedSystems: ['mobile_command_runtime_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['MOBILE_COMMAND_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const mcf of buildMobileChatFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: mcf.title,
        description: mcf.description,
        sourceSystem: mcf.sourceSystem,
        affectedSystems: ['mobile_chat_runtime_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['MOBILE_CHAT_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const mpf of buildMobilePreviewFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: mpf.title,
        description: mpf.description,
        sourceSystem: mpf.sourceSystem,
        affectedSystems: ['mobile_preview_runtime_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['MOBILE_PREVIEW_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const maf of buildMobileApprovalFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: maf.title,
        description: maf.description,
        sourceSystem: maf.sourceSystem,
        affectedSystems: ['mobile_approval_runtime_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['MOBILE_APPROVAL_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const cdf of buildCrossDeviceFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: cdf.title,
        description: cdf.description,
        sourceSystem: cdf.sourceSystem,
        affectedSystems: ['cross_device_runtime_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['CROSS_DEVICE_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const fnf of buildNotificationFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: fnf.title,
        description: fnf.description,
        sourceSystem: fnf.sourceSystem,
        affectedSystems: ['founder_notification_runtime_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const fif of buildInboxFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: fif.title,
        description: fif.description,
        sourceSystem: fif.sourceSystem,
        affectedSystems: ['founder_inbox_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['FOUNDER_INBOX_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const ndf of buildDeliveryFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: ndf.title,
        description: ndf.description,
        sourceSystem: ndf.sourceSystem,
        affectedSystems: ['notification_delivery_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['NOTIFICATION_DELIVERY_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  for (const mpf of buildMobilePushFailureContext(query).slice(0, 4)) {
    records.push(
      buildRecord({
        title: mpf.title,
        description: mpf.description,
        sourceSystem: mpf.sourceSystem,
        affectedSystems: ['mobile_push_foundation', 'failure_visibility_engine'],
        blockedCapabilities: ['MOBILE_PUSH_FOUNDATION'],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  if (records.length === 0) {
    records.push(
      buildRecord({
        title: 'No active failures detected',
        description: 'Intelligence sources report no blocked governance paths at this time.',
        sourceSystem: 'failure_visibility_engine',
        affectedSystems: [],
        blockedCapabilities: [],
        dependencyImpacts: depImpacts,
      }),
    );
  }

  return records;
}

export function resetFailureRecordCounterForTests(): void {
  failureCounter = 0;
}
