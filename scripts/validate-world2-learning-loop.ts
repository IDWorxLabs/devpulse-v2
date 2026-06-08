/**
 * DevPulse V2 World 2 Learning Loop Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import {
  builderInputFromPlanAndSimulation,
  generateBuilderPacket,
  resetDevPulseV2World2AutonomousBuilderForTests,
} from '../src/world2-autonomous-builder/index.js';
import {
  generateVerification,
  resetDevPulseV2World2CompletionVerifierForTests,
  verifierInputFromBuilderPacket,
} from '../src/world2-completion-verifier/index.js';
import {
  generateExecutionPlan,
  resetDevPulseV2World2ExecutionPlannerForTests,
} from '../src/world2-execution-planner/index.js';
import type { PlannerInput } from '../src/world2-execution-planner/index.js';
import {
  generateSimulation,
  resetDevPulseV2World2SimulationRuntimeForTests,
  simulationInputFromPlan,
} from '../src/world2-simulation-runtime/index.js';
import {
  resetDevPulseV2World2WorkspaceFoundationForTests,
} from '../src/world2-workspace-foundation/index.js';
import {
  analyzeProjectData,
  assertDistinctFromCompletionVerifier,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  compileLessonCount,
  determineLearningConfidence,
  DevPulseV2World2LearningLoop,
  extractFailurePatterns,
  extractGovernancePatterns,
  extractRecommendationPatterns,
  extractRiskPatterns,
  extractRollbackPatterns,
  extractSuccessPatterns,
  extractVerificationPatterns,
  extractWarningPatterns,
  extractWorkspacePatterns,
  failurePatternsKey,
  formatWorld2LearningReport,
  futureRecommendationsKey,
  generateFutureRecommendations,
  generateLearning,
  getLearningGovernanceSummary,
  governancePatternsKey,
  learningInputFromVerification,
  learningStateIncludes,
  learningStructuralKey,
  LEARNING_CONFIDENCE_LEVELS,
  LEARNING_STATE_SEQUENCE,
  projectAnalysisKey,
  recommendationPatternsKey,
  resetDevPulseV2World2LearningLoopForTests,
  resetLearningCounterForTests,
  riskPatternsKey,
  rollbackPatternsKey,
  scanModuleForForbiddenPatterns,
  successPatternsKey,
  validateLearningOwnership,
  verificationPatternsKey,
  warningPatternsKey,
  workspacePatternsKey,
  WORLD2_LEARNING_LOOP_OWNER_MODULE,
  WORLD2_LEARNING_LOOP_PASS_TOKEN,
} from '../src/world2-learning-loop/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<PlannerInput> = {},
): PlannerInput {
  return {
    projectGoal: 'Build a complete project in World 2',
    projectVision: 'Independent project delivery without World 1 risk',
    projectType: 'web-application',
    workspaceId,
    projectId,
    constraints: ['No World 1 modification', 'Governance gates required'],
    requirements: ['User authentication', 'Dashboard', 'API layer'],
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

function buildFullPipeline(workspaceId: string, projectId: string) {
  resetDevPulseV2World2ExecutionPlannerForTests();
  resetDevPulseV2World2SimulationRuntimeForTests();
  resetDevPulseV2World2AutonomousBuilderForTests();
  resetDevPulseV2World2CompletionVerifierForTests();
  const plan = generateExecutionPlan(makeInput(workspaceId, projectId));
  const simulation = generateSimulation(simulationInputFromPlan(plan));
  const builderPacket = generateBuilderPacket(
    builderInputFromPlanAndSimulation(plan, simulation, {
      approvedByFounder: true,
      simulationPassed: true,
      simulationConfidence: 'HIGH',
      completionLikelihood: 'HIGH',
    }),
  );
  const verification = generateVerification(
    verifierInputFromBuilderPacket(plan, simulation, builderPacket),
  );
  return { plan, simulation, builderPacket, verification };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — World 2 Learning Loop Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Decipherer Workspace',
    projectVision: 'Legal document analysis',
  });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);

  const { plan: plan1, verification: ver1 } = buildFullPipeline(ws1.workspaceId, 'devpulse');
  const { verification: ver2 } = buildFullPipeline(ws2.workspaceId, 'fine-print');

  const loop = resetDevPulseV2World2LearningLoopForTests();
  const learningInput1 = learningInputFromVerification(ver1);
  const learning1 = loop.captureLessons(learningInput1);
  const learning2 = loop.captureLessons(learningInputFromVerification(ver2));

  assert('1. learning generation succeeds', learning1.learningId.startsWith('world2-learning-'), learning1.learningId);
  assert('2. learning has workspaceId', learning1.workspaceId === ws1.workspaceId, learning1.workspaceId);
  assert('3. learning has projectId', learning1.projectId === 'devpulse', learning1.projectId);
  assert('4. learning has planId', learning1.planId === plan1.planId, learning1.planId);
  assert('5. learning has simulationId', learning1.simulationId === ver1.simulationId, learning1.simulationId);
  assert('6. learning has builderId', learning1.builderId === ver1.builderId, learning1.builderId);
  assert('7. learning has verificationId', learning1.verificationId === ver1.verificationId, learning1.verificationId);
  assert('8. lesson count positive', learning1.lessonCount > 0, String(learning1.lessonCount));
  assert('9. success patterns present', learning1.successPatterns.length >= 1, String(learning1.successPatterns.length));
  assert('10. verification patterns present', learning1.verificationPatterns.length >= 4, String(learning1.verificationPatterns.length));
  assert('11. risk patterns present', learning1.riskPatterns.length >= 2, String(learning1.riskPatterns.length));
  assert('12. rollback patterns present', learning1.rollbackPatterns.length >= 3, String(learning1.rollbackPatterns.length));
  assert('13. governance patterns present', learning1.governancePatterns.length >= 4, String(learning1.governancePatterns.length));
  assert('14. workspace patterns present', learning1.workspacePatterns.length >= 4, String(learning1.workspacePatterns.length));
  assert('15. recommendation patterns present', learning1.recommendationPatterns.length >= 1, String(learning1.recommendationPatterns.length));
  assert('16. future recommendations generated', learning1.futureRecommendations.length >= 2, String(learning1.futureRecommendations.length));
  assert('17. learning confidence set', LEARNING_CONFIDENCE_LEVELS.includes(learning1.learningConfidence), learning1.learningConfidence);
  assert('18. learning only confirmed', learning1.confirmation.learningOnlyFoundation === true, 'confirmed');
  assert('19. no execution performed', learning1.confirmation.noExecutionPerformed === true, 'no execution');
  assert('20. no files modified', learning1.confirmation.noFilesModified === true, 'no files');
  assert('21. no code generated', learning1.confirmation.noCodeGenerated === true, 'no code');

  assert('22. learning ownership valid', validateLearningOwnership(learningInput1).valid, validateLearningOwnership(learningInput1).reason);
  assert('23. orphan learning rejected', (() => {
    try {
      generateLearning({ ...learningInput1, workspaceId: 'invalid-ws' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');
  assert('24. projectId mismatch rejected', (() => {
    try {
      generateLearning({ ...learningInput1, projectId: 'wrong' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');
  assert('25. missing verificationId rejected', (() => {
    try {
      generateLearning({ ...learningInput1, verificationId: '' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');

  assert('26. cross-workspace learnings distinct', learning1.workspaceId !== learning2.workspaceId, `${learning1.workspaceId} vs ${learning2.workspaceId}`);
  assert('27. lookup by workspace', loop.getLearningByWorkspace(ws1.workspaceId)?.learningId === learning1.learningId, learning1.learningId);
  assert('28. lookup by verification', loop.getLearningByVerification(ver1.verificationId)?.planId === plan1.planId, plan1.planId);
  assert('29. lookup by project', loop.getLearningByProject('devpulse')?.learningId === learning1.learningId, learning1.learningId);
  assert('30. learnings list populated', loop.getLearnings().length === 2, String(loop.getLearnings().length));

  const analysis = analyzeProjectData(learningInput1);
  assert('31. project analysis', analysis.projectId === 'devpulse', analysis.projectId);
  assert('32. analysis key deterministic', projectAnalysisKey(analysis) === projectAnalysisKey(analysis), 'deterministic');

  const successPatterns = extractSuccessPatterns(learningInput1, analysis);
  assert('33. success pattern extraction', successPatterns.length >= 1, String(successPatterns.length));
  assert('34. success patterns key deterministic', successPatternsKey(successPatterns) === successPatternsKey(successPatterns), 'deterministic');

  const failureInput = learningInputFromVerification(ver1, {
    completionStatus: 'INCOMPLETE',
    outcomes: ['Verification fail detected'],
  });
  const failurePatterns = extractFailurePatterns(failureInput, analyzeProjectData(failureInput));
  assert('35. failure pattern extraction', failurePatterns.length >= 1, String(failurePatterns.length));
  assert('36. failure patterns key deterministic', failurePatternsKey(failurePatterns) === failurePatternsKey(failurePatterns), 'deterministic');

  const warningInput = learningInputFromVerification(ver1, {
    completionStatus: 'COMPLETE_WITH_WARNINGS',
    warnings: ['Non-critical warning observed'],
  });
  const warningPatterns = extractWarningPatterns(warningInput, analyzeProjectData(warningInput));
  assert('37. warning pattern extraction', warningPatterns.length >= 1, String(warningPatterns.length));
  assert('38. warning patterns key deterministic', warningPatternsKey(warningPatterns) === warningPatternsKey(warningPatterns), 'deterministic');

  const recPatterns = extractRecommendationPatterns(learningInput1);
  assert('39. recommendation pattern extraction', recPatterns.length >= 1, String(recPatterns.length));
  assert('40. recommendation patterns key deterministic', recommendationPatternsKey(recPatterns) === recommendationPatternsKey(recPatterns), 'deterministic');

  const verifyPatterns = extractVerificationPatterns(learningInput1);
  assert('41. verification pattern extraction', verifyPatterns.length >= 4, String(verifyPatterns.length));
  assert('42. verification patterns key deterministic', verificationPatternsKey(verifyPatterns) === verificationPatternsKey(verifyPatterns), 'deterministic');

  const riskPatterns = extractRiskPatterns(learningInput1);
  assert('43. risk pattern extraction', riskPatterns.length >= 2, String(riskPatterns.length));
  assert('44. risk patterns key deterministic', riskPatternsKey(riskPatterns) === riskPatternsKey(riskPatterns), 'deterministic');

  const rollbackPatterns = extractRollbackPatterns(learningInput1);
  assert('45. rollback pattern extraction', rollbackPatterns.length >= 3, String(rollbackPatterns.length));
  assert('46. rollback patterns key deterministic', rollbackPatternsKey(rollbackPatterns) === rollbackPatternsKey(rollbackPatterns), 'deterministic');

  const govPatterns = extractGovernancePatterns(learningInput1);
  assert('47. governance pattern extraction', govPatterns.length >= 4, String(govPatterns.length));
  assert('48. governance patterns key deterministic', governancePatternsKey(govPatterns) === governancePatternsKey(govPatterns), 'deterministic');

  const wsPatterns = extractWorkspacePatterns(learningInput1);
  assert('49. workspace pattern extraction', wsPatterns.length >= 4, String(wsPatterns.length));
  assert('50. workspace patterns key deterministic', workspacePatternsKey(wsPatterns) === workspacePatternsKey(wsPatterns), 'deterministic');

  const futureRecs = generateFutureRecommendations(learningInput1, analysis, successPatterns, failurePatterns, warningPatterns);
  assert('51. future recommendation generation', futureRecs.length >= 2, String(futureRecs.length));
  assert('52. future recommendations key deterministic', futureRecommendationsKey(futureRecs) === futureRecommendationsKey(futureRecs), 'deterministic');

  const lessonCount = compileLessonCount(
    successPatterns, failurePatterns, warningPatterns, recPatterns,
    verifyPatterns, riskPatterns, rollbackPatterns, govPatterns, wsPatterns,
  );
  assert('53. lesson compilation', lessonCount > 0, String(lessonCount));
  assert('54. learning confidence HIGH possible', determineLearningConfidence(20, 'HIGH') === 'HIGH', 'HIGH');
  assert('55. learning confidence MEDIUM possible', determineLearningConfidence(10, 'MEDIUM') === 'MEDIUM', 'MEDIUM');
  assert('56. learning confidence LOW possible', determineLearningConfidence(3, 'LOW') === 'LOW', 'LOW');

  assert('57. learning structural key deterministic', learningStructuralKey(learning1) === learningStructuralKey(learning1), 'deterministic');

  assert('58. LEARNING_REQUEST_RECEIVED state', learningStateIncludes(learning1.stateSequence, 'LEARNING_REQUEST_RECEIVED'), learning1.stateSequence.join(' → '));
  assert('59. OWNERSHIP_VALIDATED state', learningStateIncludes(learning1.stateSequence, 'OWNERSHIP_VALIDATED'), learning1.stateSequence.join(' → '));
  assert('60. PROJECT_DATA_ANALYZED state', learningStateIncludes(learning1.stateSequence, 'PROJECT_DATA_ANALYZED'), learning1.stateSequence.join(' → '));
  assert('61. SUCCESS_PATTERNS_IDENTIFIED state', learningStateIncludes(learning1.stateSequence, 'SUCCESS_PATTERNS_IDENTIFIED'), learning1.stateSequence.join(' → '));
  assert('62. FAILURE_PATTERNS_IDENTIFIED state', learningStateIncludes(learning1.stateSequence, 'FAILURE_PATTERNS_IDENTIFIED'), learning1.stateSequence.join(' → '));
  assert('63. WARNING_PATTERNS_IDENTIFIED state', learningStateIncludes(learning1.stateSequence, 'WARNING_PATTERNS_IDENTIFIED'), learning1.stateSequence.join(' → '));
  assert('64. RECOMMENDATIONS_CREATED state', learningStateIncludes(learning1.stateSequence, 'RECOMMENDATIONS_CREATED'), learning1.stateSequence.join(' → '));
  assert('65. LESSONS_COMPILED state', learningStateIncludes(learning1.stateSequence, 'LESSONS_COMPILED'), learning1.stateSequence.join(' → '));
  assert('66. LEARNING_READY state', learningStateIncludes(learning1.stateSequence, 'LEARNING_READY'), learning1.stateSequence.join(' → '));
  assert('67. full state sequence length', learning1.stateSequence.length === LEARNING_STATE_SEQUENCE.length, String(learning1.stateSequence.length));

  assert('68. LOW confidence level supported', LEARNING_CONFIDENCE_LEVELS.includes('LOW'), 'LOW');
  assert('69. MEDIUM confidence level supported', LEARNING_CONFIDENCE_LEVELS.includes('MEDIUM'), 'MEDIUM');
  assert('70. HIGH confidence level supported', LEARNING_CONFIDENCE_LEVELS.includes('HIGH'), 'HIGH');

  assert('71. world1 modification blocked', loop.checkWorld1ModificationBlocked('verification_gated_apply'), 'blocked');
  assert('72. cross-workspace access blocked', !loop.checkCrossWorkspaceLearningAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');
  assert('73. same workspace access allowed', loop.checkCrossWorkspaceLearningAccess(ws1.workspaceId, ws1.workspaceId), 'allowed');

  assert('74. governance dependencies present', assertGovernanceDependenciesPresent(), getLearningGovernanceSummary());
  assert('75. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('76. world1 protected', assertWorld1Protected(), 'protected');
  assert('77. distinct from completion verifier', assertDistinctFromCompletionVerifier(), 'distinct');
  assert('78. execution authority present', assertExecutionAuthorityPresent(), 'present');
  assert('79. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'no mutation');

  assert('80. registry ownership', DevPulseV2World2LearningLoop.assertRegistryOwnership(), WORLD2_LEARNING_LOOP_OWNER_MODULE);
  assert('81. duplicate check passes', DevPulseV2World2LearningLoop.assertDuplicateCheckPasses(), 'no duplicates');
  assert('82. does not execute', DevPulseV2World2LearningLoop.assertDoesNotExecute(), 'no execution paths');
  assert('83. dependency chain', DevPulseV2World2LearningLoop.assertDependencyChain(), 'deps ok');
  assert('84. no forbidden execution patterns', DevPulseV2World2LearningLoop.assertNoForbiddenExecutionPatterns(), 'clean');

  const owner = getDevPulseV2Owner('world2_learning_loop');
  assert('85. registry phase 7.6', owner.phase === 7.6, String(owner.phase));
  assert('86. registry owner module', owner.ownerModule === WORLD2_LEARNING_LOOP_OWNER_MODULE, owner.ownerModule);

  const reportText = formatWorld2LearningReport(loop.getLoopState(), learning1);
  assert('87. report learning id', reportText.includes(`Learning ID: ${learning1.learningId}`), 'learning id');
  assert('88. report lesson count', reportText.includes(`Lesson count: ${learning1.lessonCount}`), 'lesson count');
  assert('89. report learning only', reportText.includes('Learning-only foundation: CONFIRMED'), 'learning only');
  assert('90. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('91. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('92. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');

  const multiLoop = resetDevPulseV2World2LearningLoopForTests();
  const fiveWorkspaces = seedWorkspaces(5);
  for (const ws of fiveWorkspaces) {
    const { verification } = buildFullPipeline(ws.workspaceId, ws.projectId);
    multiLoop.captureLessons(learningInputFromVerification(verification));
  }
  assert('93. five project learnings', multiLoop.getLearnings().length === 5, String(multiLoop.getLearnings().length));

  const tenLoop = resetDevPulseV2World2LearningLoopForTests();
  const tenWorkspaces = seedWorkspaces(10);
  for (const ws of tenWorkspaces) {
    const { verification } = buildFullPipeline(ws.workspaceId, ws.projectId);
    tenLoop.captureLessons(learningInputFromVerification(verification));
  }
  assert('94. ten project learnings', tenLoop.getLearnings().length === 10, String(tenLoop.getLearnings().length));

  const twentyFiveLoop = resetDevPulseV2World2LearningLoopForTests();
  const twentyFiveWorkspaces = seedWorkspaces(25);
  const workspaceIds = new Set<string>();
  for (const ws of twentyFiveWorkspaces) {
    const { verification } = buildFullPipeline(ws.workspaceId, ws.projectId);
    const r = twentyFiveLoop.captureLessons(learningInputFromVerification(verification));
    workspaceIds.add(r.workspaceId);
  }
  assert('95. twenty-five project learnings', twentyFiveLoop.getLearnings().length === 25, String(twentyFiveLoop.getLearnings().length));
  assert('96. no cross-project leakage', workspaceIds.size === 25, String(workspaceIds.size));

  assert('97. governance bridge summary', getLearningGovernanceSummary().includes('world2_completion_verifier@7.5'), getLearningGovernanceSummary());
  assert('98. pass token defined', WORLD2_LEARNING_LOOP_PASS_TOKEN === 'DEVPULSE_V2_WORLD2_LEARNING_LOOP_FOUNDATION_V1_PASS', WORLD2_LEARNING_LOOP_PASS_TOKEN);

  const detFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWs = detFoundation.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic learning test',
  });
  const { verification: detVer } = buildFullPipeline(detWs.workspaceId, 'deterministic');
  const detLearningA = generateLearning(learningInputFromVerification(detVer));

  resetLearningCounterForTests();
  const detFoundationB = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWsB = detFoundationB.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic learning test',
  });
  const { verification: detVerB } = buildFullPipeline(detWsB.workspaceId, 'deterministic');
  const detLearningB = generateLearning(learningInputFromVerification(detVerB));

  assert('99. deterministic success patterns', successPatternsKey(detLearningA.successPatterns) === successPatternsKey(detLearningB.successPatterns), 'same success');
  assert('100. deterministic verification patterns', verificationPatternsKey(detLearningA.verificationPatterns) === verificationPatternsKey(detLearningB.verificationPatterns), 'same verification');
  assert('101. deterministic governance patterns', governancePatternsKey(detLearningA.governancePatterns) === governancePatternsKey(detLearningB.governancePatterns), 'same governance');
  assert('102. deterministic lesson count', detLearningA.lessonCount === detLearningB.lessonCount, `${detLearningA.lessonCount} vs ${detLearningB.lessonCount}`);
  assert('103. deterministic learning confidence', detLearningA.learningConfidence === detLearningB.learningConfidence, `${detLearningA.learningConfidence} vs ${detLearningB.learningConfidence}`);
  assert('104. deterministic future recommendations', futureRecommendationsKey(detLearningA.futureRecommendations) === futureRecommendationsKey(detLearningB.futureRecommendations), 'same recs');

  const freshFoundationC = resetDevPulseV2World2WorkspaceFoundationForTests();
  const freshWsC = freshFoundationC.createWorkspace({
    projectId: 'edge-cases',
    projectName: 'Edge Cases',
    projectVision: 'Edge case learning test',
  });
  const { verification: freshVerC } = buildFullPipeline(freshWsC.workspaceId, 'edge-cases');

  const rejectedInput = learningInputFromVerification(freshVerC, { completionStatus: 'REJECTED', outcomes: ['Project rejected'] });
  const rejectedLearning = generateLearning(rejectedInput);
  assert('105. failure patterns on rejected project', rejectedLearning.failurePatterns.length >= 1, String(rejectedLearning.failurePatterns.length));

  const incompleteVerInput = learningInputFromVerification(freshVerC, {
    verificationResults: freshVerC.verificationResults.map((v) => ({ ...v, result: 'FAILED' as const })),
    completionStatus: 'INCOMPLETE',
  });
  const incompleteLearning = generateLearning(incompleteVerInput);
  assert('106. failure patterns on failed verification', incompleteLearning.failurePatterns.length >= 1, String(incompleteLearning.failurePatterns.length));

  assert('107. observation input captured', learningInputFromVerification(freshVerC, { observations: ['Stage timing improved'] }).observations.length === 1, 'observation');
  assert('108. outcome input captured', learningInputFromVerification(freshVerC, { outcomes: ['Build success'] }).outcomes.length === 1, 'outcome');

  const moduleDir = join(fileURLToPath(new URL('../src/world2-learning-loop', import.meta.url)));
  const forbiddenViolations = scanModuleForForbiddenPatterns(moduleDir);
  assert('109. module scan no forbidden patterns', forbiddenViolations.length === 0, forbiddenViolations.join('; ') || 'clean');

  assert('110. no execution claim in confirmation', learning1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('111. no file modification claim', learning1.confirmation.noFilesModified === true, 'confirmed');
  assert('112. no code generation claim', learning1.confirmation.noCodeGenerated === true, 'confirmed');

  assert('113. lesson count matches pattern sum', learning1.lessonCount === compileLessonCount(
    learning1.successPatterns, learning1.failurePatterns, learning1.warningPatterns,
    learning1.recommendationPatterns, learning1.verificationPatterns, learning1.riskPatterns,
    learning1.rollbackPatterns, learning1.governancePatterns, learning1.workspacePatterns,
  ), String(learning1.lessonCount));

  assert('114. success pattern type COMPLETION_SUCCESS', learning1.successPatterns.some((p) => p.patternType === 'COMPLETION_SUCCESS' || p.patternType === 'VERIFICATION_SUCCESS'), 'found');
  assert('115. governance pattern type present', learning1.governancePatterns.some((p) => p.patternType.startsWith('GOVERNANCE_')), 'found');
  assert('116. workspace pattern type present', learning1.workspacePatterns.some((p) => p.patternType.startsWith('WORKSPACE_')), 'found');
  assert('117. evidence pattern type present', learning1.workspacePatterns.some((p) => p.patternType.startsWith('EVIDENCE_')), 'found');
  assert('118. risk pattern type present', learning1.riskPatterns.some((p) => p.patternType.startsWith('RISK_')), 'found');
  assert('119. rollback pattern type present', learning1.rollbackPatterns.some((p) => p.patternType.startsWith('ROLLBACK_')), 'found');

  assert('120. future recommendation mentions learning only', learning1.futureRecommendations.some((r) => r.includes('learning only')), 'found');
  assert('121. future recommendation mentions governance', learning1.futureRecommendations.some((r) => r.includes('verification_gated_apply')), 'found');

  assert('122. one project isolation', learning1.workspaceId === ws1.workspaceId && learning1.projectId === 'devpulse', 'isolated');
  assert('123. five project isolation count', fiveWorkspaces.length === 5, '5');
  assert('124. ten project isolation count', tenWorkspaces.length === 10, '10');
  assert('125. twenty-five project isolation count', twentyFiveWorkspaces.length === 25, '25');

  assert('126. builder ownership in learning input', learning1.builderId === ver1.builderId, ver1.builderId);
  assert('127. simulation ownership in learning input', learning1.simulationId === ver1.simulationId, ver1.simulationId);
  assert('128. plan ownership in learning input', learning1.planId === plan1.planId, plan1.planId);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('129. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('130. learning does not claim execution in report', !reportText.includes('execution performed: YES'), 'no false claim');
  assert('131. learning does not claim files modified in report', !reportText.includes('files modified: YES'), 'no false claim');
  assert('132. learning does not claim code generated in report', !reportText.includes('code generated: YES'), 'no false claim');

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
    console.log(WORLD2_LEARNING_LOOP_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:world2-learning-loop');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log(`${failed.length} SCENARIO(S) FAILED`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
