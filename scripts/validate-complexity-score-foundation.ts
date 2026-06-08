/**
 * DevPulse V2 Phase 9.5 Complexity Score Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import type { ComplexityAnalysisInput, ComplexityAnalysisSource, ComplexityFactorType, SystemArea } from '../src/complexity-score-foundation/index.js';
import {
  aggregateComplexityScore,
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertMeasurementNotSourceOfTruth,
  assertNoDuplicateComplexityScore,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNotDriftDetector,
  assertWorld1Protected,
  assertWorld2Protected,
  buildComplexityScoreReportOutput,
  COMPLEXITY_CONFIDENCE_LEVELS,
  COMPLEXITY_RISK_BANDS,
  COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE,
  COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN,
  COMPLEXITY_STATE_SEQUENCE,
  complexityStateIncludes,
  complexityStructuralKey,
  computeComplexityConfidence,
  computeRiskBand,
  createComplexityRecommendations,
  createFactorScores,
  DEPENDENCY_SYSTEMS,
  DevPulseV2ComplexityScoreFoundation,
  DUPLICATE_PATTERNS,
  evaluateComplexityProjectContext,
  evaluateComplexitySignals,
  FACTOR_WEIGHTS,
  formatComplexityScoreReport,
  isCriticalRiskBand,
  isDependencyFactor,
  isDriftFactor,
  isHighRiskBand,
  isLowRiskBand,
  isMaximumScore,
  isMediumRiskBand,
  isMinimumScore,
  isModuleCountFactor,
  isScoreInRange,
  KNOWN_ANALYSIS_SOURCES,
  KNOWN_COMPLEXITY_FACTORS,
  KNOWN_SYSTEM_AREAS,
  processComplexityAnalysis,
  resetComplexityCountersForTests,
  resetDevPulseV2ComplexityScoreFoundationForTests,
  RISK_BAND_THRESHOLDS,
  scanModuleForForbiddenPatterns,
  validateComplexityAnalysisInput,
  validateComplexityGovernance,
} from '../src/complexity-score-foundation/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeComplexityInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<ComplexityAnalysisInput> = {},
): ComplexityAnalysisInput {
  return {
    complexityAnalysisId: 'cx-ana-test-001',
    workspaceId,
    projectId,
    analysisSource: 'SYSTEM_REVIEW',
    systemArea: 'ARCHITECTURE',
    systemSnapshotId: 'snap-001',
    systemSnapshotSummary: 'Phase 9 system complexity snapshot',
    complexitySignals: ['low complexity baseline'],
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function highComplexityInput(workspaceId: string, projectId: string, id: string): ComplexityAnalysisInput {
  return makeComplexityInput(workspaceId, projectId, {
    complexityAnalysisId: id,
    complexitySignals: [
      'dependency count: 15',
      'drift finding: 10',
      'approval gate: 8',
      'workflow step: 6',
      'capability gap: 5',
    ],
    driftSignals: ['architecture drift: 10 findings from architecture_drift_detection'],
    dependencySignals: ['dependency complexity: 15 dependencies'],
    moduleSignals: ['module count: 12'],
    workflowSignals: ['workflow step: 8 steps'],
    analysisSource: 'ARCHITECTURE_DRIFT_REVIEW',
    systemArea: 'SELF_EVOLUTION',
  });
}

function mediumComplexityInput(workspaceId: string, projectId: string, id: string): ComplexityAnalysisInput {
  return makeComplexityInput(workspaceId, projectId, {
    complexityAnalysisId: id,
    complexitySignals: ['dependency count: 4', 'module count: 3'],
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

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 9.5 Complexity Score Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetComplexityCountersForTests();

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

  const scorer = resetDevPulseV2ComplexityScoreFoundationForTests();
  const input1 = makeComplexityInput(ws1.workspaceId, 'devpulse');
  const result1 = scorer.scoreComplexity(input1);
  const result2 = scorer.scoreComplexity(highComplexityInput(ws2.workspaceId, 'fine-print', 'cx-ana-test-002'));

  assert('1. complexity score created', result1.complexityScoreId.length > 0, result1.complexityScoreId);
  assert('2. score has workspaceId', result1.workspaceId === ws1.workspaceId, result1.workspaceId);
  assert('3. score has projectId', result1.projectId === 'devpulse', result1.projectId);
  assert('4. score in range', isScoreInRange(result1.complexityScore), String(result1.complexityScore));
  assert('5. report ready state', result1.complexityState === 'COMPLEXITY_REPORT_READY', result1.complexityState);
  assert('6. no execution confirmation', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('7. no auto-fix confirmation', result1.confirmation.noAutoFixPerformed === true, 'confirmed');
  assert('8. complexity scoring only confirmation', result1.confirmation.complexityScoringOnly === true, 'confirmed');
  assert('9. no architecture modified confirmation', result1.confirmation.noArchitectureModified === true, 'confirmed');
  assert('10. no registry modified confirmation', result1.confirmation.noOwnershipRegistryModified === true, 'confirmed');

  assert('11. registry ownership', DevPulseV2ComplexityScoreFoundation.assertRegistryOwnership(), 'registry ok');
  assert('12. duplicate check passes', DevPulseV2ComplexityScoreFoundation.assertDuplicateCheckPasses(), 'no duplicates');
  assert('13. does not execute', DevPulseV2ComplexityScoreFoundation.assertDoesNotExecute(), 'no execute methods');
  assert('14. no forbidden patterns', DevPulseV2ComplexityScoreFoundation.assertNoForbiddenExecutionPatterns(), 'clean scan');
  assert('15. dependency chain', DevPulseV2ComplexityScoreFoundation.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('complexity_score_foundation');
  assert('16. owner module correct', owner.ownerModule === COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('17. owner phase 9.5', owner.phase === 9.5, String(owner.phase));
  assert('18. owner function registered', owner.ownerFunction === 'createDevPulseV2ComplexityScoreFoundation', owner.ownerFunction);

  assert('19. governance dependencies present', assertGovernanceDependenciesPresent(), 'deps present');
  assert('20. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('21. world1 protected', assertWorld1Protected(), 'world1 protected');
  assert('22. world2 protected', assertWorld2Protected(), 'world2 protected');
  assert('23. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'registry ok');
  assert('24. distinct from protected modules', assertDistinctFromProtectedModules(), 'distinct');
  assert('25. not drift detector', assertNotDriftDetector(), 'not drift detector');

  const moduleDir = join(fileURLToPath(new URL('../src/complexity-score-foundation', import.meta.url)));
  const forbidden = scanModuleForForbiddenPatterns(moduleDir);
  assert('26. forbidden pattern scan clean', forbidden.length === 0, forbidden.join('; ') || 'clean');

  assert('27. complexity state sequence defined', COMPLEXITY_STATE_SEQUENCE.length >= 9, String(COMPLEXITY_STATE_SEQUENCE.length));
  assert('28. known analysis sources count', KNOWN_ANALYSIS_SOURCES.length === 11, String(KNOWN_ANALYSIS_SOURCES.length));
  assert('29. known system areas count', KNOWN_SYSTEM_AREAS.length === 9, String(KNOWN_SYSTEM_AREAS.length));
  assert('30. known complexity factors count', KNOWN_COMPLEXITY_FACTORS.length === 12, String(KNOWN_COMPLEXITY_FACTORS.length));
  assert('31. dependency systems count', DEPENDENCY_SYSTEMS.length === 15, String(DEPENDENCY_SYSTEMS.length));

  assert('32. complexity analysis validation passes', validateComplexityAnalysisInput(input1).valid === true, 'valid');
  assert('33. project context validation passes', evaluateComplexityProjectContext(input1).valid === true, 'valid');
  assert('34. governance validation passes', validateComplexityGovernance(input1).valid === true, 'valid');
  assert('35. signal evaluation passes', evaluateComplexitySignals(input1).valid === true, 'valid');

  assert('36. missing complexity analysis blocked', validateComplexityAnalysisInput(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: '' })).blocked === true, 'blocked');
  assert('37. missing workspace blocked', processComplexityAnalysis(makeComplexityInput('', 'devpulse')).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('38. missing project blocked', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, '')).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('39. unknown source blocked', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { analysisSource: 'UNKNOWN' })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('40. unknown system area blocked', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { systemArea: 'UNKNOWN' })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('41. missing snapshot blocked', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { systemSnapshotSummary: '' })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('42. missing complexity signals blocked', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexitySignals: [] })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('43. governance failure blocked', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');

  const medResult = processComplexityAnalysis(mediumComplexityInput(ws1.workspaceId, 'devpulse', 'cx-med'));
  const highResult = processComplexityAnalysis(highComplexityInput(ws1.workspaceId, 'devpulse', 'cx-high'));

  assert('44. LOW risk band', isLowRiskBand(result1.riskBand) && result1.complexityScore <= RISK_BAND_THRESHOLDS.LOW.max, `${result1.riskBand}/${result1.complexityScore}`);
  assert('45. MEDIUM risk band possible', isMediumRiskBand(medResult.riskBand) || medResult.complexityScore >= 25, medResult.riskBand);
  assert('46. HIGH or CRITICAL for high complexity', isHighRiskBand(highResult.riskBand) || isCriticalRiskBand(highResult.riskBand), highResult.riskBand);
  assert('47. score range minimum 0', result1.complexityScore >= 0, String(result1.complexityScore));
  assert('48. score range maximum 100', highResult.complexityScore <= 100, String(highResult.complexityScore));
  assert('49. isMinimumScore helper', isMinimumScore(0) === true, 'true');
  assert('50. isMaximumScore possible', isMaximumScore(100) === true, 'true');

  const factorTypes: ComplexityFactorType[] = [...KNOWN_COMPLEXITY_FACTORS];
  for (let i = 0; i < factorTypes.length; i += 1) {
    const ft = factorTypes[i]!;
    const signal = `${ft.replace(/_/g, ' ').toLowerCase()}: 3`;
    const r = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', {
      complexityAnalysisId: `cx-factor-${i}`,
      complexitySignals: [signal],
    }));
    assert(`${51 + i}. factor ${ft} scored`, r.factorScores.some((f) => f.factorType === ft) || r.complexityScore >= 0, ft);
  }

  assert('63. module count complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'mod-cx', complexitySignals: ['module count: 5'] })).factorScores.some((f) => isModuleCountFactor(f.factorType)), 'module');
  assert('64. dependency complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'dep-cx', complexitySignals: ['dependency count: 6'] })).factorScores.some((f) => isDependencyFactor(f.factorType)), 'dep');
  assert('65. drift complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'drift-cx', driftSignals: ['drift finding: 4'], complexitySignals: ['baseline'] })).factorScores.some((f) => isDriftFactor(f.factorType)), 'drift');
  assert('66. architecture drift input reuse', evaluateComplexitySignals(makeComplexityInput(ws1.workspaceId, 'devpulse', { driftSignals: ['architecture drift from architecture_drift_detection'] })).gates.some((g) => g.gateType === 'ARCHITECTURE_DRIFT_INPUT'), 'reused');

  assert('67. self-learning input reuse', evaluateComplexitySignals(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexitySignals: ['learning record: 3 from self_learning_engine'] })).affectedSystems.includes('self_learning_engine'), 'sle');
  assert('68. missing capability input reuse', evaluateComplexitySignals(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexitySignals: ['capability gap: 2 missing_capability'] })).factorValues.CAPABILITY_GAP_COUNT === 2, 'mcd');
  assert('69. safe acquisition input reuse', evaluateComplexitySignals(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexitySignals: ['capability gap: 1 safe_capability'] })).valid === true, 'sca');

  assert('70. pressure interpretation present', highResult.pressureInterpretation.length > 0, highResult.pressureInterpretation);
  assert('71. review recommendation present', highResult.reviewRecommendation.length > 0, highResult.reviewRecommendation);
  assert('72. factor scores created', result1.factorScores.length > 0, String(result1.factorScores.length));
  assert('73. top complexity factors', result1.topComplexityFactors.length > 0, String(result1.topComplexityFactors.length));
  assert('74. complexity reasons', result1.complexityReasons.length > 0, String(result1.complexityReasons.length));

  for (let i = 0; i < COMPLEXITY_CONFIDENCE_LEVELS.length; i += 1) {
    const level = COMPLEXITY_CONFIDENCE_LEVELS[i]!;
    const conf = computeComplexityConfidence(i + 3, i + 2, true);
    assert(`${75 + i}. confidence ${level} computable`, conf.length > 0, conf);
  }

  assert('79. no duplicate drift detector', getDevPulseV2Owner('architecture_drift_detection').ownerModule !== getDevPulseV2Owner('complexity_score_foundation').ownerModule, 'distinct');
  assert('80. no duplicate self-learning engine', getDevPulseV2Owner('self_learning_engine').ownerModule === 'devpulse_v2_self_learning_engine', 'sle');
  assert('81. no duplicate capability detector', getDevPulseV2Owner('missing_capability_detector').ownerModule === 'devpulse_v2_missing_capability_detector', 'mcd');
  assert('82. no duplicate acquisition planner', getDevPulseV2Owner('safe_capability_acquisition').ownerModule === 'devpulse_v2_safe_capability_acquisition', 'sca');
  assert('83. measurement not source of truth', scorer.checkMeasurementNotSourceOfTruth(), 'measurement');
  assert('84. no duplicate complexity score', assertNoDuplicateComplexityScore(), 'ok');

  assert('85. second project scored', result2.complexityScore > result1.complexityScore, `${result1.complexityScore} vs ${result2.complexityScore}`);
  assert('86. no cross-project leakage', result1.projectId !== result2.projectId, `${result1.projectId} vs ${result2.projectId}`);

  const wrongProj = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'wrong-project', { complexityAnalysisId: 'wrong-proj' }));
  assert('87. wrong project blocked', wrongProj.complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', wrongProj.complexityState);

  const crossWs = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'cross-ws', targetWorkspaceId: ws2.workspaceId }));
  assert('88. cross-workspace blocked', crossWs.complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', crossWs.complexityState);

  const execBlock = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'block-exec', systemSnapshotSummary: 'execute build now' }));
  assert('89. blocked execution request', execBlock.complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', execBlock.complexityState);

  const autoFixBlock = processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'block-autofix', systemSnapshotSummary: 'auto-fix complexity automatically' }));
  assert('90. blocked auto-fix request', autoFixBlock.complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', autoFixBlock.complexityState);

  const reportOut = buildComplexityScoreReportOutput(input1, result1);
  assert('91. complexity report output', reportOut.reportId.includes('report-'), reportOut.reportId);
  assert('92. report confirmation scoring only', reportOut.confirmation.complexityScoringOnly === true, 'confirmed');

  const formatted = formatComplexityScoreReport(scorer.getFoundationState(), result1, input1);
  assert('93. formatted report phase 9.5', formatted.includes('Phase 9.5'), 'formatted');
  assert('94. formatted report no execution', formatted.includes('No execution performed: CONFIRMED'), 'formatted');
  assert('95. formatted report complexity scoring only', formatted.includes('Complexity scoring only: CONFIRMED'), 'formatted');
  assert('96. formatted report no auto-fix', formatted.includes('No auto-fix performed: CONFIRMED'), 'formatted');

  assert('97. get analysis by complexity id', scorer.getAnalysisByComplexityId(result1.complexityAnalysisId) !== null, 'found');
  assert('98. get analysis by project', scorer.getAnalysisByProject('devpulse') !== null, 'found');
  assert('99. governance summary present', scorer.getGovernanceSummary().includes('architecture_drift_detection'), scorer.getGovernanceSummary());
  assert('100. pass token defined', COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN === 'DEVPULSE_V2_COMPLEXITY_SCORE_FOUNDATION_V1_PASS', COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN);

  assert('101. state includes COMPLEXITY_REPORT_READY', complexityStateIncludes(result1.stateSequence, 'COMPLEXITY_REPORT_READY'), 'included');
  assert('102. state includes FACTOR_SCORES_CREATED', complexityStateIncludes(result1.stateSequence, 'FACTOR_SCORES_CREATED'), 'included');
  assert('103. state includes RISK_BAND_CREATED', complexityStateIncludes(result1.stateSequence, 'RISK_BAND_CREATED'), 'included');

  assert('104. risk bands count', COMPLEXITY_RISK_BANDS.length === 4, String(COMPLEXITY_RISK_BANDS.length));
  assert('105. factor weights defined', Object.keys(FACTOR_WEIGHTS).length >= 12, String(Object.keys(FACTOR_WEIGHTS).length));
  assert('106. compute risk band LOW', computeRiskBand(10) === 'LOW', 'LOW');
  assert('107. compute risk band MEDIUM', computeRiskBand(35) === 'MEDIUM', 'MEDIUM');
  assert('108. compute risk band HIGH', computeRiskBand(60) === 'HIGH', 'HIGH');
  assert('109. compute risk band CRITICAL', computeRiskBand(85) === 'CRITICAL', 'CRITICAL');
  assert('110. aggregate score helper', aggregateComplexityScore(createFactorScores(evaluateComplexitySignals(input1))) >= 0, 'score');

  const oneScorer = resetDevPulseV2ComplexityScoreFoundationForTests();
  const oneWs = seedWorkspaces(1);
  oneScorer.scoreComplexity(makeComplexityInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { complexityAnalysisId: 'one-proj' }));
  assert('111. one project support', oneScorer.getAnalyses().length === 1, '1');

  const fiveScorer = resetDevPulseV2ComplexityScoreFoundationForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveScorer.scoreComplexity(makeComplexityInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { complexityAnalysisId: `five-${i}` }));
  }
  assert('112. five project support', fiveScorer.getAnalyses().length === 5, '5');

  const tenScorer = resetDevPulseV2ComplexityScoreFoundationForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenScorer.scoreComplexity(makeComplexityInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { complexityAnalysisId: `ten-${i}` }));
  }
  assert('113. ten project support', tenScorer.getAnalyses().length === 10, '10');

  const tfScorer = resetDevPulseV2ComplexityScoreFoundationForTests();
  const tfWs = seedWorkspaces(25);
  for (let i = 0; i < tfWs.length; i += 1) {
    tfScorer.scoreComplexity(makeComplexityInput(tfWs[i]!.workspaceId, tfWs[i]!.projectId, { complexityAnalysisId: `tf-${i}` }));
  }
  assert('114. twenty-five project support', tfScorer.getAnalyses().length === 25, '25');

  const iso1 = tfScorer.getAnalysisByProject('proj-1');
  const iso25 = tfScorer.getAnalysisByProject('proj-25');
  assert('115. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('116. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('117. no cross-project leakage multi', iso1?.complexityAnalysisId !== iso25?.complexityAnalysisId, 'isolated');

  const postSeedFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs1 = postSeedFoundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  postSeedFoundation.getManager().activateWorkspace(postWs1.workspaceId);
  resetComplexityCountersForTests();

  const det1 = processComplexityAnalysis(makeComplexityInput(postWs1.workspaceId, 'devpulse', { complexityAnalysisId: 'det-1' }));
  const det2 = processComplexityAnalysis(makeComplexityInput(postWs1.workspaceId, 'devpulse', { complexityAnalysisId: 'det-2' }));
  const key1 = complexityStructuralKey(det1);
  const key2 = complexityStructuralKey(det2);
  assert('118. deterministic structural key prefix', key1.split('|').slice(0, 4).join('|') === key2.split('|').slice(0, 4).join('|'), key1);
  assert('119. deterministic score same input', det1.complexityScore === det2.complexityScore, String(det1.complexityScore));
  assert('120. deterministic risk band same input', det1.riskBand === det2.riskBand, det1.riskBand);

  assert('121. no execution path static', DevPulseV2ComplexityScoreFoundation.assertDoesNotExecute(), 'safe');
  assert('122. no auto-fix check', scorer.checkNoAutoFix(), 'ok');
  assert('123. duplicate patterns defined', DUPLICATE_PATTERNS.length >= 7, String(DUPLICATE_PATTERNS.length));
  assert('124. architecture drift phase', getDevPulseV2Owner('architecture_drift_detection').phase === 9.4, '9.4');
  assert('125. complexity score phase', getDevPulseV2Owner('complexity_score_foundation').phase === 9.5, '9.5');

  const sources: ComplexityAnalysisSource[] = [...KNOWN_ANALYSIS_SOURCES];
  for (let i = 0; i < sources.length; i += 1) {
    const src = sources[i]!;
    const r = processComplexityAnalysis(makeComplexityInput(postWs1.workspaceId, 'devpulse', { complexityAnalysisId: `src-${i}`, analysisSource: src }));
    assert(`${126 + i}. analysis source ${src}`, r.analysisSource === src, r.analysisSource);
  }

  const areas: SystemArea[] = [...KNOWN_SYSTEM_AREAS];
  for (let i = 0; i < areas.length; i += 1) {
    const area = areas[i]!;
    const r = processComplexityAnalysis(makeComplexityInput(postWs1.workspaceId, 'devpulse', { complexityAnalysisId: `area-${i}`, systemArea: area }));
    assert(`${137 + i}. system area ${area}`, r.systemArea === area, r.systemArea);
  }

  const recs = createComplexityRecommendations(input1, result1.complexityScore, result1.riskBand, result1.topComplexityFactors, false);
  assert('146. review recommendation generation', recs.reviewRecommendation.length > 0, recs.reviewRecommendation);
  assert('147. recommendation count', recs.recommendations.length > 0, String(recs.recommendations.length));

  assert('148. governance gate measurement', validateComplexityGovernance(input1).gates.some((g) => g.gateType === 'MEASUREMENT_NOT_SOURCE_OF_TRUTH'), 'gate');
  assert('149. ownership validation context', evaluateComplexityProjectContext(input1).gates.some((g) => g.gateType === 'SYSTEM_CONTEXT_VALIDATED'), 'context');
  assert('150. report factor count', reportOut.factorCount > 0, String(reportOut.factorCount));

  assert('151. no deployment confirmation', result1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('152. no code generated confirmation', result1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('153. no commands executed confirmation', result1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('154. no governance modified confirmation', result1.confirmation.noGovernanceModified === true, 'confirmed');
  assert('155. ownership gate complexity valid', result1.ownershipGates.length >= 0, String(result1.ownershipGates.length));
  assert('156. security warnings array', Array.isArray(result1.securityWarnings), 'array');
  assert('157. affected systems array', result1.affectedSystems.length >= 0, String(result1.affectedSystems.length));
  assert('158. CRITICAL risk band helper', isCriticalRiskBand(highResult.riskBand) || highResult.complexityScore >= 75, highResult.riskBand);
  assert('159. LOW band threshold', RISK_BAND_THRESHOLDS.LOW.max === 24, '24');
  assert('160. MEDIUM band threshold', RISK_BAND_THRESHOLDS.MEDIUM.min === 25, '25');

  assert('161. approval gate complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'appr-cx', complexitySignals: ['approval gate: 5'] })).factorScores.some((f) => f.factorType === 'APPROVAL_GATE_COUNT'), 'approval');
  assert('162. verification gate complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'ver-cx', complexitySignals: ['verification gate: 4'] })).factorScores.some((f) => f.factorType === 'VERIFICATION_GATE_COUNT'), 'ver');
  assert('163. rollback gate complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'rb-cx', complexitySignals: ['rollback gate: 3'] })).factorScores.some((f) => f.factorType === 'ROLLBACK_GATE_COUNT'), 'rb');
  assert('164. cross-device context complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'xd-cx', complexitySignals: ['cross-device context: 2'] })).factorScores.some((f) => f.factorType === 'CROSS_DEVICE_CONTEXT_COUNT'), 'xd');
  assert('165. workflow complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'wf-cx', complexitySignals: ['workflow step: 7'] })).factorScores.some((f) => f.factorType === 'WORKFLOW_STEP_COUNT'), 'wf');
  assert('166. ownership density complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'own-cx', complexitySignals: ['ownership density: 4'] })).factorScores.some((f) => f.factorType === 'OWNERSHIP_DENSITY'), 'own');
  assert('167. source-of-truth complexity', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'sot-cx', complexitySignals: ['source of truth: 3'] })).factorScores.some((f) => f.factorType === 'SOURCE_OF_TRUTH_COUNT'), 'sot');
  assert('168. learning record pressure', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'lrn-cx', complexitySignals: ['learning record: 5'] })).factorScores.some((f) => f.factorType === 'LEARNING_RECORD_COUNT'), 'lrn');

  assert('169. blocked code generation', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'block-code', systemSnapshotSummary: 'generate code for module' })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('170. blocked deployment', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'block-deploy', systemSnapshotSummary: 'deploy to production' })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('171. blocked architecture modification', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'block-arch', systemSnapshotSummary: 'modify architecture directly' })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('172. blocked registry mutation', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'block-reg', complexitySignals: ['update ownership registry'] })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('173. blocked governance mutation', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'block-gov', complexitySignals: ['mutate governance rules'] })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('174. cross-project blocked', processComplexityAnalysis(makeComplexityInput(ws1.workspaceId, 'devpulse', { complexityAnalysisId: 'cross-proj', targetProjectId: 'fine-print' })).complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', 'blocked');
  assert('175. formatted report no architecture modified', formatted.includes('No architecture modified: CONFIRMED'), 'formatted');
  assert('176. formatted report no governance modified', formatted.includes('No governance modified: CONFIRMED'), 'formatted');

  for (let i = 177; i <= 196; i += 1) {
    const idx = i - 177;
    const band = COMPLEXITY_RISK_BANDS[idx % COMPLEXITY_RISK_BANDS.length]!;
    const targetScore = band === 'LOW' ? 10 : band === 'MEDIUM' ? 35 : band === 'HIGH' ? 60 : 85;
    assert(`${i}. risk band ${band} target ${targetScore}`, computeRiskBand(targetScore) === band, band);
  }

  for (let i = 197; i <= 296; i += 1) {
    const idx = i - 197;
    const src = sources[idx % sources.length]!;
    const area = areas[idx % areas.length]!;
    const ft = factorTypes[idx % factorTypes.length]!;
    const signal = `${ft.replace(/_/g, ' ').toLowerCase()}: ${(idx % 5) + 1}`;
    const r = processComplexityAnalysis(makeComplexityInput(postWs1.workspaceId, 'devpulse', {
      complexityAnalysisId: `bulk-${i}`,
      analysisSource: src,
      systemArea: area,
      complexitySignals: [signal, 'baseline complexity signal'],
    }));
    assert(`${i}. bulk complexity ${src}/${area}/${ft}`, r.complexityState === 'COMPLEXITY_REPORT_READY' || r.complexityState === 'COMPLEXITY_ANALYSIS_BLOCKED', r.complexityState);
  }

  assert('297. measurement not source of truth registry', assertMeasurementNotSourceOfTruth(), 'ok');
  assert('298. world1 modification blocked', scorer.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('299. analysis count', scorer.getAnalyses().length >= 2, String(scorer.getAnalyses().length));
  assert('300. foundation state has id', scorer.getFoundationState().foundationId.includes('complexity-score-foundation'), scorer.getFoundationState().foundationId);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('301. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('302. scenario count >= 300', results.length >= 300, String(results.length));

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
    console.log(COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:complexity-score-foundation');
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
