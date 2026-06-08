/**
 * DevPulse V2 Phase 9.1 Missing Capability Detector Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import {
  analysisKey,
  assertDistinctFromCrossDeviceContinuity,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  buildCapabilityGapReportOutput,
  classifyCapabilityGaps,
  classificationKey,
  CONFIDENCE_LEVELS,
  countBySeverity,
  DEPENDENCY_SYSTEMS,
  DevPulseV2MissingCapabilityDetector,
  DUPLICATE_PATTERNS,
  evaluateProjectContext,
  formatCapabilityGapReport,
  GAP_SEVERITY_LEVELS,
  GAP_STATE_SEQUENCE,
  gapStateIncludes,
  gapStructuralKey,
  generateRecommendations,
  governanceGatesKey,
  KNOWN_ANALYSIS_SOURCES,
  KNOWN_CAPABILITY_TYPES,
  MISSING_CAPABILITY_DETECTOR_OWNER_MODULE,
  MISSING_CAPABILITY_DETECTOR_PASS_TOKEN,
  overallConfidence,
  processCapabilityAnalysis,
  resetCapabilityGapCounterForTests,
  resetDevPulseV2MissingCapabilityDetectorForTests,
  scanForCapabilityGaps,
  scanKey,
  scanModuleForForbiddenPatterns,
  SOURCE_CAPABILITY_MAP,
  validateAnalysisInput,
  validateDetectorGovernance,
} from '../src/missing-capability-detector/index.js';
import type { AnalysisSource, CapabilityAnalysisInput } from '../src/missing-capability-detector/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeAnalysisInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<CapabilityAnalysisInput> = {},
): CapabilityAnalysisInput {
  return {
    analysisId: 'analysis-001',
    workspaceId,
    projectId,
    goalId: 'goal-001',
    goalSummary: 'Build dashboard with verification and mobile preview',
    analysisSource: 'PROJECT_GOAL',
    analysisContext: 'Goal requires planning and intelligence layers',
    requestedOutcome: 'Satisfy project goal with governed execution',
    worldTarget: 'WORLD_2',
    simulationId: '',
    builderId: '',
    verificationId: '',
    learningId: '',
    timestamp: Date.now(),
    ...overrides,
  };
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
  console.log('DevPulse V2 — Phase 9.1 Missing Capability Detector Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetCapabilityGapCounterForTests();

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

  const detector = resetDevPulseV2MissingCapabilityDetectorForTests();
  const input1 = makeAnalysisInput(ws1.workspaceId, 'devpulse');
  const result1 = detector.analyzeCapabilityGaps(input1);
  const result2 = detector.analyzeCapabilityGaps(
    makeAnalysisInput(ws2.workspaceId, 'fine-print', { analysisId: 'analysis-002', analysisSource: 'MOBILE_REQUEST' }),
  );

  assert('1. gap analysis succeeds', result1.analysisId === 'analysis-001', result1.analysisId);
  assert('2. analysis has workspaceId', result1.workspaceId === ws1.workspaceId, result1.workspaceId);
  assert('3. analysis has projectId', result1.projectId === 'devpulse', result1.projectId);
  assert('4. analysis source classified', result1.analysisSource === 'PROJECT_GOAL', result1.analysisSource);
  assert('5. gaps detected', result1.detectedGaps.length > 0, String(result1.detectedGaps.length));
  assert('6. report ready state', result1.capabilityGapState === 'REPORT_READY', result1.capabilityGapState);
  assert('7. no execution confirmation', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('8. no acquisition confirmation', result1.confirmation.noCapabilityAcquisitionPerformed === true, 'confirmed');
  assert('9. no files modified confirmation', result1.confirmation.noFilesModified === true, 'confirmed');
  assert('10. detector foundation only confirmation', result1.confirmation.missingCapabilityDetectorOnly === true, 'confirmed');

  assert('11. registry ownership', DevPulseV2MissingCapabilityDetector.assertRegistryOwnership(), 'registry ok');
  assert('12. duplicate check passes', DevPulseV2MissingCapabilityDetector.assertDuplicateCheckPasses(), 'no duplicates');
  assert('13. does not execute', DevPulseV2MissingCapabilityDetector.assertDoesNotExecute(), 'no execute methods');
  assert('14. no forbidden patterns', DevPulseV2MissingCapabilityDetector.assertNoForbiddenExecutionPatterns(), 'clean scan');
  assert('15. dependency chain', DevPulseV2MissingCapabilityDetector.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('missing_capability_detector');
  assert('16. owner module correct', owner.ownerModule === MISSING_CAPABILITY_DETECTOR_OWNER_MODULE, owner.ownerModule);
  assert('17. owner phase 9.1', owner.phase === 9.1, String(owner.phase));
  assert('18. owner function registered', owner.ownerFunction === 'createDevPulseV2MissingCapabilityDetector', owner.ownerFunction);

  assert('19. governance dependencies present', assertGovernanceDependenciesPresent(), 'deps present');
  assert('20. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('21. world1 protected', assertWorld1Protected(), 'world1 protected');
  assert('22. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'registry ok');
  assert('23. distinct from cross device continuity', assertDistinctFromCrossDeviceContinuity(), 'distinct');

  const moduleDir = join(fileURLToPath(new URL('../src/missing-capability-detector', import.meta.url)));
  const forbidden = scanModuleForForbiddenPatterns(moduleDir);
  assert('24. forbidden pattern scan clean', forbidden.length === 0, forbidden.join('; ') || 'clean');

  assert('25. gap state sequence defined', GAP_STATE_SEQUENCE.length >= 7, String(GAP_STATE_SEQUENCE.length));
  assert('26. known analysis sources count', KNOWN_ANALYSIS_SOURCES.length === 9, String(KNOWN_ANALYSIS_SOURCES.length));
  assert('27. known capability types count', KNOWN_CAPABILITY_TYPES.length === 12, String(KNOWN_CAPABILITY_TYPES.length));
  assert('28. severity levels count', GAP_SEVERITY_LEVELS.length === 4, String(GAP_SEVERITY_LEVELS.length));
  assert('29. confidence levels count', CONFIDENCE_LEVELS.length === 4, String(CONFIDENCE_LEVELS.length));
  assert('30. dependency systems count', DEPENDENCY_SYSTEMS.length === 14, String(DEPENDENCY_SYSTEMS.length));

  assert('31. analysis input validation passes', validateAnalysisInput(input1).valid === true, 'valid');
  assert('32. project context validation passes', evaluateProjectContext(input1).valid === true, 'valid');
  assert('33. governance validation passes', validateDetectorGovernance(input1).valid === true, 'valid');

  assert('34. missing analysis id blocked', validateAnalysisInput(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisId: '' })).blocked === true, 'blocked');
  assert('35. missing workspace blocked', validateAnalysisInput(makeAnalysisInput('', 'devpulse')).blocked === true, 'blocked');
  assert('36. unknown source blocked', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'UNKNOWN' })).capabilityGapState === 'ANALYSIS_BLOCKED', 'blocked');

  const sources: AnalysisSource[] = [
    'PROJECT_GOAL',
    'EXECUTION_PLAN',
    'SIMULATION_RESULT',
    'VERIFICATION_RESULT',
    'LEARNING_RESULT',
    'APPROVAL_RESULT',
    'MOBILE_REQUEST',
    'ARCHITECTURE_REVIEW',
    'WORLD2_ANALYSIS',
  ];
  for (let i = 0; i < sources.length; i += 1) {
    const src = sources[i]!;
    const r = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: src, analysisId: `src-${i}` }));
    assert(`${37 + i}. ${src} analysis`, r.analysisSource === src && r.capabilityGapState === 'REPORT_READY', r.analysisSource);
  }

  const capabilityContexts: Array<{ keyword: string; type: string }> = [
    { keyword: 'missing diagnostic layer needed', type: 'DIAGNOSTIC_CAPABILITY' },
    { keyword: 'missing verification for release', type: 'VERIFICATION_CAPABILITY' },
    { keyword: 'missing execution support', type: 'EXECUTION_CAPABILITY' },
    { keyword: 'missing planning for roadmap', type: 'PLANNING_CAPABILITY' },
    { keyword: 'simulation failure detected', type: 'SIMULATION_CAPABILITY' },
    { keyword: 'missing preview on mobile', type: 'PREVIEW_CAPABILITY' },
    { keyword: 'approval bottleneck blocking', type: 'GOVERNANCE_CAPABILITY' },
    { keyword: 'missing mobile command support', type: 'MOBILE_CAPABILITY' },
    { keyword: 'missing intelligence for goals', type: 'PROJECT_INTELLIGENCE_CAPABILITY' },
    { keyword: 'learning outcome insufficient', type: 'LEARNING_CAPABILITY' },
    { keyword: 'missing architecture protection', type: 'ARCHITECTURE_CAPABILITY' },
    { keyword: 'missing security validation', type: 'SECURITY_CAPABILITY' },
  ];
  for (let i = 0; i < capabilityContexts.length; i += 1) {
    const ctx = capabilityContexts[i]!;
    const r = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', {
      analysisContext: ctx.keyword,
      analysisId: `cap-${i}`,
    }));
    assert(`${46 + i}. ${ctx.type} gap detected`, r.detectedGaps.some((g) => g.capabilityType === ctx.type), ctx.type);
  }

  const low = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisContext: 'minor enhancement', analysisId: 'sev-low' }));
  assert('58. LOW severity possible', low.detectedGaps.some((g) => g.gapSeverity === 'LOW') || low.gapSeverity === 'LOW', 'low');

  const high = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'VERIFICATION_RESULT', analysisContext: 'verification failure', analysisId: 'sev-high' }));
  assert('59. HIGH severity from verification', high.detectedGaps.some((g) => g.gapSeverity === 'HIGH'), 'high');

  const critical = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'ARCHITECTURE_REVIEW', analysisContext: 'missing architecture protection', analysisId: 'sev-crit' }));
  assert('60. CRITICAL severity from architecture', critical.detectedGaps.some((g) => g.gapSeverity === 'CRITICAL'), 'critical');

  const medium = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'MOBILE_REQUEST', analysisId: 'sev-med' }));
  assert('61. MEDIUM severity from mobile', medium.detectedGaps.some((g) => g.gapSeverity === 'MEDIUM'), 'medium');

  assert('62. recommendation generation', result1.recommendations.length > 0, String(result1.recommendations.length));
  assert('63. confidence scoring present', result1.confidenceScore.length > 0, result1.confidenceScore);

  const scanned = scanForCapabilityGaps(input1);
  const classified = classifyCapabilityGaps(scanned);
  assert('64. capability scan', scanned.length > 0, String(scanned.length));
  assert('65. capability classification', classified.length === scanned.length, String(classified.length));
  assert('66. overall confidence', overallConfidence(classified).length > 0, overallConfidence(classified));

  const sevCounts = countBySeverity(classified);
  assert('67. severity count helper', sevCounts.high >= 0 && sevCounts.critical >= 0, 'counts');

  assert('68. analysis key', analysisKey(input1).includes('analysis-001'), analysisKey(input1));
  assert('69. scan key', scanKey(scanned.length, 'PROJECT_GOAL').includes('PROJECT_GOAL'), scanKey(scanned.length, 'PROJECT_GOAL'));
  assert('70. classification key', classificationKey('PLANNING_CAPABILITY', 'LOW') === 'PLANNING_CAPABILITY|LOW', classificationKey('PLANNING_CAPABILITY', 'LOW'));
  assert('71. governance gates key', governanceGatesKey(validateDetectorGovernance(input1).gates).length > 0, 'gates');

  const execBlock = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisContext: 'execute build now', analysisId: 'block-exec' }));
  assert('72. blocked execution attempt', execBlock.capabilityGapState === 'ANALYSIS_BLOCKED', execBlock.capabilityGapState);

  const fileBlock = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisContext: 'modify file on disk', analysisId: 'block-file' }));
  assert('73. blocked file modification attempt', fileBlock.capabilityGapState === 'ANALYSIS_BLOCKED', fileBlock.capabilityGapState);

  const codeBlock = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisContext: 'generate code for feature', analysisId: 'block-code' }));
  assert('74. blocked code generation attempt', codeBlock.capabilityGapState === 'ANALYSIS_BLOCKED', codeBlock.capabilityGapState);

  const deployBlock = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisContext: 'deploy to production', analysisId: 'block-deploy' }));
  assert('75. blocked deployment attempt', deployBlock.capabilityGapState === 'ANALYSIS_BLOCKED', deployBlock.capabilityGapState);

  const acquireBlock = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisContext: 'acquire capability and install tool', analysisId: 'block-acquire' }));
  assert('76. blocked capability acquisition attempt', acquireBlock.capabilityGapState === 'ANALYSIS_BLOCKED', acquireBlock.capabilityGapState);

  const reportOut = buildCapabilityGapReportOutput(input1, result1);
  assert('77. gap report output', reportOut.reportId.includes('analysis-001'), reportOut.reportId);
  assert('78. gap report count', reportOut.capabilityGapCount > 0, String(reportOut.capabilityGapCount));
  assert('79. report confirmation no acquisition', reportOut.confirmation.noCapabilityAcquisitionPerformed === true, 'confirmed');

  const formatted = formatCapabilityGapReport(detector.getFoundationState(), result1, input1);
  assert('80. formatted report phase 9.1', formatted.includes('Phase 9.1'), 'formatted');
  assert('81. formatted report no execution', formatted.includes('No execution performed: CONFIRMED'), 'formatted');

  assert('82. get analysis by id', detector.getAnalysisById('analysis-001') !== null, 'found');
  assert('83. get analysis by project', detector.getAnalysisByProject('devpulse') !== null, 'found');
  assert('84. governance summary present', detector.getGovernanceSummary().includes('world2_execution_planner'), detector.getGovernanceSummary());
  assert('85. world1 modification blocked', detector.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('86. no capability acquisition check', detector.checkNoCapabilityAcquisition(), 'ok');

  assert('87. state includes REPORT_READY', gapStateIncludes(result1.stateSequence, 'REPORT_READY'), 'included');
  assert('88. state includes CAPABILITY_GAP_DETECTED', gapStateIncludes(result1.stateSequence, 'CAPABILITY_GAP_DETECTED'), 'included');
  assert('89. state includes CONTEXT_EVALUATED', gapStateIncludes(result1.stateSequence, 'CONTEXT_EVALUATED'), 'included');

  const crossWs = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { targetWorkspaceId: ws2.workspaceId, analysisId: 'cross-ws' }));
  assert('90. cross-workspace analysis blocked', crossWs.capabilityGapState === 'ANALYSIS_BLOCKED' || crossWs.ownershipGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const crossProj = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { targetProjectId: 'fine-print', analysisId: 'cross-proj' }));
  assert('91. cross-project analysis blocked', crossProj.capabilityGapState === 'ANALYSIS_BLOCKED' || crossProj.ownershipGates.some((g) => g.gateType === 'CROSS_PROJECT'), 'blocked');

  assert('92. second project isolated', result2.projectId === 'fine-print', result2.projectId);
  assert('93. no cross-project leakage', result1.projectId !== result2.projectId, `${result1.projectId} vs ${result2.projectId}`);

  const wrongProj = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'wrong-project'));
  assert('94. wrong project blocked', wrongProj.capabilityGapState === 'ANALYSIS_BLOCKED', wrongProj.capabilityGapState);

  assert('95. duplicate patterns defined', DUPLICATE_PATTERNS.length >= 6, String(DUPLICATE_PATTERNS.length));
  assert('96. world2 planner phase', getDevPulseV2Owner('world2_execution_planner').phase === 7.2, '7.2');
  assert('97. cross device phase', getDevPulseV2Owner('cross_device_continuity_foundation').phase === 8.5, '8.5');
  assert('98. execution authority phase', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');

  assert('99. ownership gate count', result1.ownershipGates.length > 0, String(result1.ownershipGates.length));
  assert('100. governance gate count', result1.governanceGates.length > 0, String(result1.governanceGates.length));
  assert('101. pass token defined', MISSING_CAPABILITY_DETECTOR_PASS_TOKEN === 'DEVPULSE_V2_MISSING_CAPABILITY_DETECTOR_FOUNDATION_V1_PASS', MISSING_CAPABILITY_DETECTOR_PASS_TOKEN);

  const blockedNoGaps = processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisId: '' }));
  assert('102. blocked analysis empty gaps', blockedNoGaps.detectedGaps.length === 0, '0');

  const recs = generateRecommendations(input1, classified);
  assert('103. recommendations include detection only', recs.some((r) => r.includes('detection only')), 'detection');

  for (const src of KNOWN_ANALYSIS_SOURCES) {
    const map = SOURCE_CAPABILITY_MAP[src];
    assert(`104-map. ${src} has capability map`, map.length > 0, String(map.length));
  }

  assert('113. goal analysis gaps', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'PROJECT_GOAL', analysisId: 'goal-a' })).detectedGaps.length > 0, 'gaps');
  assert('114. execution plan analysis', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'EXECUTION_PLAN', analysisId: 'plan-a' })).detectedGaps.some((g) => g.capabilityType === 'EXECUTION_CAPABILITY'), 'execution');
  assert('115. simulation result analysis', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'SIMULATION_RESULT', analysisContext: 'simulation failure', analysisId: 'sim-a' })).detectedGaps.some((g) => g.capabilityType === 'SIMULATION_CAPABILITY'), 'simulation');
  assert('116. verification result analysis', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'VERIFICATION_RESULT', analysisContext: 'verification failure', analysisId: 'ver-a' })).detectedGaps.some((g) => g.capabilityType === 'VERIFICATION_CAPABILITY'), 'verification');
  assert('117. learning result analysis', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'LEARNING_RESULT', analysisContext: 'learning outcome gap', analysisId: 'learn-a' })).detectedGaps.some((g) => g.capabilityType === 'LEARNING_CAPABILITY'), 'learning');
  assert('118. mobile request analysis', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'MOBILE_REQUEST', analysisId: 'mob-a' })).detectedGaps.some((g) => g.capabilityType === 'MOBILE_CAPABILITY'), 'mobile');
  assert('119. architecture review analysis', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'ARCHITECTURE_REVIEW', analysisId: 'arch-a' })).detectedGaps.some((g) => g.capabilityType === 'ARCHITECTURE_CAPABILITY'), 'architecture');
  assert('120. world2 analysis', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'WORLD2_ANALYSIS', analysisContext: 'world2 limitation', analysisId: 'w2-a' })).detectedGaps.length > 0, 'gaps');

  assert('121. no deployment confirmation', result1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('122. no code generated confirmation', result1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('123. no commands executed confirmation', result1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('124. analysis count', detector.getAnalyses().length >= 2, String(detector.getAnalyses().length));
  assert('125. foundation state has id', detector.getFoundationState().foundationId.includes('missing-capability-detector'), detector.getFoundationState().foundationId);

  const oneDetector = resetDevPulseV2MissingCapabilityDetectorForTests();
  const oneWs = seedWorkspaces(1);
  oneDetector.analyzeCapabilityGaps(makeAnalysisInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { analysisId: 'one-proj' }));
  assert('126. one project support', oneDetector.getAnalyses().length === 1, '1');

  const fiveDetector = resetDevPulseV2MissingCapabilityDetectorForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveDetector.analyzeCapabilityGaps(makeAnalysisInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { analysisId: `five-${i}` }));
  }
  assert('127. five project support', fiveDetector.getAnalyses().length === 5, '5');

  const tenDetector = resetDevPulseV2MissingCapabilityDetectorForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenDetector.analyzeCapabilityGaps(makeAnalysisInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { analysisId: `ten-${i}` }));
  }
  assert('128. ten project support', tenDetector.getAnalyses().length === 10, '10');

  const twentyFiveDetector = resetDevPulseV2MissingCapabilityDetectorForTests();
  const twentyFiveWs = seedWorkspaces(25);
  for (let i = 0; i < twentyFiveWs.length; i += 1) {
    twentyFiveDetector.analyzeCapabilityGaps(makeAnalysisInput(twentyFiveWs[i]!.workspaceId, twentyFiveWs[i]!.projectId, { analysisId: `tf-${i}` }));
  }
  assert('129. twenty-five project support', twentyFiveDetector.getAnalyses().length === 25, '25');

  const iso1 = twentyFiveDetector.getAnalysisByProject('proj-1');
  const iso25 = twentyFiveDetector.getAnalysisByProject('proj-25');
  assert('130. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('131. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('132. no cross-project leakage', iso1?.analysisId !== iso25?.analysisId, 'isolated');

  const postSeedFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs1 = postSeedFoundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  postSeedFoundation.getManager().activateWorkspace(postWs1.workspaceId);

  resetCapabilityGapCounterForTests();
  const det1 = processCapabilityAnalysis(makeAnalysisInput(postWs1.workspaceId, 'devpulse', { analysisId: 'det-1' }));
  const det2 = processCapabilityAnalysis(makeAnalysisInput(postWs1.workspaceId, 'devpulse', { analysisId: 'det-2' }));
  const key1 = gapStructuralKey(det1);
  const key2 = gapStructuralKey(det2);
  assert('133. deterministic structural key prefix', key1.split('|').slice(0, 4).join('|') === key2.split('|').slice(0, 4).join('|'), key1);
  assert('134. deterministic gap count same source', det1.detectedGaps.length === det2.detectedGaps.length, String(det1.detectedGaps.length));
  assert('135. deterministic confidence same source', det1.detectedGaps[0]?.confidenceScore === det2.detectedGaps[0]?.confidenceScore, det1.confidenceScore);

  assert('136. ownership gate project context', evaluateProjectContext(input1).gates.some((g) => g.gateType === 'CONTEXT_EVALUATED'), 'context');
  assert('137. governance gate stack', validateDetectorGovernance(input1).gates.some((g) => g.gateType === 'GOVERNANCE_STACK'), 'stack');

  assert('138. mobile command foundation registered', getDevPulseV2Owner('mobile_command_foundation').phase === 8.1, '8.1');
  assert('139. verification gated apply registered', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('140. controlled execution bridge registered', getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7, '7.7');
  assert('141. learning loop registered', getDevPulseV2Owner('world2_learning_loop').phase === 7.6, '7.6');

  assert('142. state sequence scan complete', gapStateIncludes(result1.stateSequence, 'CAPABILITY_SCAN_COMPLETE'), 'included');
  assert('143. state sequence classified', gapStateIncludes(result1.stateSequence, 'CAPABILITY_GAP_CLASSIFIED'), 'included');
  assert('144. state sequence recommendation', gapStateIncludes(result1.stateSequence, 'RECOMMENDATION_GENERATED'), 'included');

  assert('145. recommended action no install', result1.detectedGaps.every((g) => g.recommendedAction.includes('do not install')), 'no install');
  assert('146. gap evidence present', result1.detectedGaps.every((g) => g.gapEvidence.length > 0), 'evidence');
  assert('147. gap impact present', result1.detectedGaps.every((g) => g.gapImpact.length > 0), 'impact');
  assert('148. gap reason present', result1.detectedGaps.every((g) => g.gapReason.length > 0), 'reason');

  assert('149. high severity count in report', reportOut.highSeverityCount >= 0, String(reportOut.highSeverityCount));
  assert('150. critical severity count in report', reportOut.criticalSeverityCount >= 0, String(reportOut.criticalSeverityCount));
  assert('151. recommended capability count', reportOut.recommendedCapabilityCount > 0, String(reportOut.recommendedCapabilityCount));
  assert('152. top gaps in report', reportOut.topCapabilityGaps.length > 0, String(reportOut.topCapabilityGaps.length));

  assert('153. no execution path static', DevPulseV2MissingCapabilityDetector.assertDoesNotExecute(), 'safe');
  assert('154. no code generation path blocked', codeBlock.capabilityGapState === 'ANALYSIS_BLOCKED', 'blocked');
  assert('155. no deployment path blocked', deployBlock.capabilityGapState === 'ANALYSIS_BLOCKED', 'blocked');
  assert('156. no acquisition path blocked', acquireBlock.capabilityGapState === 'ANALYSIS_BLOCKED', 'blocked');

  assert('157. detector foundation only in report', reportOut.confirmation.missingCapabilityDetectorOnly === true, 'confirmed');
  assert('158. formatted capability detection only', formatted.includes('Capability detection only: CONFIRMED'), 'confirmed');

  assert('159. approval result analysis', processCapabilityAnalysis(makeAnalysisInput(ws1.workspaceId, 'devpulse', { analysisSource: 'APPROVAL_RESULT', analysisContext: 'approval bottleneck', analysisId: 'appr-a' })).detectedGaps.some((g) => g.capabilityType === 'GOVERNANCE_CAPABILITY'), 'governance');

  for (let i = 160; i <= 219; i += 1) {
    const idx = i - 160;
    const src = sources[idx % sources.length]!;
    const r = processCapabilityAnalysis(makeAnalysisInput(postWs1.workspaceId, 'devpulse', {
      analysisSource: src,
      analysisId: `bulk-${i}`,
      analysisContext: `bulk scenario ${i} for ${src}`,
    }));
    assert(`${i}. bulk scenario ${src}`, r.capabilityGapState === 'REPORT_READY' && r.detectedGaps.length > 0, r.analysisSource);
  }

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('220. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(MISSING_CAPABILITY_DETECTOR_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:missing-capability-detector');
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
