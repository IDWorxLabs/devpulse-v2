/**
 * Phase 27.03 — Launch Readiness Artifact Completion Boundary Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hasIntakeValidationCompletionBoundaryInRegistry,
  recordIntakeCompletionBoundaryOperation,
  resetChatStressCompletionPropagationForTests,
} from '../src/founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import {
  advanceFounderTestRuntimeStage,
  beginFounderTestRuntime,
  completeFounderTestRuntimeStage,
  emitFounderTestRuntimeTrace,
  getFounderTestRuntimeStatus,
  resetFounderTestRuntimeMonitorForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  beginArtifactBuildSubstep,
  getActiveArtifactBuildSubstep,
  resetLaunchReadinessArtifactBuildTracerForTests,
} from '../src/founder-test-runtime-monitor/launch-readiness-artifact-build-tracer.js';
import {
  emitLaunchReadinessAssessmentCompleteOnce,
  resetLaunchReadinessArtifactCompletionBarrierRepairModuleForTests,
} from '../src/launch-readiness-artifact-completion-barrier-repair/index.js';
import {
  LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS,
  LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  LAUNCH_READINESS_ARTIFACTS_BUILT,
  BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  assessLaunchReadinessArtifactCompletionBoundaryRepair,
  applyLaunchReadinessArtifactCompletionBoundaryRepairSync,
  auditLaunchReadinessAssessment,
  auditLaunchReadinessArtifactBuilder,
  buildDegradedLaunchReadinessReportMarkdown,
  buildLaunchReadinessArtifactCompletionBoundaryRepairMarkdown,
  buildLaunchReadinessArtifactCompletionValidationMarkdown,
  detectLaunchReadinessArtifactBoundary,
  planLaunchReadinessArtifactBoundaryRepair,
  reconcileLaunchReadinessArtifactCompletionBoundaryOnSnapshot,
  resetLaunchReadinessArtifactCompletionBoundaryRepairModuleForTests,
} from '../src/launch-readiness-artifact-completion-boundary-repair/index.js';
import type { FounderTestLaunchReadinessReport } from '../src/founder-test-launch-readiness/founder-test-launch-readiness-types.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-launch-readiness-artifact-completion-boundary-repair';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-artifact-completion-boundary-repair-types.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-artifact-completion-boundary-repair-registry.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-assessment-auditor.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-artifact-builder-auditor.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-boundary-detector.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-transition-analyzer.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-repair-planner.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-artifact-completion-report-builder.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-artifact-completion-history.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-artifact-completion-boundary-repair-authority.ts',
  'src/launch-readiness-artifact-completion-boundary-repair/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(
    ROOT,
    'src/launch-readiness-artifact-completion-boundary-repair/launch-readiness-artifact-completion-boundary-repair-authority.ts',
  ),
  'utf8',
);
const launchAuthoritySource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);
const runtimeMonitorSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('PASS token in authority', authoritySource.includes(LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS), 'missing');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert('no nested validator', !authoritySource.includes('validate-'), 'nested');
assert(
  'wired into launch authority',
  launchAuthoritySource.includes('applyLaunchReadinessArtifactCompletionBoundaryRepairSync'),
  'missing',
);
assert(
  'runtime monitor wired',
  runtimeMonitorSource.includes('reconcileLaunchReadinessArtifactCompletionBoundaryOnSnapshot'),
  'missing',
);
assert(
  'package script registered',
  packageJson.includes(`validate:launch-readiness-artifact-completion-boundary-repair": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);

resetLaunchReadinessArtifactBuildTracerForTests();
resetLaunchReadinessArtifactCompletionBarrierRepairModuleForTests();
resetLaunchReadinessArtifactCompletionBoundaryRepairModuleForTests();
resetChatStressCompletionPropagationForTests();
resetFounderTestRuntimeMonitorForTests();

function minimalTraceEvent(
  operationId: string,
  status: 'RUNNING' | 'PASSED' | 'FAILED',
): import('../src/founder-test-runtime-monitor/founder-test-runtime-types.js').FounderTestRuntimeTraceEvent {
  const timestamp = new Date().toISOString();
  return {
    readOnly: true,
    traceEventId: `${operationId}-${status}`,
    operationId,
    stageId: 'INTAKE_VALIDATION',
    stageOrder: 1,
    stageLabel: 'Intake Validation',
    operationLabel: operationId,
    status,
    timestamp,
    displayTime: timestamp,
    displayLine: `${operationId} ${status}`,
  };
}

const minimalReport = {
  generatedAt: new Date().toISOString(),
  launchReadinessVerdict: 'PASSED',
} as unknown as FounderTestLaunchReadinessReport;

const traceOps: string[] = [];
emitLaunchReadinessAssessmentCompleteOnce({
  onBuildTrace: (event) => traceOps.push(event.operationId),
});
assert(
  '1. assessment complete emitted',
  traceOps.includes(LAUNCH_READINESS_ASSESSMENT_COMPLETE),
  traceOps.join(', '),
);

const assessmentAudit = auditLaunchReadinessAssessment({
  traceEvents: [minimalTraceEvent(LAUNCH_READINESS_ASSESSMENT_COMPLETE, 'PASSED')],
});
assert('2. assessment audit finished', assessmentAudit.assessmentFinished, assessmentAudit.stoppingReason ?? '');

beginArtifactBuildSubstep({
  operationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  operationLabel: 'Building launch readiness report markdown',
});
const stalledBuilderAudit = auditLaunchReadinessArtifactBuilder({
  traceEvents: [minimalTraceEvent(BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN, 'RUNNING')],
  activeArtifactSubstepOperationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
});
const stalledBoundary = detectLaunchReadinessArtifactBoundary({
  assessmentAudit,
  artifactBuilderAudit: stalledBuilderAudit,
});
assert(
  '3. exact stopping point: report markdown unfinished',
  stalledBoundary.exactStoppingStep === 'report-markdown-finished',
  stalledBoundary.exactStoppingStep ?? 'none',
);
assert(
  '4. failure class REPORT_GENERATION_CRASH or STATE_MACHINE_STALLED',
  stalledBoundary.failureClass === 'REPORT_GENERATION_CRASH' ||
    stalledBoundary.failureClass === 'STATE_MACHINE_STALLED',
  stalledBoundary.failureClass,
);

const chainTrace: string[] = [];
const chainResult = applyLaunchReadinessArtifactCompletionBoundaryRepairSync({
  launchReadinessReport: minimalReport,
  onBuildTrace: (event) => chainTrace.push(`${event.operationId}:${event.phase}`),
  buildMarkdown: () => {
    throw new Error('markdown generation crash');
  },
});
assert(
  '5. degraded markdown fallback on crash',
  chainResult.reportMarkdownDegraded && chainResult.markdown.includes('Degraded'),
  chainResult.failureClass,
);
assert(
  '6. artifacts-built emitted after repair',
  chainTrace.some((entry) => entry.startsWith(`${LAUNCH_READINESS_ARTIFACTS_BUILT}:PASSED`)),
  chainTrace.join(', '),
);
assert(
  '7. intake boundary records artifacts-built',
  hasIntakeValidationCompletionBoundaryInRegistry(LAUNCH_READINESS_ARTIFACTS_BUILT),
  'registry missing',
);

resetLaunchReadinessArtifactBuildTracerForTests();
resetChatStressCompletionPropagationForTests();
beginFounderTestRuntime({ runId: 'launch-artifact-boundary-repair-run' });
completeFounderTestRuntimeStage({ stageId: 'FOUNDER_TEST_STARTED', skipFeed: true });
advanceFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION' });
emitFounderTestRuntimeTrace({
  operationId: LAUNCH_READINESS_ASSESSMENT_COMPLETE,
  stageId: 'INTAKE_VALIDATION',
  operationLabel: 'Launch readiness assessment complete',
  status: 'PASSED',
});
recordIntakeCompletionBoundaryOperation(LAUNCH_READINESS_ASSESSMENT_COMPLETE);
beginArtifactBuildSubstep({
  operationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  operationLabel: 'Building launch readiness report markdown',
});

reconcileLaunchReadinessArtifactCompletionBoundaryOnSnapshot(
  {
    state: 'RUNNING',
    stages: getFounderTestRuntimeStatus().stages,
    traceEvents: getFounderTestRuntimeStatus().traceEvents,
    missingCompletionBoundary: 'Launch readiness artifacts built',
    stage2CompletionGap: true,
    activeArtifactBuildSubstep: 'Building launch readiness report markdown',
    activeArtifactBuildSubstepOperationId: BUILDING_LAUNCH_READINESS_REPORT_MARKDOWN,
  },
  {
    onRuntimeTrace: ({ operationId, operationLabel, stageId, status }) => {
      emitFounderTestRuntimeTrace({ operationId, operationLabel, stageId, status });
    },
  },
);

const runtimeSnap = getFounderTestRuntimeStatus();
assert(
  '8. reconcile emits artifacts-built trace',
  runtimeSnap.traceEvents.some(
    (event) => event.operationId === LAUNCH_READINESS_ARTIFACTS_BUILT && event.status === 'PASSED',
  ),
  runtimeSnap.traceEvents.map((event) => event.operationId).join(', '),
);
assert(
  '9. active artifact substep cleared after reconcile',
  getActiveArtifactBuildSubstep() == null,
  getActiveArtifactBuildSubstep()?.operationLabel ?? 'cleared',
);

emitFounderTestRuntimeTrace({
  operationId: 'intake-validation-complete',
  stageId: 'INTAKE_VALIDATION',
  operationLabel: 'Intake validation complete',
  status: 'PASSED',
});
completeFounderTestRuntimeStage({ stageId: 'INTAKE_VALIDATION', message: 'Intake Validation Passed' });
emitFounderTestRuntimeTrace({
  operationId: 'planning-gate-started',
  stageId: 'PLANNING_GATE',
  operationLabel: 'Planning gate started',
  status: 'RUNNING',
});

const fullChainAssessment = assessLaunchReadinessArtifactCompletionBoundaryRepair({
  runtimeSnapshot: getFounderTestRuntimeStatus(),
  launchReadinessReportMarkdown: buildDegradedLaunchReadinessReportMarkdown({ verdict: 'PASSED' }),
  artifactPersisted: true,
});
assert(
  '10. full chain assessment passes',
  fullChainAssessment.report.passToken === LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS,
  fullChainAssessment.report.boundaryDetection.failureClass,
);

const repairPlan = planLaunchReadinessArtifactBoundaryRepair({
  assessmentAudit: fullChainAssessment.report.assessmentAudit,
  artifactBuilderAudit: fullChainAssessment.report.artifactBuilderAudit,
  boundaryDetection: fullChainAssessment.report.boundaryDetection,
  transitionAnalysis: fullChainAssessment.report.transitionAnalysis,
});
assert('11. no repair required when chain satisfied', !repairPlan.repairRequired, repairPlan.actions.join(', '));

const reportMarkdown = buildLaunchReadinessArtifactCompletionBoundaryRepairMarkdown(fullChainAssessment.report);
assert('12. report markdown generated', reportMarkdown.includes('Artifact chain'), reportMarkdown.slice(0, 60));

const failed = results.filter((entry) => !entry.passed);
const passToken =
  failed.length === 0 ? LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS : null;

const validationMarkdown = buildLaunchReadinessArtifactCompletionValidationMarkdown({
  passToken,
  checks: results,
});

writeFileSync(join(ROOT, 'architecture/LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_VALIDATION.md'), validationMarkdown);
writeFileSync(join(ROOT, 'architecture/LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_REPORT.md'), validationMarkdown);

if (failed.length > 0) {
  console.error('Launch readiness artifact completion boundary repair validation FAILED');
  for (const entry of failed) {
    console.error(`  ✗ ${entry.name}: ${entry.detail}`);
  }
  process.exit(1);
}

console.log(LAUNCH_READINESS_ARTIFACT_COMPLETION_BOUNDARY_REPAIR_PASS);
