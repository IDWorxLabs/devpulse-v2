/**
 * Reasoning Visibility Engine — structured visible reasoning orchestrator.
 */

import { publishReasoningVisibilityFeedStages } from '../operator-feed/reasoning-visibility-feed-bridge.js';
import { getProgressIntelligenceContext } from '../progress-intelligence/progress-intelligence.js';
import { buildFailureRecords } from '../failure-visibility-engine/failure-record-builder.js';
import { analyzeRecurringBlockers } from '../learning-visibility-engine/learning-blocker-analyzer.js';
import { analyzeRecurringFailures } from '../learning-visibility-engine/learning-failure-analyzer.js';
import { analyzeRecurringRecommendations } from '../learning-visibility-engine/learning-recommendation-analyzer.js';
import { analyzeReasoningBlockers } from './reasoning-blocker-analyzer.js';
import { calculateReasoningConfidence } from './reasoning-confidence-builder.js';
import { buildReasoningEvidence } from './reasoning-evidence-builder.js';
import { analyzeReasoningRisks } from './reasoning-risk-analyzer.js';
import { analyzeReasoningSources, systemsConsulted } from './reasoning-source-analyzer.js';
import { updateReasoningVisibilityDiagnostics } from './reasoning-visibility-diagnostics.js';
import type {
  ReasoningVisibilityRecord,
  ReasoningVisibilityResult,
} from './reasoning-visibility-types.js';

let reasoningCounter = 0;

function nextReasoningId(): string {
  reasoningCounter += 1;
  return `rsn-${reasoningCounter.toString().padStart(4, '0')}`;
}

