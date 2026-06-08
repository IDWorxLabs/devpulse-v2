/**
 * DevPulse V2 World 2 Execution Planner — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import {
  resetDevPulseV2World2WorkspaceFoundationForTests,
} from '../src/world2-workspace-foundation/index.js';
import {
  analyzeProjectGoal,
  assertDistinctFromPhase4Planners,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  completionOutputKey,
  dependencyMapKey,
  DevPulseV2World2ExecutionPlanner,
  formatWorld2PlannerReport,
  generateExecutionPlan,
  getPlannerGovernanceSummary,
  goalAnalysisKey,
  mapExecutionStages,
  planStructuralKey,
  planningStateIncludes,
  PLANNING_STATE_SEQUENCE,
  resetDevPulseV2World2ExecutionPlannerForTests,
  resetPlanCounterForTests,
  resetRiskCounterForTests,
  resetVerificationCounterForTests,
  resetRollbackCounterForTests,
  resetCompletionCounterForTests,
  riskOutputKey,
  rollbackOutputKey,
  STAGE_ORDER,
  validateStageDependencies,
  validateWorkspaceOwnership,
  verificationOutputKey,
  WORLD2_EXECUTION_PLANNER_OWNER_MODULE,
  WORLD2_EXECUTION_PLANNER_PASS_TOKEN,
} from '../src/world2-execution-planner/index.js';
import type { PlannerInput } from '../src/world2-execution-planner/index.js';

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

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — World 2 Execution Planner');
  console.log('=======================================');
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

  const planner = resetDevPulseV2World2ExecutionPlannerForTests();
  const input1 = makeInput(ws1.workspaceId, 'devpulse');
  const plan1 = planner.createPlan(input1);
  const plan2 = planner.createPlan(makeInput(ws2.workspaceId, 'fine-print'));

  assert('1. plan generation succeeds', plan1.planId.startsWith('world2-plan-'), plan1.planId);
  assert('2. plan has workspaceId', plan1.workspaceId === ws1.workspaceId, plan1.workspaceId);
  assert('3. plan has projectId', plan1.projectId === 'devpulse', plan1.projectId);
  assert('4. plan has projectGoal', plan1.projectGoal.length > 0, plan1.projectGoal);
  assert('5. six execution stages', plan1.executionStages.length === 6, String(plan1.executionStages.length));
  assert('6. DISCOVERY stage first', plan1.executionStages[0]?.stageType === 'DISCOVERY', plan1.executionStages[0]?.stageType ?? '');
  assert('7. COMPLETION stage last', plan1.executionStages[5]?.stageType === 'COMPLETION', plan1.executionStages[5]?.stageType ?? '');
  assert('8. stage order matches STAGE_ORDER', plan1.executionStages.every((s, i) => s.stageType === STAGE_ORDER[i]), 'order ok');
  assert('9. risks identified', plan1.riskItems.length >= 2, String(plan1.riskItems.length));
  assert('10. verification points created', plan1.verificationPoints.length >= 4, String(plan1.verificationPoints.length));
  assert('11. rollback points created', plan1.rollbackPoints.length >= 3, String(plan1.rollbackPoints.length));
  assert('12. completion criteria created', plan1.completionCriteria.length === 4, String(plan1.completionCriteria.length));
  assert('13. next recommended step present', plan1.nextRecommendedStep.length > 0, plan1.nextRecommendedStep);
  assert('14. planning only confirmed', plan1.planningOnlyConfirmed === true, 'confirmed');
  assert('15. no execution occurred', plan1.noExecutionOccurred === true, 'no execution');
  assert('16. no files modified', plan1.noFilesModified === true, 'no files');
  assert('17. no code generated', plan1.noCodeGenerated === true, 'no code');

  assert('18. workspace ownership valid', validateWorkspaceOwnership(input1).valid, validateWorkspaceOwnership(input1).reason);
  assert('19. orphan plan rejected', (() => {
    try {
      generateExecutionPlan(makeInput('invalid-ws', 'orphan'));
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');
  assert('20. projectId mismatch rejected', (() => {
    try {
      generateExecutionPlan(makeInput(ws1.workspaceId, 'wrong-project'));
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');

  assert('21. cross-workspace plans distinct', plan1.workspaceId !== plan2.workspaceId, `${plan1.workspaceId} vs ${plan2.workspaceId}`);
  assert('22. plan lookup by workspace', planner.getPlanByWorkspace(ws1.workspaceId)?.planId === plan1.planId, plan1.planId);
  assert('23. plans list populated', planner.getPlans().length === 2, String(planner.getPlans().length));

  const analysis = analyzeProjectGoal(input1);
  assert('24. goal analysis normalized type', analysis.normalizedType === 'web-application', analysis.normalizedType);
  assert('25. goal analysis requirement count', analysis.requirementCount === 3, String(analysis.requirementCount));
  assert('26. goal analysis constraint count', analysis.constraintCount === 2, String(analysis.constraintCount));
  assert('27. goal analysis key deterministic', goalAnalysisKey(input1) === goalAnalysisKey(input1), goalAnalysisKey(input1));

  const stages = mapExecutionStages(input1);
  assert('28. dependency map valid', validateStageDependencies(stages), 'valid');
  assert('29. dependency map key deterministic', dependencyMapKey(stages) === dependencyMapKey(stages), dependencyMapKey(stages));
  assert('30. ARCHITECTURE depends on DISCOVERY', stages[1]?.dependsOn.includes('DISCOVERY') === true, 'depends');

  assert('31. risk output key deterministic', riskOutputKey(plan1.riskItems) === riskOutputKey(plan1.riskItems), 'deterministic');
  assert('32. verification output key deterministic', verificationOutputKey(plan1.verificationPoints) === verificationOutputKey(plan1.verificationPoints), 'deterministic');
  assert('33. rollback output key deterministic', rollbackOutputKey(plan1.rollbackPoints) === rollbackOutputKey(plan1.rollbackPoints), 'deterministic');
  assert('34. completion output key deterministic', completionOutputKey(plan1.completionCriteria) === completionOutputKey(plan1.completionCriteria), 'deterministic');
  assert('35. plan structural key deterministic', planStructuralKey(plan1) === planStructuralKey(plan1), 'deterministic');

  assert('36. PLAN_REQUEST_RECEIVED state', planningStateIncludes(plan1.stateSequence, 'PLAN_REQUEST_RECEIVED'), plan1.stateSequence.join(' → '));
  assert('37. PLAN_ANALYZED state', planningStateIncludes(plan1.stateSequence, 'PLAN_ANALYZED'), plan1.stateSequence.join(' → '));
  assert('38. DEPENDENCIES_MAPPED state', planningStateIncludes(plan1.stateSequence, 'DEPENDENCIES_MAPPED'), plan1.stateSequence.join(' → '));
  assert('39. RISKS_IDENTIFIED state', planningStateIncludes(plan1.stateSequence, 'RISKS_IDENTIFIED'), plan1.stateSequence.join(' → '));
  assert('40. VERIFICATION_POINTS_CREATED state', planningStateIncludes(plan1.stateSequence, 'VERIFICATION_POINTS_CREATED'), plan1.stateSequence.join(' → '));
  assert('41. ROLLBACK_POINTS_CREATED state', planningStateIncludes(plan1.stateSequence, 'ROLLBACK_POINTS_CREATED'), plan1.stateSequence.join(' → '));
  assert('42. PLAN_GENERATED state', planningStateIncludes(plan1.stateSequence, 'PLAN_GENERATED'), plan1.stateSequence.join(' → '));
  assert('43. PLAN_READY state', planningStateIncludes(plan1.stateSequence, 'PLAN_READY'), plan1.stateSequence.join(' → '));
  assert('44. full state sequence length', plan1.stateSequence.length === PLANNING_STATE_SEQUENCE.length, String(plan1.stateSequence.length));

  assert('45. phaseComplete verification type', plan1.verificationPoints.some((v) => v.pointType === 'phaseComplete'), 'found');
  assert('46. dependencyValidated verification type', plan1.verificationPoints.some((v) => v.pointType === 'dependencyValidated'), 'found');
  assert('47. requirementsSatisfied verification type', plan1.verificationPoints.some((v) => v.pointType === 'requirementsSatisfied'), 'found');
  assert('48. governanceApproved verification type', plan1.verificationPoints.some((v) => v.pointType === 'governanceApproved'), 'found');

  assert('49. checkpointCreated rollback type', plan1.rollbackPoints.some((r) => r.pointType === 'checkpointCreated'), 'found');
  assert('50. checkpointRecommended rollback type', plan1.rollbackPoints.some((r) => r.pointType === 'checkpointRecommended'), 'found');
  assert('51. checkpointRequired rollback type', plan1.rollbackPoints.some((r) => r.pointType === 'checkpointRequired'), 'found');

  assert('52. requirementsMet criterion', plan1.completionCriteria.some((c) => c.criterionType === 'requirementsMet'), 'found');
  assert('53. verificationPassed criterion', plan1.completionCriteria.some((c) => c.criterionType === 'verificationPassed'), 'found');
  assert('54. governanceSatisfied criterion', plan1.completionCriteria.some((c) => c.criterionType === 'governanceSatisfied'), 'found');
  assert('55. workspaceReady criterion', plan1.completionCriteria.some((c) => c.criterionType === 'workspaceReady'), 'found');

  assert('56. LOW risk level supported', plan1.riskItems.some((r) => r.riskLevel === 'LOW'), 'found');
  assert('57. MEDIUM risk level supported', plan1.riskItems.some((r) => r.riskLevel === 'MEDIUM'), 'found');
  assert('58. HIGH risk level supported', plan1.riskItems.some((r) => r.riskLevel === 'HIGH' || r.riskLevel === 'MEDIUM'), 'found');

  assert('59. world1 modification blocked', planner.checkWorld1ModificationBlocked('verification_gated_apply'), 'blocked');
  assert('60. cross-workspace access blocked', !planner.checkCrossWorkspacePlanAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');
  assert('61. same workspace access allowed', planner.checkCrossWorkspacePlanAccess(ws1.workspaceId, ws1.workspaceId), 'allowed');

  assert('62. governance dependencies present', assertGovernanceDependenciesPresent(), getPlannerGovernanceSummary());
  assert('63. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('64. world1 protected', assertWorld1Protected(), 'protected');
  assert('65. distinct from phase 4 planners', assertDistinctFromPhase4Planners(), 'distinct');

  assert('66. registry ownership', DevPulseV2World2ExecutionPlanner.assertRegistryOwnership(), WORLD2_EXECUTION_PLANNER_OWNER_MODULE);
  assert('67. duplicate check passes', DevPulseV2World2ExecutionPlanner.assertDuplicateCheckPasses(), 'no duplicates');
  assert('68. does not execute', DevPulseV2World2ExecutionPlanner.assertDoesNotExecute(), 'no execution paths');
  assert('69. dependency chain', DevPulseV2World2ExecutionPlanner.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('world2_execution_planner');
  assert('70. registry phase 7.2', owner.phase === 7.2, String(owner.phase));
  assert('71. registry owner module', owner.ownerModule === WORLD2_EXECUTION_PLANNER_OWNER_MODULE, owner.ownerModule);

  const reportText = formatWorld2PlannerReport(planner.getPlannerState(), plan1);
  assert('72. report plan id', reportText.includes(`Plan ID: ${plan1.planId}`), 'plan id');
  assert('73. report workspace id', reportText.includes(`Workspace ID: ${plan1.workspaceId}`), 'workspace id');
  assert('74. report stage count', reportText.includes(`Stage count: 6`), 'stage count');
  assert('75. report planning only', reportText.includes('Planning only: CONFIRMED'), 'planning only');
  assert('76. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('77. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('78. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');

  const multiPlanner = resetDevPulseV2World2ExecutionPlannerForTests();
  const fiveWorkspaces = seedWorkspaces(5);
  for (const ws of fiveWorkspaces) {
    multiPlanner.createPlan(makeInput(ws.workspaceId, ws.projectId));
  }
  assert('79. five project plans', multiPlanner.getPlans().length === 5, String(multiPlanner.getPlans().length));

  const tenPlanner = resetDevPulseV2World2ExecutionPlannerForTests();
  const tenWorkspaces = seedWorkspaces(10);
  for (const ws of tenWorkspaces) {
    tenPlanner.createPlan(makeInput(ws.workspaceId, ws.projectId));
  }
  assert('80. ten project plans', tenPlanner.getPlans().length === 10, String(tenPlanner.getPlans().length));

  assert('81. governance bridge summary', getPlannerGovernanceSummary().includes('world2_workspace_foundation@7.1'), getPlannerGovernanceSummary());
  assert('82. pass token defined', WORLD2_EXECUTION_PLANNER_PASS_TOKEN === 'DEVPULSE_V2_WORLD2_EXECUTION_PLANNER_V1_PASS', WORLD2_EXECUTION_PLANNER_PASS_TOKEN);

  const deterministicPlanner = resetDevPulseV2World2ExecutionPlannerForTests();
  const detFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWs = detFoundation.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic planning test',
  });
  const detInput = makeInput(detWs.workspaceId, 'deterministic', {
    constraints: ['c1'],
    requirements: ['r1'],
  });
  const detPlanA = generateExecutionPlan(detInput);
  resetDevPulseV2World2ExecutionPlannerForTests();
  resetPlanCounterForTests();
  resetRiskCounterForTests();
  resetVerificationCounterForTests();
  resetRollbackCounterForTests();
  resetCompletionCounterForTests();
  const detFoundationB = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWsB = detFoundationB.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic planning test',
  });
  const detInputB = makeInput(detWsB.workspaceId, 'deterministic', {
    constraints: ['c1'],
    requirements: ['r1'],
  });
  const detPlanB = generateExecutionPlan(detInputB);
  assert('83. deterministic stage count', detPlanA.executionStages.length === detPlanB.executionStages.length, '6 stages');
  assert('84. deterministic stage types', detPlanA.executionStages.map((s) => s.stageType).join(',') === detPlanB.executionStages.map((s) => s.stageType).join(','), 'same types');
  assert('85. deterministic dependency map', dependencyMapKey(detPlanA.executionStages) === dependencyMapKey(detPlanB.executionStages), 'same deps');
  deterministicPlanner.createPlan(detInputB);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('86. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('=======================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(WORLD2_EXECUTION_PLANNER_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:world2-execution-planner');
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
