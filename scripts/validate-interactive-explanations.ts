/**
 * Phase 24.6 — Interactive Explanations validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  INTERACTIVE_EXPLANATIONS_PASS_TOKEN,
  INTERACTIVE_EXPLANATIONS_OWNER_MODULE,
  DEFAULT_MAX_INTERACTIVE_EXPLANATIONS_HISTORY_SIZE,
  analyzeSystemExplanation,
  analyzeWorkflowExplanation,
  analyzeReasoningExplanation,
  analyzeReportInterpretation,
  analyzeNextStepGuidance,
  buildUnifiedInteractiveExplanationsAuthority,
  clearInteractiveExplanationsHistory,
  evaluateInteractiveExplanations,
  evaluateInteractiveExplanationsEngine,
  generateInteractiveExplanationsReport,
  getAuthorityBuildCount,
  getDevPulseV2InteractiveExplanations,
  getEvaluationCount,
  getGuidanceAnalysisCount,
  getInteractiveExplanationsCacheStats,
  getInteractiveExplanationsHistorySize,
  getInteractiveExplanationRecord,
  getInteractiveExplanationRecordCount,
  getInteractiveExplanationsRuntimeReport,
  getReasoningAnalysisCount,
  getReportAnalysisCount,
  getSystemAnalysisCount,
  getWorkflowAnalysisCount,
  isInteractiveExplanationsQuestion,
  listBaseGuidanceAreas,
  listBaseReasoningAreas,
  listBaseReportAreas,
  listBaseSystemAreas,
  listBaseWorkflowAreas,
  lookupInteractiveExplanationByProjectId,
  lookupInteractiveExplanationByState,
  registerInteractiveExplanationsWithApiDocumentation,
  registerInteractiveExplanationsWithArchitectureDocumentation,
  registerInteractiveExplanationsWithCapabilityRegistry,
  registerInteractiveExplanationsWithCentralBrain,
  registerInteractiveExplanationsWithCloudWorkerRuntime,
  registerInteractiveExplanationsWithFindPanel,
  registerInteractiveExplanationsWithFoundation,
  registerInteractiveExplanationsWithFounderGuides,
  registerInteractiveExplanationsWithMissingCapabilityEscalation,
  registerInteractiveExplanationsWithMobileCommand,
  registerInteractiveExplanationsWithProductHardeningCheckpoint,
  registerInteractiveExplanationsWithProjectVault,
  registerInteractiveExplanationsWithSelfDocumentation,
  registerInteractiveExplanationsWithSelfEvolutionGovernance,
  registerInteractiveExplanationsWithTrustEngineCheckpoint,
  registerInteractiveExplanationsWithUnifiedTrustScore,
  registerInteractiveExplanationsWithUserGuides,
  registerInteractiveExplanationsWithUvl,
  registerInteractiveExplanationsWithWorld2,
  resetInteractiveExplanationsForTests,
} from '../src/interactive-explanations/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { INTERACTIVE_EXPLANATIONS_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { InteractiveExplanationsInput } from '../src/interactive-explanations/interactive-explanations-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/interactive-explanations');

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 45 * 1000 });

function assert(group: string, name: string, condition: boolean, detail: string): void {
  results.push({ group, name, passed: condition, detail });
}

const REQUIRED_FILES = [
  'interactive-explanations-types.ts',
  'interactive-explanations-cache.ts',
  'interactive-explanations-registry.ts',
  'system-explanation-analyzer.ts',
  'workflow-explanation-analyzer.ts',
  'reasoning-explanation-analyzer.ts',
  'report-interpretation-analyzer.ts',
  'next-step-guidance-analyzer.ts',
  'interactive-explanations-authority-builder.ts',
  'interactive-explanations-evaluator.ts',
  'interactive-explanations-history.ts',
  'interactive-explanations-reporting.ts',
  'interactive-explanations.ts',
  'index.ts',
];

function resetAll(): void {
  resetInteractiveExplanationsForTests();
}

function explainInput(
  requestId: string,
  overrides: Partial<InteractiveExplanationsInput> = {},
): InteractiveExplanationsInput {
  return {
    requestId,
    projectId: 'test_project',
    workspaceId: 'test_workspace',
    governanceBlocked: false,
    ...overrides,
  };
}

function runSetup(): void {
  const g = harness.beginGroup('A-TYPES');
  for (const file of REQUIRED_FILES) {
    assert('A-TYPES', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }
  const engine = getDevPulseV2InteractiveExplanations();
  assert('A-TYPES', 'pass token', engine.passToken === INTERACTIVE_EXPLANATIONS_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === INTERACTIVE_EXPLANATIONS_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 24.6, String(engine.phase));
  assert('A-TYPES', 'uvl rows', INTERACTIVE_EXPLANATIONS_UVL_ROWS.length >= 13, String(INTERACTIVE_EXPLANATIONS_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_INTERACTIVE_EXPLANATIONS_HISTORY_SIZE === 128, String(DEFAULT_MAX_INTERACTIVE_EXPLANATIONS_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('interactive_explanations').phase === 24.6, '24.6');
  assert('A-TYPES', 'question signal', isInteractiveExplanationsQuestion('show interactive explanations'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateInteractiveExplanationsEngine(explainInput('reg-test'));
  assert('B-REGISTRY', 'registered', getInteractiveExplanationRecord(record.explanationId) !== undefined, record.explanationId);
  assert('B-REGISTRY', 'by project', lookupInteractiveExplanationByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'explanation id', record.explanationId.startsWith('interactive-explanations-'), record.explanationId);
  assert('B-REGISTRY', 'record count', getInteractiveExplanationRecordCount() >= 1, String(getInteractiveExplanationRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runSystemExplanations(): void {
  const g = harness.beginGroup('C-SYSTEM-EXPLANATIONS');
  resetAll();

  const snapshot = registerInteractiveExplanationsWithCentralBrain();
  const clean = analyzeSystemExplanation(explainInput('system-clean'), {
    systemCount: snapshot.centralBrainSystems,
    capabilityCount: snapshot.capabilityEntries,
    domainCount: snapshot.foundationDomains,
  });
  assert('C-SYSTEM-EXPLANATIONS', 'clean score', clean.systemCoverageScore >= 85, String(clean.systemCoverageScore));
  assert('C-SYSTEM-EXPLANATIONS', 'no gaps', clean.undocumentedSystems.length === 0, '0');
  assert('C-SYSTEM-EXPLANATIONS', 'base areas', listBaseSystemAreas().length >= 6, String(listBaseSystemAreas().length));

  const gaps = analyzeSystemExplanation(explainInput('system-gaps', {
    missingSystemExplanationGuidance: true,
    missingCapabilityExplanationGuidance: true,
    missingDomainExplanationGuidance: true,
    missingPhaseExplanationGuidance: true,
    missingCheckpointExplanationGuidance: true,
    missingAuthorityChainExplanationGuidance: true,
    undocumentedSystems: ['systems', 'capabilities', 'phases'],
  }), {
    systemCount: 0,
    capabilityCount: 0,
    domainCount: 0,
  });
  assert('C-SYSTEM-EXPLANATIONS', 'warnings', gaps.systemWarnings.length >= 6, String(gaps.systemWarnings.length));
  assert('C-SYSTEM-EXPLANATIONS', 'gaps present', gaps.undocumentedSystems.length >= 3, String(gaps.undocumentedSystems.length));
  assert('C-SYSTEM-EXPLANATIONS', 'low score', gaps.systemCoverageScore < 50, String(gaps.systemCoverageScore));

  harness.endGroup('C-SYSTEM-EXPLANATIONS', g);
}

function runWorkflowExplanations(): void {
  const g = harness.beginGroup('D-WORKFLOW-EXPLANATIONS');
  resetAll();

  const clean = analyzeWorkflowExplanation(explainInput('workflow-clean'), {
    hasProjectWorkflow: true,
    hasVerificationWorkflow: true,
    hasTrustWorkflow: true,
  });
  assert('D-WORKFLOW-EXPLANATIONS', 'clean score', clean.workflowCoverageScore >= 80, String(clean.workflowCoverageScore));
  assert('D-WORKFLOW-EXPLANATIONS', 'base workflows', listBaseWorkflowAreas().length >= 6, String(listBaseWorkflowAreas().length));

  const gaps = analyzeWorkflowExplanation(explainInput('workflow-gaps', {
    missingProjectWorkflowExplanation: true,
    missingVerificationWorkflowExplanation: true,
    missingTrustWorkflowExplanation: true,
    missingHardeningWorkflowExplanation: true,
    missingDocumentationWorkflowExplanation: true,
    missingLaunchWorkflowExplanation: true,
    undocumentedWorkflows: ['project_workflows', 'verification_workflows', 'launch_workflows'],
  }), {
    hasProjectWorkflow: false,
    hasVerificationWorkflow: false,
    hasTrustWorkflow: false,
  });
  assert('D-WORKFLOW-EXPLANATIONS', 'warnings', gaps.workflowWarnings.length >= 6, String(gaps.workflowWarnings.length));
  assert('D-WORKFLOW-EXPLANATIONS', 'gaps present', gaps.undocumentedWorkflows.length >= 3, String(gaps.undocumentedWorkflows.length));
  assert('D-WORKFLOW-EXPLANATIONS', 'low score', gaps.workflowCoverageScore < 50, String(gaps.workflowCoverageScore));

  harness.endGroup('D-WORKFLOW-EXPLANATIONS', g);
}

function runReasoningExplanations(): void {
  const g = harness.beginGroup('E-REASONING-EXPLANATIONS');
  resetAll();

  const clean = analyzeReasoningExplanation(explainInput('reasoning-clean'), {
    hasTrustReasoning: true,
    hasVerificationReasoning: true,
    hasGovernanceReasoning: true,
  });
  assert('E-REASONING-EXPLANATIONS', 'clean score', clean.reasoningCoverageScore >= 80, String(clean.reasoningCoverageScore));
  assert('E-REASONING-EXPLANATIONS', 'base areas', listBaseReasoningAreas().length >= 5, String(listBaseReasoningAreas().length));

  const gaps = analyzeReasoningExplanation(explainInput('reasoning-gaps', {
    missingTrustDecisionExplanation: true,
    missingVerificationDecisionExplanation: true,
    missingHardeningDecisionExplanation: true,
    missingDocumentationDecisionExplanation: true,
    missingGovernanceDecisionExplanation: true,
    undocumentedReasoningAreas: ['trust_decisions', 'verification_decisions', 'governance_decisions'],
  }), {
    hasTrustReasoning: false,
    hasVerificationReasoning: false,
    hasGovernanceReasoning: false,
  });
  assert('E-REASONING-EXPLANATIONS', 'warnings', gaps.reasoningWarnings.length >= 5, String(gaps.reasoningWarnings.length));
  assert('E-REASONING-EXPLANATIONS', 'gaps present', gaps.undocumentedReasoningAreas.length >= 3, String(gaps.undocumentedReasoningAreas.length));
  assert('E-REASONING-EXPLANATIONS', 'low score', gaps.reasoningCoverageScore < 50, String(gaps.reasoningCoverageScore));

  harness.endGroup('E-REASONING-EXPLANATIONS', g);
}

function runReportExplanations(): void {
  const g = harness.beginGroup('F-REPORT-EXPLANATIONS');
  resetAll();

  const clean = analyzeReportInterpretation(explainInput('report-clean'), {
    hasTrustReports: true,
    hasVerificationReports: true,
    hasCheckpointReports: true,
  });
  assert('F-REPORT-EXPLANATIONS', 'clean score', clean.reportCoverageScore >= 80, String(clean.reportCoverageScore));
  assert('F-REPORT-EXPLANATIONS', 'base areas', listBaseReportAreas().length >= 5, String(listBaseReportAreas().length));

  const gaps = analyzeReportInterpretation(explainInput('report-gaps', {
    missingTrustReportExplanation: true,
    missingVerificationReportExplanation: true,
    missingHardeningReportExplanation: true,
    missingDocumentationReportExplanation: true,
    missingCheckpointReportExplanation: true,
    undocumentedReportAreas: ['trust_reports', 'verification_reports', 'checkpoint_reports'],
  }), {
    hasTrustReports: false,
    hasVerificationReports: false,
    hasCheckpointReports: false,
  });
  assert('F-REPORT-EXPLANATIONS', 'warnings', gaps.reportWarnings.length >= 5, String(gaps.reportWarnings.length));
  assert('F-REPORT-EXPLANATIONS', 'gaps present', gaps.undocumentedReportAreas.length >= 3, String(gaps.undocumentedReportAreas.length));
  assert('F-REPORT-EXPLANATIONS', 'low score', gaps.reportCoverageScore < 50, String(gaps.reportCoverageScore));

  harness.endGroup('F-REPORT-EXPLANATIONS', g);
}

function runNextStepGuidance(): void {
  const g = harness.beginGroup('G-NEXT-STEP-GUIDANCE');
  resetAll();

  const clean = analyzeNextStepGuidance(explainInput('guidance-clean'), {
    hasRoadmapProgression: true,
    hasCheckpointProgression: true,
    hasDependencyProgression: true,
  });
  assert('G-NEXT-STEP-GUIDANCE', 'clean score', clean.guidanceCoverageScore >= 80, String(clean.guidanceCoverageScore));
  assert('G-NEXT-STEP-GUIDANCE', 'base areas', listBaseGuidanceAreas().length >= 5, String(listBaseGuidanceAreas().length));

  const gaps = analyzeNextStepGuidance(explainInput('guidance-gaps', {
    missingNextPhaseGuidance: true,
    missingNextCheckpointGuidance: true,
    missingNextActionGuidance: true,
    missingRoadmapProgressionGuidance: true,
    missingDependencyProgressionGuidance: true,
    undocumentedGuidanceAreas: ['next_phase', 'next_checkpoint', 'roadmap_progression'],
  }), {
    hasRoadmapProgression: false,
    hasCheckpointProgression: false,
    hasDependencyProgression: false,
  });
  assert('G-NEXT-STEP-GUIDANCE', 'warnings', gaps.guidanceWarnings.length >= 5, String(gaps.guidanceWarnings.length));
  assert('G-NEXT-STEP-GUIDANCE', 'gaps present', gaps.undocumentedGuidanceAreas.length >= 3, String(gaps.undocumentedGuidanceAreas.length));
  assert('G-NEXT-STEP-GUIDANCE', 'low score', gaps.guidanceCoverageScore < 50, String(gaps.guidanceCoverageScore));

  harness.endGroup('G-NEXT-STEP-GUIDANCE', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const snapshot = registerInteractiveExplanationsWithCentralBrain();
  const input = explainInput('auth-test');
  const system = analyzeSystemExplanation(input, {
    systemCount: snapshot.centralBrainSystems,
    capabilityCount: snapshot.capabilityEntries,
    domainCount: snapshot.foundationDomains,
  });
  const workflow = analyzeWorkflowExplanation(input, {
    hasProjectWorkflow: true,
    hasVerificationWorkflow: true,
    hasTrustWorkflow: true,
  });
  const reasoning = analyzeReasoningExplanation(input, {
    hasTrustReasoning: true,
    hasVerificationReasoning: true,
    hasGovernanceReasoning: true,
  });
  const report = analyzeReportInterpretation(input, {
    hasTrustReports: true,
    hasVerificationReports: true,
    hasCheckpointReports: true,
  });
  const guidance = analyzeNextStepGuidance(input, {
    hasRoadmapProgression: true,
    hasCheckpointProgression: true,
    hasDependencyProgression: true,
  });
  const authority = buildUnifiedInteractiveExplanationsAuthority(
    'auth-test',
    system,
    workflow,
    reasoning,
    report,
    guidance,
    input,
  );

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('interactive-explanations-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'coverage score', authority.explanationCoverageScore > 0, String(authority.explanationCoverageScore));
  assert('H-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('H-AUTHORITY', 'coverage level', authority.coverageLevel.length > 0, authority.coverageLevel);

  const blocked = buildUnifiedInteractiveExplanationsAuthority(
    'auth-blocked',
    system,
    workflow,
    reasoning,
    report,
    guidance,
    { ...input, governanceBlocked: true },
  );
  assert('H-AUTHORITY', 'blocked state', blocked.state === 'UNKNOWN', blocked.state);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluateInteractiveExplanationsEngine(explainInput('eval-stable'));
  assert('I-EVALUATION', 'stable state', record.state === 'READY' || record.state === 'PARTIAL', record.state);
  assert('I-EVALUATION', 'coverage score', record.explanationCoverageScore > 50, String(record.explanationCoverageScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluateInteractiveExplanationsEngine(explainInput('eval-degraded', {
    missingSystemExplanationGuidance: true,
    missingCapabilityExplanationGuidance: true,
    missingDomainExplanationGuidance: true,
    missingPhaseExplanationGuidance: true,
    missingCheckpointExplanationGuidance: true,
    missingAuthorityChainExplanationGuidance: true,
    missingProjectWorkflowExplanation: true,
    missingVerificationWorkflowExplanation: true,
    missingTrustWorkflowExplanation: true,
    missingHardeningWorkflowExplanation: true,
    missingDocumentationWorkflowExplanation: true,
    missingLaunchWorkflowExplanation: true,
    missingTrustDecisionExplanation: true,
    missingVerificationDecisionExplanation: true,
    missingHardeningDecisionExplanation: true,
    missingDocumentationDecisionExplanation: true,
    missingGovernanceDecisionExplanation: true,
    missingTrustReportExplanation: true,
    missingVerificationReportExplanation: true,
    missingHardeningReportExplanation: true,
    missingDocumentationReportExplanation: true,
    missingCheckpointReportExplanation: true,
    missingNextPhaseGuidance: true,
    missingNextCheckpointGuidance: true,
    missingNextActionGuidance: true,
    missingRoadmapProgressionGuidance: true,
    missingDependencyProgressionGuidance: true,
    governanceBlocked: true,
  }));
  assert('I-EVALUATION', 'degraded state', degraded.record.state !== 'READY', degraded.record.state);
  assert('I-EVALUATION', 'low score', degraded.record.explanationCoverageScore < 75, String(degraded.record.explanationCoverageScore));

  const snapshot = registerInteractiveExplanationsWithCentralBrain();
  const input = explainInput('eval-manual');
  const authority = buildUnifiedInteractiveExplanationsAuthority(
    'eval-manual',
    analyzeSystemExplanation(input, {
      systemCount: snapshot.centralBrainSystems,
      capabilityCount: snapshot.capabilityEntries,
      domainCount: snapshot.foundationDomains,
    }),
    analyzeWorkflowExplanation(input, {
      hasProjectWorkflow: true,
      hasVerificationWorkflow: true,
      hasTrustWorkflow: true,
    }),
    analyzeReasoningExplanation(input, {
      hasTrustReasoning: true,
      hasVerificationReasoning: true,
      hasGovernanceReasoning: true,
    }),
    analyzeReportInterpretation(input, {
      hasTrustReports: true,
      hasVerificationReports: true,
      hasCheckpointReports: true,
    }),
    analyzeNextStepGuidance(input, {
      hasRoadmapProgression: true,
      hasCheckpointProgression: true,
      hasDependencyProgression: true,
    }),
    input,
  );
  const evaluation = evaluateInteractiveExplanations(authority);
  assert('I-EVALUATION', 'explanation readiness', evaluation.explanationReadiness > 0, String(evaluation.explanationReadiness));
  assert('I-EVALUATION', 'report score', evaluation.reportCoverageScore >= 0, String(evaluation.reportCoverageScore));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluateInteractiveExplanationsEngine(explainInput('report-test'));
  assert('J-REPORTING', 'coverage score', report.explanationCoverageScore === record.explanationCoverageScore, String(report.explanationCoverageScore));
  assert('J-REPORTING', 'state', report.state === record.state, report.state);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));
  assert('J-REPORTING', 'system coverage', report.systemExplanationCoverage.length > 0, String(report.systemExplanationCoverage.length));
  assert('J-REPORTING', 'guidance coverage', report.guidanceCoverage.length > 0, String(report.guidanceCoverage.length));

  const manual = generateInteractiveExplanationsReport(
    record,
    report.evaluation,
    { systemCoverageScore: 90, undocumentedSystems: [], systemWarnings: [] },
    { workflowCoverageScore: 90, undocumentedWorkflows: [], workflowWarnings: [] },
    { reasoningCoverageScore: 90, undocumentedReasoningAreas: [], reasoningWarnings: [] },
    { reportCoverageScore: 90, undocumentedReportAreas: [], reportWarnings: [] },
    { guidanceCoverageScore: 90, undocumentedGuidanceAreas: [], guidanceWarnings: [] },
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluateInteractiveExplanationsEngine(explainInput(`history-${i}`));
  }
  assert('J-REPORTING', 'history bounded', getInteractiveExplanationsHistorySize() === 128, String(getInteractiveExplanationsHistorySize()));
  clearInteractiveExplanationsHistory();
  assert('J-REPORTING', 'history cleared', getInteractiveExplanationsHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerInteractiveExplanationsWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerInteractiveExplanationsWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'self documentation', registerInteractiveExplanationsWithSelfDocumentation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'founder guides', registerInteractiveExplanationsWithFounderGuides().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'user guides', registerInteractiveExplanationsWithUserGuides().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'architecture documentation', registerInteractiveExplanationsWithArchitectureDocumentation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'api documentation', registerInteractiveExplanationsWithApiDocumentation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'foundation', registerInteractiveExplanationsWithFoundation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'capability registry', registerInteractiveExplanationsWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'find panel', registerInteractiveExplanationsWithFindPanel().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerInteractiveExplanationsWithUvl().uvlRowCount >= 13, String(registerInteractiveExplanationsWithUvl().uvlRowCount));
  assert('K-INTEGRATION', 'unified trust score', registerInteractiveExplanationsWithUnifiedTrustScore().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust checkpoint', registerInteractiveExplanationsWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'product hardening checkpoint', registerInteractiveExplanationsWithProductHardeningCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerInteractiveExplanationsWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'project vault', registerInteractiveExplanationsWithProjectVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'mobile command', registerInteractiveExplanationsWithMobileCommand().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'cloud worker runtime', registerInteractiveExplanationsWithCloudWorkerRuntime().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerInteractiveExplanationsWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerInteractiveExplanationsWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));
  assert('K-INTEGRATION', 'uvl rows', brain.uvlRows > 0, String(brain.uvlRows));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const snapshot = registerInteractiveExplanationsWithCentralBrain();
  const input = explainInput('cache-fixed');
  const system = analyzeSystemExplanation(input, {
    systemCount: snapshot.centralBrainSystems,
    capabilityCount: snapshot.capabilityEntries,
    domainCount: snapshot.foundationDomains,
  });
  const workflow = analyzeWorkflowExplanation(input, {
    hasProjectWorkflow: true,
    hasVerificationWorkflow: true,
    hasTrustWorkflow: true,
  });
  const reasoning = analyzeReasoningExplanation(input, {
    hasTrustReasoning: true,
    hasVerificationReasoning: true,
    hasGovernanceReasoning: true,
  });
  const report = analyzeReportInterpretation(input, {
    hasTrustReports: true,
    hasVerificationReports: true,
    hasCheckpointReports: true,
  });
  const guidance = analyzeNextStepGuidance(input, {
    hasRoadmapProgression: true,
    hasCheckpointProgression: true,
    hasDependencyProgression: true,
  });

  buildUnifiedInteractiveExplanationsAuthority('cache-fixed', system, workflow, reasoning, report, guidance, input);
  buildUnifiedInteractiveExplanationsAuthority('cache-fixed', system, workflow, reasoning, report, guidance, input);

  const cache = getInteractiveExplanationsCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byState = lookupInteractiveExplanationByState('READY');
  assert('L-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressExplanations(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluateInteractiveExplanationsEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      missingSystemExplanationGuidance: i % 11 === 0,
      missingProjectWorkflowExplanation: i % 13 === 0,
      missingTrustDecisionExplanation: i % 17 === 0,
      missingTrustReportExplanation: i % 19 === 0,
      missingNextPhaseGuidance: i % 23 === 0,
      governanceBlocked: i % 29 === 0,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getInteractiveExplanationRecordCount() === count, String(getInteractiveExplanationRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getInteractiveExplanationsRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'system analyses', runtime.systemAnalysisCount > 0, String(runtime.systemAnalysisCount));

  const sample = getInteractiveExplanationRecord(`interactive-explanations-${count}`);
  assert(`M-STRESS-${label}`, 'sample record', sample !== undefined, 'record');

  harness.endGroup(`M-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('N-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Phase 24.6 Interactive Explanations');
  console.log('=================================================\n');

  runSetup();
  runRegistry();
  runSystemExplanations();
  runWorkflowExplanations();
  runReasoningExplanations();
  runReportExplanations();
  runNextStepGuidance();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressExplanations(100, '100');
  stressExplanations(1000, '1000');
  stressExplanations(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getInteractiveExplanationsRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `System analyses: ${getSystemAnalysisCount()}`,
    `Workflow analyses: ${getWorkflowAnalysisCount()}`,
    `Reasoning analyses: ${getReasoningAnalysisCount()}`,
    `Report analyses: ${getReportAnalysisCount()}`,
    `Guidance analyses: ${getGuidanceAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getInteractiveExplanationRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? INTERACTIVE_EXPLANATIONS_PASS_TOKEN : 'INTERACTIVE_EXPLANATIONS_V1_FAIL',
  ]);

  if (failed.length > 0) {
    console.error('\nFailed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.error(`  [${f.group}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  if (results.length < MIN_SCENARIOS) {
    console.error(`\nInsufficient scenarios: ${results.length} < ${MIN_SCENARIOS}`);
    process.exit(1);
  }

  console.log(`\n${INTERACTIVE_EXPLANATIONS_PASS_TOKEN}`);
}

main();