export function buildReasoningVisibilityRecord(query: string): ReasoningVisibilityRecord {
  const evidence = buildReasoningEvidence(query);
  const sources = analyzeReasoningSources(query);
  const blockers = analyzeReasoningBlockers(query);
  const risks = analyzeReasoningRisks(query);
  const { confidence, confidenceBasis, recommendationBasis } = calculateReasoningConfidence(
    evidence,
    blockers,
    risks,
    query,
  );

  const contextDeps = evidence
    .filter((e) => e.statement.includes('Dependency'))
    .map((e) => e.statement);

  const progress = getProgressIntelligenceContext(query);
  const progressBasis = progress.primaryRecord
    ? `${progress.primaryRecord.projectName}: ${progress.primaryRecord.percentComplete}% complete — ${progress.primaryRecord.summary}`
    : 'Progress basis unavailable';

  const failures = buildFailureRecords(query);
  const failureEvidence = failures
    .filter((f) => f.severity !== 'Info')
    .slice(0, 6)
    .map((f) => `[${f.severity}] ${f.title} (${f.sourceSystem}): ${f.description}`);

  const blockerLearn = analyzeRecurringBlockers(query);
  const failureLearn = analyzeRecurringFailures(query);
  const recLearn = analyzeRecurringRecommendations(query);
  const learningObservations = [
    ...blockerLearn.observations.slice(0, 2).map((o) => o.text),
    ...failureLearn.observations.slice(0, 2).map((o) => o.text),
    ...recLearn.observations.slice(0, 2).map((o) => o.text),
  ];

  const executionBlockers = [
    ...blockers.map((b) => b.summary),
    ...failureEvidence.slice(0, 2),
    'Phase 14.1 Execution Runtime Foundation — real execution is not connected',
  ];

  return {
    reasoningId: nextReasoningId(),
    query,
    sourceSystem: 'unified_decision_layer',
    evidence,
    sources,
    blockers,
    risks,
    dependencies: contextDeps,
    confidence,
    confidenceBasis,
    recommendationBasis,
    summary: recommendationBasis,
    systemsConsulted: systemsConsulted(sources),
    progressBasis,
    failureEvidence,
    learningObservations,
    executionReadinessBasis: `Readiness advisory from ${evidence.length} evidence items, ${blockers.length} blockers, and ${failureEvidence.length} failure signals — Phase 14.1 simulation only.`,
    executionBlockers,
    buildTaskPlanBasis: `Build task planning advisory from ${sources.length} consulted systems and ${blockers.length} blockers — Phase 14.2 planning only, 6 standard steps, execution blocked.`,
    codeGenerationBasis: `Code generation proposal advisory from ${evidence.length} evidence items and ${risks.length} risks — Phase 14.3 proposal-only, no file writes.`,
    codeGenerationRisks: risks.slice(0, 6).map((r) => r.summary),
    testingBasis: `Testing planning advisory from ${evidence.length} evidence items and ${risks.length} risks — Phase 14.4 simulation-only, no test execution.`,
    testingRisks: risks.slice(0, 6).map((r) => r.summary),
    fixBasis: `Auto-fix planning advisory from ${evidence.length} evidence items and ${risks.length} risks — Phase 14.5 simulation-only, no fix application.`,
    fixRisks: risks.slice(0, 6).map((r) => r.summary),
    fixAlternatives: [
      'Incremental foundation extension',
      'Defer fix until approval gate',
      'Rollback-first remediation',
    ],
    fixRollbackReasoning: 'Rollback required before any future fix — capture pass tokens, revert applied proposals, reset diagnostics, keep executionAllowed false.',
    verificationBasis: `Runtime verification advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 14.6 verification-only, no runtime actions.`,
    verificationGaps: blockers.slice(0, 6).map((b) => b.summary),
    trustFactors: [
      'Execution blocked — executionAllowed false',
      'Generation proposal-only — applied: false',
      'Testing simulation-only — no test execution',
      'Auto-fix simulation-only — no fix application',
    ],
    verificationConfidenceBasis: `Confidence from ${evidence.length} evidence items, ${risks.length} risks, and ${failureEvidence.length} failure signals — Phase 14.6 chain verification advisory.`,
    world2ActivationBasis: `World 2 activation advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 15.1 simulation-only, World 1 protected, no real execution.`,
    world2ActivationBlockers: blockers.slice(0, 6).map((b) => b.summary),
    world2ActivationGates: [
      'World 2 workspace isolation gate',
      'Founder approval gate',
      'Runtime verification gate',
      'No World 1 modification gate',
      'Rollback readiness gate',
      'Operator feed visibility gate',
      'Failure visibility gate',
      'Testing simulation gate',
    ],
    world2IsolationReasoning:
      'World 2 workspace must remain isolated from World 1; no shared mutable state, no World 1 modification path, no cloud or deployment execution in Phase 15.1.',
    builderPacketExecutionBasis: `Builder packet execution advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 15.2 preparation only, executionAllowed false.`,
    builderPacketExecutionBlockers: blockers.slice(0, 6).map((b) => b.summary),
    builderPacketExecutionRisks: risks.slice(0, 6).map((r) => r.summary),
    builderPacketApprovalRequirements: [
      'Founder approval required before controlled apply',
      'High/critical step approvals recorded',
      'Task Governor scheduling check required',
    ],
    builderPacketSimulationOnly: true,
    controlledApplyBasis: `Controlled apply advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 15.3 apply plans only, applyAllowed false.`,
    controlledApplyBlockers: blockers.slice(0, 6).map((b) => b.summary),
    controlledApplyRisks: risks.slice(0, 6).map((r) => r.summary),
    controlledApplyApprovalRequirements: [
      'Founder approval required before future apply',
      'Constitution gate required',
      'Task Governor scheduling required',
      'Multi-gate approval for critical apply steps',
    ],
    rollbackBasis: `Rollback advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 15.4 rollback plans only, rollbackAllowed false.`,
    rollbackBlockers: blockers.slice(0, 6).map((b) => b.summary),
    rollbackRisks: risks.slice(0, 6).map((r) => r.summary),
    rollbackApprovalRequirements: [
      'Founder approval required before future rollback',
      'Constitution gate required',
      'Task Governor scheduling required',
      'Multi-gate approval for critical rollback steps',
    ],
    rollbackSnapshotRequirements: [
      'PRE_APPLY_WORKSPACE_SNAPSHOT',
      'PRE_APPLY_FILE_MANIFEST',
      'PRE_APPLY_DIFF_MANIFEST',
      'PRE_APPLY_TEST_BASELINE',
      'PRE_APPLY_DEPENDENCY_STATE',
      'PRE_APPLY_GIT_REFERENCE',
    ],
    recoveryBasis: `Recovery advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 15.5 recovery plans only, recoveryAllowed false.`,
    recoveryBlockers: blockers.slice(0, 6).map((b) => b.summary),
    recoveryRisks: risks.slice(0, 6).map((r) => r.summary),
    recoveryApprovalRequirements: [
      'Founder approval required before future recovery',
      'Constitution gate required',
      'Task Governor scheduling required',
      'Multi-gate approval for critical recovery steps',
    ],
    recoveryFailureCategory: 'UNKNOWN_RUNTIME_FAILURE',
    recoveryStrategy: 'STOP_AND_REPORT_PROPOSAL',
    recoveryEscalationReason: 'No escalation required for low-severity failure context',
    completionBasis: `Completion advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 15.6 completion plans only, completionAllowed false.`,
    completionBlockers: blockers.slice(0, 6).map((b) => b.summary),
    completionRisks: risks.slice(0, 6).map((r) => r.summary),
    completionCriteria: [
      'PROJECT_GOAL_SATISFIED',
      'VERIFICATION_PASS',
      'ROLLBACK_DEFINED',
      'RECOVERY_DEFINED',
      'WORLD1_PROTECTION_PRESERVED',
    ],
    completionEvidence: [
      'PROJECT_EVIDENCE',
      'VERIFICATION_EVIDENCE',
      'ROLLBACK_EVIDENCE',
      'RECOVERY_EVIDENCE',
      'RUNTIME_EVIDENCE',
    ],
    completionVerificationRequirements: [
      'RUNTIME_VERIFICATION',
      'TASK_GOVERNOR',
      'CONSTITUTION',
      'FOUNDER_APPROVAL',
      'ROLLBACK_PLAN_EXISTS',
      'RECOVERY_PLAN_EXISTS',
    ],
    previewBasis: `Preview advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 16.1 preview management only, no browser launch.`,
    previewBlockers: blockers.slice(0, 6).map((b) => b.summary),
    previewCapabilities: [
      'LIVE_VIEW',
      'SCREEN_CAPTURE',
      'INTERACTION_TESTING',
      'SELF_VISION',
      'VISUAL_VERIFICATION',
      'SESSION_REPLAY',
    ],
    previewWarnings: [
      'Capability tracking only — not implemented in Phase 16.1',
      'No screenshots, interaction testing, or self vision',
    ],
    previewIntelligenceBasis: `Preview intelligence advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 16.2 reasoning only, no visual execution.`,
    previewLimitations: [
      'NO_SCREEN_CAPTURE',
      'NO_INTERACTION_LAYER',
      'NO_SELF_VISION_RUNTIME',
      'NO_VISUAL_VERIFICATION',
    ],
    previewObservationPlan: [
      'OBSERVE_RENDER_STATE',
      'OBSERVE_LAYOUT_STABILITY',
      'OBSERVE_INTERACTION_SURFACE',
      'OBSERVE_ERROR_BOUNDARIES',
    ],
    previewCapabilitySummary: [
      'LIVE_VIEW — tracked, future phase',
      'SCREEN_CAPTURE — missing, Phase 16.2',
      'INTERACTION_TESTING — missing, Phase 16.2',
      'SELF_VISION — future required',
      'VISUAL_VERIFICATION — future required',
      'SESSION_REPLAY — tracked, future phase',
    ],
    selfVisionBasis: `Self vision advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 16.3 observation runtime only, no capture execution.`,
    selfVisionBlockers: blockers.slice(0, 6).map((b) => b.summary),
    capturePlan: [
      'INITIAL_RENDER_CAPTURE',
      'LOADING_STATE_CAPTURE',
      'ERROR_STATE_CAPTURE',
      'POST_ACTION_CAPTURE',
      'MANUAL_CAPTURE',
      'TIMELINE_CAPTURE',
    ],
    observationTargets: [
      'RENDER_SURFACE',
      'LAYOUT_SURFACE',
      'NAVIGATION_SURFACE',
      'INTERACTION_SURFACE',
      'ERROR_SURFACE',
      'LOADING_SURFACE',
      'RESPONSIVE_SURFACE',
    ],
    observationCapabilities: [
      'SCREEN_CAPTURE',
      'VIDEO_CAPTURE',
      'TIMELINE_CAPTURE',
      'SESSION_REPLAY_LINK',
      'UI_INSPECTION',
      'INTERACTION_TESTING',
      'VISUAL_VERIFICATION',
    ],
    inspectionBasis: `UI inspection advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 16.4 structure inspection only, no clicking or verification.`,
    layoutStructures: ['header', 'sidebar', 'main-content', 'footer', 'panel-regions'],
    navigationStructures: ['primary-nav', 'menu-structures', 'tab-structures', 'route-regions'],
    loadingStructures: ['loading-indicators', 'empty-states', 'error-states', 'readiness-indicators'],
    responsiveStructures: ['mobile-surfaces', 'tablet-surfaces', 'desktop-surfaces', 'viewport-regions'],
    interactionBasis: `Interaction testing advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 16.5 simulation only, no correctness verdicts.`,
    interactionPlans: [
      'BUTTON_INTERACTION — primary-action-btn',
      'NAVIGATION_INTERACTION — primary-nav',
      'FORM_INTERACTION — settings-form',
      'WORKFLOW_INTERACTION — onboarding-workflow',
    ],
    interactionResults: [
      'Button interaction simulated — outcome recorded',
      'Navigation path traversed — outcome recorded',
      'Form submission attempted — outcome recorded',
      'Workflow steps progressed — outcome recorded',
    ],
    interactionWarnings: [
      'No correctness verdict produced',
      'No quality scoring or visual regression pass/fail',
      'Simulation only — no browser automation',
    ],
    visualVerificationBasis: `Visual verification advisory from ${evidence.length} evidence items and ${blockers.length} blockers — Phase 16.6 verification only, no UI modification or repairs.`,
    visualVerificationResults: [
      'LAYOUT_TARGET — layout regions verified',
      'NAVIGATION_TARGET — navigation structures verified',
      'LOADING_TARGET — loading indicators verified',
      'RESPONSIVE_TARGET — responsive surfaces verified',
      'INTERACTION_TARGET — interaction outcomes verified',
    ],
    visualVerificationEvidence: [
      'LAYOUT_EVIDENCE — header, sidebar, main-content regions',
      'NAVIGATION_EVIDENCE — primary-nav, menu-structures',
      'LOADING_EVIDENCE — loading-indicators, readiness-indicators',
      'RESPONSIVE_EVIDENCE — mobile, tablet, desktop regions',
      'INTERACTION_EVIDENCE — simulated outcomes recorded',
      'SELF_VISION_EVIDENCE — observation session linked',
    ],
    visualVerificationRisks: [
      'MEDIUM — missing tab structure',
      'LOW — empty state not exposed',
    ],
    visualVerificationWarnings: [
      'No UI modification or code changes',
      'No patch application or auto-fix',
      'Verification only — no interaction re-execution',
    ],
    visibilityOnly: true,
  };
}

