/**
 * DevPulse V2 Phase 7.7 Controlled Execution Bridge Foundation — validation scenarios.
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
  generateLearning,
  learningInputFromVerification,
  resetDevPulseV2World2LearningLoopForTests,
} from '../src/world2-learning-loop/index.js';
import {
  resetDevPulseV2World2WorkspaceFoundationForTests,
} from '../src/world2-workspace-foundation/index.js';
import {
  approvalGatesKey,
  assertDistinctFromAutonomousBuilder,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  bridgeInputFromStack,
  bridgeStateIncludes,
  bridgeStructuralKey,
  BRIDGE_STATE_SEQUENCE,
  classifyBridge,
  classifyPreparedAction,
  classifyPreparedActions,
  CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE,
  CONTROLLED_EXECUTION_BRIDGE_PASS_TOKEN,
  determineExecutionReadiness,
  DevPulseV2ControlledExecutionBridge,
  EXECUTION_READINESS_LEVELS,
  formatControlledExecutionReport,
  generateApprovalGates,
  generateProtectionGates,
  generateRollbackGates,
  generateRiskGates,
  generateVerificationGates,
  getBridgeGovernanceSummary,
  isGlobalEligibilityMet,
  protectionGatesKey,
  resetDevPulseV2ControlledExecutionBridgeForTests,
  scanModuleForForbiddenPatterns,
  SPECIAL_APPROVAL_ACTION_TYPES,
  validateBridgeOwnership,
} from '../src/controlled-execution-bridge/index.js';
import type { BridgeInput } from '../src/controlled-execution-bridge/index.js';

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
  resetDevPulseV2World2LearningLoopForTests();
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
  const learning = generateLearning(learningInputFromVerification(verification));
  return { plan, simulation, builderPacket, verification, learning };
}

function eligibleBridgeInput(
  builder: ReturnType<typeof buildFullPipeline>['builderPacket'],
  verification: ReturnType<typeof buildFullPipeline>['verification'],
  learning: ReturnType<typeof buildFullPipeline>['learning'],
  overrides: Partial<BridgeInput> = {},
): BridgeInput {
  return bridgeInputFromStack(builder, verification, learning, {
    founderApproved: true,
    simulationPassed: true,
  }, overrides);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 7.7 Controlled Execution Bridge Foundation');
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

  const { plan: plan1, builderPacket: builder1, verification: ver1, learning: learn1 } =
    buildFullPipeline(ws1.workspaceId, 'devpulse');
  const { builderPacket: builder2, verification: ver2, learning: learn2 } =
    buildFullPipeline(ws2.workspaceId, 'fine-print');

  const bridge = resetDevPulseV2ControlledExecutionBridgeForTests();
  const input1 = eligibleBridgeInput(builder1, ver1, learn1);
  const bridge1 = bridge.classifyExecutionEligibility(input1);
  const bridge2 = bridge.classifyExecutionEligibility(
    eligibleBridgeInput(builder2, ver2, learn2),
  );

  assert('1. bridge generation succeeds', bridge1.bridgeId.startsWith('controlled-exec-bridge-'), bridge1.bridgeId);
  assert('2. bridge has workspaceId', bridge1.workspaceId === ws1.workspaceId, bridge1.workspaceId);
  assert('3. bridge has projectId', bridge1.projectId === 'devpulse', bridge1.projectId);
  assert('4. bridge has planId', bridge1.planId === plan1.planId, bridge1.planId);
  assert('5. bridge has simulationId', bridge1.simulationId === ver1.simulationId, bridge1.simulationId);
  assert('6. bridge has builderId', bridge1.builderId === ver1.builderId, bridge1.builderId);
  assert('7. bridge has verificationId', bridge1.verificationId === ver1.verificationId, ver1.verificationId);
  assert('8. bridge has learningId', bridge1.learningId === learn1.learningId, bridge1.learningId);
  assert('9. eligible requests present', bridge1.eligibleExecutionRequests.length >= 1, String(bridge1.eligibleExecutionRequests.length));
  assert('10. approval gates present', bridge1.approvalGates.length >= 1, String(bridge1.approvalGates.length));
  assert('11. verification gates present', bridge1.verificationGates.length >= 1, String(bridge1.verificationGates.length));
  assert('12. rollback gates present', bridge1.rollbackGates.length >= 1, String(bridge1.rollbackGates.length));
  assert('13. risk gates present', bridge1.riskGates.length >= 1, String(bridge1.riskGates.length));
  assert('14. protection gates present', bridge1.protectionGates.length >= 5, String(bridge1.protectionGates.length));
  assert('15. recommendations generated', bridge1.recommendations.length >= 1, String(bridge1.recommendations.length));
  assert('16. execution readiness set', EXECUTION_READINESS_LEVELS.includes(bridge1.executionReadiness), bridge1.executionReadiness);
  assert('17. classification only confirmed', bridge1.confirmation.bridgeClassificationOnly === true, 'confirmed');
  assert('18. no execution performed', bridge1.confirmation.noExecutionPerformed === true, 'no execution');
  assert('19. no commands executed', bridge1.confirmation.noCommandsExecuted === true, 'no commands');
  assert('20. no files modified', bridge1.confirmation.noFilesModified === true, 'no files');
  assert('21. no code generated', bridge1.confirmation.noCodeGenerated === true, 'no code');
  assert('22. no deployment performed', bridge1.confirmation.noDeploymentPerformed === true, 'no deployment');

  assert('23. bridge ownership valid', validateBridgeOwnership(input1).valid, validateBridgeOwnership(input1).reason);
  assert('24. orphan bridge rejected', (() => {
    try {
      classifyBridge({ ...input1, workspaceId: 'invalid-ws' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');
  assert('25. projectId mismatch rejected', (() => {
    try {
      classifyBridge({ ...input1, projectId: 'wrong' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');
  assert('26. missing learningId rejected', (() => {
    try {
      classifyBridge({ ...input1, learningId: '' });
      return false;
    } catch {
      return true;
    }
  })(), 'rejected');

  assert('27. cross-workspace bridges distinct', bridge1.workspaceId !== bridge2.workspaceId, `${bridge1.workspaceId} vs ${bridge2.workspaceId}`);
  assert('28. lookup by workspace', bridge.getBridgeByWorkspace(ws1.workspaceId)?.bridgeId === bridge1.bridgeId, bridge1.bridgeId);
  assert('29. lookup by project', bridge.getBridgeByProject('devpulse')?.bridgeId === bridge1.bridgeId, bridge1.bridgeId);
  assert('30. bridges list populated', bridge.getBridges().length === 2, String(bridge.getBridges().length));

  assert('31. global eligibility met on happy path', isGlobalEligibilityMet(input1), 'eligible');
  assert('32. readiness READY_FOR_GATED_EXECUTION', bridge1.executionReadiness === 'READY_FOR_GATED_EXECUTION', bridge1.executionReadiness);
  assert('33. bridge state BRIDGE_READY', bridge1.bridgeState === 'BRIDGE_READY', bridge1.bridgeState);
  assert('34. all requests executed false', bridge1.eligibleExecutionRequests.every((r) => r.executed === false), 'executed false');
  assert('35. all requests classificationOnly true', bridge1.eligibleExecutionRequests.every((r) => r.classificationOnly === true), 'classification only');

  const noFounderInput = eligibleBridgeInput(builder1, ver1, learn1, { founderApproved: false });
  const noFounderBridge = classifyBridge(noFounderInput);
  assert('36. founder approval required readiness', noFounderBridge.executionReadiness === 'NEEDS_FOUNDER_APPROVAL', noFounderBridge.executionReadiness);
  assert('37. founder approval blocks eligible requests', noFounderBridge.eligibleExecutionRequests.length === 0, String(noFounderBridge.eligibleExecutionRequests.length));
  assert('38. founder approval gate REQUIRED', noFounderBridge.approvalGates.some((g) => g.gateType === 'FOUNDER_APPROVAL' && g.status === 'REQUIRED'), 'required');

  const founderOkBridge = classifyBridge(eligibleBridgeInput(builder1, ver1, learn1, { founderApproved: true }));
  assert('39. founder approval accepted', founderOkBridge.approvalGates.some((g) => g.gateType === 'FOUNDER_APPROVAL' && g.status === 'OPEN'), 'open');

  const simFailInput = eligibleBridgeInput(builder1, ver1, learn1, { simulationPassed: false });
  const simFailBridge = classifyBridge(simFailInput);
  assert('40. simulation failed blocks execution', simFailBridge.eligibleExecutionRequests.length === 0, String(simFailBridge.eligibleExecutionRequests.length));
  assert('41. simulation failed readiness NOT_READY', simFailBridge.executionReadiness === 'NOT_READY', simFailBridge.executionReadiness);

  const incompleteInput = eligibleBridgeInput(builder1, ver1, learn1, { completionStatus: 'INCOMPLETE' });
  const incompleteBridge = classifyBridge(incompleteInput);
  assert('42. completion incomplete blocks execution', incompleteBridge.eligibleExecutionRequests.length === 0, String(incompleteBridge.eligibleExecutionRequests.length));
  assert('43. completion incomplete readiness NOT_READY', incompleteBridge.executionReadiness === 'NOT_READY', incompleteBridge.executionReadiness);

  const rejectedInput = eligibleBridgeInput(builder1, ver1, learn1, { completionStatus: 'REJECTED' });
  const rejectedBridge = classifyBridge(rejectedInput);
  assert('44. completion rejected blocks execution', rejectedBridge.eligibleExecutionRequests.length === 0, String(rejectedBridge.eligibleExecutionRequests.length));
  assert('45. completion rejected readiness BLOCKED', rejectedBridge.executionReadiness === 'BLOCKED', rejectedBridge.executionReadiness);

  const lowConfInput = eligibleBridgeInput(builder1, ver1, learn1, { completionConfidence: 'LOW' });
  const lowConfBridge = classifyBridge(lowConfInput);
  assert('46. low confidence blocks execution', lowConfBridge.eligibleExecutionRequests.length === 0, String(lowConfBridge.eligibleExecutionRequests.length));
  assert('47. low confidence readiness NOT_READY', lowConfBridge.executionReadiness === 'NOT_READY', lowConfBridge.executionReadiness);

  const wsIsoFailInput = eligibleBridgeInput(builder1, ver1, learn1, { workspaceIsolationStatus: 'FAIL' });
  const wsIsoFailBridge = classifyBridge(wsIsoFailInput);
  assert('48. workspace isolation failure blocks execution', wsIsoFailBridge.eligibleExecutionRequests.length === 0, String(wsIsoFailBridge.eligibleExecutionRequests.length));
  assert('49. workspace isolation failure readiness BLOCKED', wsIsoFailBridge.executionReadiness === 'BLOCKED', wsIsoFailBridge.executionReadiness);

  const w1FailInput = eligibleBridgeInput(builder1, ver1, learn1, { world1ProtectionStatus: 'FAIL' });
  const w1FailBridge = classifyBridge(w1FailInput);
  assert('50. World 1 protection failure blocks execution', w1FailBridge.eligibleExecutionRequests.length === 0, String(w1FailBridge.eligibleExecutionRequests.length));
  assert('51. World 1 protection failure readiness BLOCKED', w1FailBridge.executionReadiness === 'BLOCKED', w1FailBridge.executionReadiness);

  const govFailInput = eligibleBridgeInput(builder1, ver1, learn1, { governanceStatus: 'FAIL' });
  const govFailBridge = classifyBridge(govFailInput);
  assert('52. governance failure blocks execution', govFailBridge.eligibleExecutionRequests.length === 0, String(govFailBridge.eligibleExecutionRequests.length));
  assert('53. governance failure readiness BLOCKED', govFailBridge.executionReadiness === 'BLOCKED', govFailBridge.executionReadiness);

  const noVerifyInput = eligibleBridgeInput(builder1, ver1, learn1, { verificationRequirements: [] });
  const noVerifyBridge = classifyBridge(noVerifyInput);
  assert('54. missing verification requirements blocks eligibility', noVerifyBridge.eligibleExecutionRequests.length === 0, String(noVerifyBridge.eligibleExecutionRequests.length));
  assert('55. missing verification readiness NEEDS_VERIFICATION_GATE', noVerifyBridge.executionReadiness === 'NEEDS_VERIFICATION_GATE', noVerifyBridge.executionReadiness);

  const classified = classifyPreparedActions(input1);
  assert('56. eligible request classification', classified.eligible.length >= 1, String(classified.eligible.length));
  assert('57. blocked request classification includes builder blocked', classified.blocked.length >= builder1.blockedActions.length, String(classified.blocked.length));

  const deleteAction = {
    actionId: 'delete-test-001',
    actionType: 'DELETE_FILE_PROPOSED' as const,
    stageType: 'IMPLEMENTATION' as const,
    description: 'Delete temp file',
    targetPath: 'world2/devpulse/temp.txt',
    requiresApproval: true,
    dryRunOnly: true as const,
    executed: false as const,
  };
  const deleteNoSpecial = classifyBridge(eligibleBridgeInput(builder1, ver1, learn1, {
    preparedActions: [deleteAction],
  }));
  assert('58. delete action blocked without special approval', deleteNoSpecial.eligibleExecutionRequests.length === 0, 'blocked');
  assert('59. delete action in blocked list', deleteNoSpecial.blockedExecutionRequests.some((r) => r.actionType === 'DELETE_FILE_PROPOSED'), 'found');

  const deleteWithSpecial = classifyBridge(eligibleBridgeInput(builder1, ver1, learn1, {
    preparedActions: [deleteAction],
    specialApproval: true,
  }));
  assert('60. delete action eligible with special approval', deleteWithSpecial.eligibleExecutionRequests.some((r) => r.actionType === 'DELETE_FILE_PROPOSED'), 'eligible');
  assert('61. delete special approval satisfied flag', deleteWithSpecial.eligibleExecutionRequests.some((r) => r.specialApprovalSatisfied), 'satisfied');

  const commandAction = {
    actionId: 'cmd-test-001',
    actionType: 'RUN_COMMAND_PROPOSED' as const,
    stageType: 'VERIFICATION' as const,
    description: 'Run test command',
    targetPath: 'world2/devpulse',
    requiresApproval: true,
    dryRunOnly: true as const,
    executed: false as const,
  };
  const cmdNoSpecial = classifyBridge(eligibleBridgeInput(builder1, ver1, learn1, {
    preparedActions: [commandAction],
  }));
  assert('62. command action blocked without special approval', cmdNoSpecial.eligibleExecutionRequests.length === 0, 'blocked');

  const cmdWithSpecial = classifyBridge(eligibleBridgeInput(builder1, ver1, learn1, {
    preparedActions: [commandAction],
    specialApproval: true,
  }));
  assert('63. command action eligible with special approval', cmdWithSpecial.eligibleExecutionRequests.some((r) => r.actionType === 'RUN_COMMAND_PROPOSED'), 'eligible');

  assert('64. verification gate generation', generateVerificationGates(input1).length >= 1, String(generateVerificationGates(input1).length));
  assert('65. rollback gate generation', generateRollbackGates(input1).length >= 1, String(generateRollbackGates(input1).length));
  assert('66. risk gate generation', generateRiskGates(input1).length >= 1, String(generateRiskGates(input1).length));
  assert('67. approval gate generation', generateApprovalGates(input1).length >= 1, String(generateApprovalGates(input1).length));
  assert('68. protection gate generation', generateProtectionGates(input1).length === 5, String(generateProtectionGates(input1).length));

  const w1Action = classifyPreparedAction(input1, {
    ...builder1.preparedActions[0]!,
    targetPath: 'world1/src/forbidden.ts',
  }, 0, true);
  assert('69. no World 1 action eligibility', w1Action.eligibility === 'BLOCKED', w1Action.blockReason);
  const govAction = classifyPreparedAction(input1, {
    ...builder1.preparedActions[0]!,
    targetPath: 'governance/law_enforcement/rule.ts',
  }, 0, true);
  assert('70. no governance action eligibility', govAction.eligibility === 'BLOCKED', govAction.blockReason);

  assert('71. bridge structural key deterministic', bridgeStructuralKey(bridge1) === bridgeStructuralKey(bridge1), 'deterministic');
  assert('72. approval gates key deterministic', approvalGatesKey(bridge1.approvalGates) === approvalGatesKey(bridge1.approvalGates), 'deterministic');
  assert('73. protection gates key deterministic', protectionGatesKey(bridge1.protectionGates) === protectionGatesKey(bridge1.protectionGates), 'deterministic');
  assert('74. readiness deterministic', determineExecutionReadiness(input1, true) === determineExecutionReadiness(input1, true), 'deterministic');
  assert('75. blocked reasons deterministic', bridgeStructuralKey(classifyBridge(input1)) === bridgeStructuralKey(classifyBridge(input1)), 'deterministic');

  assert('76. BRIDGE_REQUEST_RECEIVED state', bridgeStateIncludes(bridge1.stateSequence, 'BRIDGE_REQUEST_RECEIVED'), bridge1.stateSequence.join(' → '));
  assert('77. OWNERSHIP_VALIDATED state', bridgeStateIncludes(bridge1.stateSequence, 'OWNERSHIP_VALIDATED'), bridge1.stateSequence.join(' → '));
  assert('78. BUILDER_PACKET_VALIDATED state', bridgeStateIncludes(bridge1.stateSequence, 'BUILDER_PACKET_VALIDATED'), bridge1.stateSequence.join(' → '));
  assert('79. COMPLETION_VERIFICATION_VALIDATED state', bridgeStateIncludes(bridge1.stateSequence, 'COMPLETION_VERIFICATION_VALIDATED'), bridge1.stateSequence.join(' → '));
  assert('80. LEARNING_CONTEXT_VALIDATED state', bridgeStateIncludes(bridge1.stateSequence, 'LEARNING_CONTEXT_VALIDATED'), bridge1.stateSequence.join(' → '));
  assert('81. FOUNDER_APPROVAL_VALIDATED state', bridgeStateIncludes(bridge1.stateSequence, 'FOUNDER_APPROVAL_VALIDATED'), bridge1.stateSequence.join(' → '));
  assert('82. GOVERNANCE_VALIDATED state', bridgeStateIncludes(bridge1.stateSequence, 'GOVERNANCE_VALIDATED'), bridge1.stateSequence.join(' → '));
  assert('83. PROTECTION_GATES_EVALUATED state', bridgeStateIncludes(bridge1.stateSequence, 'PROTECTION_GATES_EVALUATED'), bridge1.stateSequence.join(' → '));
  assert('84. EXECUTION_REQUESTS_CLASSIFIED state', bridgeStateIncludes(bridge1.stateSequence, 'EXECUTION_REQUESTS_CLASSIFIED'), bridge1.stateSequence.join(' → '));
  assert('85. BRIDGE_READY state', bridgeStateIncludes(bridge1.stateSequence, 'BRIDGE_READY'), bridge1.stateSequence.join(' → '));

  assert('86. NOT_READY readiness supported', EXECUTION_READINESS_LEVELS.includes('NOT_READY'), 'NOT_READY');
  assert('87. NEEDS_FOUNDER_APPROVAL supported', EXECUTION_READINESS_LEVELS.includes('NEEDS_FOUNDER_APPROVAL'), 'NEEDS_FOUNDER_APPROVAL');
  assert('88. NEEDS_VERIFICATION_GATE supported', EXECUTION_READINESS_LEVELS.includes('NEEDS_VERIFICATION_GATE'), 'NEEDS_VERIFICATION_GATE');
  assert('89. READY_FOR_GATED_EXECUTION supported', EXECUTION_READINESS_LEVELS.includes('READY_FOR_GATED_EXECUTION'), 'READY_FOR_GATED_EXECUTION');
  assert('90. BLOCKED readiness supported', EXECUTION_READINESS_LEVELS.includes('BLOCKED'), 'BLOCKED');

  assert('91. world1 modification blocked', bridge.checkWorld1ModificationBlocked('verification_gated_apply'), 'blocked');
  assert('92. cross-workspace access blocked', !bridge.checkCrossWorkspaceBridgeAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');
  assert('93. same workspace access allowed', bridge.checkCrossWorkspaceBridgeAccess(ws1.workspaceId, ws1.workspaceId), 'allowed');

  assert('94. governance dependencies present', assertGovernanceDependenciesPresent(), getBridgeGovernanceSummary());
  assert('95. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('96. world1 protected', assertWorld1Protected(), 'protected');
  assert('97. distinct from autonomous builder', assertDistinctFromAutonomousBuilder(), 'distinct');
  assert('98. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'no mutation');

  assert('99. registry ownership', DevPulseV2ControlledExecutionBridge.assertRegistryOwnership(), CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE);
  assert('100. duplicate check passes', DevPulseV2ControlledExecutionBridge.assertDuplicateCheckPasses(), 'no duplicates');
  assert('101. does not execute', DevPulseV2ControlledExecutionBridge.assertDoesNotExecute(), 'no execution paths');
  assert('102. dependency chain', DevPulseV2ControlledExecutionBridge.assertDependencyChain(), 'deps ok');
  assert('103. no forbidden execution patterns', DevPulseV2ControlledExecutionBridge.assertNoForbiddenExecutionPatterns(), 'clean');

  const owner = getDevPulseV2Owner('controlled_execution_bridge');
  assert('104. registry phase 7.7', owner.phase === 7.7, String(owner.phase));
  assert('105. registry owner module', owner.ownerModule === CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE, owner.ownerModule);

  const partialInput = eligibleBridgeInput(builder1, ver1, learn1, { completionStatus: 'PARTIALLY_COMPLETE' });
  const partialBridge = classifyBridge(partialInput);
  assert('106. partially complete blocks execution', partialBridge.eligibleExecutionRequests.length === 0, 'blocked');
  assert('107. partially complete NOT_READY', partialBridge.executionReadiness === 'NOT_READY', partialBridge.executionReadiness);

  const notStartedInput = eligibleBridgeInput(builder1, ver1, learn1, { completionStatus: 'NOT_STARTED' });
  const notStartedBridge = classifyBridge(notStartedInput);
  assert('108. not started blocks execution', notStartedBridge.eligibleExecutionRequests.length === 0, 'blocked');

  const warnCompleteInput = eligibleBridgeInput(builder1, ver1, learn1, { completionStatus: 'COMPLETE_WITH_WARNINGS' });
  const warnBridge = classifyBridge(warnCompleteInput);
  assert('109. complete with warnings allows eligibility', warnBridge.eligibleExecutionRequests.length >= 1, String(warnBridge.eligibleExecutionRequests.length));

  const otherWsAction = classifyPreparedAction(input1, {
    ...builder1.preparedActions[0]!,
    targetPath: 'world2/other-workspace/secret.ts',
  }, 0, true);
  assert('110. action targeting another workspace blocked', otherWsAction.eligibility === 'BLOCKED', otherWsAction.blockReason);

  const reportText = formatControlledExecutionReport(bridge.getBridgeState(), bridge1);
  assert('111. report bridge id', reportText.includes(`Bridge ID: ${bridge1.bridgeId}`), 'bridge id');
  assert('112. report eligible count', reportText.includes(`Eligible request count: ${bridge1.eligibleExecutionRequests.length}`), 'eligible count');
  assert('113. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('114. report no commands', reportText.includes('No commands executed: CONFIRMED'), 'no commands');
  assert('115. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('116. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');
  assert('117. report no deployment', reportText.includes('No deployment performed: CONFIRMED'), 'no deployment');
  assert('118. report classification only', reportText.includes('Bridge classification only: CONFIRMED'), 'classification only');

  const multiBridge = resetDevPulseV2ControlledExecutionBridgeForTests();
  const fiveWorkspaces = seedWorkspaces(5);
  for (const ws of fiveWorkspaces) {
    const { builderPacket, verification, learning } = buildFullPipeline(ws.workspaceId, ws.projectId);
    multiBridge.classifyExecutionEligibility(eligibleBridgeInput(builderPacket, verification, learning));
  }
  assert('119. five project bridges', multiBridge.getBridges().length === 5, String(multiBridge.getBridges().length));

  const tenBridge = resetDevPulseV2ControlledExecutionBridgeForTests();
  const tenWorkspaces = seedWorkspaces(10);
  for (const ws of tenWorkspaces) {
    const { builderPacket, verification, learning } = buildFullPipeline(ws.workspaceId, ws.projectId);
    tenBridge.classifyExecutionEligibility(eligibleBridgeInput(builderPacket, verification, learning));
  }
  assert('120. ten project bridges', tenBridge.getBridges().length === 10, String(tenBridge.getBridges().length));

  const twentyFiveBridge = resetDevPulseV2ControlledExecutionBridgeForTests();
  const twentyFiveWorkspaces = seedWorkspaces(25);
  for (const ws of twentyFiveWorkspaces) {
    const { builderPacket, verification, learning } = buildFullPipeline(ws.workspaceId, ws.projectId);
    twentyFiveBridge.classifyExecutionEligibility(eligibleBridgeInput(builderPacket, verification, learning));
  }
  assert('121. twenty-five project bridges', twentyFiveBridge.getBridges().length === 25, String(twentyFiveBridge.getBridges().length));

  assert('122. one project support', bridge1.projectId === 'devpulse', bridge1.projectId);
  assert('123. multi-project isolation distinct workspaces', fiveWorkspaces[0]!.workspaceId !== fiveWorkspaces[1]!.workspaceId, 'distinct');
  assert('124. no cross-workspace leakage', bridge1.workspaceId !== bridge2.workspaceId, 'isolated');

  assert('125. special approval action types defined', SPECIAL_APPROVAL_ACTION_TYPES.includes('DELETE_FILE_PROPOSED'), 'DELETE');
  assert('126. special approval RUN_COMMAND defined', SPECIAL_APPROVAL_ACTION_TYPES.includes('RUN_COMMAND_PROPOSED'), 'RUN_COMMAND');
  assert('127. bridge state sequence defined', BRIDGE_STATE_SEQUENCE.length >= 9, String(BRIDGE_STATE_SEQUENCE.length));

  const moduleDir = join(fileURLToPath(new URL('../src/controlled-execution-bridge', import.meta.url)));
  const forbiddenViolations = scanModuleForForbiddenPatterns(moduleDir);
  assert('128. module scan no forbidden patterns', forbiddenViolations.length === 0, forbiddenViolations.join('; ') || 'clean');

  assert('129. no execution claim in confirmation', bridge1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('130. no file modification claim', bridge1.confirmation.noFilesModified === true, 'confirmed');
  assert('131. no code generation claim', bridge1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('132. no deployment claim', bridge1.confirmation.noDeploymentPerformed === true, 'confirmed');

  assert('133. builder ownership in bridge input', bridge1.builderId === ver1.builderId, ver1.builderId);
  assert('134. simulation ownership in bridge input', bridge1.simulationId === ver1.simulationId, ver1.simulationId);
  assert('135. plan ownership in bridge input', bridge1.planId === plan1.planId, plan1.planId);
  assert('136. learning ownership in bridge input', bridge1.learningId === learn1.learningId, learn1.learningId);

  assert('137. bridge does not claim execution in report', !reportText.includes('execution performed: YES'), 'no false claim');
  assert('138. bridge does not claim files modified in report', !reportText.includes('files modified: YES'), 'no false claim');
  assert('139. bridge does not claim commands run in report', !reportText.includes('commands executed: YES'), 'no false claim');
  assert('140. bridge does not claim code generated in report', !reportText.includes('code generated: YES'), 'no false claim');
  assert('141. bridge does not claim deployment in report', !reportText.includes('deployment performed: YES'), 'no false claim');

  const freshFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const freshWs = freshFoundation.createWorkspace({
    projectId: 'edge-cases',
    projectName: 'Edge Cases',
    projectVision: 'Edge case validation',
  });
  freshFoundation.getManager().activateWorkspace(freshWs.workspaceId);
  const { builderPacket: freshBuilder, verification: freshVer, learning: freshLearn } =
    buildFullPipeline(freshWs.workspaceId, 'edge-cases');

  const noRollbackInput = eligibleBridgeInput(freshBuilder, freshVer, freshLearn, { rollbackRequirements: [] });
  assert('142. missing rollback blocks eligibility', classifyBridge(noRollbackInput).eligibleExecutionRequests.length === 0, 'blocked');

  const noRiskInput = eligibleBridgeInput(freshBuilder, freshVer, freshLearn, { riskControls: [] });
  assert('143. missing risk controls blocks eligibility', classifyBridge(noRiskInput).eligibleExecutionRequests.length === 0, 'blocked');

  assert('144. dependency integrity world2_learning_loop', getDevPulseV2Owner('world2_learning_loop').phase === 7.6, '7.6');
  assert('145. dependency integrity verification_gated_apply', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('146. dependency integrity founder_approval_execution_gate', getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5, '6.5');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('147. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(CONTROLLED_EXECUTION_BRIDGE_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:controlled-execution-bridge');
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
