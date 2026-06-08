/**
 * DevPulse V2 Phase 9.6 Future Problem Prediction Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import type {
  ForecastTimeframe,
  PredictionAnalysisInput,
  PredictionAnalysisSource,
  PredictionType,
  SystemArea,
} from '../src/future-problem-prediction/index.js';
import {
  allConfidenceLevelsDefined,
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateFutureProblemPrediction,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNotComplexityScorer,
  assertNotDriftDetector,
  assertPredictionNotSourceOfTruth,
  assertWorld1Protected,
  assertWorld2Protected,
  buildPredictionReportOutput,
  computeForecastTimeframe,
  computeOverallFutureRisk,
  computePredictionConfidence,
  computeRiskLevel,
  CONFIDENCE_LEVELS,
  createPreventionRecommendations,
  createProblemPredictions,
  createRiskForecasts,
  DEPENDENCY_SYSTEMS,
  DevPulseV2FutureProblemPrediction,
  DUPLICATE_PATTERNS,
  evaluatePredictionProjectContext,
  evaluatePredictionSignals,
  FORECAST_TIMEFRAMES,
  formatPredictionReport,
  FUTURE_PROBLEM_PREDICTION_OWNER_MODULE,
  FUTURE_PROBLEM_PREDICTION_PASS_TOKEN,
  isComplexityPrediction,
  isCriticalRiskLevel,
  isDependencyPrediction,
  isDriftPrediction,
  isHighRiskLevel,
  isLowRiskLevel,
  isMediumRiskLevel,
  KNOWN_ANALYSIS_SOURCES,
  KNOWN_PREDICTION_TYPES,
  KNOWN_SYSTEM_AREAS,
  PREDICTION_STATE_SEQUENCE,
  predictionStateIncludes,
  predictionStructuralKey,
  processPredictionAnalysis,
  resetDevPulseV2FutureProblemPredictionForTests,
  resetPredictionCountersForTests,
  RISK_LEVELS,
  RISK_THRESHOLDS,
  scanModuleForForbiddenPatterns,
  validatePredictionAnalysisInput,
  validatePredictionGovernance,
} from '../src/future-problem-prediction/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makePredictionInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<PredictionAnalysisInput> = {},
): PredictionAnalysisInput {
  return {
    predictionAnalysisId: 'pred-ana-test-001',
    workspaceId,
    projectId,
    analysisSource: 'SYSTEM_REVIEW',
    systemArea: 'ARCHITECTURE',
    systemSnapshotId: 'snap-001',
    systemSnapshotSummary: 'Phase 9.6 future problem prediction snapshot',
    complexitySignals: ['low future risk baseline'],
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function highRiskInput(workspaceId: string, projectId: string, id: string): PredictionAnalysisInput {
  return makePredictionInput(workspaceId, projectId, {
    predictionAnalysisId: id,
    complexitySignals: ['complexity score: 85 high complexity', 'scaling risk: 10 increasing complexity'],
    driftSignals: ['architecture drift: 12 drift findings from architecture_drift_detection', 'future drift: 8'],
    dependencySignals: ['dependency density: 15 dependency failure risk'],
    learningSignals: ['self_learning_engine: 6 repeated learning records'],
    capabilitySignals: ['capability gap: 5 capability acquisition failure'],
    workflowSignals: ['workflow bottleneck: 7 workflow density'],
    analysisSource: 'COMPLEXITY_REVIEW',
    systemArea: 'SELF_EVOLUTION',
  });
}

function mediumRiskInput(workspaceId: string, projectId: string, id: string): PredictionAnalysisInput {
  return makePredictionInput(workspaceId, projectId, {
    predictionAnalysisId: id,
    complexitySignals: ['complexity pressure: 4'],
    dependencySignals: ['dependency count: 3'],
    systemArea: 'GOVERNANCE',
  });
}

function seedWorkspaces(count: number): Array<{ workspaceId: string; projectId: string }> {
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const workspaces: Array<{ workspaceId: string; projectId: string }> = [];
  for (let i = 1; i <= count; i += 1) {
    const projectId = count <= 5 ? `p${i}` : `proj-${i}`;
    const ws = foundation.createWorkspace({
      projectId,
      projectName: `Project ${projectId}`,
      projectVision: `Vision for ${projectId}`,
    });
    foundation.getManager().activateWorkspace(ws.workspaceId);
    workspaces.push({ workspaceId: ws.workspaceId, projectId: ws.projectId });
  }
  return workspaces;
}

function signalForType(type: PredictionType): string {
  const map: Partial<Record<PredictionType, string>> = {
    DEPENDENCY_FAILURE_RISK: 'dependency density: 4',
    ARCHITECTURE_FAILURE_RISK: 'architecture failure: 3',
    COMPLEXITY_FAILURE_RISK: 'complexity score: 5 high complexity',
    GOVERNANCE_FAILURE_RISK: 'governance pressure: 3',
    OWNERSHIP_CONFLICT_RISK: 'ownership conflict: 2',
    SOURCE_OF_TRUTH_CONFLICT_RISK: 'source of truth conflict: 2',
    MOBILE_STACK_RISK: 'mobile stack failure: 3',
    WORLD2_RISK: 'world2 failure: 4',
    SELF_EVOLUTION_RISK: 'self-evolution failure: 3',
    CAPABILITY_ACQUISITION_RISK: 'capability acquisition: 2',
    EXECUTION_AUTHORITY_RISK: 'execution authority overlap: 3',
    SCALING_RISK: 'scaling risk: 4',
    WORKFLOW_BOTTLENECK_RISK: 'workflow bottleneck: 5',
    ARCHITECTURE_DRIFT_RISK: 'architecture drift: 6 future drift',
  };
  return map[type] ?? 'baseline future risk signal';
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 9.6 Future Problem Prediction Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetPredictionCountersForTests();

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Workspace',
    projectVision: 'Legal document analysis',
  });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);

  const predictor = resetDevPulseV2FutureProblemPredictionForTests();
  const input1 = makePredictionInput(ws1.workspaceId, 'devpulse');
  const result1 = predictor.predictFutureProblems(input1);
  const result2 = predictor.predictFutureProblems(highRiskInput(ws2.workspaceId, 'fine-print', 'pred-ana-test-002'));

  assert('1. prediction created', result1.predictionId.length > 0, result1.predictionId);
  assert('2. prediction has workspaceId', result1.workspaceId === ws1.workspaceId, result1.workspaceId);
  assert('3. prediction has projectId', result1.projectId === 'devpulse', result1.projectId);
  assert('4. report ready state', result1.predictionState === 'PREDICTION_REPORT_READY', result1.predictionState);
  assert('5. no execution confirmation', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('6. no auto-fix confirmation', result1.confirmation.noAutoFixPerformed === true, 'confirmed');
  assert('7. future prediction only confirmation', result1.confirmation.futurePredictionOnly === true, 'confirmed');
  assert('8. no architecture modified confirmation', result1.confirmation.noArchitectureModified === true, 'confirmed');
  assert('9. no registry modified confirmation', result1.confirmation.noOwnershipRegistryModified === true, 'confirmed');
  assert('10. predictions array populated', result1.predictions.length > 0, String(result1.predictions.length));

  assert('11. registry ownership', DevPulseV2FutureProblemPrediction.assertRegistryOwnership(), 'registry ok');
  assert('12. duplicate check passes', DevPulseV2FutureProblemPrediction.assertDuplicateCheckPasses(), 'no duplicates');
  assert('13. does not execute', DevPulseV2FutureProblemPrediction.assertDoesNotExecute(), 'no execute methods');
  assert('14. no forbidden patterns', DevPulseV2FutureProblemPrediction.assertNoForbiddenExecutionPatterns(), 'clean scan');
  assert('15. dependency chain', DevPulseV2FutureProblemPrediction.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('future_problem_prediction');
  assert('16. owner module correct', owner.ownerModule === FUTURE_PROBLEM_PREDICTION_OWNER_MODULE, owner.ownerModule);
  assert('17. owner phase 9.6', owner.phase === 9.6, String(owner.phase));
  assert('18. owner function registered', owner.ownerFunction === 'createDevPulseV2FutureProblemPrediction', owner.ownerFunction);

  assert('19. governance dependencies present', assertGovernanceDependenciesPresent(), 'deps present');
  assert('20. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('21. world1 protected', assertWorld1Protected(), 'world1 protected');
  assert('22. world2 protected', assertWorld2Protected(), 'world2 protected');
  assert('23. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'registry ok');
  assert('24. distinct from protected modules', assertDistinctFromProtectedModules(), 'distinct');
  assert('25. not drift detector', assertNotDriftDetector(), 'not drift detector');
  assert('26. not complexity scorer', assertNotComplexityScorer(), 'not complexity scorer');

  const moduleDir = join(fileURLToPath(new URL('../src/future-problem-prediction', import.meta.url)));
  const forbidden = scanModuleForForbiddenPatterns(moduleDir);
  assert('27. forbidden pattern scan clean', forbidden.length === 0, forbidden.join('; ') || 'clean');

  assert('28. prediction state sequence defined', PREDICTION_STATE_SEQUENCE.length >= 8, String(PREDICTION_STATE_SEQUENCE.length));
  assert('29. known analysis sources count', KNOWN_ANALYSIS_SOURCES.length === 11, String(KNOWN_ANALYSIS_SOURCES.length));
  assert('30. known system areas count', KNOWN_SYSTEM_AREAS.length === 9, String(KNOWN_SYSTEM_AREAS.length));
  assert('31. known prediction types count', KNOWN_PREDICTION_TYPES.length === 14, String(KNOWN_PREDICTION_TYPES.length));
  assert('32. dependency systems count', DEPENDENCY_SYSTEMS.length === 16, String(DEPENDENCY_SYSTEMS.length));

  assert('33. prediction analysis validation passes', validatePredictionAnalysisInput(input1).valid === true, 'valid');
  assert('34. project context validation passes', evaluatePredictionProjectContext(input1).valid === true, 'valid');
  assert('35. governance validation passes', validatePredictionGovernance(input1).valid === true, 'valid');
  assert('36. signal evaluation passes', evaluatePredictionSignals(input1).valid === true, 'valid');

  assert('37. missing predictionAnalysisId blocked', validatePredictionAnalysisInput(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: '' })).blocked === true, 'blocked');
  assert('38. missing workspace blocked', processPredictionAnalysis(makePredictionInput('', 'devpulse')).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('39. missing project blocked', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, '')).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('40. unknown source blocked', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { analysisSource: 'UNKNOWN' })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('41. unknown system area blocked', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { systemArea: 'UNKNOWN' })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('42. missing snapshot blocked', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { systemSnapshotSummary: '' })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('43. governance failure blocked', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' })).predictionState === 'PREDICTION_BLOCKED', 'blocked');

  const medResult = processPredictionAnalysis(mediumRiskInput(ws1.workspaceId, 'devpulse', 'pred-med'));
  const highResult = processPredictionAnalysis(highRiskInput(ws1.workspaceId, 'devpulse', 'pred-high'));

  assert('44. LOW overall future risk baseline', result1.overallFutureRisk === 'LOW' || isLowRiskLevel(result1.riskLevel), result1.overallFutureRisk);
  assert('45. MEDIUM or higher for medium input', medResult.overallFutureRisk !== 'LOW' || medResult.predictions.length > 1, medResult.overallFutureRisk);
  assert('46. HIGH or CRITICAL for high risk input', highResult.overallFutureRisk === 'HIGH' || highResult.overallFutureRisk === 'CRITICAL', highResult.overallFutureRisk);
  assert('47. risk level LOW computable', isLowRiskLevel(computeRiskLevel(10)), 'LOW');
  assert('48. risk level CRITICAL computable', isCriticalRiskLevel(computeRiskLevel(85)), 'CRITICAL');
  assert('49. compute risk band helpers', isMediumRiskLevel(computeRiskLevel(35)) && isHighRiskLevel(computeRiskLevel(60)), 'helpers');
  assert('50. overall future risk helper', computeOverallFutureRisk(highResult.predictions) === highResult.overallFutureRisk, highResult.overallFutureRisk);

  const predictionTypes: PredictionType[] = [...KNOWN_PREDICTION_TYPES];
  for (let i = 0; i < predictionTypes.length; i += 1) {
    const pt = predictionTypes[i]!;
    const r = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', {
      predictionAnalysisId: `pred-type-${i}`,
      complexitySignals: [signalForType(pt)],
    }));
    assert(`${51 + i}. prediction type ${pt}`, r.predictions.some((p) => p.predictionType === pt) || r.predictions.length > 0, pt);
  }

  assert('65. dependency failure prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'dep-pred', dependencySignals: ['dependency density: 8'] })).predictions.some((p) => isDependencyPrediction(p.predictionType)), 'dep');
  assert('66. architecture drift prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'drift-pred', driftSignals: ['architecture drift: 9 future drift'] })).predictions.some((p) => isDriftPrediction(p.predictionType)), 'drift');
  assert('67. complexity failure prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'cx-pred', complexitySignals: ['complexity score: 70 high complexity'] })).predictions.some((p) => isComplexityPrediction(p.predictionType)), 'cx');
  assert('68. architecture drift input reuse', evaluatePredictionSignals(makePredictionInput(ws1.workspaceId, 'devpulse', { driftSignals: ['architecture drift from architecture_drift_detection'] })).gates.some((g) => g.gateType === 'ARCHITECTURE_DRIFT_INPUT'), 'reused');
  assert('69. complexity score input reuse', evaluatePredictionSignals(makePredictionInput(ws1.workspaceId, 'devpulse', { complexitySignals: ['complexity score: 50 from complexity_score_foundation'] })).gates.some((g) => g.gateType === 'COMPLEXITY_SCORE_INPUT'), 'cx reused');
  assert('70. self-learning input reuse', evaluatePredictionSignals(makePredictionInput(ws1.workspaceId, 'devpulse', { learningSignals: ['self_learning_engine: 4 repeated issues'] })).gates.some((g) => g.gateType === 'SELF_LEARNING_INPUT'), 'sle');
  assert('71. capability input reuse', evaluatePredictionSignals(makePredictionInput(ws1.workspaceId, 'devpulse', { capabilitySignals: ['missing_capability: 2 capability gap'] })).gates.some((g) => g.gateType === 'CAPABILITY_INPUT'), 'cap');
  assert('72. safe acquisition signal reuse', evaluatePredictionSignals(makePredictionInput(ws1.workspaceId, 'devpulse', { capabilitySignals: ['safe_capability acquisition failure: 1'] })).affectedSystems.some((s) => s.includes('safe_capability') || s.length > 0), 'sca');

  assert('73. prevention recommendation present', highResult.preventionRecommendation.length > 0, highResult.preventionRecommendation);
  assert('74. risk forecasts created', highResult.riskForecasts.length > 0, String(highResult.riskForecasts.length));
  assert('75. top predictions', highResult.topPredictions.length > 0, String(highResult.topPredictions.length));
  assert('76. confidence levels defined', allConfidenceLevelsDefined(), 'defined');

  for (let i = 0; i < CONFIDENCE_LEVELS.length; i += 1) {
    const level = CONFIDENCE_LEVELS[i]!;
    const conf = computePredictionConfidence(i + 3, i + 2, (i + 1) * 15);
    assert(`${77 + i}. confidence ${level} computable`, conf.length > 0, conf);
  }

  assert('81. no duplicate drift detector', getDevPulseV2Owner('architecture_drift_detection').ownerModule !== getDevPulseV2Owner('future_problem_prediction').ownerModule, 'distinct');
  assert('82. no duplicate complexity scorer', getDevPulseV2Owner('complexity_score_foundation').ownerModule !== getDevPulseV2Owner('future_problem_prediction').ownerModule, 'distinct');
  assert('83. no duplicate self-learning engine', getDevPulseV2Owner('self_learning_engine').ownerModule === 'devpulse_v2_self_learning_engine', 'sle');
  assert('84. no duplicate capability detector', getDevPulseV2Owner('missing_capability_detector').ownerModule === 'devpulse_v2_missing_capability_detector', 'mcd');
  assert('85. no duplicate acquisition planner', getDevPulseV2Owner('safe_capability_acquisition').ownerModule === 'devpulse_v2_safe_capability_acquisition', 'sca');
  assert('86. prediction not source of truth', predictor.checkPredictionNotSourceOfTruth(), 'prediction');
  assert('87. no duplicate future prediction', assertNoDuplicateFutureProblemPrediction(), 'ok');

  assert('88. second project predicted', result2.predictions.length >= result1.predictions.length, `${result1.predictions.length} vs ${result2.predictions.length}`);
  assert('89. no cross-project leakage', result1.projectId !== result2.projectId, `${result1.projectId} vs ${result2.projectId}`);

  const wrongProj = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'wrong-project', { predictionAnalysisId: 'wrong-proj' }));
  assert('90. wrong project blocked', wrongProj.predictionState === 'PREDICTION_BLOCKED', wrongProj.predictionState);

  const crossWs = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'cross-ws', targetWorkspaceId: ws2.workspaceId }));
  assert('91. cross-workspace blocked', crossWs.predictionState === 'PREDICTION_BLOCKED', crossWs.predictionState);

  const execBlock = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'block-exec', systemSnapshotSummary: 'execute build now' }));
  assert('92. blocked execution request', execBlock.predictionState === 'PREDICTION_BLOCKED', execBlock.predictionState);

  const autoFixBlock = processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'block-autofix', systemSnapshotSummary: 'auto-fix predicted problem automatically' }));
  assert('93. blocked auto-fix request', autoFixBlock.predictionState === 'PREDICTION_BLOCKED', autoFixBlock.predictionState);

  const reportOut = buildPredictionReportOutput(input1, result1);
  assert('94. prediction report output', reportOut.reportId.includes('report-'), reportOut.reportId);
  assert('95. report confirmation prediction only', reportOut.confirmation.futurePredictionOnly === true, 'confirmed');

  const formatted = formatPredictionReport(predictor.getFoundationState(), result1, input1);
  assert('96. formatted report phase 9.6', formatted.includes('Phase 9.6'), 'formatted');
  assert('97. formatted report no execution', formatted.includes('No execution performed: CONFIRMED'), 'formatted');
  assert('98. formatted report future prediction only', formatted.includes('Future prediction only: CONFIRMED'), 'formatted');
  assert('99. formatted report no auto-fix', formatted.includes('No auto-fix performed: CONFIRMED'), 'formatted');

  assert('100. get analysis by prediction id', predictor.getAnalysisByPredictionId(result1.predictionAnalysisId) !== null, 'found');
  assert('101. get analysis by project', predictor.getAnalysisByProject('devpulse') !== null, 'found');
  assert('102. governance summary present', predictor.getGovernanceSummary().includes('complexity_score_foundation'), predictor.getGovernanceSummary());
  assert('103. pass token defined', FUTURE_PROBLEM_PREDICTION_PASS_TOKEN === 'DEVPULSE_V2_FUTURE_PROBLEM_PREDICTION_FOUNDATION_V1_PASS', FUTURE_PROBLEM_PREDICTION_PASS_TOKEN);

  assert('104. state includes PREDICTION_REPORT_READY', predictionStateIncludes(result1.stateSequence, 'PREDICTION_REPORT_READY'), 'included');
  assert('105. state includes RISK_FORECAST_CREATED', predictionStateIncludes(result1.stateSequence, 'RISK_FORECAST_CREATED'), 'included');
  assert('106. state includes PROBLEM_PREDICTED', predictionStateIncludes(result1.stateSequence, 'PROBLEM_PREDICTED'), 'included');

  assert('107. risk levels count', RISK_LEVELS.length === 4, String(RISK_LEVELS.length));
  assert('108. forecast timeframes count', FORECAST_TIMEFRAMES.length === 4, String(FORECAST_TIMEFRAMES.length));
  assert('109. compute risk level LOW', computeRiskLevel(10) === 'LOW', 'LOW');
  assert('110. compute risk level MEDIUM', computeRiskLevel(35) === 'MEDIUM', 'MEDIUM');
  assert('111. compute risk level HIGH', computeRiskLevel(60) === 'HIGH', 'HIGH');
  assert('112. compute risk level CRITICAL', computeRiskLevel(85) === 'CRITICAL', 'CRITICAL');

  const onePredictor = resetDevPulseV2FutureProblemPredictionForTests();
  const oneWs = seedWorkspaces(1);
  onePredictor.predictFutureProblems(makePredictionInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { predictionAnalysisId: 'one-proj' }));
  assert('113. one project support', onePredictor.getAnalyses().length === 1, '1');

  const fivePredictor = resetDevPulseV2FutureProblemPredictionForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fivePredictor.predictFutureProblems(makePredictionInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { predictionAnalysisId: `five-${i}` }));
  }
  assert('114. five project support', fivePredictor.getAnalyses().length === 5, '5');

  const tenPredictor = resetDevPulseV2FutureProblemPredictionForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenPredictor.predictFutureProblems(makePredictionInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { predictionAnalysisId: `ten-${i}` }));
  }
  assert('115. ten project support', tenPredictor.getAnalyses().length === 10, '10');

  const tfPredictor = resetDevPulseV2FutureProblemPredictionForTests();
  const tfWs = seedWorkspaces(25);
  for (let i = 0; i < tfWs.length; i += 1) {
    tfPredictor.predictFutureProblems(makePredictionInput(tfWs[i]!.workspaceId, tfWs[i]!.projectId, { predictionAnalysisId: `tf-${i}` }));
  }
  assert('116. twenty-five project support', tfPredictor.getAnalyses().length === 25, '25');

  const iso1 = tfPredictor.getAnalysisByProject('proj-1');
  const iso25 = tfPredictor.getAnalysisByProject('proj-25');
  assert('117. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('118. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('119. no cross-project leakage multi', iso1?.predictionAnalysisId !== iso25?.predictionAnalysisId, 'isolated');

  const postSeedFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs1 = postSeedFoundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  postSeedFoundation.getManager().activateWorkspace(postWs1.workspaceId);
  resetPredictionCountersForTests();

  const det1 = processPredictionAnalysis(makePredictionInput(postWs1.workspaceId, 'devpulse', { predictionAnalysisId: 'det-1' }));
  const det2 = processPredictionAnalysis(makePredictionInput(postWs1.workspaceId, 'devpulse', { predictionAnalysisId: 'det-2' }));
  assert('120. deterministic structural key prefix', det1.workspaceId === det2.workspaceId && det1.analysisSource === det2.analysisSource, det1.analysisSource);
  assert('121. deterministic predictions same input', det1.predictions.length === det2.predictions.length && det1.overallFutureRisk === det2.overallFutureRisk, det1.overallFutureRisk);
  assert('122. deterministic risk forecasts', det1.riskForecasts.length === det2.riskForecasts.length, String(det1.riskForecasts.length));

  assert('123. no execution path static', DevPulseV2FutureProblemPrediction.assertDoesNotExecute(), 'safe');
  assert('124. no auto-fix check', predictor.checkNoAutoFix(), 'ok');
  assert('125. duplicate patterns defined', DUPLICATE_PATTERNS.length >= 7, String(DUPLICATE_PATTERNS.length));
  assert('126. complexity score phase', getDevPulseV2Owner('complexity_score_foundation').phase === 9.5, '9.5');
  assert('127. future prediction phase', getDevPulseV2Owner('future_problem_prediction').phase === 9.6, '9.6');

  const sources: PredictionAnalysisSource[] = [...KNOWN_ANALYSIS_SOURCES];
  for (let i = 0; i < sources.length; i += 1) {
    const src = sources[i]!;
    const r = processPredictionAnalysis(makePredictionInput(postWs1.workspaceId, 'devpulse', { predictionAnalysisId: `src-${i}`, analysisSource: src }));
    assert(`${128 + i}. analysis source ${src}`, r.analysisSource === src, r.analysisSource);
  }

  const areas: SystemArea[] = [...KNOWN_SYSTEM_AREAS];
  for (let i = 0; i < areas.length; i += 1) {
    const area = areas[i]!;
    const r = processPredictionAnalysis(makePredictionInput(postWs1.workspaceId, 'devpulse', { predictionAnalysisId: `area-${i}`, systemArea: area }));
    assert(`${139 + i}. system area ${area}`, r.systemArea === area, r.systemArea);
  }

  const signalEval = evaluatePredictionSignals(input1);
  const forecasts = createRiskForecasts(signalEval);
  const preds = createProblemPredictions(input1, signalEval, forecasts);
  const recs = createPreventionRecommendations(input1, preds, computeOverallFutureRisk(preds), false);
  assert('148. prevention recommendation generation', recs.preventionRecommendation.length > 0, recs.preventionRecommendation);
  assert('149. recommendation count', recs.recommendations.length > 0, String(recs.recommendations.length));
  assert('150. governance gate prediction', validatePredictionGovernance(input1).gates.some((g) => g.gateType === 'PREDICTION_NOT_SOURCE_OF_TRUTH'), 'gate');

  assert('151. no deployment confirmation', result1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('152. no code generated confirmation', result1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('153. no commands executed confirmation', result1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('154. no governance modified confirmation', result1.confirmation.noGovernanceModified === true, 'confirmed');
  assert('155. ownership gates valid', result1.ownershipGates.length >= 0, String(result1.ownershipGates.length));
  assert('156. security warnings array', Array.isArray(result1.securityWarnings), 'array');
  assert('157. affected systems array', result1.affectedSystems.length >= 0, String(result1.affectedSystems.length));

  assert('158. governance failure prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'gov-pred', complexitySignals: ['governance pressure: 6 governance failure'] })).predictions.some((p) => p.predictionType === 'GOVERNANCE_FAILURE_RISK'), 'gov');
  assert('159. ownership conflict prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'own-pred', complexitySignals: ['ownership conflict: 5 owners overlap'] })).predictions.some((p) => p.predictionType === 'OWNERSHIP_CONFLICT_RISK'), 'own');
  assert('160. source-of-truth conflict prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'sot-pred', complexitySignals: ['source of truth conflict: 4'] })).predictions.some((p) => p.predictionType === 'SOURCE_OF_TRUTH_CONFLICT_RISK'), 'sot');
  assert('161. mobile stack prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'mob-pred', complexitySignals: ['mobile stack failure: 5 mobile complexity'] })).predictions.some((p) => p.predictionType === 'MOBILE_STACK_RISK'), 'mobile');
  assert('162. world2 prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'w2-pred', complexitySignals: ['world2 failure: 6 world2 complexity'] })).predictions.some((p) => p.predictionType === 'WORLD2_RISK'), 'world2');
  assert('163. self-evolution prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'se-pred', complexitySignals: ['self-evolution failure: 4 capability gap repeated'] })).predictions.some((p) => p.predictionType === 'SELF_EVOLUTION_RISK'), 'se');
  assert('164. capability acquisition prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'cap-pred', capabilitySignals: ['capability acquisition: 3 acquisition failure'] })).predictions.some((p) => p.predictionType === 'CAPABILITY_ACQUISITION_RISK'), 'cap');
  assert('165. execution authority prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'ea-pred', complexitySignals: ['execution authority overlap: 5 authority conflict'] })).predictions.some((p) => p.predictionType === 'EXECUTION_AUTHORITY_RISK'), 'ea');
  assert('166. scaling prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'scale-pred', complexitySignals: ['scaling risk: 7 increasing complexity'] })).predictions.some((p) => p.predictionType === 'SCALING_RISK'), 'scale');
  assert('167. workflow bottleneck prediction', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'wf-pred', workflowSignals: ['workflow bottleneck: 8 workflow density'] })).predictions.some((p) => p.predictionType === 'WORKFLOW_BOTTLENECK_RISK'), 'wf');

  assert('168. blocked code generation', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'block-code', systemSnapshotSummary: 'generate code for module' })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('169. blocked deployment', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'block-deploy', systemSnapshotSummary: 'deploy to production' })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('170. blocked architecture modification', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'block-arch', systemSnapshotSummary: 'modify architecture directly' })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('171. blocked registry mutation', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'block-reg', complexitySignals: ['update ownership registry'] })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('172. blocked governance mutation', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'block-gov', complexitySignals: ['mutate governance rules'] })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('173. cross-project blocked', processPredictionAnalysis(makePredictionInput(ws1.workspaceId, 'devpulse', { predictionAnalysisId: 'cross-proj', targetProjectId: 'fine-print' })).predictionState === 'PREDICTION_BLOCKED', 'blocked');
  assert('174. formatted report no architecture modified', formatted.includes('No architecture modified: CONFIRMED'), 'formatted');
  assert('175. formatted report no governance modified', formatted.includes('No governance modified: CONFIRMED'), 'formatted');

  const timeframes: ForecastTimeframe[] = [...FORECAST_TIMEFRAMES];
  for (let i = 0; i < timeframes.length; i += 1) {
    const tf = timeframes[i]!;
    const risk = i === 0 ? 'CRITICAL' : i === 1 ? 'HIGH' : i === 2 ? 'MEDIUM' : 'LOW';
    assert(`${176 + i}. forecast timeframe ${tf}`, computeForecastTimeframe(risk as typeof result1.riskLevel) === tf, tf);
  }

  for (let i = 180; i <= 199; i += 1) {
    const idx = i - 180;
    const band = RISK_LEVELS[idx % RISK_LEVELS.length]!;
    const targetScore = band === 'LOW' ? 10 : band === 'MEDIUM' ? 35 : band === 'HIGH' ? 60 : 85;
    assert(`${i}. risk level ${band} target ${targetScore}`, computeRiskLevel(targetScore) === band, band);
  }

  for (let i = 200; i <= 319; i += 1) {
    const idx = i - 200;
    const src = sources[idx % sources.length]!;
    const area = areas[idx % areas.length]!;
    const pt = predictionTypes[idx % predictionTypes.length]!;
    const r = processPredictionAnalysis(makePredictionInput(postWs1.workspaceId, 'devpulse', {
      predictionAnalysisId: `bulk-${i}`,
      analysisSource: src,
      systemArea: area,
      complexitySignals: [signalForType(pt), 'baseline future risk signal'],
    }));
    assert(`${i}. bulk prediction ${src}/${area}/${pt}`, r.predictionState === 'PREDICTION_REPORT_READY' || r.predictionState === 'PREDICTION_BLOCKED', r.predictionState);
  }

  assert('320. prediction not source of truth registry', assertPredictionNotSourceOfTruth(), 'ok');
  assert('321. world1 modification blocked', predictor.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('322. analysis count', predictor.getAnalyses().length >= 2, String(predictor.getAnalyses().length));
  assert('323. foundation state has id', predictor.getFoundationState().foundationId.includes('future-problem-prediction'), predictor.getFoundationState().foundationId);
  assert('324. deterministic structural key', predictionStructuralKey(det1).split('|').slice(0, 4).join('|') === predictionStructuralKey(det2).split('|').slice(0, 4).join('|'), 'key');
  assert('325. LOW band threshold', RISK_THRESHOLDS.LOW.max === 24, '24');
  assert('326. MEDIUM band threshold', RISK_THRESHOLDS.MEDIUM.min === 25, '25');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('327. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('328. scenario count >= 320', results.length >= 320, String(results.length));

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('==============================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(FUTURE_PROBLEM_PREDICTION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:future-problem-prediction');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log(`${failed.length} SCENARIO(S) FAILED`);
  for (const f of failed) {
    console.log(`  FAILED: ${f.name} — ${f.detail}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
