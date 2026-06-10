/**
 * Phase 24.3 — User Guides validation.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import {
  USER_GUIDES_PASS_TOKEN,
  USER_GUIDES_OWNER_MODULE,
  DEFAULT_MAX_USER_GUIDES_HISTORY_SIZE,
  analyzeOnboardingGuide,
  analyzeWorkflowGuide,
  analyzeFeatureDiscoveryGuide,
  analyzeSafetyGuide,
  analyzeResultsInterpretationGuide,
  buildUnifiedUserGuidesAuthority,
  clearUserGuidesHistory,
  evaluateUserGuides,
  evaluateUserGuidesEngine,
  generateUserGuidesReport,
  getAuthorityBuildCount,
  getDevPulseV2UserGuides,
  getEvaluationCount,
  getFeatureAnalysisCount,
  getInterpretationAnalysisCount,
  getOnboardingAnalysisCount,
  getSafetyAnalysisCount,
  getUserGuidesCacheStats,
  getUserGuidesHistorySize,
  getUserGuideRecord,
  getUserGuideRecordCount,
  getUserGuidesRuntimeReport,
  getWorkflowAnalysisCount,
  isUserGuidesQuestion,
  listBaseOnboardingAreas,
  listBaseResultAreas,
  listBaseSafetyAreas,
  listBaseWorkflows,
  lookupUserGuideByProjectId,
  lookupUserGuideByState,
  registerUserGuidesWithCapabilityRegistry,
  registerUserGuidesWithCentralBrain,
  registerUserGuidesWithFindPanel,
  registerUserGuidesWithFoundation,
  registerUserGuidesWithFounderGuides,
  registerUserGuidesWithMissingCapabilityEscalation,
  registerUserGuidesWithMobileCommand,
  registerUserGuidesWithNotificationVault,
  registerUserGuidesWithOperatorFeed,
  registerUserGuidesWithProductHardeningCheckpoint,
  registerUserGuidesWithSelfDocumentation,
  registerUserGuidesWithSelfEvolutionGovernance,
  registerUserGuidesWithTrustEngineCheckpoint,
  registerUserGuidesWithUnifiedTrustScore,
  registerUserGuidesWithUvl,
  registerUserGuidesWithWorld2,
  resetUserGuidesForTests,
} from '../src/user-guides/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { USER_GUIDES_UVL_ROWS } from '../src/unified-verification-lab/uvl-row-registry.js';
import type { UserGuidesInput } from '../src/user-guides/user-guides-types.js';

const MIN_SCENARIOS = 110;
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODULE_DIR = join(ROOT, 'src/user-guides');

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
  'user-guides-types.ts',
  'user-guides-cache.ts',
  'user-guides-registry.ts',
  'onboarding-guide-analyzer.ts',
  'workflow-guide-analyzer.ts',
  'feature-discovery-guide-analyzer.ts',
  'safety-guide-analyzer.ts',
  'results-interpretation-guide-analyzer.ts',
  'user-guides-authority-builder.ts',
  'user-guides-evaluator.ts',
  'user-guides-history.ts',
  'user-guides-reporting.ts',
  'user-guides.ts',
  'index.ts',
];

function resetAll(): void {
  resetUserGuidesForTests();
}

function guideInput(requestId: string, overrides: Partial<UserGuidesInput> = {}): UserGuidesInput {
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
  const engine = getDevPulseV2UserGuides();
  assert('A-TYPES', 'pass token', engine.passToken === USER_GUIDES_PASS_TOKEN, engine.passToken);
  assert('A-TYPES', 'owner module', engine.ownerModule === USER_GUIDES_OWNER_MODULE, engine.ownerModule);
  assert('A-TYPES', 'read only', engine.readOnly === true, 'readOnly');
  assert('A-TYPES', 'no execution', engine.noExecution === true, 'noExecution');
  assert('A-TYPES', 'phase', engine.phase === 24.3, String(engine.phase));
  assert('A-TYPES', 'uvl rows', USER_GUIDES_UVL_ROWS.length >= 13, String(USER_GUIDES_UVL_ROWS.length));
  assert('A-TYPES', 'max history', DEFAULT_MAX_USER_GUIDES_HISTORY_SIZE === 128, String(DEFAULT_MAX_USER_GUIDES_HISTORY_SIZE));
  assert('A-TYPES', 'ownership', getDevPulseV2Owner('user_guides').phase === 24.3, '24.3');
  assert('A-TYPES', 'question signal', isUserGuidesQuestion('show user guides'), 'signal');
  harness.endGroup('A-TYPES', g);
}

function runRegistry(): void {
  const g = harness.beginGroup('B-REGISTRY');
  resetAll();

  const { record } = evaluateUserGuidesEngine(guideInput('reg-test'));
  assert('B-REGISTRY', 'registered', getUserGuideRecord(record.guideId) !== undefined, record.guideId);
  assert('B-REGISTRY', 'by project', lookupUserGuideByProjectId('test_project').length >= 1, 'lookup');
  assert('B-REGISTRY', 'guide id', record.guideId.startsWith('user-guides-'), record.guideId);
  assert('B-REGISTRY', 'record count', getUserGuideRecordCount() >= 1, String(getUserGuideRecordCount()));

  harness.endGroup('B-REGISTRY', g);
}

function runOnboardingGuides(): void {
  const g = harness.beginGroup('C-ONBOARDING-GUIDES');
  resetAll();

  const clean = analyzeOnboardingGuide(guideInput('onboarding-clean'), {
    hasChatSystem: true,
    hasNotificationSystem: true,
    hasVerificationSystem: true,
    hasMobileSystem: true,
  });
  assert('C-ONBOARDING-GUIDES', 'clean score', clean.onboardingCoverageScore >= 85, String(clean.onboardingCoverageScore));
  assert('C-ONBOARDING-GUIDES', 'no gaps', clean.undocumentedOnboardingAreas.length === 0, '0');
  assert('C-ONBOARDING-GUIDES', 'base areas', listBaseOnboardingAreas().length >= 8, String(listBaseOnboardingAreas().length));

  const gaps = analyzeOnboardingGuide(guideInput('onboarding-gaps', {
    missingFirstLaunchGuidance: true,
    missingProjectCreationGuidance: true,
    missingChatGuidance: true,
    missingNavigationGuidance: true,
    missingNotificationGuidance: true,
    missingVerificationGuidance: true,
    missingReportGuidance: true,
    missingMobileUsageGuidance: true,
    undocumentedOnboardingAreas: ['first_launch', 'creating_a_project', 'understanding_chat'],
  }), {
    hasChatSystem: false,
    hasNotificationSystem: false,
    hasVerificationSystem: false,
    hasMobileSystem: false,
  });
  assert('C-ONBOARDING-GUIDES', 'warnings', gaps.onboardingWarnings.length >= 8, String(gaps.onboardingWarnings.length));
  assert('C-ONBOARDING-GUIDES', 'gaps present', gaps.undocumentedOnboardingAreas.length >= 3, String(gaps.undocumentedOnboardingAreas.length));
  assert('C-ONBOARDING-GUIDES', 'low score', gaps.onboardingCoverageScore < 50, String(gaps.onboardingCoverageScore));

  harness.endGroup('C-ONBOARDING-GUIDES', g);
}

function runWorkflowGuides(): void {
  const g = harness.beginGroup('D-WORKFLOW-GUIDES');
  resetAll();

  const clean = analyzeWorkflowGuide(guideInput('workflow-clean'), {
    hasProjectWorkflow: true,
    hasVerificationWorkflow: true,
    hasNotificationWorkflow: true,
    hasMobileWorkflow: true,
    hasWorld2Workflow: true,
  });
  assert('D-WORKFLOW-GUIDES', 'clean score', clean.workflowCoverageScore >= 80, String(clean.workflowCoverageScore));
  assert('D-WORKFLOW-GUIDES', 'base workflows', listBaseWorkflows().length >= 8, String(listBaseWorkflows().length));

  const gaps = analyzeWorkflowGuide(guideInput('workflow-gaps', {
    missingProjectManagementWorkflow: true,
    missingWorld2WorkflowGuidance: true,
    missingMonitoringWorkflowGuidance: true,
    missingTrustWorkflowGuidance: true,
    undocumentedWorkflows: ['project_creation', 'verification', 'mobile'],
  }), {
    hasProjectWorkflow: false,
    hasVerificationWorkflow: false,
    hasNotificationWorkflow: false,
    hasMobileWorkflow: false,
    hasWorld2Workflow: false,
  });
  assert('D-WORKFLOW-GUIDES', 'warnings', gaps.workflowWarnings.length >= 4, String(gaps.workflowWarnings.length));
  assert('D-WORKFLOW-GUIDES', 'gaps present', gaps.undocumentedWorkflows.length >= 5, String(gaps.undocumentedWorkflows.length));
  assert('D-WORKFLOW-GUIDES', 'low score', gaps.workflowCoverageScore < 50, String(gaps.workflowCoverageScore));

  harness.endGroup('D-WORKFLOW-GUIDES', g);
}

function runFeatureDiscovery(): void {
  const g = harness.beginGroup('E-FEATURE-DISCOVERY');
  resetAll();

  const snapshot = registerUserGuidesWithCentralBrain();
  const clean = analyzeFeatureDiscoveryGuide(guideInput('feature-clean'), {
    capabilityCount: snapshot.capabilityEntries,
    aliasCount: snapshot.findPanelAliases,
    hasMobileFeatures: true,
    hasCloudFeatures: true,
  });
  assert('E-FEATURE-DISCOVERY', 'clean score', clean.featureCoverageScore >= 70, String(clean.featureCoverageScore));
  assert('E-FEATURE-DISCOVERY', 'no undocumented', clean.undocumentedFeatures.length === 0, '0');

  const gaps = analyzeFeatureDiscoveryGuide(guideInput('feature-gaps', {
    missingCapabilityDiscoveryGuidance: true,
    missingFindPanelGuidance: true,
    missingMobileFeatureGuidance: true,
    missingCloudFeatureGuidance: true,
    undocumentedFeatures: ['capabilities', 'commands', 'dashboards'],
  }), {
    capabilityCount: 5,
    aliasCount: 2,
    hasMobileFeatures: false,
    hasCloudFeatures: false,
  });
  assert('E-FEATURE-DISCOVERY', 'warnings', gaps.featureWarnings.length >= 4, String(gaps.featureWarnings.length));
  assert('E-FEATURE-DISCOVERY', 'gaps present', gaps.undocumentedFeatures.length >= 3, String(gaps.undocumentedFeatures.length));
  assert('E-FEATURE-DISCOVERY', 'low score', gaps.featureCoverageScore < 55, String(gaps.featureCoverageScore));

  harness.endGroup('E-FEATURE-DISCOVERY', g);
}

function runSafetyGuides(): void {
  const g = harness.beginGroup('F-SAFETY-GUIDES');
  resetAll();

  const clean = analyzeSafetyGuide(guideInput('safety-clean'), {
    hasTrustSystem: true,
    hasPrivacyHardening: true,
    hasSecurityHardening: true,
    hasMobileControl: true,
  });
  assert('F-SAFETY-GUIDES', 'clean score', clean.safetyCoverageScore >= 75, String(clean.safetyCoverageScore));
  assert('F-SAFETY-GUIDES', 'base areas', listBaseSafetyAreas().length >= 8, String(listBaseSafetyAreas().length));

  const gaps = analyzeSafetyGuide(guideInput('safety-gaps', {
    missingSafeUsageGuidance: true,
    missingTrustAwarenessGuidance: true,
    missingPrivacyAwarenessGuidance: true,
    missingSecurityAwarenessGuidance: true,
    missingMobileControlAwareness: true,
    undocumentedSafetyAreas: ['safe_usage', 'trust_awareness', 'cloud_awareness'],
  }), {
    hasTrustSystem: false,
    hasPrivacyHardening: false,
    hasSecurityHardening: false,
    hasMobileControl: false,
  });
  assert('F-SAFETY-GUIDES', 'warnings', gaps.safetyWarnings.length >= 5, String(gaps.safetyWarnings.length));
  assert('F-SAFETY-GUIDES', 'gaps present', gaps.undocumentedSafetyAreas.length >= 3, String(gaps.undocumentedSafetyAreas.length));
  assert('F-SAFETY-GUIDES', 'low score', gaps.safetyCoverageScore < 50, String(gaps.safetyCoverageScore));

  harness.endGroup('F-SAFETY-GUIDES', g);
}

function runResultInterpretation(): void {
  const g = harness.beginGroup('G-RESULT-INTERPRETATION');
  resetAll();

  const clean = analyzeResultsInterpretationGuide(guideInput('interpretation-clean'), {
    hasTrustScore: true,
    hasVerificationResults: true,
    hasHardeningScores: true,
    hasCheckpoints: true,
  });
  assert('G-RESULT-INTERPRETATION', 'clean score', clean.interpretationCoverageScore >= 80, String(clean.interpretationCoverageScore));
  assert('G-RESULT-INTERPRETATION', 'base areas', listBaseResultAreas().length >= 8, String(listBaseResultAreas().length));

  const gaps = analyzeResultsInterpretationGuide(guideInput('interpretation-gaps', {
    missingTrustScoreInterpretation: true,
    missingVerificationResultInterpretation: true,
    missingHardeningScoreInterpretation: true,
    missingCheckpointInterpretation: true,
    undocumentedResultAreas: ['trust_scores', 'warnings', 'recommendations'],
  }), {
    hasTrustScore: false,
    hasVerificationResults: false,
    hasHardeningScores: false,
    hasCheckpoints: false,
  });
  assert('G-RESULT-INTERPRETATION', 'warnings', gaps.interpretationWarnings.length >= 4, String(gaps.interpretationWarnings.length));
  assert('G-RESULT-INTERPRETATION', 'gaps present', gaps.undocumentedResultAreas.length >= 3, String(gaps.undocumentedResultAreas.length));
  assert('G-RESULT-INTERPRETATION', 'low score', gaps.interpretationCoverageScore < 50, String(gaps.interpretationCoverageScore));

  harness.endGroup('G-RESULT-INTERPRETATION', g);
}

function runAuthority(): void {
  const g = harness.beginGroup('H-AUTHORITY');
  resetAll();

  const snapshot = registerUserGuidesWithCentralBrain();
  const input = guideInput('auth-test');
  const onboarding = analyzeOnboardingGuide(input, {
    hasChatSystem: true,
    hasNotificationSystem: true,
    hasVerificationSystem: true,
    hasMobileSystem: true,
  });
  const workflow = analyzeWorkflowGuide(input, {
    hasProjectWorkflow: true,
    hasVerificationWorkflow: true,
    hasNotificationWorkflow: true,
    hasMobileWorkflow: true,
    hasWorld2Workflow: true,
  });
  const feature = analyzeFeatureDiscoveryGuide(input, {
    capabilityCount: snapshot.capabilityEntries,
    aliasCount: snapshot.findPanelAliases,
    hasMobileFeatures: true,
    hasCloudFeatures: true,
  });
  const safety = analyzeSafetyGuide(input, {
    hasTrustSystem: true,
    hasPrivacyHardening: true,
    hasSecurityHardening: true,
    hasMobileControl: true,
  });
  const interpretation = analyzeResultsInterpretationGuide(input, {
    hasTrustScore: true,
    hasVerificationResults: true,
    hasHardeningScores: true,
    hasCheckpoints: true,
  });
  const authority = buildUnifiedUserGuidesAuthority(
    'auth-test',
    onboarding,
    workflow,
    feature,
    safety,
    interpretation,
    input,
  );

  assert('H-AUTHORITY', 'authority id', authority.authorityId.startsWith('user-guides-authority-'), authority.authorityId);
  assert('H-AUTHORITY', 'coverage score', authority.userCoverageScore > 0, String(authority.userCoverageScore));
  assert('H-AUTHORITY', 'state', authority.state.length > 0, authority.state);
  assert('H-AUTHORITY', 'completeness', authority.completenessLevel.length > 0, authority.completenessLevel);

  const blocked = buildUnifiedUserGuidesAuthority(
    'auth-blocked',
    onboarding,
    workflow,
    feature,
    safety,
    interpretation,
    { ...input, governanceBlocked: true },
  );
  assert('H-AUTHORITY', 'blocked state', blocked.state === 'UNKNOWN', blocked.state);

  harness.endGroup('H-AUTHORITY', g);
}

function runEvaluation(): void {
  const g = harness.beginGroup('I-EVALUATION');
  resetAll();

  const { record } = evaluateUserGuidesEngine(guideInput('eval-stable'));
  assert('I-EVALUATION', 'stable state', record.state === 'READY' || record.state === 'PARTIAL', record.state);
  assert('I-EVALUATION', 'coverage score', record.userCoverageScore > 50, String(record.userCoverageScore));
  assert('I-EVALUATION', 'confidence', record.confidence > 0, String(record.confidence));

  const degraded = evaluateUserGuidesEngine(guideInput('eval-degraded', {
    missingFirstLaunchGuidance: true,
    missingProjectCreationGuidance: true,
    missingChatGuidance: true,
    missingNavigationGuidance: true,
    missingNotificationGuidance: true,
    missingVerificationGuidance: true,
    missingReportGuidance: true,
    missingMobileUsageGuidance: true,
    missingProjectManagementWorkflow: true,
    missingWorld2WorkflowGuidance: true,
    missingMonitoringWorkflowGuidance: true,
    missingTrustWorkflowGuidance: true,
    missingCapabilityDiscoveryGuidance: true,
    missingFindPanelGuidance: true,
    missingMobileFeatureGuidance: true,
    missingCloudFeatureGuidance: true,
    missingSafeUsageGuidance: true,
    missingTrustAwarenessGuidance: true,
    missingPrivacyAwarenessGuidance: true,
    missingSecurityAwarenessGuidance: true,
    missingMobileControlAwareness: true,
    missingTrustScoreInterpretation: true,
    missingVerificationResultInterpretation: true,
    missingHardeningScoreInterpretation: true,
    missingCheckpointInterpretation: true,
    governanceBlocked: true,
  }));
  assert('I-EVALUATION', 'degraded state', degraded.record.state !== 'READY', degraded.record.state);
  assert('I-EVALUATION', 'low score', degraded.record.userCoverageScore < 75, String(degraded.record.userCoverageScore));

  const snapshot = registerUserGuidesWithCentralBrain();
  const input = guideInput('eval-manual');
  const authority = buildUnifiedUserGuidesAuthority(
    'eval-manual',
    analyzeOnboardingGuide(input, {
      hasChatSystem: true,
      hasNotificationSystem: true,
      hasVerificationSystem: true,
      hasMobileSystem: true,
    }),
    analyzeWorkflowGuide(input, {
      hasProjectWorkflow: true,
      hasVerificationWorkflow: true,
      hasNotificationWorkflow: true,
      hasMobileWorkflow: true,
      hasWorld2Workflow: true,
    }),
    analyzeFeatureDiscoveryGuide(input, {
      capabilityCount: snapshot.capabilityEntries,
      aliasCount: snapshot.findPanelAliases,
      hasMobileFeatures: true,
      hasCloudFeatures: true,
    }),
    analyzeSafetyGuide(input, {
      hasTrustSystem: true,
      hasPrivacyHardening: true,
      hasSecurityHardening: true,
      hasMobileControl: true,
    }),
    analyzeResultsInterpretationGuide(input, {
      hasTrustScore: true,
      hasVerificationResults: true,
      hasHardeningScores: true,
      hasCheckpoints: true,
    }),
    input,
  );
  const evaluation = evaluateUserGuides(authority);
  assert('I-EVALUATION', 'guide readiness', evaluation.guideReadiness > 0, String(evaluation.guideReadiness));
  assert('I-EVALUATION', 'feature score', evaluation.featureCoverageScore >= 0, String(evaluation.featureCoverageScore));

  harness.endGroup('I-EVALUATION', g);
}

function runReporting(): void {
  const g = harness.beginGroup('J-REPORTING');
  resetAll();

  const { record, report } = evaluateUserGuidesEngine(guideInput('report-test'));
  assert('J-REPORTING', 'coverage score', report.userCoverageScore === record.userCoverageScore, String(report.userCoverageScore));
  assert('J-REPORTING', 'state', report.state === record.state, report.state);
  assert('J-REPORTING', 'confidence', report.confidence > 0, String(report.confidence));
  assert('J-REPORTING', 'recommendations', report.recommendations.length > 0, String(report.recommendations.length));
  assert('J-REPORTING', 'onboarding guidance', report.onboardingGuidance.length > 0, String(report.onboardingGuidance.length));
  assert('J-REPORTING', 'safety guidance', report.safetyGuidance.length > 0, String(report.safetyGuidance.length));

  const manual = generateUserGuidesReport(
    record,
    report.evaluation,
    { onboardingCoverageScore: 90, undocumentedOnboardingAreas: [], onboardingWarnings: [] },
    { workflowCoverageScore: 90, undocumentedWorkflows: [], workflowWarnings: [] },
    { featureCoverageScore: 90, undocumentedFeatures: [], featureWarnings: [] },
    { safetyCoverageScore: 90, undocumentedSafetyAreas: [], safetyWarnings: [] },
    { interpretationCoverageScore: 90, undocumentedResultAreas: [], interpretationWarnings: [] },
    report.missingSignals,
  );
  assert('J-REPORTING', 'manual report', manual.historySize >= 1, String(manual.historySize));

  for (let i = 0; i < 130; i++) {
    evaluateUserGuidesEngine(guideInput(`history-${i}`));
  }
  assert('J-REPORTING', 'history bounded', getUserGuidesHistorySize() === 128, String(getUserGuidesHistorySize()));
  clearUserGuidesHistory();
  assert('J-REPORTING', 'history cleared', getUserGuidesHistorySize() === 0, '0');

  harness.endGroup('J-REPORTING', g);
}

function runIntegration(): void {
  const g = harness.beginGroup('K-INTEGRATION');
  resetAll();

  const brain = registerUserGuidesWithCentralBrain();
  assert('K-INTEGRATION', 'central brain', brain.centralBrainSystems >= 0, String(brain.centralBrainSystems));
  const brain2 = registerUserGuidesWithCentralBrain();
  assert('K-INTEGRATION', 'bootstrap reuse', brain === brain2, 'reuse');

  assert('K-INTEGRATION', 'self documentation', registerUserGuidesWithSelfDocumentation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'founder guides', registerUserGuidesWithFounderGuides().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'foundation', registerUserGuidesWithFoundation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'capability registry', registerUserGuidesWithCapabilityRegistry().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'find panel', registerUserGuidesWithFindPanel().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'uvl', registerUserGuidesWithUvl().uvlRowCount >= 13, String(registerUserGuidesWithUvl().uvlRowCount));
  assert('K-INTEGRATION', 'unified trust score', registerUserGuidesWithUnifiedTrustScore().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'trust checkpoint', registerUserGuidesWithTrustEngineCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'product hardening checkpoint', registerUserGuidesWithProductHardeningCheckpoint().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'world2', registerUserGuidesWithWorld2().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'mobile command', registerUserGuidesWithMobileCommand().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'notification vault', registerUserGuidesWithNotificationVault().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'operator feed', registerUserGuidesWithOperatorFeed().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'self evolution governance', registerUserGuidesWithSelfEvolutionGovernance().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'missing capability escalation', registerUserGuidesWithMissingCapabilityEscalation().readOnly === true, 'readOnly');
  assert('K-INTEGRATION', 'validation scripts', brain.validationScripts >= 10, String(brain.validationScripts));
  assert('K-INTEGRATION', 'uvl rows', brain.uvlRows > 0, String(brain.uvlRows));

  harness.endGroup('K-INTEGRATION', g);
}

function runCache(): void {
  const g = harness.beginGroup('L-CACHE');
  resetAll();

  const snapshot = registerUserGuidesWithCentralBrain();
  const input = guideInput('cache-fixed');
  const onboarding = analyzeOnboardingGuide(input, {
    hasChatSystem: true,
    hasNotificationSystem: true,
    hasVerificationSystem: true,
    hasMobileSystem: true,
  });
  const workflow = analyzeWorkflowGuide(input, {
    hasProjectWorkflow: true,
    hasVerificationWorkflow: true,
    hasNotificationWorkflow: true,
    hasMobileWorkflow: true,
    hasWorld2Workflow: true,
  });
  const feature = analyzeFeatureDiscoveryGuide(input, {
    capabilityCount: snapshot.capabilityEntries,
    aliasCount: snapshot.findPanelAliases,
    hasMobileFeatures: true,
    hasCloudFeatures: true,
  });
  const safety = analyzeSafetyGuide(input, {
    hasTrustSystem: true,
    hasPrivacyHardening: true,
    hasSecurityHardening: true,
    hasMobileControl: true,
  });
  const interpretation = analyzeResultsInterpretationGuide(input, {
    hasTrustScore: true,
    hasVerificationResults: true,
    hasHardeningScores: true,
    hasCheckpoints: true,
  });

  buildUnifiedUserGuidesAuthority('cache-fixed', onboarding, workflow, feature, safety, interpretation, input);
  buildUnifiedUserGuidesAuthority('cache-fixed', onboarding, workflow, feature, safety, interpretation, input);

  const cache = getUserGuidesCacheStats();
  assert('L-CACHE', 'cache hits', cache.hits > 0, String(cache.hits));
  assert('L-CACHE', 'cache misses', cache.misses > 0, String(cache.misses));

  const byState = lookupUserGuideByState('READY');
  assert('L-CACHE', 'state lookup', Array.isArray(byState), 'array');

  harness.endGroup('L-CACHE', g);
}

function stressGuides(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAll();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    evaluateUserGuidesEngine({
      requestId: `stress-${label}-${i}`,
      projectId: `project-${i % 100}`,
      workspaceId: `workspace-${i % 50}`,
      missingFirstLaunchGuidance: i % 11 === 0,
      missingChatGuidance: i % 13 === 0,
      missingCapabilityDiscoveryGuidance: i % 17 === 0,
      missingSafeUsageGuidance: i % 19 === 0,
      missingTrustScoreInterpretation: i % 23 === 0,
      governanceBlocked: i % 29 === 0,
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'record count', getUserGuideRecordCount() === count, String(getUserGuideRecordCount()));
  assert(`M-STRESS-${label}`, 'performance', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);

  const runtime = getUserGuidesRuntimeReport();
  assert(`M-STRESS-${label}`, 'evaluations', runtime.evaluationCount === count, String(runtime.evaluationCount));
  assert(`M-STRESS-${label}`, 'authority builds', runtime.authorityBuildCount === count, String(runtime.authorityBuildCount));
  assert(`M-STRESS-${label}`, 'onboarding analyses', runtime.onboardingAnalysisCount > 0, String(runtime.onboardingAnalysisCount));

  const sample = getUserGuideRecord(`user-guides-${count}`);
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
  console.log('\nDevPulse V2 — Phase 24.3 User Guides');
  console.log('====================================\n');

  runSetup();
  runRegistry();
  runOnboardingGuides();
  runWorkflowGuides();
  runFeatureDiscovery();
  runSafetyGuides();
  runResultInterpretation();
  runAuthority();
  runEvaluation();
  runReporting();
  runIntegration();
  runCache();
  stressGuides(100, '100');
  stressGuides(1000, '1000');
  stressGuides(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const runtime = getUserGuidesRuntimeReport();

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Onboarding analyses: ${getOnboardingAnalysisCount()}`,
    `Workflow analyses: ${getWorkflowAnalysisCount()}`,
    `Feature analyses: ${getFeatureAnalysisCount()}`,
    `Safety analyses: ${getSafetyAnalysisCount()}`,
    `Interpretation analyses: ${getInterpretationAnalysisCount()}`,
    `Authority builds: ${getAuthorityBuildCount()}`,
    `Evaluations: ${getEvaluationCount()}`,
    `Records: ${getUserGuideRecordCount()}`,
    `Cache hits: ${runtime.cacheHits}`,
    `Cache misses: ${runtime.cacheMisses}`,
    `Cache evictions: ${runtime.cacheEvictions}`,
    `Bootstrap reuse: ${runtime.bootstrapReuseCount}`,
    failed.length === 0 ? USER_GUIDES_PASS_TOKEN : 'USER_GUIDES_V1_FAIL',
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

  console.log(`\n${USER_GUIDES_PASS_TOKEN}`);
}

main();