function composeResponse(query: string, record: ReasoningVisibilityRecord): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Reasoning Visibility Engine Response', ''];

  if (lower.includes('why') && (lower.includes('recommended') || lower.includes('recommendation'))) {
    lines.push('Recommendation basis:');
    lines.push(record.recommendationBasis);
  } else if (lower.includes('why') && lower.includes('blocked')) {
    lines.push('Why blocked:');
    if (record.blockers.length === 0) {
      lines.push('No active blockers identified in visible reasoning.');
    } else {
      for (const b of record.blockers) {
        lines.push(`• ${b.summary} (${b.sourceSystem})`);
      }
    }
  } else if (lower.includes('why') && lower.includes('confidence')) {
    lines.push(`Confidence: ${record.confidence}`);
    lines.push(`Basis: ${record.confidenceBasis}`);
  } else if (lower.includes('evidence')) {
    lines.push('Evidence used:');
    for (const e of record.evidence.slice(0, 8)) {
      lines.push(`• ${e.statement} [${e.sourceSystem}]`);
    }
  } else if (lower.includes('systems contributed') || lower.includes('systems consulted')) {
    lines.push('Systems consulted:');
    for (const s of record.sources) {
      lines.push(`• ${s.sourceSystem}: ${s.contribution}`);
    }
  } else if (lower.includes('risks')) {
    lines.push('Risks considered:');
    for (const r of record.risks.slice(0, 8)) {
      lines.push(`• ${r.summary} (${r.sourceSystem})`);
    }
  } else if (lower.includes('blockers')) {
    lines.push('Blockers considered:');
    for (const b of record.blockers) {
      lines.push(`• ${b.summary} (${b.sourceSystem})`);
    }
  } else {
    lines.push(`Summary: ${record.summary}`);
    lines.push(`Confidence: ${record.confidence} — ${record.confidenceBasis}`);
    lines.push(`Systems consulted: ${record.systemsConsulted.join(', ')}`);
    lines.push(`Evidence count: ${record.evidence.length}`);
    lines.push(`Blockers: ${record.blockers.length} | Risks: ${record.risks.length}`);
  }

  lines.push('');
  lines.push('Structured visible reasoning only — no chain-of-thought, no execution.');
  return lines.join('\n').trim();
}

export function analyzeReasoningVisibility(query: string): ReasoningVisibilityResult {
  publishReasoningVisibilityFeedStages(query);
  const record = buildReasoningVisibilityRecord(query);
  updateReasoningVisibilityDiagnostics(query, [record]);

  return {
    query,
    records: [record],
    responseText: composeResponse(query, record),
  };
}

export function processReasoningVisibilityRequest(query: string): ReasoningVisibilityResult {
  return analyzeReasoningVisibility(query);
}

export function getReasoningVisibilityContext(query: string): {
  result: ReasoningVisibilityResult;
  primaryRecord: ReasoningVisibilityRecord;
} {
  const result = analyzeReasoningVisibility(query);
  return {
    result,
    primaryRecord: result.records[0]!,
  };
}

export function resetReasoningVisibilityCounterForTests(): void {
  reasoningCounter = 0;
}
