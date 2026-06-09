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
