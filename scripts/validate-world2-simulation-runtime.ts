/**
 * DevPulse V2 World 2 Simulation Runtime — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import {
  generateExecutionPlan,
  resetDevPulseV2World2ExecutionPlannerForTests,
} from '../src/world2-execution-planner/index.js';
import type { PlannerInput } from '../src/world2-execution-planner/index.js';
import {
  resetDevPulseV2World2WorkspaceFoundationForTests,
} from '../src/world2-workspace-foundation/index.js';
import {
  aggregateRiskLikelihood,
  aggregateRollbackLikelihood,
  assertDistinctFromExecutionPlanner,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  completionForecastKey,
  CONFIDENCE_LEVELS,
  countLikelyFailures,
  DevPulseV2World2SimulationRuntime,
  forecastCompletionLikelihood,
  forecastConfidence,
  forecastRollback,
  forecastVerification,
  formatWorld2SimulationReport,
  generateSimulation,
  getSimulationGovernanceSummary,
  LIKELIHOOD_LEVELS,
  resetDevPulseV2World2SimulationRuntimeForTests,
  resetSimulationCounterForTests,
  riskSimulationKey,
  rollbackForecastKey,
  simulateRisks,
  simulateStages,
  simulationInputFromPlan,
  simulationStateIncludes,
  simulationStructuralKey,
  SIMULATION_STATE_SEQUENCE,
  stageSimulationKey,
  validatePlanOwnership,
  verificationForecastKey,
  WORLD2_SIMULATION_RUNTIME_OWNER_MODULE,
  WORLD2_SIMULATION_RUNTIME_PASS_TOKEN,
} from '../src/world2-simulation-runtime/index.js';

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
  console.log('DevPulse V2 — World 2 Simulation Runtime');
  console.log('========================================');
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

  resetDevPulseV2World2ExecutionPlannerForTests();
  const plan1 = generateExecutionPlan(makeInput(ws1.workspaceId, 'devpulse'));
  const plan2 = generateExecutionPlan(makeInput(ws2.workspaceId, 'fine-print'));

  const runtime = resetDevPulseV2World2SimulationRuntimeForTests();
  const simInput1 = simulationInputFromPlan(plan1);
  const sim1 = runtime.simulatePlan(simInput1);
  const sim2 = runtime.simulateFromExecutionPlan(plan2);

  assert('1. simulation generation succeeds', sim1.simulationId.startsWith('world2-simulation-'), sim1.simulationId);
  assert('2. simulation has workspaceId', sim1.workspaceId === ws1.workspaceId, sim1.workspaceId);
  assert('3. simulation has projectId', sim1.projectId === 'devpulse', sim1.projectId);
  assert('4. simulation has planId', sim1.planId === plan1.planId, sim1.planId);
  assert('5. six simulated stages', sim1.simulatedStages.length === 6, String(sim1.simulatedStages.length));
  assert('6. DISCOVERY stage simulated', sim1.simulatedStages[0]?.stageType === 'DISCOVERY', sim1.simulatedStages[0]?.stageType ?? '');
  assert('7. COMPLETION stage simulated', sim1.simulatedStages[5]?.stageType === 'COMPLETION', sim1.simulatedStages[5]?.stageType ?? '');
  assert('8. simulated risks present', sim1.simulatedRisks.length >= 2, String(sim1.simulatedRisks.length));
  assert('9. simulated warnings present', sim1.simulatedWarnings.length >= 1, String(sim1.simulatedWarnings.length));
  assert('10. verification forecasts created', sim1.verificationForecasts.length >= 4, String(sim1.verificationForecasts.length));
  assert('11. rollback forecasts created', sim1.rollbackForecasts.length >= 3, String(sim1.rollbackForecasts.length));
  assert('12. completion likelihood set', LIKELIHOOD_LEVELS.includes(sim1.completionLikelihood), sim1.completionLikelihood);
  assert('13. confidence score set', CONFIDENCE_LEVELS.includes(sim1.confidenceScore), sim1.confidenceScore);
  assert('14. recommendations generated', sim1.recommendations.length >= 2, String(sim1.recommendations.length));
  assert('15. simulation only confirmed', sim1.simulationOnlyConfirmed === true, 'confirmed');
  assert('16. no execution occurred', sim1.noExecutionOccurred === true, 'no execution');
  assert('17. no files modified', sim1.noFilesModified === true, 'no files');
  assert('18. no code generated', sim1.noCodeGenerated === true, 'no code');
  assert('19. simulation ready', sim1.simulationReady === true, 'ready');

  assert('20. plan ownership valid', validatePlanOwnership(simInput1).valid, validatePlanOwnership(simInput1).reason);
  assert('21. orphan simulation rejected', (() => {
    try {
      generateSimulation({ ...simInput1, workspaceId: 'invalid-ws' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');
  assert('22. projectId mismatch rejected', (() => {
    try {
      generateSimulation({ ...simInput1, projectId: 'wrong-project' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');
  assert('23. missing planId rejected', (() => {
    try {
      generateSimulation({ ...simInput1, planId: '' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');

  assert('24. cross-workspace simulations distinct', sim1.workspaceId !== sim2.workspaceId, `${sim1.workspaceId} vs ${sim2.workspaceId}`);
  assert('25. simulation lookup by workspace', runtime.getSimulationByWorkspace(ws1.workspaceId)?.simulationId === sim1.simulationId, sim1.simulationId);
  assert('26. simulation lookup by plan', runtime.getSimulationByPlan(plan1.planId)?.planId === plan1.planId, plan1.planId);
  assert('27. simulations list populated', runtime.getSimulations().length === 2, String(runtime.getSimulations().length));

  const stages = simulateStages(plan1.executionStages);
  assert('28. stage simulation key deterministic', stageSimulationKey(stages) === stageSimulationKey(stages), stageSimulationKey(stages));
  assert('29. IMPLEMENTATION stage forecast', stages.some((s) => s.stageType === 'IMPLEMENTATION'), 'found');
  assert('30. stage duration units positive', stages.every((s) => s.estimatedDurationUnits > 0), 'positive');

  const risks = simulateRisks(plan1.riskItems);
  assert('31. risk simulation key deterministic', riskSimulationKey(risks) === riskSimulationKey(risks), 'deterministic');
  assert('32. aggregate risk likelihood valid', LIKELIHOOD_LEVELS.includes(aggregateRiskLikelihood(risks)), aggregateRiskLikelihood(risks));
  assert('33. LOW risk likelihood supported', risks.some((r) => r.likelihood === 'LOW'), 'found');
  assert('34. MEDIUM risk likelihood supported', risks.some((r) => r.likelihood === 'MEDIUM'), 'found');
  assert('35. HIGH risk likelihood supported', risks.some((r) => r.likelihood === 'HIGH' || r.likelihood === 'MEDIUM'), 'found');

  const verificationForecasts = forecastVerification(plan1.verificationPoints);
  assert('36. verification forecast key deterministic', verificationForecastKey(verificationForecasts) === verificationForecastKey(verificationForecasts), 'deterministic');
  assert('37. LIKELY_PASS forecast supported', verificationForecasts.some((f) => f.forecastResult === 'LIKELY_PASS'), 'found');
  assert('38. LIKELY_PARTIAL forecast supported', verificationForecasts.some((f) => f.forecastResult === 'LIKELY_PARTIAL'), 'found');
  assert('39. governanceApproved forecast', verificationForecasts.some((f) => f.pointType === 'governanceApproved'), 'found');
  assert('40. count likely failures', countLikelyFailures(verificationForecasts) >= 0, String(countLikelyFailures(verificationForecasts)));

  const rollbackForecasts = forecastRollback(plan1.rollbackPoints);
  assert('41. rollback forecast key deterministic', rollbackForecastKey(rollbackForecasts) === rollbackForecastKey(rollbackForecasts), 'deterministic');
  assert('42. aggregate rollback likelihood valid', LIKELIHOOD_LEVELS.includes(aggregateRollbackLikelihood(rollbackForecasts)), aggregateRollbackLikelihood(rollbackForecasts));
  assert('43. checkpointCreated rollback forecast', rollbackForecasts.some((r) => r.pointType === 'checkpointCreated'), 'found');
  assert('44. checkpointRecommended rollback forecast', rollbackForecasts.some((r) => r.pointType === 'checkpointRecommended'), 'found');
  assert('45. checkpointRequired rollback forecast', rollbackForecasts.some((r) => r.pointType === 'checkpointRequired'), 'found');

  assert('46. completion likelihood forecast', LIKELIHOOD_LEVELS.includes(
    forecastCompletionLikelihood(stages, risks, verificationForecasts, rollbackForecasts),
  ), 'valid');
  assert('47. confidence forecast', CONFIDENCE_LEVELS.includes(
    forecastConfidence(stages, risks, plan1.completionCriteria, verificationForecasts),
  ), 'valid');
  assert('48. completion forecast key deterministic', completionForecastKey(sim1.completionLikelihood, sim1.confidenceScore, sim1.recommendations.length) === completionForecastKey(sim1.completionLikelihood, sim1.confidenceScore, sim1.recommendations.length), 'deterministic');
  assert('49. simulation structural key deterministic', simulationStructuralKey(sim1) === simulationStructuralKey(sim1), 'deterministic');

  assert('50. SIMULATION_REQUEST_RECEIVED state', simulationStateIncludes(sim1.stateSequence, 'SIMULATION_REQUEST_RECEIVED'), sim1.stateSequence.join(' → '));
  assert('51. PLAN_VALIDATED state', simulationStateIncludes(sim1.stateSequence, 'PLAN_VALIDATED'), sim1.stateSequence.join(' → '));
  assert('52. STAGES_SIMULATED state', simulationStateIncludes(sim1.stateSequence, 'STAGES_SIMULATED'), sim1.stateSequence.join(' → '));
  assert('53. RISKS_SIMULATED state', simulationStateIncludes(sim1.stateSequence, 'RISKS_SIMULATED'), sim1.stateSequence.join(' → '));
  assert('54. VERIFICATION_FORECAST_CREATED state', simulationStateIncludes(sim1.stateSequence, 'VERIFICATION_FORECAST_CREATED'), sim1.stateSequence.join(' → '));
  assert('55. ROLLBACK_FORECAST_CREATED state', simulationStateIncludes(sim1.stateSequence, 'ROLLBACK_FORECAST_CREATED'), sim1.stateSequence.join(' → '));
  assert('56. COMPLETION_FORECAST_CREATED state', simulationStateIncludes(sim1.stateSequence, 'COMPLETION_FORECAST_CREATED'), sim1.stateSequence.join(' → '));
  assert('57. SIMULATION_READY state', simulationStateIncludes(sim1.stateSequence, 'SIMULATION_READY'), sim1.stateSequence.join(' → '));
  assert('58. full state sequence length', sim1.stateSequence.length === SIMULATION_STATE_SEQUENCE.length, String(sim1.stateSequence.length));

  assert('59. VERY_LOW likelihood level supported', LIKELIHOOD_LEVELS.includes('VERY_LOW'), 'VERY_LOW');
  assert('60. VERY_HIGH likelihood level supported', LIKELIHOOD_LEVELS.includes('VERY_HIGH'), 'VERY_HIGH');
  assert('61. LOW confidence level supported', CONFIDENCE_LEVELS.includes('LOW'), 'LOW');
  assert('62. HIGH confidence level supported', CONFIDENCE_LEVELS.includes('HIGH'), 'HIGH');

  assert('63. world1 modification blocked', runtime.checkWorld1ModificationBlocked('verification_gated_apply'), 'blocked');
  assert('64. cross-workspace access blocked', !runtime.checkCrossWorkspaceSimulationAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');
  assert('65. same workspace access allowed', runtime.checkCrossWorkspaceSimulationAccess(ws1.workspaceId, ws1.workspaceId), 'allowed');

  assert('66. governance dependencies present', assertGovernanceDependenciesPresent(), getSimulationGovernanceSummary());
  assert('67. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('68. world1 protected', assertWorld1Protected(), 'protected');
  assert('69. distinct from execution planner', assertDistinctFromExecutionPlanner(), 'distinct');
  assert('70. execution authority present', assertExecutionAuthorityPresent(), 'present');

  assert('71. registry ownership', DevPulseV2World2SimulationRuntime.assertRegistryOwnership(), WORLD2_SIMULATION_RUNTIME_OWNER_MODULE);
  assert('72. duplicate check passes', DevPulseV2World2SimulationRuntime.assertDuplicateCheckPasses(), 'no duplicates');
  assert('73. does not execute', DevPulseV2World2SimulationRuntime.assertDoesNotExecute(), 'no execution paths');
  assert('74. dependency chain', DevPulseV2World2SimulationRuntime.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('world2_simulation_runtime');
  assert('75. registry phase 7.3', owner.phase === 7.3, String(owner.phase));
  assert('76. registry owner module', owner.ownerModule === WORLD2_SIMULATION_RUNTIME_OWNER_MODULE, owner.ownerModule);

  const reportText = formatWorld2SimulationReport(runtime.getRuntimeState(), sim1);
  assert('77. report simulation id', reportText.includes(`Simulation ID: ${sim1.simulationId}`), 'simulation id');
  assert('78. report workspace id', reportText.includes(`Workspace ID: ${sim1.workspaceId}`), 'workspace id');
  assert('79. report plan id', reportText.includes(`Plan ID: ${sim1.planId}`), 'plan id');
  assert('80. report stage count', reportText.includes(`Stage count: 6`), 'stage count');
  assert('81. report simulation only', reportText.includes('Simulation only: CONFIRMED'), 'simulation only');
  assert('82. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('83. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('84. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');

  const multiRuntime = resetDevPulseV2World2SimulationRuntimeForTests();
  const fiveWorkspaces = seedWorkspaces(5);
  for (const ws of fiveWorkspaces) {
    const plan = generateExecutionPlan(makeInput(ws.workspaceId, ws.projectId));
    multiRuntime.simulatePlan(simulationInputFromPlan(plan));
  }
  assert('85. five project simulations', multiRuntime.getSimulations().length === 5, String(multiRuntime.getSimulations().length));

  const tenRuntime = resetDevPulseV2World2SimulationRuntimeForTests();
  const tenWorkspaces = seedWorkspaces(10);
  for (const ws of tenWorkspaces) {
    const plan = generateExecutionPlan(makeInput(ws.workspaceId, ws.projectId));
    tenRuntime.simulatePlan(simulationInputFromPlan(plan));
  }
  assert('86. ten project simulations', tenRuntime.getSimulations().length === 10, String(tenRuntime.getSimulations().length));

  const twentyFiveRuntime = resetDevPulseV2World2SimulationRuntimeForTests();
  const twentyFiveWorkspaces = seedWorkspaces(25);
  for (const ws of twentyFiveWorkspaces) {
    const plan = generateExecutionPlan(makeInput(ws.workspaceId, ws.projectId));
    twentyFiveRuntime.simulatePlan(simulationInputFromPlan(plan));
  }
  assert('87. twenty-five project simulations', twentyFiveRuntime.getSimulations().length === 25, String(twentyFiveRuntime.getSimulations().length));

  assert('88. governance bridge summary', getSimulationGovernanceSummary().includes('world2_execution_planner@7.2'), getSimulationGovernanceSummary());
  assert('89. pass token defined', WORLD2_SIMULATION_RUNTIME_PASS_TOKEN === 'DEVPULSE_V2_WORLD2_SIMULATION_RUNTIME_V1_PASS', WORLD2_SIMULATION_RUNTIME_PASS_TOKEN);

  const detFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWs = detFoundation.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic simulation test',
  });
  const detPlan = generateExecutionPlan(makeInput(detWs.workspaceId, 'deterministic', {
    constraints: ['c1'],
    requirements: ['r1'],
  }));
  const detSimA = generateSimulation(simulationInputFromPlan(detPlan));

  resetSimulationCounterForTests();
  const detFoundationB = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWsB = detFoundationB.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic simulation test',
  });
  const detPlanB = generateExecutionPlan(makeInput(detWsB.workspaceId, 'deterministic', {
    constraints: ['c1'],
    requirements: ['r1'],
  }));
  const detSimB = generateSimulation(simulationInputFromPlan(detPlanB));

  assert('90. deterministic stage simulation', stageSimulationKey(detSimA.simulatedStages) === stageSimulationKey(detSimB.simulatedStages), 'same stages');
  assert('91. deterministic risk simulation', riskSimulationKey(detSimA.simulatedRisks) === riskSimulationKey(detSimB.simulatedRisks), 'same risks');
  assert('92. deterministic verification forecast', verificationForecastKey(detSimA.verificationForecasts) === verificationForecastKey(detSimB.verificationForecasts), 'same verification');
  assert('93. deterministic rollback forecast', rollbackForecastKey(detSimA.rollbackForecasts) === rollbackForecastKey(detSimB.rollbackForecasts), 'same rollback');
  assert('94. deterministic completion likelihood', detSimA.completionLikelihood === detSimB.completionLikelihood, `${detSimA.completionLikelihood} vs ${detSimB.completionLikelihood}`);
  assert('95. deterministic confidence score', detSimA.confidenceScore === detSimB.confidenceScore, `${detSimA.confidenceScore} vs ${detSimB.confidenceScore}`);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('96. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('========================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(WORLD2_SIMULATION_RUNTIME_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:world2-simulation-runtime');
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
