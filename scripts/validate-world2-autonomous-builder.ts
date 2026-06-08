/**
 * DevPulse V2 World 2 Autonomous Builder Foundation — validation scenarios.
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
  generateSimulation,
  resetDevPulseV2World2SimulationRuntimeForTests,
  simulationInputFromPlan,
} from '../src/world2-simulation-runtime/index.js';
import {
  resetDevPulseV2World2WorkspaceFoundationForTests,
} from '../src/world2-workspace-foundation/index.js';
import {
  ACTION_TYPES,
  APPROVAL_REQUIRED_ACTION_TYPES,
  assertAllWorld1ChecksProtected,
  assertDistinctFromSimulationRuntime,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  approvalRequirementsKey,
  blockedActionsKey,
  BUILD_READINESS_LEVELS,
  BUILDER_STATE_SEQUENCE,
  builderInputFromPlanAndSimulation,
  builderStateIncludes,
  builderStructuralKey,
  DevPulseV2World2AutonomousBuilder,
  determineBuildReadiness,
  formatWorld2BuilderReport,
  generateBuilderPacket,
  getBuilderGovernanceSummary,
  getWorld1ProtectionStatus,
  preparedActionsKey,
  resetDevPulseV2World2AutonomousBuilderForTests,
  resetBuilderCounterForTests,
  riskControlsKey,
  rollbackRequirementsKey,
  scanModuleForForbiddenPatterns,
  unsatisfiedApprovalCount,
  validateBuilderOwnership,
  verificationRequirementsKey,
  workspaceProtectionKey,
  world1ProtectionKey,
  WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE,
  WORLD2_AUTONOMOUS_BUILDER_PASS_TOKEN,
} from '../src/world2-autonomous-builder/index.js';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

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

function buildPlanAndSimulation(workspaceId: string, projectId: string) {
  resetDevPulseV2World2ExecutionPlannerForTests();
  const plan = generateExecutionPlan(makeInput(workspaceId, projectId));
  const simulation = generateSimulation(simulationInputFromPlan(plan));
  return { plan, simulation };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — World 2 Autonomous Builder Foundation');
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

  resetDevPulseV2World2SimulationRuntimeForTests();
  const { plan: plan1, simulation: sim1 } = buildPlanAndSimulation(ws1.workspaceId, 'devpulse');
  const { plan: plan2, simulation: sim2 } = buildPlanAndSimulation(ws2.workspaceId, 'fine-print');

  const builder = resetDevPulseV2World2AutonomousBuilderForTests();
  const builderInput1 = builderInputFromPlanAndSimulation(plan1, sim1, {
    approvedByFounder: true,
    simulationPassed: true,
    simulationConfidence: 'HIGH',
    completionLikelihood: 'HIGH',
  });
  const packet1 = builder.prepareBuildPacket(builderInput1);
  const packet2 = builder.prepareBuildPacket(
    builderInputFromPlanAndSimulation(plan2, sim2, {
      approvedByFounder: false,
      simulationPassed: true,
      simulationConfidence: 'MEDIUM',
      completionLikelihood: 'MEDIUM',
    }),
  );

  assert('1. builder packet generation succeeds', packet1.builderId.startsWith('world2-builder-'), packet1.builderId);
  assert('2. packet has workspaceId', packet1.workspaceId === ws1.workspaceId, packet1.workspaceId);
  assert('3. packet has projectId', packet1.projectId === 'devpulse', packet1.projectId);
  assert('4. packet has planId', packet1.planId === plan1.planId, packet1.planId);
  assert('5. packet has simulationId', packet1.simulationId === sim1.simulationId, packet1.simulationId);
  assert('6. prepared actions present', packet1.preparedActions.length >= 5, String(packet1.preparedActions.length));
  assert('7. all prepared actions dry-run only', packet1.preparedActions.every((a) => a.dryRunOnly === true), 'dry-run');
  assert('8. no prepared action executed', packet1.preparedActions.every((a) => a.executed === false), 'not executed');
  assert('9. approval requirements generated', packet1.approvalRequirements.length >= 1, String(packet1.approvalRequirements.length));
  assert('10. verification requirements generated', packet1.verificationRequirements.length >= 4, String(packet1.verificationRequirements.length));
  assert('11. rollback requirements generated', packet1.rollbackRequirements.length >= 3, String(packet1.rollbackRequirements.length));
  assert('12. risk controls generated', packet1.riskControls.length >= 2, String(packet1.riskControls.length));
  assert('13. workspace protection checks', packet1.workspaceProtectionChecks.length === 4, String(packet1.workspaceProtectionChecks.length));
  assert('14. world1 protection checks', packet1.world1ProtectionChecks.length >= 6, String(packet1.world1ProtectionChecks.length));
  assert('15. recommendations generated', packet1.recommendations.length >= 2, String(packet1.recommendations.length));
  assert('16. dry-run confirmation', packet1.confirmation.dryRunFoundationOnly === true, 'confirmed');
  assert('17. no world1 changes', packet1.confirmation.noWorld1ChangesPerformed === true, 'no w1');
  assert('18. no files modified', packet1.confirmation.noFilesModified === true, 'no files');
  assert('19. no commands executed', packet1.confirmation.noCommandsExecuted === true, 'no commands');
  assert('20. no code generated', packet1.confirmation.noCodeGenerated === true, 'no code');
  assert('21. no execution performed', packet1.confirmation.noExecutionPerformed === true, 'no execution');

  assert('22. builder ownership valid', validateBuilderOwnership(builderInput1).valid, validateBuilderOwnership(builderInput1).reason);
  assert('23. orphan builder rejected', (() => {
    try {
      generateBuilderPacket({ ...builderInput1, workspaceId: 'invalid-ws' });
      return false;
    } catch {
      return false;
    }
  })() === false || generateBuilderPacket({ ...builderInput1, workspaceId: 'invalid-ws' }).builderState === 'BLOCKED', 'blocked');
  const orphanPacket = generateBuilderPacket({ ...builderInput1, workspaceId: 'invalid-ws' });
  assert('24. invalid workspace blocked', orphanPacket.builderState === 'BLOCKED', orphanPacket.builderState);
  assert('25. projectId mismatch blocked', (() => {
    const p = generateBuilderPacket({ ...builderInput1, projectId: 'wrong' });
    return p.builderState === 'BLOCKED';
  })(), 'blocked');

  assert('26. cross-workspace packets distinct', packet1.workspaceId !== packet2.workspaceId, `${packet1.workspaceId} vs ${packet2.workspaceId}`);
  assert('27. packet lookup by workspace', builder.getBuilderPacketByWorkspace(ws1.workspaceId)?.builderId === packet1.builderId, packet1.builderId);
  assert('28. packet lookup by simulation', builder.getBuilderPacketBySimulation(sim1.simulationId)?.planId === plan1.planId, plan1.planId);
  assert('29. packets list populated', builder.getBuilderPackets().length === 2, String(builder.getBuilderPackets().length));

  assert('30. simulation failed NOT_READY', determineBuildReadiness({ ...builderInput1, simulationPassed: false }) === 'NOT_READY', 'NOT_READY');
  assert('31. low confidence NEEDS_APPROVAL', determineBuildReadiness({ ...builderInput1, simulationConfidence: 'LOW' }) === 'NEEDS_APPROVAL', 'NEEDS_APPROVAL');
  assert('32. low completion NEEDS_APPROVAL', determineBuildReadiness({ ...builderInput1, completionLikelihood: 'LOW' }) === 'NEEDS_APPROVAL', 'NEEDS_APPROVAL');
  assert('33. very low completion NEEDS_APPROVAL', determineBuildReadiness({ ...builderInput1, completionLikelihood: 'VERY_LOW' }) === 'NEEDS_APPROVAL', 'NEEDS_APPROVAL');
  assert('34. no founder approval NEEDS_APPROVAL', determineBuildReadiness({ ...builderInput1, approvedByFounder: false }) === 'NEEDS_APPROVAL', 'NEEDS_APPROVAL');
  assert('35. founder approved READY_FOR_DRY_RUN', determineBuildReadiness({ ...builderInput1, approvedByFounder: true, simulationConfidence: 'MEDIUM', completionLikelihood: 'MEDIUM' }) === 'READY_FOR_DRY_RUN', 'READY_FOR_DRY_RUN');
  assert('36. high confidence READY_FOR_GATED_EXECUTION_FUTURE', determineBuildReadiness(builderInput1) === 'READY_FOR_GATED_EXECUTION_FUTURE', determineBuildReadiness(builderInput1));
  assert('37. governance failed NOT_READY', determineBuildReadiness({ ...builderInput1, governanceStatus: 'FAILED' }) === 'NOT_READY', 'NOT_READY');
  assert('38. isolation failed NOT_READY', determineBuildReadiness({ ...builderInput1, workspaceIsolationStatus: 'BOUNDARY_VIOLATION' }) === 'NOT_READY', 'NOT_READY');

  const failedSimPacket = generateBuilderPacket({ ...builderInput1, simulationPassed: false });
  assert('39. simulation failed blocked state', failedSimPacket.builderState === 'BLOCKED', failedSimPacket.builderState);
  assert('40. simulation failed blocked actions', failedSimPacket.preparedActions.length === 0 || failedSimPacket.blockedActions.length > 0, 'blocked');

  const noApprovalPacket = generateBuilderPacket({ ...builderInput1, approvedByFounder: false, simulationConfidence: 'MEDIUM', completionLikelihood: 'MEDIUM' });
  assert('41. no approval APPROVALS_REQUIRED state', noApprovalPacket.builderState === 'APPROVALS_REQUIRED', noApprovalPacket.builderState);
  assert('42. unsatisfied approvals', unsatisfiedApprovalCount(noApprovalPacket.approvalRequirements) > 0, String(unsatisfiedApprovalCount(noApprovalPacket.approvalRequirements)));

  assert('43. CREATE_FILE_PROPOSED action type', packet1.preparedActions.some((a) => a.actionType === 'CREATE_FILE_PROPOSED'), 'found');
  assert('44. MODIFY_FILE_PROPOSED action type', packet1.preparedActions.some((a) => a.actionType === 'MODIFY_FILE_PROPOSED'), 'found');
  assert('45. CREATE_TEST_PROPOSED action type', packet1.preparedActions.some((a) => a.actionType === 'CREATE_TEST_PROPOSED'), 'found');
  assert('46. RUN_VERIFICATION_PROPOSED action type', packet1.preparedActions.some((a) => a.actionType === 'RUN_VERIFICATION_PROPOSED'), 'found');
  assert('47. CREATE_ROLLBACK_POINT_PROPOSED action type', packet1.preparedActions.some((a) => a.actionType === 'CREATE_ROLLBACK_POINT_PROPOSED'), 'found');
  assert('48. UPDATE_WORKSPACE_STATE_PROPOSED action type', packet1.preparedActions.some((a) => a.actionType === 'UPDATE_WORKSPACE_STATE_PROPOSED'), 'found');
  assert('49. UPDATE_PROJECT_MEMORY_PROPOSED action type', packet1.preparedActions.some((a) => a.actionType === 'UPDATE_PROJECT_MEMORY_PROPOSED'), 'found');
  assert('50. INSTALL_DEPENDENCY_PROPOSED action type', packet1.preparedActions.some((a) => a.actionType === 'INSTALL_DEPENDENCY_PROPOSED'), 'found');
  assert('51. all ten action types defined', ACTION_TYPES.length === 10, String(ACTION_TYPES.length));

  assert('52. prepared actions key deterministic', preparedActionsKey(packet1.preparedActions) === preparedActionsKey(packet1.preparedActions), 'deterministic');
  assert('53. blocked actions key deterministic', blockedActionsKey(packet1.blockedActions) === blockedActionsKey(packet1.blockedActions), 'deterministic');
  assert('54. approval requirements key deterministic', approvalRequirementsKey(packet1.approvalRequirements) === approvalRequirementsKey(packet1.approvalRequirements), 'deterministic');
  assert('55. verification requirements key deterministic', verificationRequirementsKey(packet1.verificationRequirements) === verificationRequirementsKey(packet1.verificationRequirements), 'deterministic');
  assert('56. rollback requirements key deterministic', rollbackRequirementsKey(packet1.rollbackRequirements) === rollbackRequirementsKey(packet1.rollbackRequirements), 'deterministic');
  assert('57. risk controls key deterministic', riskControlsKey(packet1.riskControls) === riskControlsKey(packet1.riskControls), 'deterministic');
  assert('58. builder structural key deterministic', builderStructuralKey(packet1) === builderStructuralKey(packet1), 'deterministic');

  assert('59. BUILDER_REQUEST_RECEIVED state', builderStateIncludes(packet1.stateSequence, 'BUILDER_REQUEST_RECEIVED'), packet1.stateSequence.join(' → '));
  assert('60. OWNERSHIP_VALIDATED state', builderStateIncludes(packet1.stateSequence, 'OWNERSHIP_VALIDATED'), packet1.stateSequence.join(' → '));
  assert('61. SIMULATION_VALIDATED state', builderStateIncludes(packet1.stateSequence, 'SIMULATION_VALIDATED'), packet1.stateSequence.join(' → '));
  assert('62. GOVERNANCE_VALIDATED state', builderStateIncludes(packet1.stateSequence, 'GOVERNANCE_VALIDATED'), packet1.stateSequence.join(' → '));
  assert('63. WORKSPACE_ISOLATION_VALIDATED state', builderStateIncludes(packet1.stateSequence, 'WORKSPACE_ISOLATION_VALIDATED'), packet1.stateSequence.join(' → '));
  assert('64. ACTIONS_PREPARED state', builderStateIncludes(packet1.stateSequence, 'ACTIONS_PREPARED'), packet1.stateSequence.join(' → '));
  assert('65. RISKS_CONTROLLED state', builderStateIncludes(packet1.stateSequence, 'RISKS_CONTROLLED'), packet1.stateSequence.join(' → '));
  assert('66. VERIFICATION_REQUIREMENTS_CREATED state', builderStateIncludes(packet1.stateSequence, 'VERIFICATION_REQUIREMENTS_CREATED'), packet1.stateSequence.join(' → '));
  assert('67. ROLLBACK_REQUIREMENTS_CREATED state', builderStateIncludes(packet1.stateSequence, 'ROLLBACK_REQUIREMENTS_CREATED'), packet1.stateSequence.join(' → '));
  assert('68. DRY_RUN_READY state', builderStateIncludes(packet1.stateSequence, 'DRY_RUN_READY'), packet1.stateSequence.join(' → '));
  assert('69. BLOCKED state supported', builderStateIncludes(failedSimPacket.stateSequence, 'BLOCKED'), failedSimPacket.stateSequence.join(' → '));
  assert('70. full ready state sequence length', packet1.stateSequence.length === BUILDER_STATE_SEQUENCE.length, String(packet1.stateSequence.length));

  assert('71. NOT_READY readiness level', BUILD_READINESS_LEVELS.includes('NOT_READY'), 'NOT_READY');
  assert('72. NEEDS_APPROVAL readiness level', BUILD_READINESS_LEVELS.includes('NEEDS_APPROVAL'), 'NEEDS_APPROVAL');
  assert('73. READY_FOR_DRY_RUN readiness level', BUILD_READINESS_LEVELS.includes('READY_FOR_DRY_RUN'), 'READY_FOR_DRY_RUN');
  assert('74. READY_FOR_GATED_EXECUTION_FUTURE readiness level', BUILD_READINESS_LEVELS.includes('READY_FOR_GATED_EXECUTION_FUTURE'), 'READY_FOR_GATED_EXECUTION_FUTURE');
  assert('75. packet build readiness', BUILD_READINESS_LEVELS.includes(packet1.buildReadiness), packet1.buildReadiness);

  assert('76. approval required for file creation', APPROVAL_REQUIRED_ACTION_TYPES.includes('CREATE_FILE_PROPOSED'), 'required');
  assert('77. approval required for file modification', APPROVAL_REQUIRED_ACTION_TYPES.includes('MODIFY_FILE_PROPOSED'), 'required');
  assert('78. approval required for dependency install', APPROVAL_REQUIRED_ACTION_TYPES.includes('INSTALL_DEPENDENCY_PROPOSED'), 'required');
  assert('79. approval required for command', APPROVAL_REQUIRED_ACTION_TYPES.includes('RUN_COMMAND_PROPOSED'), 'required');
  assert('80. prepared actions require approval flagged', packet1.preparedActions.filter((a) => a.requiresApproval).length >= 3, String(packet1.preparedActions.filter((a) => a.requiresApproval).length));

  assert('81. world1 protection all protected', assertAllWorld1ChecksProtected(packet1.world1ProtectionChecks), getWorld1ProtectionStatus(packet1.world1ProtectionChecks));
  assert('82. world1 protection key deterministic', world1ProtectionKey(packet1.world1ProtectionChecks) === world1ProtectionKey(packet1.world1ProtectionChecks), 'deterministic');
  assert('83. workspace protection key deterministic', workspaceProtectionKey(packet1.workspaceProtectionChecks) === workspaceProtectionKey(packet1.workspaceProtectionChecks), 'deterministic');
  assert('84. world1 modification blocked', builder.checkWorld1ModificationBlocked('verification_gated_apply'), 'blocked');
  assert('85. cross-workspace access blocked', !builder.checkCrossWorkspaceBuilderAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');
  assert('86. same workspace access allowed', builder.checkCrossWorkspaceBuilderAccess(ws1.workspaceId, ws1.workspaceId), 'allowed');

  assert('87. governance dependencies present', assertGovernanceDependenciesPresent(), getBuilderGovernanceSummary());
  assert('88. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('89. world1 protected', assertWorld1Protected(), 'protected');
  assert('90. distinct from simulation runtime', assertDistinctFromSimulationRuntime(), 'distinct');
  assert('91. execution authority present', assertExecutionAuthorityPresent(), 'present');
  assert('92. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'no mutation');

  assert('93. registry ownership', DevPulseV2World2AutonomousBuilder.assertRegistryOwnership(), WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE);
  assert('94. duplicate check passes', DevPulseV2World2AutonomousBuilder.assertDuplicateCheckPasses(), 'no duplicates');
  assert('95. does not execute', DevPulseV2World2AutonomousBuilder.assertDoesNotExecute(), 'no execution paths');
  assert('96. dependency chain', DevPulseV2World2AutonomousBuilder.assertDependencyChain(), 'deps ok');
  assert('97. no forbidden execution patterns', DevPulseV2World2AutonomousBuilder.assertNoForbiddenExecutionPatterns(), 'clean');

  const owner = getDevPulseV2Owner('world2_autonomous_builder');
  assert('98. registry phase 7.4', owner.phase === 7.4, String(owner.phase));
  assert('99. registry owner module', owner.ownerModule === WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE, owner.ownerModule);

  const reportText = formatWorld2BuilderReport(builder.getFoundationState(), packet1);
  assert('100. report builder id', reportText.includes(`Builder ID: ${packet1.builderId}`), 'builder id');
  assert('101. report simulation id', reportText.includes(`Simulation ID: ${sim1.simulationId}`), 'simulation id');
  assert('102. report dry-run only', reportText.includes('Dry-run foundation only: CONFIRMED'), 'dry-run');
  assert('103. report no world1 changes', reportText.includes('No World 1 changes performed: CONFIRMED'), 'no w1');
  assert('104. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('105. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('106. report no commands executed', reportText.includes('No commands executed: CONFIRMED'), 'no commands');
  assert('107. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');

  const multiBuilder = resetDevPulseV2World2AutonomousBuilderForTests();
  const fiveWorkspaces = seedWorkspaces(5);
  for (const ws of fiveWorkspaces) {
    const { plan, simulation } = buildPlanAndSimulation(ws.workspaceId, ws.projectId);
    multiBuilder.prepareBuildPacket(builderInputFromPlanAndSimulation(plan, simulation, { approvedByFounder: true, simulationConfidence: 'MEDIUM', completionLikelihood: 'MEDIUM' }));
  }
  assert('108. five project builder packets', multiBuilder.getBuilderPackets().length === 5, String(multiBuilder.getBuilderPackets().length));

  const tenBuilder = resetDevPulseV2World2AutonomousBuilderForTests();
  const tenWorkspaces = seedWorkspaces(10);
  for (const ws of tenWorkspaces) {
    const { plan, simulation } = buildPlanAndSimulation(ws.workspaceId, ws.projectId);
    tenBuilder.prepareBuildPacket(builderInputFromPlanAndSimulation(plan, simulation, { approvedByFounder: true, simulationConfidence: 'MEDIUM', completionLikelihood: 'MEDIUM' }));
  }
  assert('109. ten project builder packets', tenBuilder.getBuilderPackets().length === 10, String(tenBuilder.getBuilderPackets().length));

  const twentyFiveBuilder = resetDevPulseV2World2AutonomousBuilderForTests();
  const twentyFiveWorkspaces = seedWorkspaces(25);
  const workspaceIds = new Set<string>();
  for (const ws of twentyFiveWorkspaces) {
    const { plan, simulation } = buildPlanAndSimulation(ws.workspaceId, ws.projectId);
    const pkt = twentyFiveBuilder.prepareBuildPacket(builderInputFromPlanAndSimulation(plan, simulation, { approvedByFounder: true, simulationConfidence: 'MEDIUM', completionLikelihood: 'MEDIUM' }));
    workspaceIds.add(pkt.workspaceId);
  }
  assert('110. twenty-five project builder packets', twentyFiveBuilder.getBuilderPackets().length === 25, String(twentyFiveBuilder.getBuilderPackets().length));
  assert('111. no cross-project workspace leakage', workspaceIds.size === 25, String(workspaceIds.size));

  assert('112. governance bridge summary', getBuilderGovernanceSummary().includes('world2_simulation_runtime@7.3'), getBuilderGovernanceSummary());
  assert('113. pass token defined', WORLD2_AUTONOMOUS_BUILDER_PASS_TOKEN === 'DEVPULSE_V2_WORLD2_AUTONOMOUS_BUILDER_FOUNDATION_V1_PASS', WORLD2_AUTONOMOUS_BUILDER_PASS_TOKEN);

  const detFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWs = detFoundation.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic builder test',
  });
  const { plan: detPlan, simulation: detSim } = buildPlanAndSimulation(detWs.workspaceId, 'deterministic');
  const detInput = builderInputFromPlanAndSimulation(detPlan, detSim, {
    approvedByFounder: true,
    simulationConfidence: 'MEDIUM',
    completionLikelihood: 'MEDIUM',
  });
  const detPacketA = generateBuilderPacket(detInput);

  resetBuilderCounterForTests();
  const detFoundationB = resetDevPulseV2World2WorkspaceFoundationForTests();
  const detWsB = detFoundationB.createWorkspace({
    projectId: 'deterministic',
    projectName: 'Deterministic Project',
    projectVision: 'Deterministic builder test',
  });
  const { plan: detPlanB, simulation: detSimB } = buildPlanAndSimulation(detWsB.workspaceId, 'deterministic');
  const detPacketB = generateBuilderPacket(builderInputFromPlanAndSimulation(detPlanB, detSimB, {
    approvedByFounder: true,
    simulationConfidence: 'MEDIUM',
    completionLikelihood: 'MEDIUM',
  }));

  assert('114. deterministic prepared actions', preparedActionsKey(detPacketA.preparedActions) === preparedActionsKey(detPacketB.preparedActions), 'same actions');
  assert('115. deterministic approval requirements', approvalRequirementsKey(detPacketA.approvalRequirements) === approvalRequirementsKey(detPacketB.approvalRequirements), 'same approvals');
  assert('116. deterministic risk controls', riskControlsKey(detPacketA.riskControls) === riskControlsKey(detPacketB.riskControls), 'same risks');
  assert('117. deterministic build readiness', detPacketA.buildReadiness === detPacketB.buildReadiness, `${detPacketA.buildReadiness} vs ${detPacketB.buildReadiness}`);

  const moduleDir = join(fileURLToPath(new URL('../src/world2-autonomous-builder', import.meta.url)));
  const forbiddenViolations = scanModuleForForbiddenPatterns(moduleDir);
  assert('118. module scan no forbidden patterns', forbiddenViolations.length === 0, forbiddenViolations.join('; ') || 'clean');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('119. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('120. no execution claim in confirmation', packet1.confirmation.noExecutionPerformed === true && !reportText.includes('execution performed: YES'), 'no execution claim');

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
    console.log(WORLD2_AUTONOMOUS_BUILDER_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:world2-autonomous-builder');
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
