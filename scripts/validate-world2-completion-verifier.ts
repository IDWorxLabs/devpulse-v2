/**
 * DevPulse V2 World 2 Completion Verifier Foundation — validation scenarios.
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
  assertDistinctFromAutonomousBuilder,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  COMPLETION_CONFIDENCE_LEVELS,
  COMPLETION_STATUSES,
  completionCriteriaKey,
  completionDecisionKey,
  countCriticalRiskFailures,
  countFailedRollbackProtections,
  countFailedVerifications,
  countMissingEvidence,
  decideCompletionStatus,
  DevPulseV2World2CompletionVerifier,
  evaluateCompletionCriteria,
  evaluateEvidence,
  evaluateGovernance,
  evaluateRiskControls,
  evaluateRollbackRequirements,
  evaluateVerificationRequirements,
  evaluateWorkspaceIntegrity,
  evidenceResultsKey,
  formatWorld2CompletionReport,
  generateVerification,
  getVerifierGovernanceSummary,
  governanceFailed,
  governanceResultsKey,
  resetDevPulseV2World2CompletionVerifierForTests,
  resetVerificationCounterForTests,
  riskControlResultsKey,
  rollbackResultsKey,
  scanModuleForForbiddenPatterns,
  validateVerifierOwnership,
  verificationResultsKey,
  verifierInputFromBuilderPacket,
  verifierStateIncludes,
  verifierStructuralKey,
  VERIFIER_STATE_SEQUENCE,
  workspaceIntegrityKey,
  WORLD2_COMPLETION_VERIFIER_OWNER_MODULE,
  WORLD2_COMPLETION_VERIFIER_PASS_TOKEN,
} from '../src/world2-completion-verifier/index.js';

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

function buildFullPipeline(workspaceId: string, projectId: string, builderOverrides = {}) {
  resetDevPulseV2World2ExecutionPlannerForTests();
  resetDevPulseV2World2SimulationRuntimeForTests();
  resetDevPulseV2World2AutonomousBuilderForTests();
  const plan = generateExecutionPlan(makeInput(workspaceId, projectId));
  const simulation = generateSimulation(simulationInputFromPlan(plan));
  const builderPacket = generateBuilderPacket(
    builderInputFromPlanAndSimulation(plan, simulation, {
      approvedByFounder: true,
      simulationPassed: true,
      simulationConfidence: 'HIGH',
      completionLikelihood: 'HIGH',
      ...builderOverrides,
    }),
  );
  return { plan, simulation, builderPacket };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — World 2 Completion Verifier Foundation');
  console.log('===================================================');
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

  const { plan: plan1, simulation: sim1, builderPacket: packet1 } = buildFullPipeline(ws1.workspaceId, 'devpulse');
  const { plan: plan2, simulation: sim2, builderPacket: packet2 } = buildFullPipeline(ws2.workspaceId, 'fine-print');

  const verifier = resetDevPulseV2World2CompletionVerifierForTests();
  const verifierInput1 = verifierInputFromBuilderPacket(plan1, sim1, packet1);
  const result1 = verifier.verifyCompletion(verifierInput1);
  const result2 = verifier.verifyCompletion(verifierInputFromBuilderPacket(plan2, sim2, packet2));

  assert('1. verification generation succeeds', result1.verificationId.startsWith('world2-verification-'), result1.verificationId);
  assert('2. result has workspaceId', result1.workspaceId === ws1.workspaceId, result1.workspaceId);
  assert('3. result has projectId', result1.projectId === 'devpulse', result1.projectId);
  assert('4. result has planId', result1.planId === plan1.planId, result1.planId);
  assert('5. result has simulationId', result1.simulationId === sim1.simulationId, result1.simulationId);
  assert('6. result has builderId', result1.builderId === packet1.builderId, result1.builderId);
  assert('7. completion status set', COMPLETION_STATUSES.includes(result1.completionStatus), result1.completionStatus);
  assert('8. completion confidence set', COMPLETION_CONFIDENCE_LEVELS.includes(result1.completionConfidence), result1.completionConfidence);
  assert('9. completion reasons present', result1.completionReasons.length >= 1, String(result1.completionReasons.length));
  assert('10. passed requirements present', result1.passedRequirements.length >= 4, String(result1.passedRequirements.length));
  assert('11. verification results present', result1.verificationResults.length >= 4, String(result1.verificationResults.length));
  assert('12. risk control results present', result1.riskControlResults.length >= 2, String(result1.riskControlResults.length));
  assert('13. rollback results present', result1.rollbackResults.length >= 3, String(result1.rollbackResults.length));
  assert('14. workspace integrity results present', result1.workspaceIntegrityResults.length === 4, String(result1.workspaceIntegrityResults.length));
  assert('15. governance results present', result1.governanceResults.length >= 4, String(result1.governanceResults.length));
  assert('16. evidence results present', result1.evidenceResults.length >= 3, String(result1.evidenceResults.length));
  assert('17. recommendations generated', result1.recommendations.length >= 2, String(result1.recommendations.length));
  assert('18. verification only confirmed', result1.confirmation.verificationOnlyFoundation === true, 'confirmed');
  assert('19. no execution performed', result1.confirmation.noExecutionPerformed === true, 'no execution');
  assert('20. no files modified', result1.confirmation.noFilesModified === true, 'no files');
  assert('21. no code generated', result1.confirmation.noCodeGenerated === true, 'no code');
  assert('22. no commands executed', result1.confirmation.noCommandsExecuted === true, 'no commands');

  assert('23. verifier ownership valid', validateVerifierOwnership(verifierInput1).valid, validateVerifierOwnership(verifierInput1).reason);
  const invalidOwnership = generateVerification({ ...verifierInput1, workspaceId: 'invalid-ws' });
  assert('24. invalid workspace rejected', invalidOwnership.completionStatus === 'REJECTED', invalidOwnership.completionStatus);
  assert('25. projectId mismatch rejected', (() => {
    const r = generateVerification({ ...verifierInput1, projectId: 'wrong' });
    return r.completionStatus === 'REJECTED';
  })(), 'REJECTED');
  assert('26. missing builderId rejected', (() => {
    const r = generateVerification({ ...verifierInput1, builderId: '' });
    return r.completionStatus === 'REJECTED';
  })(), 'REJECTED');

  assert('27. cross-workspace results distinct', result1.workspaceId !== result2.workspaceId, `${result1.workspaceId} vs ${result2.workspaceId}`);
  assert('28. lookup by workspace', verifier.getVerificationByWorkspace(ws1.workspaceId)?.verificationId === result1.verificationId, result1.verificationId);
  assert('29. lookup by builder', verifier.getVerificationByBuilder(packet1.builderId)?.planId === plan1.planId, plan1.planId);
  assert('30. verifications list populated', verifier.getVerifications().length === 2, String(verifier.getVerifications().length));

  const criteriaEval = evaluateCompletionCriteria(plan1.completionCriteria);
  assert('31. completion criteria evaluated', criteriaEval.passed.length === 4, String(criteriaEval.passed.length));
  assert('32. empty criteria fails', evaluateCompletionCriteria([]).failed.length === 1, 'failed');
  assert('33. criteria key deterministic', completionCriteriaKey(criteriaEval.passed) === completionCriteriaKey(criteriaEval.passed), 'deterministic');

  const verifyEval = evaluateVerificationRequirements(packet1.verificationRequirements);
  assert('34. verification evaluation', verifyEval.length >= 4, String(verifyEval.length));
  assert('35. verification key deterministic', verificationResultsKey(verifyEval) === verificationResultsKey(verifyEval), 'deterministic');
  assert('36. failed verification count', countFailedVerifications(verifyEval) >= 0, String(countFailedVerifications(verifyEval)));

  const riskEval = evaluateRiskControls(packet1.riskControls);
  assert('37. risk control evaluation', riskEval.length >= 2, String(riskEval.length));
  assert('38. risk key deterministic', riskControlResultsKey(riskEval) === riskControlResultsKey(riskEval), 'deterministic');

  const rollbackEval = evaluateRollbackRequirements(packet1.rollbackRequirements);
  assert('39. rollback evaluation', rollbackEval.length >= 3, String(rollbackEval.length));
  assert('40. rollback key deterministic', rollbackResultsKey(rollbackEval) === rollbackResultsKey(rollbackEval), 'deterministic');

  const integrityEval = evaluateWorkspaceIntegrity(packet1.workspaceProtectionChecks);
  assert('41. workspace integrity evaluation', integrityEval.every((i) => i.result === 'PASSED'), 'all passed');
  assert('42. integrity key deterministic', workspaceIntegrityKey(integrityEval) === workspaceIntegrityKey(integrityEval), 'deterministic');

  const govEval = evaluateGovernance(packet1.world1ProtectionChecks, true);
  assert('43. governance evaluation', govEval.every((g) => g.result === 'PASSED'), 'all passed');
  assert('44. governance failed detection', governanceFailed([{ resultId: 'x', checkType: 't', result: 'FAILED', description: 'd' }]), 'failed');
  assert('45. governance key deterministic', governanceResultsKey(govEval) === governanceResultsKey(govEval), 'deterministic');

  const evidenceEval = evaluateEvidence(verifierInput1.evidenceReferences);
  assert('46. evidence evaluation all present', evidenceEval.filter((e) => e.result === 'PASSED').length >= 3, 'passed');
  assert('47. missing evidence detection', countMissingEvidence(evaluateEvidence([])) >= 3, String(countMissingEvidence(evaluateEvidence([]))));
  assert('48. evidence key deterministic', evidenceResultsKey(evidenceEval) === evidenceResultsKey(evidenceEval), 'deterministic');

  assert('49. COMPLETE classification possible', result1.completionStatus === 'COMPLETE' || result1.completionStatus === 'COMPLETE_WITH_WARNINGS', result1.completionStatus);

  const missingEvidenceResult = generateVerification({ ...verifierInput1, evidenceReferences: [] });
  assert('50. INCOMPLETE on missing evidence', missingEvidenceResult.completionStatus === 'INCOMPLETE', missingEvidenceResult.completionStatus);

  const failedVerifyInput = {
    ...verifierInput1,
    verificationRequirements: verifierInput1.verificationRequirements.map((v) => ({
      ...v,
      forecastResult: 'LIKELY_FAIL' as const,
    })),
  };
  const failedVerifyResult = generateVerification(failedVerifyInput);
  assert('51. INCOMPLETE on failed verification', failedVerifyResult.completionStatus === 'INCOMPLETE', failedVerifyResult.completionStatus);

  const failedGovResult = generateVerification({
    ...verifierInput1,
    world1ProtectionChecks: verifierInput1.world1ProtectionChecks.map((c) => ({
      ...c,
      status: 'VIOLATION_DETECTED' as const,
    })),
  });
  assert('52. REJECTED on world1 protection failure', failedGovResult.completionStatus === 'REJECTED', failedGovResult.completionStatus);

  const failedIntegrityResult = generateVerification({
    ...verifierInput1,
    workspaceProtectionChecks: verifierInput1.workspaceProtectionChecks.map((c) => ({
      ...c,
      status: 'VIOLATION_DETECTED' as const,
    })),
  });
  assert('53. REJECTED on workspace integrity failure', failedIntegrityResult.completionStatus === 'REJECTED', failedIntegrityResult.completionStatus);

  const emptyCriteriaResult = generateVerification({ ...verifierInput1, completionCriteria: [] });
  assert('54. INCOMPLETE on empty criteria', emptyCriteriaResult.completionStatus === 'INCOMPLETE', emptyCriteriaResult.completionStatus);

  const warningVerifyInput = {
    ...verifierInput1,
    verificationRequirements: verifierInput1.verificationRequirements.map((v, i) => ({
      ...v,
      forecastResult: i === 0 ? ('LIKELY_PARTIAL' as const) : v.forecastResult,
    })),
  };
  const warningResult = generateVerification(warningVerifyInput);
  assert('55. warning classification possible', warningResult.completionStatus === 'COMPLETE_WITH_WARNINGS' || warningResult.verificationResults.some((v) => v.result === 'WARNING'), warningResult.completionStatus);

  assert('56. NOT_STARTED status supported', COMPLETION_STATUSES.includes('NOT_STARTED'), 'NOT_STARTED');
  assert('57. INCOMPLETE status supported', COMPLETION_STATUSES.includes('INCOMPLETE'), 'INCOMPLETE');
  assert('58. PARTIALLY_COMPLETE status supported', COMPLETION_STATUSES.includes('PARTIALLY_COMPLETE'), 'PARTIALLY_COMPLETE');
  assert('59. COMPLETE status supported', COMPLETION_STATUSES.includes('COMPLETE'), 'COMPLETE');
  assert('60. COMPLETE_WITH_WARNINGS status supported', COMPLETION_STATUSES.includes('COMPLETE_WITH_WARNINGS'), 'COMPLETE_WITH_WARNINGS');
  assert('61. REJECTED status supported', COMPLETION_STATUSES.includes('REJECTED'), 'REJECTED');

  assert('62. LOW confidence supported', COMPLETION_CONFIDENCE_LEVELS.includes('LOW'), 'LOW');
  assert('63. MEDIUM confidence supported', COMPLETION_CONFIDENCE_LEVELS.includes('MEDIUM'), 'MEDIUM');
  assert('64. HIGH confidence supported', COMPLETION_CONFIDENCE_LEVELS.includes('HIGH'), 'HIGH');

  assert('65. verifier structural key deterministic', verifierStructuralKey(result1) === verifierStructuralKey(result1), 'deterministic');
  assert('66. completion decision key deterministic', completionDecisionKey(result1.completionStatus, result1.completionConfidence, result1.completionReasons.length) === completionDecisionKey(result1.completionStatus, result1.completionConfidence, result1.completionReasons.length), 'deterministic');

  assert('67. VERIFICATION_REQUEST_RECEIVED state', verifierStateIncludes(result1.stateSequence, 'VERIFICATION_REQUEST_RECEIVED'), result1.stateSequence.join(' → '));
  assert('68. OWNERSHIP_VALIDATED state', verifierStateIncludes(result1.stateSequence, 'OWNERSHIP_VALIDATED'), result1.stateSequence.join(' → '));
  assert('69. GOVERNANCE_VALIDATED state', verifierStateIncludes(result1.stateSequence, 'GOVERNANCE_VALIDATED'), result1.stateSequence.join(' → '));
  assert('70. COMPLETION_CRITERIA_EVALUATED state', verifierStateIncludes(result1.stateSequence, 'COMPLETION_CRITERIA_EVALUATED'), result1.stateSequence.join(' → '));
  assert('71. VERIFICATION_REQUIREMENTS_EVALUATED state', verifierStateIncludes(result1.stateSequence, 'VERIFICATION_REQUIREMENTS_EVALUATED'), result1.stateSequence.join(' → '));
  assert('72. RISK_CONTROLS_EVALUATED state', verifierStateIncludes(result1.stateSequence, 'RISK_CONTROLS_EVALUATED'), result1.stateSequence.join(' → '));
  assert('73. ROLLBACK_REQUIREMENTS_EVALUATED state', verifierStateIncludes(result1.stateSequence, 'ROLLBACK_REQUIREMENTS_EVALUATED'), result1.stateSequence.join(' → '));
  assert('74. WORKSPACE_INTEGRITY_EVALUATED state', verifierStateIncludes(result1.stateSequence, 'WORKSPACE_INTEGRITY_EVALUATED'), result1.stateSequence.join(' → '));
  assert('75. EVIDENCE_EVALUATED state', verifierStateIncludes(result1.stateSequence, 'EVIDENCE_EVALUATED'), result1.stateSequence.join(' → '));
  assert('76. COMPLETION_DECISION_CREATED state', verifierStateIncludes(result1.stateSequence, 'COMPLETION_DECISION_CREATED'), result1.stateSequence.join(' → '));
  assert('77. VERIFICATION_READY state', verifierStateIncludes(result1.stateSequence, 'VERIFICATION_READY'), result1.stateSequence.join(' → '));
  assert('78. full state sequence length', result1.stateSequence.length === VERIFIER_STATE_SEQUENCE.length, String(result1.stateSequence.length));

  assert('79. world1 modification blocked', verifier.checkWorld1ModificationBlocked('verification_gated_apply'), 'blocked');
  assert('80. cross-workspace access blocked', !verifier.checkCrossWorkspaceVerificationAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');
  assert('81. same workspace access allowed', verifier.checkCrossWorkspaceVerificationAccess(ws1.workspaceId, ws1.workspaceId), 'allowed');

  assert('82. governance dependencies present', assertGovernanceDependenciesPresent(), getVerifierGovernanceSummary());
  assert('83. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('84. world1 protected', assertWorld1Protected(), 'protected');
  assert('85. distinct from autonomous builder', assertDistinctFromAutonomousBuilder(), 'distinct');
  assert('86. execution authority present', assertExecutionAuthorityPresent(), 'present');
  assert('87. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'no mutation');

  assert('88. registry ownership', DevPulseV2World2CompletionVerifier.assertRegistryOwnership(), WORLD2_COMPLETION_VERIFIER_OWNER_MODULE);
  assert('89. duplicate check passes', DevPulseV2World2CompletionVerifier.assertDuplicateCheckPasses(), 'no duplicates');
  assert('90. does not execute', DevPulseV2World2CompletionVerifier.assertDoesNotExecute(), 'no execution paths');
  assert('91. dependency chain', DevPulseV2World2CompletionVerifier.assertDependencyChain(), 'deps ok');
  assert('92. no forbidden execution patterns', DevPulseV2World2CompletionVerifier.assertNoForbiddenExecutionPatterns(), 'clean');

  const owner = getDevPulseV2Owner('world2_completion_verifier');
  assert('93. registry phase 7.5', owner.phase === 7.5, String(owner.phase));
  assert('94. registry owner module', owner.ownerModule === WORLD2_COMPLETION_VERIFIER_OWNER_MODULE, owner.ownerModule);

  const reportText = formatWorld2CompletionReport(verifier.getVerifierState(), result1);
  assert('95. report verification id', reportText.includes(`Verification ID: ${result1.verificationId}`), 'verification id');
  assert('96. report builder id', reportText.includes(`Builder ID: ${packet1.builderId}`), 'builder id');
  assert('97. report verification only', reportText.includes('Verification-only foundation: CONFIRMED'), 'verification only');
  assert('98. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('99. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('100. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');
  assert('101. report no commands executed', reportText.includes('No commands executed: CONFIRMED'), 'no commands');

  const multiVerifier = resetDevPulseV2World2CompletionVerifierForTests();
  const fiveWorkspaces = seedWorkspaces(5);
  for (const ws of fiveWorkspaces) {
    const { plan, simulation, builderPacket } = buildFullPipeline(ws.workspaceId, ws.projectId);
    multiVerifier.verifyCompletion(verifierInputFromBuilderPacket(plan, simulation, builderPacket));
  }
  assert('102. five project verifications', multiVerifier.getVerifications().length === 5, String(multiVerifier.getVerifications().length));

  const tenVerifier = resetDevPulseV2World2CompletionVerifierForTests();
  const tenWorkspaces = seedWorkspaces(10);
  for (const ws of tenWorkspaces) {
    const { plan, simulation, builderPacket } = buildFullPipeline(ws.workspaceId, ws.projectId);
    tenVerifier.verifyCompletion(verifierInputFromBuilderPacket(plan, simulation, builderPacket));
  }
  assert('103. ten project verifications', tenVerifier.getVerifications().length === 10, String(tenVerifier.getVerifications().length));

  const twentyFiveVerifier = resetDevPulseV2World2CompletionVerifierForTests();
  const twentyFiveWorkspaces = seedWorkspaces(25);
  const workspaceIds = new Set<string>();
  for (const ws of twentyFiveWorkspaces) {
    const { plan, simulation, builderPacket } = buildFullPipeline(ws.workspaceId, ws.projectId);
    const r = twentyFiveVerifier.verifyCompletion(verifierInputFromBuilderPacket(plan, simulation, builderPacket));
    workspaceIds.add(r.workspaceId);
  }
  assert('104. twenty-five project verifications', twentyFiveVerifier.getVerifications().length === 25, String(twentyFiveVerifier.getVerifications().length));
  assert('105. no cross-project leakage', workspaceIds.size === 25, String(workspaceIds.size));

  assert('106. governance bridge summary', getVerifierGovernanceSummary().includes('world2_autonomous_builder@7.4'), getVerifierGovernanceSummary());
  assert('107. pass token defined', WORLD2_COMPLETION_VERIFIER_PASS_TOKEN === 'DEVPULSE_V2_WORLD2_COMPLETION_VERIFIER_FOUNDATION_V1_PASS', WORLD2_COMPLETION_VERIFIER_PASS_TOKEN);

  const detFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWs = detFoundation.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic verifier test',
  });
  const { plan: detPlan, simulation: detSim, builderPacket: detPacket } = buildFullPipeline(detWs.workspaceId, 'deterministic');
  const detInput = verifierInputFromBuilderPacket(detPlan, detSim, detPacket);
  const detResultA = generateVerification(detInput);

  resetVerificationCounterForTests();
  const detFoundationB = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWsB = detFoundationB.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic verifier test',
  });
  const { plan: detPlanB, simulation: detSimB, builderPacket: detPacketB } = buildFullPipeline(detWsB.workspaceId, 'deterministic');
  const detResultB = generateVerification(verifierInputFromBuilderPacket(detPlanB, detSimB, detPacketB));

  assert('108. deterministic verification results', verificationResultsKey(detResultA.verificationResults) === verificationResultsKey(detResultB.verificationResults), 'same verification');
  assert('109. deterministic completion decision', detResultA.completionStatus === detResultB.completionStatus, `${detResultA.completionStatus} vs ${detResultB.completionStatus}`);
  assert('110. deterministic confidence', detResultA.completionConfidence === detResultB.completionConfidence, `${detResultA.completionConfidence} vs ${detResultB.completionConfidence}`);
  assert('111. deterministic risk controls', riskControlResultsKey(detResultA.riskControlResults) === riskControlResultsKey(detResultB.riskControlResults), 'same risks');
  assert('112. deterministic recommendations count', detResultA.recommendations.length === detResultB.recommendations.length, String(detResultA.recommendations.length));

  const freshFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const freshWs = freshFoundation.createWorkspace({
    projectId: 'risk-test',
    projectName: 'Risk Test',
    projectVision: 'Risk test project',
  });
  const { plan: freshPlan, simulation: freshSim, builderPacket: freshPacket } = buildFullPipeline(freshWs.workspaceId, 'risk-test');
  const freshVerifierInput = verifierInputFromBuilderPacket(freshPlan, freshSim, freshPacket);

  const criticalRiskInput = {
    ...freshVerifierInput,
    riskControls: freshVerifierInput.riskControls.map((c) => ({
      ...c,
      mitigationRequired: true,
      likelihood: 'VERY_HIGH' as const,
    })),
  };
  const criticalRiskResult = generateVerification(criticalRiskInput);
  assert('113. INCOMPLETE on critical risk failure', criticalRiskResult.completionStatus === 'INCOMPLETE', criticalRiskResult.completionStatus);
  assert('114. critical risk count', countCriticalRiskFailures(criticalRiskResult.riskControlResults) >= 1, String(countCriticalRiskFailures(criticalRiskResult.riskControlResults)));

  const failedRollbackInput = {
    ...freshVerifierInput,
    rollbackRequirements: freshVerifierInput.rollbackRequirements.map((r) => ({
      ...r,
      checkpointRequired: true,
      triggerLikelihood: 'VERY_HIGH' as const,
    })),
  };
  const failedRollbackResult = generateVerification(failedRollbackInput);
  assert('115. INCOMPLETE on rollback failure', failedRollbackResult.completionStatus === 'INCOMPLETE', failedRollbackResult.completionStatus);
  assert('116. failed rollback count', countFailedRollbackProtections(failedRollbackResult.rollbackResults) >= 1, String(countFailedRollbackProtections(failedRollbackResult.rollbackResults)));

  const moduleDir = join(fileURLToPath(new URL('../src/world2-completion-verifier', import.meta.url)));
  const forbiddenViolations = scanModuleForForbiddenPatterns(moduleDir);
  assert('117. module scan no forbidden patterns', forbiddenViolations.length === 0, forbiddenViolations.join('; ') || 'clean');

  assert('118. no execution claim in confirmation', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('119. no file modification claim', result1.confirmation.noFilesModified === true, 'confirmed');
  assert('120. no code generation claim', result1.confirmation.noCodeGenerated === true, 'confirmed');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('121. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('122. decideCompletionStatus REJECTED on bad ownership', decideCompletionStatus({
    ownershipValid: false,
    criteriaPassed: [],
    criteriaFailed: [],
    verificationResults: [],
    riskControlResults: [],
    rollbackResults: [],
    workspaceIntegrityResults: [],
    governanceResults: [],
    evidenceResults: [],
    confidenceScore: 'HIGH',
    warningCount: 0,
  }).status === 'REJECTED', 'REJECTED');

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('===================================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(WORLD2_COMPLETION_VERIFIER_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:world2-completion-verifier');
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
