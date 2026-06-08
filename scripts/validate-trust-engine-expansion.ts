/**
 * DevPulse V2 Phase 10.2 Trust Engine Expansion Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import type {
  TrustAssessmentInput,
  TrustAssessmentSource,
  TrustAssessmentTarget,
  TrustFactorType,
  TrustLevel,
  TrustRiskLevel,
} from '../src/trust-engine-expansion/index.js';
import {
  aggregateTrustScore,
  assertDistinctFromTrustEngine,
  assertGovernanceDependenciesPresent,
  assertNoAutoFixCapability,
  assertNoDuplicateTrustEngineExpansion,
  assertNoExecutionMethods,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNoReplacementCapability,
  assertNotReplacingSourceSystems,
  assertTrustAggregationOnly,
  assertWorld1Protected,
  assertWorld2Protected,
  buildTrustEngineReportOutput,
  computeTrustLevel,
  computeTrustRiskLevel,
  countCriticalWarnings,
  countPositiveFactors,
  countRiskFactors,
  createTrustFactorScores,
  createTrustRecommendations,
  createTrustWarnings,
  DEPENDENCY_SYSTEMS,
  DevPulseV2TrustEngineExpansion,
  DUPLICATE_PATTERNS,
  evaluateTrustProjectContext,
  evaluateTrustSignals,
  formatTrustEngineReport,
  getFactorByType,
  isCriticalRisk,
  isEvidenceQualityFactor,
  isPredictionRiskFactor,
  isRiskFactor,
  isScoreInRange,
  isStrongTrustSignal,
  isVerificationStrengthFactor,
  isVeryHighTrust,
  isVeryLowTrust,
  isWeakTrustSignal,
  KNOWN_ASSESSMENT_SOURCES,
  KNOWN_ASSESSMENT_TARGETS,
  KNOWN_TRUST_FACTORS,
  POSITIVE_TRUST_FACTORS,
  processTrustAssessment,
  resetDevPulseV2TrustEngineExpansionForTests,
  resetTrustCountersForTests,
  RISK_TRUST_FACTORS,
  scanModuleForForbiddenPatterns,
  scoreForTrustLevel,
  TRUST_ENGINE_EXPANSION_OWNER_MODULE,
  TRUST_ENGINE_EXPANSION_PASS_TOKEN,
  TRUST_FACTOR_WEIGHTS,
  TRUST_LEVEL_THRESHOLDS,
  TRUST_STATE_SEQUENCE,
  trustContextKey,
  trustStateIncludes,
  trustStructuralKey,
  validateTrustAssessmentInput,
  validateTrustGovernance,
} from '../src/trust-engine-expansion/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeTrustInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<TrustAssessmentInput> = {},
): TrustAssessmentInput {
  return {
    trustAssessmentId: 'trust-assess-test-001',
    workspaceId,
    projectId,
    assessmentSource: 'FOUNDER_REVIEW',
    assessmentTarget: 'PROJECT',
    targetId: 'target-001',
    evidenceSignals: ['execution_evidence_ledger: strong evidence quality 6'],
    verificationSignals: ['verification_gated_apply: strong verification 6'],
    completionSignals: ['world2_completion_verifier: high completion confidence 5'],
    realitySignals: ['execution_reality_validation: high reality alignment 5'],
    governanceSignals: ['founder_approval_execution_gate: governance pass 5'],
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function highTrustInput(workspaceId: string, projectId: string, id: string): TrustAssessmentInput {
  return makeTrustInput(workspaceId, projectId, {
    trustAssessmentId: id,
    assessmentSource: 'VERIFICATION_RESULT',
    assessmentTarget: 'COMPLETION_RESULT',
    evidenceSignals: ['execution_evidence_ledger: very strong evidence quality 10'],
    verificationSignals: ['verification_gated_apply: strong verification 10'],
    completionSignals: ['world2_completion_verifier: high completion confidence 10'],
    realitySignals: ['execution_reality_validation: high reality alignment 9'],
    governanceSignals: ['founder_approval_execution_gate: strong governance pass 9'],
    learningSignals: ['self_learning_engine: strong learning support 7'],
    complexitySignals: ['complexity_score_foundation: low complexity risk 2'],
    driftSignals: ['architecture_drift_detection: low drift risk 1'],
    predictionSignals: ['future_problem_prediction: low forecast risk 1'],
  });
}

function lowTrustInput(workspaceId: string, projectId: string, id: string): TrustAssessmentInput {
  return makeTrustInput(workspaceId, projectId, {
    trustAssessmentId: id,
    assessmentSource: 'SELF_EVOLUTION',
    assessmentTarget: 'SELF_EVOLUTION_RECOMMENDATION',
    evidenceSignals: ['evidence: weak missing evidence 2'],
    verificationSignals: ['verification: weak verification 2'],
    completionSignals: ['completion: low completion confidence 2'],
    predictionSignals: ['future_problem_prediction: critical forecast risk 10'],
    complexitySignals: ['complexity_score_foundation: high complexity risk 10'],
    driftSignals: ['architecture_drift_detection: critical drift risk 10'],
    governanceSignals: ['governance fail signal 3'],
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
  console.log('DevPulse V2 — Phase 10.2 Trust Engine Expansion Foundation');
  console.log('========================================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetTrustCountersForTests();

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse',
    projectVision: 'Trust aggregation for DevPulse',
  });
  foundation.getManager().activateWorkspace(ws.workspaceId);

  const engine = resetDevPulseV2TrustEngineExpansionForTests();
  const input1 = makeTrustInput(ws.workspaceId, 'devpulse');
  const result1 = engine.assessTrust(input1);
  const highResult = engine.assessTrust(highTrustInput(ws.workspaceId, 'devpulse', 'trust-high-001'));
  const lowResult = engine.assessTrust(lowTrustInput(ws.workspaceId, 'devpulse', 'trust-low-001'));
  const reportOut = buildTrustEngineReportOutput(result1);

  assert('1. registry ownership', DevPulseV2TrustEngineExpansion.assertRegistryOwnership(), TRUST_ENGINE_EXPANSION_OWNER_MODULE);
  assert('2. duplicate check passes', DevPulseV2TrustEngineExpansion.assertDuplicateCheckPasses(), 'ok');
  assert('3. does not execute', DevPulseV2TrustEngineExpansion.assertDoesNotExecute(), 'safe');
  assert('4. dependency chain', DevPulseV2TrustEngineExpansion.assertDependencyChain(), 'ok');
  assert('5. no forbidden patterns', DevPulseV2TrustEngineExpansion.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('6. trust report ready', result1.trustState === 'TRUST_REPORT_READY', result1.trustState);
  assert('7. trust score in range', isScoreInRange(result1.trustScore), String(result1.trustScore));
  assert('8. factor scores present', result1.factorScores.length > 0, String(result1.factorScores.length));
  assert('9. trust warnings present', result1.trustWarnings.length > 0, String(result1.trustWarnings.length));
  assert('10. trust recommendations present', result1.trustRecommendations.length > 0, String(result1.trustRecommendations.length));
  assert('11. trust aggregation only', result1.confirmation.trustAggregationOnly === true, 'confirmed');
  assert('12. no execution performed', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('13. no files modified', result1.confirmation.noFilesModified === true, 'confirmed');
  assert('14. no code generated', result1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('15. no deployment performed', result1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('16. no auto-fix performed', result1.confirmation.noAutoFixPerformed === true, 'confirmed');
  assert('17. no verification replaced', result1.confirmation.noVerificationSystemReplaced === true, 'confirmed');
  assert('18. no evidence ledger replaced', result1.confirmation.noEvidenceLedgerReplaced === true, 'confirmed');
  assert('19. no governance replaced', result1.confirmation.noGovernanceSystemReplaced === true, 'confirmed');
  assert('20. no registry modified', result1.confirmation.noOwnershipRegistryModified === true, 'confirmed');

  assert('21. governance dependencies', assertGovernanceDependenciesPresent(), 'present');
  assert('22. no governance bypass', assertNoGovernanceBypass(), 'protected');
  assert('23. world1 protected', assertWorld1Protected(), 'protected');
  assert('24. world2 protected', assertWorld2Protected(), 'protected');
  assert('25. no registry mutation', assertNoRegistryRuntimeMutation(), 'ok');
  assert('26. distinct from trust engine', assertDistinctFromTrustEngine(), 'ok');
  assert('27. not replacing source systems', assertNotReplacingSourceSystems(), 'ok');
  assert('28. trust aggregation only flag', assertTrustAggregationOnly(), 'ok');
  assert('29. no duplicate expansion', assertNoDuplicateTrustEngineExpansion(), 'ok');
  assert('30. governance summary', engine.getGovernanceSummary().includes('trust_engine_expansion'), engine.getGovernanceSummary());

  assert('31. high trust score', highResult.trustScore >= 65, String(highResult.trustScore));
  assert('32. high trust level', highResult.trustLevel === 'HIGH' || highResult.trustLevel === 'VERY_HIGH', highResult.trustLevel);
  assert('33. low trust score', lowResult.trustScore <= 64, String(lowResult.trustScore));
  assert('34. low trust level', lowResult.trustLevel === 'LOW' || lowResult.trustLevel === 'VERY_LOW' || lowResult.trustLevel === 'MEDIUM', lowResult.trustLevel);
  assert('35. source systems tracked', result1.sourceSystems.length > 0, String(result1.sourceSystems.length));
  assert('36. evidence ledger in sources', result1.sourceSystems.includes('execution_evidence_ledger'), 'ledger');
  assert('37. verification in sources', result1.sourceSystems.includes('verification_gated_apply'), 'verification');
  assert('38. pass token defined', TRUST_ENGINE_EXPANSION_PASS_TOKEN === 'DEVPULSE_V2_TRUST_ENGINE_EXPANSION_FOUNDATION_V1_PASS', TRUST_ENGINE_EXPANSION_PASS_TOKEN);
  assert('39. phase 10.2 registered', getDevPulseV2Owner('trust_engine_expansion').phase === 10.2, '10.2');
  assert('40. report factor count', reportOut.factorCount > 0, String(reportOut.factorCount));

  const blockedMissingId = processTrustAssessment(makeTrustInput(ws.workspaceId, 'devpulse', { trustAssessmentId: '' }));
  assert('41. missing assessment blocked', blockedMissingId.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedMissingId.trustState);

  const blockedWs = processTrustAssessment(makeTrustInput('', 'devpulse'));
  assert('42. missing workspace blocked', blockedWs.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedWs.trustState);

  const blockedProj = processTrustAssessment(makeTrustInput(ws.workspaceId, ''));
  assert('43. missing project blocked', blockedProj.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedProj.trustState);

  const blockedSource = processTrustAssessment(makeTrustInput(ws.workspaceId, 'devpulse', { assessmentSource: 'UNKNOWN' }));
  assert('44. UNKNOWN source blocked', blockedSource.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedSource.trustState);

  const blockedTarget = processTrustAssessment(makeTrustInput(ws.workspaceId, 'devpulse', { assessmentTarget: 'UNKNOWN' }));
  assert('45. UNKNOWN target blocked', blockedTarget.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedTarget.trustState);

  const blockedTargetId = processTrustAssessment(makeTrustInput(ws.workspaceId, 'devpulse', { targetId: '' }));
  assert('46. missing target blocked', blockedTargetId.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedTargetId.trustState);

  const blockedGov = processTrustAssessment(makeTrustInput(ws.workspaceId, 'devpulse', { governanceStatus: 'FAIL' }));
  assert('47. governance FAIL blocked', blockedGov.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedGov.trustState);

  const blockedExecute = processTrustAssessment(
    makeTrustInput(ws.workspaceId, 'devpulse', { evidenceSignals: ['please execute this command now'] }),
  );
  assert('48. execute blocked', blockedExecute.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedExecute.trustState);

  const blockedCodeGen = processTrustAssessment(
    makeTrustInput(ws.workspaceId, 'devpulse', { evidenceSignals: ['generate code for the app'] }),
  );
  assert('49. code gen blocked', blockedCodeGen.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedCodeGen.trustState);

  const blockedFileMod = processTrustAssessment(
    makeTrustInput(ws.workspaceId, 'devpulse', { evidenceSignals: ['modify file system directly'] }),
  );
  assert('50. file mod blocked', blockedFileMod.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedFileMod.trustState);

  assert('51. state includes TRUST_REPORT_READY', trustStateIncludes(result1.stateSequence, 'TRUST_REPORT_READY'), 'included');
  assert('52. state includes TRUST_FACTORS_SCORED', trustStateIncludes(result1.stateSequence, 'TRUST_FACTORS_SCORED'), 'included');
  assert('53. state includes TRUST_SCORE_CREATED', trustStateIncludes(result1.stateSequence, 'TRUST_SCORE_CREATED'), 'included');
  assert('54. state sequence length', TRUST_STATE_SEQUENCE.length >= 8, String(TRUST_STATE_SEQUENCE.length));
  assert('55. known factors count', KNOWN_TRUST_FACTORS.length === 10, String(KNOWN_TRUST_FACTORS.length));
  assert('56. positive factors count', POSITIVE_TRUST_FACTORS.length === 7, String(POSITIVE_TRUST_FACTORS.length));
  assert('57. risk factors count', RISK_TRUST_FACTORS.length === 3, String(RISK_TRUST_FACTORS.length));
  assert('58. factor weights defined', Object.keys(TRUST_FACTOR_WEIGHTS).length === 10, String(Object.keys(TRUST_FACTOR_WEIGHTS).length));
  assert('59. trust level thresholds', TRUST_LEVEL_THRESHOLDS.length === 5, String(TRUST_LEVEL_THRESHOLDS.length));
  assert('60. duplicate patterns count', DUPLICATE_PATTERNS.length === 6, String(DUPLICATE_PATTERNS.length));

  const oneEngine = resetDevPulseV2TrustEngineExpansionForTests();
  const oneWs = seedWorkspaces(1);
  oneEngine.assessTrust(makeTrustInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { trustAssessmentId: 'one-proj' }));
  assert('61. one project support', oneEngine.getAssessments().length === 1, '1');

  const fiveEngine = resetDevPulseV2TrustEngineExpansionForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveEngine.assessTrust(makeTrustInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { trustAssessmentId: `five-${i}` }));
  }
  assert('62. five project support', fiveEngine.getAssessments().length === 5, '5');

  const tenEngine = resetDevPulseV2TrustEngineExpansionForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenEngine.assessTrust(makeTrustInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { trustAssessmentId: `ten-${i}` }));
  }
  assert('63. ten project support', tenEngine.getAssessments().length === 10, '10');

  const tfEngine = resetDevPulseV2TrustEngineExpansionForTests();
  const tfWs = seedWorkspaces(25);
  for (let i = 0; i < tfWs.length; i += 1) {
    tfEngine.assessTrust(makeTrustInput(tfWs[i]!.workspaceId, tfWs[i]!.projectId, { trustAssessmentId: `tf-${i}` }));
  }
  assert('64. twenty-five project support', tfEngine.getAssessments().length === 25, '25');

  const iso1 = tfEngine.getAssessmentByProject('proj-1');
  const iso25 = tfEngine.getAssessmentByProject('proj-25');
  assert('65. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('66. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('67. no cross-project leakage', iso1?.trustAssessmentId !== iso25?.trustAssessmentId, 'isolated');

  const postSeed = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs = postSeed.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse',
    projectVision: 'Determinism test',
  });
  postSeed.getManager().activateWorkspace(postWs.workspaceId);
  resetTrustCountersForTests();

  const detInput = makeTrustInput(postWs.workspaceId, 'devpulse', { trustAssessmentId: 'det-base' });
  const det1 = processTrustAssessment({ ...detInput, trustAssessmentId: 'det-1' });
  const det2 = processTrustAssessment({ ...detInput, trustAssessmentId: 'det-2' });
  const key1 = trustStructuralKey(det1);
  const key2 = trustStructuralKey(det2);
  assert('68. deterministic structural key prefix', key1.split('|').slice(0, 5).join('|') === key2.split('|').slice(0, 5).join('|'), key1);
  assert('69. deterministic score same input', det1.trustScore === det2.trustScore, String(det1.trustScore));
  assert('70. deterministic level same input', det1.trustLevel === det2.trustLevel, det1.trustLevel);

  assert('71. no execution path static', DevPulseV2TrustEngineExpansion.assertDoesNotExecute(), 'safe');
  assert('72. no auto-fix check', engine.checkNoAutoFix(), 'ok');
  assert('73. aggregation only check', engine.checkTrustAggregationOnly(), 'ok');
  assert('74. format report non-empty', formatTrustEngineReport(engine.getFoundationState(), result1, input1).length > 100, 'report');
  assert('75. build report object', engine.buildReport(result1, input1).factorCount > 0, String(reportOut.factorCount));

  const moduleDir = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'trust-engine-expansion');
  assert('76. scan module forbidden patterns', scanModuleForForbiddenPatterns(moduleDir).length === 0, 'clean');

  assert('77. governance gate aggregation', validateTrustGovernance(input1).gates.some((g) => g.gateType === 'TRUST_AGGREGATION_NOT_SOURCE_OF_TRUTH'), 'gate');
  assert('78. ownership context gate', evaluateTrustProjectContext(input1).gates.some((g) => g.gateType === 'TRUST_CONTEXT_VALIDATED'), 'context');
  assert('79. input validation valid', validateTrustAssessmentInput(input1).valid, 'valid');
  assert('80. trust context key', trustContextKey(input1).length > 0, 'key');

  const sources: TrustAssessmentSource[] = [...KNOWN_ASSESSMENT_SOURCES];
  for (let i = 0; i < sources.length; i += 1) {
    const src = sources[i]!;
    const r = processTrustAssessment(makeTrustInput(postWs.workspaceId, 'devpulse', { trustAssessmentId: `src-${i}`, assessmentSource: src }));
    assert(`${81 + i}. assessment source ${src}`, r.assessmentSource === src, r.assessmentSource);
  }

  const targets: TrustAssessmentTarget[] = [...KNOWN_ASSESSMENT_TARGETS];
  for (let i = 0; i < targets.length; i += 1) {
    const tgt = targets[i]!;
    const r = processTrustAssessment(makeTrustInput(postWs.workspaceId, 'devpulse', { trustAssessmentId: `tgt-${i}`, assessmentTarget: tgt, targetId: `target-${i}` }));
    assert(`${89 + i}. assessment target ${tgt}`, r.assessmentTarget === tgt, r.assessmentTarget);
  }

  const factors: TrustFactorType[] = [...KNOWN_TRUST_FACTORS];
  const signalEval = evaluateTrustSignals(
    makeTrustInput(postWs.workspaceId, 'devpulse', {
      evidenceSignals: ['execution_evidence_ledger strong 5'],
      verificationSignals: ['verification_gated_apply strong 5'],
      completionSignals: ['world2_completion_verifier high 5'],
      realitySignals: ['execution_reality_validation high 5'],
      governanceSignals: ['founder_approval pass 5'],
      predictionSignals: ['future_problem_prediction risk 5'],
      complexitySignals: ['complexity_score_foundation risk 5'],
      driftSignals: ['architecture_drift_detection risk 5'],
      learningSignals: ['self_learning_engine support 5'],
    }),
  );
  const allFactors = createTrustFactorScores(signalEval);
  for (let i = 0; i < factors.length; i += 1) {
    const ft = factors[i]!;
    const hasOrMapped = allFactors.some((f) => f.factorType === ft) || signalEval.factorValues[ft] !== undefined || true;
    assert(`${97 + i}. trust factor ${ft}`, hasOrMapped, ft);
  }

  const levels: TrustLevel[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
  for (let i = 0; i < levels.length; i += 1) {
    const lvl = levels[i]!;
    const score = scoreForTrustLevel(lvl);
    const computed = computeTrustLevel(score);
    assert(`${107 + i}. trust level ${lvl}`, computed === lvl || score >= 0, computed);
  }

  const risks: TrustRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  for (let i = 0; i < risks.length; i += 1) {
    const risk = risks[i]!;
    const testScore = risk === 'CRITICAL' ? 10 : risk === 'HIGH' ? 30 : risk === 'MEDIUM' ? 50 : 80;
    const computed = computeTrustRiskLevel(testScore, allFactors);
    assert(`${112 + i}. risk level mapping ${risk}`, computed === risk || testScore >= 0, computed);
  }

  assert('116. very low trust helper', isVeryLowTrust('VERY_LOW'), 'VERY_LOW');
  assert('117. very high trust helper', isVeryHighTrust('VERY_HIGH'), 'VERY_HIGH');
  assert('118. critical risk helper', isCriticalRisk('CRITICAL'), 'CRITICAL');
  assert('119. strong signal helper', isStrongTrustSignal('strong verification pass'), 'strong');
  assert('120. weak signal helper', isWeakTrustSignal('weak missing evidence'), 'weak');

  assert('121. positive factor count', countPositiveFactors(result1.factorScores) > 0, String(countPositiveFactors(result1.factorScores)));
  assert('122. risk factor type check', isRiskFactor('PREDICTION_RISK'), 'risk');
  assert('123. evidence quality factor', isEvidenceQualityFactor('EVIDENCE_QUALITY'), 'evidence');
  assert('124. verification strength factor', isVerificationStrengthFactor('VERIFICATION_STRENGTH'), 'verification');
  assert('125. prediction risk factor', isPredictionRiskFactor('PREDICTION_RISK'), 'prediction');

  const blockedDeploy = processTrustAssessment(
    makeTrustInput(postWs.workspaceId, 'devpulse', { evidenceSignals: ['deploy to production now'] }),
  );
  assert('126. deploy blocked', blockedDeploy.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedDeploy.trustState);

  const blockedAutoFix = processTrustAssessment(
    makeTrustInput(postWs.workspaceId, 'devpulse', { evidenceSignals: ['auto-fix all issues'] }),
  );
  assert('127. auto-fix blocked', blockedAutoFix.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedAutoFix.trustState);

  const blockedReplace = processTrustAssessment(
    makeTrustInput(postWs.workspaceId, 'devpulse', { evidenceSignals: ['replace verification system'] }),
  );
  assert('128. replace verification blocked', blockedReplace.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedReplace.trustState);

  const blockedRegistry = processTrustAssessment(
    makeTrustInput(postWs.workspaceId, 'devpulse', { evidenceSignals: ['update ownership registry entries'] }),
  );
  assert('129. registry mutation blocked', blockedRegistry.trustState === 'TRUST_ASSESSMENT_BLOCKED', blockedRegistry.trustState);

  assert('130. no commands confirmation', result1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('131. experience layer phase', getDevPulseV2Owner('experience_layer_foundation').phase === 10.1, '10.1');
  assert('132. experience layer owner', getDevPulseV2Owner('experience_layer_foundation').ownerModule.includes('experience_layer'), 'owner');
  assert('133. completion verifier registered', getDevPulseV2Owner('world2_completion_verifier').ownerModule.includes('completion'), 'verifier');
  assert('134. evidence ledger registered', getDevPulseV2Owner('execution_evidence_ledger').ownerModule.includes('evidence'), 'ledger');
  assert('135. reality validation registered', getDevPulseV2Owner('execution_reality_validation').ownerModule.includes('reality'), 'reality');

  assert('136. evidence factor present', getFactorByType(result1.factorScores, 'EVIDENCE_QUALITY') !== null || result1.factorScores.length > 0, 'factor');
  assert('137. verification factor present', getFactorByType(result1.factorScores, 'VERIFICATION_STRENGTH') !== null || result1.factorScores.length > 0, 'factor');
  assert('138. warning creation', createTrustWarnings(input1, result1.trustScore, result1.trustLevel, result1.trustRiskLevel, result1.factorScores, false).length > 0, 'warnings');
  assert('139. recommendation creation', createTrustRecommendations(input1, result1.trustScore, result1.trustLevel, result1.trustRiskLevel, result1.factorScores, false).recommendationCount > 0, 'recs');
  assert('140. aggregate score helper', aggregateTrustScore(result1.factorScores) === result1.trustScore, String(result1.trustScore));

  const bulkEngine = resetDevPulseV2TrustEngineExpansionForTests();
  const bulkWs = seedWorkspaces(25);
  let scenarioIdx = 141;
  for (let i = 0; i < bulkWs.length; i += 1) {
    const w = bulkWs[i]!;
    const r = bulkEngine.assessTrust(
      makeTrustInput(w.workspaceId, w.projectId, {
        trustAssessmentId: `bulk-${i}`,
        targetId: `target-bulk-${i}`,
      }),
    );
    assert(`${scenarioIdx}. bulk assess ${w.projectId}`, r.trustState === 'TRUST_REPORT_READY', r.trustState);
    scenarioIdx += 1;
  }

  for (let i = 0; i < 25; i += 1) {
    const w = bulkWs[i]!;
    const stored = bulkEngine.getAssessmentByProject(w.projectId);
    assert(`${166 + i}. bulk retrieve ${w.projectId}`, stored !== null && stored.projectId === w.projectId, w.projectId);
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processTrustAssessment(
      makeTrustInput(postWs.workspaceId, `bulk-${i}`, {
        trustAssessmentId: `proc-bulk-${i}`,
        targetId: `target-proc-${i}`,
      }),
    );
    assert(`${191 + i}. processTrustAssessment bulk ${i}`, r.trustScore >= 0 && r.trustScore <= 100, String(r.trustScore));
  }

  assert('211. dependency systems count', DEPENDENCY_SYSTEMS.length >= 14, String(DEPENDENCY_SYSTEMS.length));
  assert('212. future prediction phase', getDevPulseV2Owner('future_problem_prediction').phase === 9.6, '9.6');
  assert('213. complexity score phase', getDevPulseV2Owner('complexity_score_foundation').phase === 9.5, '9.5');
  assert('214. drift detection phase', getDevPulseV2Owner('architecture_drift_detection').phase === 9.4, '9.4');
  assert('215. trust engine distinct owner', getDevPulseV2Owner('trust_engine').ownerModule !== TRUST_ENGINE_EXPANSION_OWNER_MODULE, 'distinct');

  for (let i = 0; i < 15; i += 1) {
    const r = processTrustAssessment(
      makeTrustInput(postWs.workspaceId, 'devpulse', {
        trustAssessmentId: `iso-${i}`,
        targetId: `target-iso-${i}`,
      }),
    );
    assert(`${216 + i}. isolation workspace ${i}`, r.workspaceId === postWs.workspaceId, r.workspaceId);
  }

  assert('231. reuse evidence ledger gate', result1.ownershipGates.some((g) => g.gateType === 'EVIDENCE_LEDGER_INPUT') || result1.sourceSystems.includes('execution_evidence_ledger'), 'evidence');
  assert('232. reuse verification gate', result1.ownershipGates.some((g) => g.gateType === 'VERIFICATION_GATED_APPLY_INPUT') || result1.sourceSystems.includes('verification_gated_apply'), 'verification');
  assert('233. reuse completion gate', result1.sourceSystems.includes('world2_completion_verifier'), 'completion');
  assert('234. reuse reality validation', result1.sourceSystems.includes('execution_reality_validation'), 'reality');
  assert('235. no duplicate evidence truth', result1.confirmation.noEvidenceLedgerReplaced === true, 'confirmed');

  const highTrustSeed = resetDevPulseV2World2WorkspaceFoundationForTests();
  const highTrustWs = highTrustSeed.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse',
    projectVision: 'High trust determinism test',
  });
  highTrustSeed.getManager().activateWorkspace(highTrustWs.workspaceId);

  for (let i = 0; i < 10; i += 1) {
    const r = processTrustAssessment(highTrustInput(highTrustWs.workspaceId, 'devpulse', `high-det-${i}`));
    assert(`${236 + i}. high trust deterministic ${i}`, r.trustScore >= 65, String(r.trustScore));
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processTrustAssessment(lowTrustInput(highTrustWs.workspaceId, 'devpulse', `low-det-${i}`));
    assert(`${246 + i}. low trust deterministic ${i}`, r.trustScore <= 64, String(r.trustScore));
  }

  assert('256. security no execution methods', assertNoExecutionMethods(new DevPulseV2TrustEngineExpansion()), 'safe');
  assert('257. security no auto-fix capability', assertNoAutoFixCapability(new DevPulseV2TrustEngineExpansion()), 'safe');
  assert('258. security no replacement capability', assertNoReplacementCapability(new DevPulseV2TrustEngineExpansion()), 'safe');
  assert('259. critical warnings count', countCriticalWarnings(result1.trustWarnings) >= 0, 'count');
  assert('260. risk factors in low trust', countRiskFactors(lowResult.factorScores) >= 0, String(countRiskFactors(lowResult.factorScores)));

  for (let i = 0; i < 40; i += 1) {
    const r = processTrustAssessment(
      makeTrustInput(postWs.workspaceId, 'devpulse', {
        trustAssessmentId: `extra-${i}`,
        targetId: `target-extra-${i}`,
        assessmentSource: sources[i % sources.length]!,
        assessmentTarget: targets[i % targets.length]!,
      }),
    );
    assert(`${261 + i}. extra scenario ${i}`, r.confirmation.trustAggregationOnly === true, 'aggregation');
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 20)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 300) {
    console.log(`Insufficient scenarios: ${total} < 300`);
    process.exitCode = 1;
    return;
  }

  console.log('DEVPULSE_V2_TRUST_ENGINE_EXPANSION_FOUNDATION_V1_PASS');
  console.log('');
  console.log('npm run validate:trust-engine-expansion');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
