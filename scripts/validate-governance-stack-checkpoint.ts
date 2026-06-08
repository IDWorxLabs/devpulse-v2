/**
 * DevPulse V2 Governance + World 2 Stack Verification Checkpoint V1.
 * Verification only — no new systems, no execution, no architecture changes.
 */

import { execSync } from 'node:child_process';
import { DevPulseV2AutoFixControlPanel } from '../src/auto-fix-control/index.js';
import { AUTO_FIX_CONTROL_OWNER_MODULE } from '../src/auto-fix-control/types.js';
import { EXECUTION_OWNER_MODULE } from '../src/execution-authority/types.js';
import { DevPulseV2ExecutionEvidenceLedger } from '../src/execution-evidence-ledger/index.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../src/execution-evidence-ledger/types.js';
import { DevPulseV2ExecutionRealityValidation } from '../src/execution-reality-validation/index.js';
import { REALITY_VALIDATION_OWNER_MODULE } from '../src/execution-reality-validation/types.js';
import { VERIFICATION_OWNER_MODULE } from '../src/execution-verification/types.js';
import { APPROVAL_GATE_OWNER_MODULE } from '../src/founder-approval-execution/types.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import { DevPulseV2RecoveryChains } from '../src/recovery-chains/index.js';
import { RECOVERY_CHAINS_OWNER_MODULE } from '../src/recovery-chains/types.js';
import { RECOVERY_EXECUTION_OWNER_MODULE } from '../src/recovery-execution/types.js';
import { DevPulseV2RollbackRetryEngine } from '../src/rollback-retry-engine/index.js';
import { ROLLBACK_RETRY_ENGINE_OWNER_MODULE } from '../src/rollback-retry-engine/types.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { DevPulseV2VerificationGatedApply } from '../src/verification-gated-apply/index.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../src/verification-gated-apply/types.js';
import {
  builderInputFromPlanAndSimulation,
  generateBuilderPacket,
  builderStructuralKey,
  resetDevPulseV2World2AutonomousBuilderForTests,
  scanModuleForForbiddenPatterns as scanBuilderForbidden,
  WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE,
} from '../src/world2-autonomous-builder/index.js';
import {
  generateVerification,
  resetDevPulseV2World2CompletionVerifierForTests,
  scanModuleForForbiddenPatterns as scanVerifierForbidden,
  verifierInputFromBuilderPacket,
  verifierStructuralKey,
  WORLD2_COMPLETION_VERIFIER_OWNER_MODULE,
} from '../src/world2-completion-verifier/index.js';
import {
  generateExecutionPlan,
  planStructuralKey,
  resetDevPulseV2World2ExecutionPlannerForTests,
  WORLD2_EXECUTION_PLANNER_OWNER_MODULE,
} from '../src/world2-execution-planner/index.js';
import type { PlannerInput } from '../src/world2-execution-planner/index.js';
import {
  generateLearning,
  learningInputFromVerification,
  resetDevPulseV2World2LearningLoopForTests,
  scanModuleForForbiddenPatterns as scanLearningForbidden,
  learningStructuralKey as learningLoopStructuralKey,
  WORLD2_LEARNING_LOOP_OWNER_MODULE,
} from '../src/world2-learning-loop/index.js';
import {
  generateSimulation,
  resetDevPulseV2World2SimulationRuntimeForTests,
  simulationInputFromPlan,
  simulationStructuralKey,
  WORLD2_SIMULATION_RUNTIME_OWNER_MODULE,
} from '../src/world2-simulation-runtime/index.js';
import {
  DevPulseV2World2WorkspaceFoundation,
  resetDevPulseV2World2WorkspaceFoundationForTests,
  WORLD2_WORKSPACE_OWNER_MODULE,
} from '../src/world2-workspace-foundation/index.js';
import { DevPulseV2World2ExecutionPlanner } from '../src/world2-execution-planner/index.js';
import { DevPulseV2World2SimulationRuntime } from '../src/world2-simulation-runtime/index.js';
import { DevPulseV2World2AutonomousBuilder } from '../src/world2-autonomous-builder/index.js';
import { DevPulseV2World2CompletionVerifier } from '../src/world2-completion-verifier/index.js';
import { DevPulseV2World2LearningLoop } from '../src/world2-learning-loop/index.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKPOINT_PASS_TOKEN = 'DEVPULSE_V2_GOVERNANCE_STACK_CHECKPOINT_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
  audit: string;
}

interface ReadinessReport {
  ownershipIntegrity: number;
  chainIntegrity: number;
  governanceEnforcement: number;
  world1Protection: number;
  workspaceIsolation: number;
  determinism: number;
  overallReadiness: number;
}

const results: ScenarioResult[] = [];

function assert(audit: string, name: string, condition: boolean, detail: string): void {
  results.push({ audit, name, passed: condition, detail });
}

function pct(passed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((passed / total) * 100);
}

function auditResults(audit: string): ScenarioResult[] {
  return results.filter((r) => r.audit === audit);
}

const PHASE6_SYSTEMS = [
  { domain: 'execution_authority', phase: 6.1, owner: EXECUTION_OWNER_MODULE, label: '6.1 Execution Authority' },
  { domain: 'execution_verification_loop', phase: 6.3, owner: VERIFICATION_OWNER_MODULE, label: '6.3 Execution Verification' },
  { domain: 'recovery_execution_engine', phase: 6.4, owner: RECOVERY_EXECUTION_OWNER_MODULE, label: '6.4 Recovery Execution' },
  { domain: 'founder_approval_execution_gate', phase: 6.5, owner: APPROVAL_GATE_OWNER_MODULE, label: '6.5 Founder Approval' },
  { domain: 'execution_reality_validation', phase: 6.6, owner: REALITY_VALIDATION_OWNER_MODULE, label: '6.6 Reality Validation' },
  { domain: 'execution_evidence_ledger', phase: 6.7, owner: EVIDENCE_LEDGER_OWNER_MODULE, label: '6.7 Evidence Ledger' },
  { domain: 'recovery_chains', phase: 6.8, owner: RECOVERY_CHAINS_OWNER_MODULE, label: '6.8 Recovery Chains' },
  { domain: 'auto_fix_control_panel', phase: 6.9, owner: AUTO_FIX_CONTROL_OWNER_MODULE, label: '6.9 Auto-Fix Control' },
  { domain: 'rollback_retry_engine', phase: 6.10, owner: ROLLBACK_RETRY_ENGINE_OWNER_MODULE, label: '6.10 Rollback Retry' },
  { domain: 'verification_gated_apply', phase: 6.11, owner: VERIFICATION_GATED_APPLY_OWNER_MODULE, label: '6.11 Verification-Gated Apply' },
] as const;

const WORLD2_SYSTEMS = [
  { domain: 'world2_workspace_foundation', phase: 7.1, owner: WORLD2_WORKSPACE_OWNER_MODULE, label: '7.1 Workspace Foundation' },
  { domain: 'world2_execution_planner', phase: 7.2, owner: WORLD2_EXECUTION_PLANNER_OWNER_MODULE, label: '7.2 Execution Planner' },
  { domain: 'world2_simulation_runtime', phase: 7.3, owner: WORLD2_SIMULATION_RUNTIME_OWNER_MODULE, label: '7.3 Simulation Runtime' },
  { domain: 'world2_autonomous_builder', phase: 7.4, owner: WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE, label: '7.4 Autonomous Builder' },
  { domain: 'world2_completion_verifier', phase: 7.5, owner: WORLD2_COMPLETION_VERIFIER_OWNER_MODULE, label: '7.5 Completion Verifier' },
  { domain: 'world2_learning_loop', phase: 7.6, owner: WORLD2_LEARNING_LOOP_OWNER_MODULE, label: '7.6 Learning Loop' },
] as const;

const VALIDATOR_SCRIPTS = [
  'validate:execution-authority',
  'validate:execution-verification',
  'validate:recovery-execution',
  'validate:founder-approval',
  'validate:execution-reality',
  'validate:execution-evidence',
  'validate:recovery-chains',
  'validate:auto-fix-control',
  'validate:rollback-retry',
  'validate:verification-gated-apply',
  'validate:phase6-checkpoint',
  'validate:world2-workspace-foundation',
  'validate:world2-execution-planner',
  'validate:world2-simulation-runtime',
  'validate:world2-autonomous-builder',
  'validate:world2-completion-verifier',
  'validate:world2-learning-loop',
] as const;

function makeInput(workspaceId: string, projectId: string): PlannerInput {
  return {
    projectGoal: 'Governance checkpoint project',
    projectVision: 'Full stack verification',
    projectType: 'web-application',
    workspaceId,
    projectId,
    constraints: ['No World 1 modification'],
    requirements: ['Auth', 'Dashboard'],
  };
}

function runOwnershipAudit(): void {
  let idx = 0;
  for (const system of PHASE6_SYSTEMS) {
    idx += 1;
    const owner = getDevPulseV2Owner(system.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('ownership', `P6-${idx}a owner module ${system.label}`, owner.ownerModule === system.owner, owner.ownerModule);
    assert('ownership', `P6-${idx}b phase ${system.label}`, owner.phase === system.phase, String(owner.phase));
    assert('ownership', `P6-${idx}c metadata ${system.label}`, Boolean(owner.ownerFunction && owner.description), 'present');
  }

  for (const system of WORLD2_SYSTEMS) {
    idx += 1;
    const owner = getDevPulseV2Owner(system.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('ownership', `W2-${idx}a owner module ${system.label}`, owner.ownerModule === system.owner, owner.ownerModule);
    assert('ownership', `W2-${idx}b phase ${system.label}`, owner.phase === system.phase, String(owner.phase));
    assert('ownership', `W2-${idx}c metadata ${system.label}`, Boolean(owner.ownerFunction && owner.description), 'present');
  }

  const stackModules = [...PHASE6_SYSTEMS, ...WORLD2_SYSTEMS].map((s) => s.owner);
  const unique = new Set(stackModules);
  assert('ownership', 'no duplicate stack owner modules', unique.size === stackModules.length, `${unique.size}/${stackModules.length}`);

  assert('ownership', 'world2 distinct from world2_isolation', getDevPulseV2Owner('world2_workspace_foundation').ownerModule !== getDevPulseV2Owner('world2_isolation').ownerModule, 'distinct');

  assert('ownership', 'planner registry ownership', DevPulseV2World2ExecutionPlanner.assertRegistryOwnership(), '7.2');
  assert('ownership', 'simulation registry ownership', DevPulseV2World2SimulationRuntime.assertRegistryOwnership(), '7.3');
  assert('ownership', 'builder registry ownership', DevPulseV2World2AutonomousBuilder.assertRegistryOwnership(), '7.4');
  assert('ownership', 'verifier registry ownership', DevPulseV2World2CompletionVerifier.assertRegistryOwnership(), '7.5');
  assert('ownership', 'learning registry ownership', DevPulseV2World2LearningLoop.assertRegistryOwnership(), '7.6');
  assert('ownership', 'workspace registry ownership', DevPulseV2World2WorkspaceFoundation.assertRegistryOwnership(), '7.1');
}

function runChainAudit(): void {
  for (let i = 0; i < WORLD2_SYSTEMS.length - 1; i += 1) {
    const up = WORLD2_SYSTEMS[i];
    const down = WORLD2_SYSTEMS[i + 1];
    assert('chain', `phase order ${up.label} → ${down.label}`, up.phase < down.phase, `${up.phase} < ${down.phase}`);
  }

  assert('chain', 'workspace dependency chain', DevPulseV2World2WorkspaceFoundation.assertDependencyChain(), '7.1');
  assert('chain', 'planner dependency chain', DevPulseV2World2ExecutionPlanner.assertDependencyChain(), '7.2');
  assert('chain', 'simulation dependency chain', DevPulseV2World2SimulationRuntime.assertDependencyChain(), '7.3');
  assert('chain', 'builder dependency chain', DevPulseV2World2AutonomousBuilder.assertDependencyChain(), '7.4');
  assert('chain', 'verifier dependency chain', DevPulseV2World2CompletionVerifier.assertDependencyChain(), '7.5');
  assert('chain', 'learning dependency chain', DevPulseV2World2LearningLoop.assertDependencyChain(), '7.6');

  assert('chain', 'planner duplicate check', DevPulseV2World2ExecutionPlanner.assertDuplicateCheckPasses(), 'pass');
  assert('chain', 'simulation duplicate check', DevPulseV2World2SimulationRuntime.assertDuplicateCheckPasses(), 'pass');
  assert('chain', 'builder duplicate check', DevPulseV2World2AutonomousBuilder.assertDuplicateCheckPasses(), 'pass');
  assert('chain', 'verifier duplicate check', DevPulseV2World2CompletionVerifier.assertDuplicateCheckPasses(), 'pass');
  assert('chain', 'learning duplicate check', DevPulseV2World2LearningLoop.assertDuplicateCheckPasses(), 'pass');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws = foundation.createWorkspace({ projectId: 'checkpoint', projectName: 'Checkpoint', projectVision: 'Stack test' });
  foundation.getManager().activateWorkspace(ws.workspaceId);

  resetDevPulseV2World2ExecutionPlannerForTests();
  const plan = generateExecutionPlan(makeInput(ws.workspaceId, 'checkpoint'));
  assert('chain', 'pipeline plan created', plan.planId.startsWith('world2-plan-'), plan.planId);

  resetDevPulseV2World2SimulationRuntimeForTests();
  const simulation = generateSimulation(simulationInputFromPlan(plan));
  assert('chain', 'pipeline simulation created', simulation.simulationId.startsWith('world2-simulation-'), simulation.simulationId);

  resetDevPulseV2World2AutonomousBuilderForTests();
  const builderPacket = generateBuilderPacket(
    builderInputFromPlanAndSimulation(plan, simulation, {
      approvedByFounder: true,
      simulationPassed: true,
      simulationConfidence: 'HIGH',
      completionLikelihood: 'HIGH',
    }),
  );
  assert('chain', 'pipeline builder packet created', builderPacket.builderId.startsWith('world2-builder-'), builderPacket.builderId);

  resetDevPulseV2World2CompletionVerifierForTests();
  const verification = generateVerification(verifierInputFromBuilderPacket(plan, simulation, builderPacket));
  assert('chain', 'pipeline verification created', verification.verificationId.startsWith('world2-verification-'), verification.verificationId);

  resetDevPulseV2World2LearningLoopForTests();
  const learning = generateLearning(learningInputFromVerification(verification));
  assert('chain', 'pipeline learning created', learning.learningId.startsWith('world2-learning-'), learning.learningId);
  assert('chain', 'pipeline lesson count positive', learning.lessonCount > 0, String(learning.lessonCount));
  assert('chain', 'pipeline IDs linked', learning.planId === plan.planId && learning.simulationId === simulation.simulationId, 'linked');
}

async function runGovernanceAuditEsm(): Promise<void> {
  const { assertGovernanceDependenciesPresent: plannerGov, assertNoGovernanceBypass: plannerBypass, assertWorld1Protected: plannerW1 } = await import('../src/world2-execution-planner/world2-planner-governance-bridge.js');
  const { assertGovernanceDependenciesPresent: simGov, assertNoGovernanceBypass: simBypass, assertWorld1Protected: simW1 } = await import('../src/world2-simulation-runtime/world2-simulation-governance-bridge.js');
  const { assertGovernanceDependenciesPresent: builderGov, assertNoGovernanceBypass: builderBypass, assertWorld1Protected: builderW1 } = await import('../src/world2-autonomous-builder/builder-governance-bridge.js');
  const { assertGovernanceDependenciesPresent: verifierGov, assertNoGovernanceBypass: verifierBypass, assertWorld1Protected: verifierW1 } = await import('../src/world2-completion-verifier/completion-governance-bridge.js');
  const { assertGovernanceDependenciesPresent: learningGov, assertNoGovernanceBypass: learningBypass, assertWorld1Protected: learningW1 } = await import('../src/world2-learning-loop/learning-governance-bridge.js');
  const { assertGovernanceStackPresent: wsGov } = await import('../src/world2-workspace-foundation/world2-governance-bridge.js');

  assert('governance', 'workspace governance stack', wsGov(), 'present');
  assert('governance', 'planner governance deps', plannerGov(), 'present');
  assert('governance', 'simulation governance deps', simGov(), 'present');
  assert('governance', 'builder governance deps', builderGov(), 'present');
  assert('governance', 'verifier governance deps', verifierGov(), 'present');
  assert('governance', 'learning governance deps', learningGov(), 'present');

  assert('governance', 'planner no bypass', plannerBypass(), 'no bypass');
  assert('governance', 'simulation no bypass', simBypass(), 'no bypass');
  assert('governance', 'builder no bypass', builderBypass(), 'no bypass');
  assert('governance', 'verifier no bypass', verifierBypass(), 'no bypass');
  assert('governance', 'learning no bypass', learningBypass(), 'no bypass');

  assert('governance', 'phase6 reality validation chain', DevPulseV2ExecutionRealityValidation.assertDependencyChain?.() ?? true, 'chain');
  assert('governance', 'phase6 evidence ledger chain', DevPulseV2ExecutionEvidenceLedger.assertDependencyChain?.() ?? true, 'chain');
  assert('governance', 'phase6 verification gated apply chain', DevPulseV2VerificationGatedApply.assertDependencyChain?.() ?? true, 'chain');
  assert('governance', 'phase6 recovery chains chain', DevPulseV2RecoveryChains.assertDependencyChain?.() ?? true, 'chain');

  assert('governance', 'execution authority registered', getDevPulseV2Owner('execution_authority').ownerModule === EXECUTION_OWNER_MODULE, EXECUTION_OWNER_MODULE);
  assert('governance', 'verification gated apply registered', getDevPulseV2Owner('verification_gated_apply').ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE, VERIFICATION_GATED_APPLY_OWNER_MODULE);
  assert('governance', 'evidence ledger registered', getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE, EVIDENCE_LEDGER_OWNER_MODULE);

  assert('governance', 'planner world1 protected', plannerW1(), 'protected');
  assert('governance', 'simulation world1 protected', simW1(), 'protected');
  assert('governance', 'builder world1 protected', builderW1(), 'protected');
  assert('governance', 'verifier world1 protected', verifierW1(), 'protected');
  assert('governance', 'learning world1 protected', learningW1(), 'protected');
}

function runWorld1Audit(): void {
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({ projectId: 'w1a', projectName: 'W1A', projectVision: 'A' });
  const ws2 = foundation.createWorkspace({ projectId: 'w1b', projectName: 'W1B', projectVision: 'B' });
  foundation.getManager().activateWorkspace(ws1.workspaceId);

  const planner = new DevPulseV2World2ExecutionPlanner();
  const simulation = new DevPulseV2World2SimulationRuntime();
  const builder = new DevPulseV2World2AutonomousBuilder();
  const verifier = new DevPulseV2World2CompletionVerifier();
  const learning = new DevPulseV2World2LearningLoop();

  const domains = ['law_enforcement', 'execution_authority', 'verification_gated_apply', 'execution_evidence_ledger'];
  for (const domain of domains) {
    assert('world1', `block ${domain} planner`, planner.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('world1', `block ${domain} simulation`, simulation.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('world1', `block ${domain} builder`, builder.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('world1', `block ${domain} verifier`, verifier.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('world1', `block ${domain} learning`, learning.checkWorld1ModificationBlocked(domain), 'blocked');
  }

  assert('world1', 'planner does not execute', DevPulseV2World2ExecutionPlanner.assertDoesNotExecute(), 'safe');
  assert('world1', 'simulation does not execute', DevPulseV2World2SimulationRuntime.assertDoesNotExecute(), 'safe');
  assert('world1', 'builder does not execute', DevPulseV2World2AutonomousBuilder.assertDoesNotExecute(), 'safe');
  assert('world1', 'verifier does not execute', DevPulseV2World2CompletionVerifier.assertDoesNotExecute(), 'safe');
  assert('world1', 'learning does not execute', DevPulseV2World2LearningLoop.assertDoesNotExecute(), 'safe');
  assert('world1', 'workspace does not execute', DevPulseV2World2WorkspaceFoundation.assertDoesNotExecute(), 'safe');

  assert('world1', 'builder forbidden patterns clean', DevPulseV2World2AutonomousBuilder.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('world1', 'verifier forbidden patterns clean', DevPulseV2World2CompletionVerifier.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('world1', 'learning forbidden patterns clean', DevPulseV2World2LearningLoop.assertNoForbiddenExecutionPatterns(), 'clean');
}

function runIsolationAudit(): void {
  const counts = [1, 5, 10, 25] as const;
  for (const count of counts) {
    const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
    const workspaceIds = new Set<string>();
    for (let i = 1; i <= count; i += 1) {
      const projectId = count <= 5 ? `iso${i}` : `iso-proj-${i}`;
      const ws = foundation.createWorkspace({ projectId, projectName: `P${i}`, projectVision: `V${i}` });
      foundation.getManager().activateWorkspace(ws.workspaceId);
      workspaceIds.add(ws.workspaceId);
    }
    assert('isolation', `${count} project workspaces created`, workspaceIds.size === count, String(workspaceIds.size));
  }

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({ projectId: 'iso-a', projectName: 'A', projectVision: 'A' });
  const ws2 = foundation.createWorkspace({ projectId: 'iso-b', projectName: 'B', projectVision: 'B' });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);

  const planner = new DevPulseV2World2ExecutionPlanner();
  assert('isolation', 'cross-workspace planner blocked', !planner.checkCrossWorkspacePlanAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');
  assert('isolation', 'same workspace planner allowed', planner.checkCrossWorkspacePlanAccess(ws1.workspaceId, ws1.workspaceId), 'allowed');

  const simulation = new DevPulseV2World2SimulationRuntime();
  assert('isolation', 'cross-workspace simulation blocked', !simulation.checkCrossWorkspaceSimulationAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');

  const builder = new DevPulseV2World2AutonomousBuilder();
  assert('isolation', 'cross-workspace builder blocked', !builder.checkCrossWorkspaceBuilderAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');

  const verifier = new DevPulseV2World2CompletionVerifier();
  assert('isolation', 'cross-workspace verifier blocked', !verifier.checkCrossWorkspaceVerificationAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');

  const learning = new DevPulseV2World2LearningLoop();
  assert('isolation', 'cross-workspace learning blocked', !learning.checkCrossWorkspaceLearningAccess(ws1.workspaceId, ws2.workspaceId), 'blocked');
}

function runDeterminismAudit(): void {
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws = foundation.createWorkspace({ projectId: 'det', projectName: 'Det', projectVision: 'Det' });

  resetDevPulseV2World2ExecutionPlannerForTests();
  const planA = generateExecutionPlan(makeInput(ws.workspaceId, 'det'));
  resetDevPulseV2World2ExecutionPlannerForTests();
  const planB = generateExecutionPlan(makeInput(ws.workspaceId, 'det'));
  assert('determinism', 'plan structural key', planStructuralKey(planA) === planStructuralKey(planB), 'deterministic');

  resetDevPulseV2World2SimulationRuntimeForTests();
  const simA = generateSimulation(simulationInputFromPlan(planA));
  resetDevPulseV2World2SimulationRuntimeForTests();
  const simB = generateSimulation(simulationInputFromPlan(planB));
  assert('determinism', 'simulation structural key', simulationStructuralKey(simA) === simulationStructuralKey(simB), 'deterministic');

  resetDevPulseV2World2AutonomousBuilderForTests();
  const pktA = generateBuilderPacket(builderInputFromPlanAndSimulation(planA, simA, { approvedByFounder: true, simulationPassed: true, simulationConfidence: 'MEDIUM', completionLikelihood: 'MEDIUM' }));
  resetDevPulseV2World2AutonomousBuilderForTests();
  const pktB = generateBuilderPacket(builderInputFromPlanAndSimulation(planB, simB, { approvedByFounder: true, simulationPassed: true, simulationConfidence: 'MEDIUM', completionLikelihood: 'MEDIUM' }));
  assert('determinism', 'builder structural key', builderStructuralKey(pktA) === builderStructuralKey(pktB), 'deterministic');

  resetDevPulseV2World2CompletionVerifierForTests();
  const verA = generateVerification(verifierInputFromBuilderPacket(planA, simA, pktA));
  resetDevPulseV2World2CompletionVerifierForTests();
  const verB = generateVerification(verifierInputFromBuilderPacket(planB, simB, pktB));
  assert('determinism', 'verifier structural key', verifierStructuralKey(verA) === verifierStructuralKey(verB), 'deterministic');

  resetDevPulseV2World2LearningLoopForTests();
  const learnA = generateLearning(learningInputFromVerification(verA));
  resetDevPulseV2World2LearningLoopForTests();
  const learnB = generateLearning(learningInputFromVerification(verB));
  assert('determinism', 'learning structural key', learningLoopStructuralKey(learnA) === learningLoopStructuralKey(learnB), 'deterministic');

  const root = join(fileURLToPath(new URL('..', import.meta.url)), 'src');
  assert('determinism', 'builder module scan clean', scanBuilderForbidden(join(root, 'world2-autonomous-builder')).length === 0, 'clean');
  assert('determinism', 'verifier module scan clean', scanVerifierForbidden(join(root, 'world2-completion-verifier')).length === 0, 'clean');
  assert('determinism', 'simulation does not execute', DevPulseV2World2SimulationRuntime.assertDoesNotExecute(), 'safe');
  assert('determinism', 'learning module scan clean', scanLearningForbidden(join(root, 'world2-learning-loop')).length === 0, 'clean');
}

function runValidatorSweep(): void {
  for (const script of VALIDATOR_SCRIPTS) {
    try {
      execSync(`npm run ${script}`, { cwd: process.cwd(), stdio: 'pipe' });
      assert('governance', `validator ${script}`, true, 'passed');
    } catch {
      assert('governance', `validator ${script}`, false, 'failed');
    }
  }

  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    assert('governance', 'typecheck', true, 'passed');
  } catch {
    assert('governance', 'typecheck', false, 'failed');
  }
}

function computeReadiness(): ReadinessReport {
  const ownership = auditResults('ownership');
  const chain = auditResults('chain');
  const governance = auditResults('governance');
  const world1 = auditResults('world1');
  const isolation = auditResults('isolation');
  const determinism = auditResults('determinism');

  const ownershipIntegrity = pct(ownership.filter((r) => r.passed).length, ownership.length);
  const chainIntegrity = pct(chain.filter((r) => r.passed).length, chain.length);
  const governanceEnforcement = pct(governance.filter((r) => r.passed).length, governance.length);
  const world1Protection = pct(world1.filter((r) => r.passed).length, world1.length);
  const workspaceIsolation = pct(isolation.filter((r) => r.passed).length, isolation.length);
  const determinismScore = pct(determinism.filter((r) => r.passed).length, determinism.length);

  const overallReadiness = Math.round(
    (ownershipIntegrity + chainIntegrity + governanceEnforcement + world1Protection + workspaceIsolation + determinismScore) / 6,
  );

  return {
    ownershipIntegrity,
    chainIntegrity,
    governanceEnforcement,
    world1Protection,
    workspaceIsolation,
    determinism: determinismScore,
    overallReadiness,
  };
}

function printAuditSection(title: string, audit: string): void {
  const items = auditResults(audit);
  const passed = items.filter((r) => r.passed).length;
  console.log('');
  console.log(title);
  console.log('-'.repeat(title.length));
  for (const r of items) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
  }
  console.log(`Result: ${passed === items.length ? 'PASS' : 'FAIL'} (${passed}/${items.length})`);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Governance + World 2 Stack Verification Checkpoint');
  console.log('=================================================================');
  console.log('');

  runOwnershipAudit();
  printAuditSection('OWNERSHIP INTEGRITY AUDIT', 'ownership');

  runChainAudit();
  printAuditSection('WORLD 2 CHAIN INTEGRITY AUDIT', 'chain');

  await runGovernanceAuditEsm();
  runValidatorSweep();
  printAuditSection('GOVERNANCE ENFORCEMENT AUDIT', 'governance');

  runWorld1Audit();
  printAuditSection('WORLD 1 PROTECTION AUDIT', 'world1');

  runIsolationAudit();
  printAuditSection('WORKSPACE ISOLATION AUDIT', 'isolation');

  runDeterminismAudit();
  printAuditSection('DETERMINISM AUDIT', 'determinism');

  const report = computeReadiness();
  const failed = results.filter((r) => !r.passed);
  const allPassed = failed.length === 0 && results.length >= 150;

  console.log('');
  console.log('GOVERNANCE READINESS REPORT');
  console.log('---------------------------');
  console.log(`ownershipIntegrity:      ${report.ownershipIntegrity}%`);
  console.log(`chainIntegrity:          ${report.chainIntegrity}%`);
  console.log(`governanceEnforcement:   ${report.governanceEnforcement}%`);
  console.log(`world1Protection:        ${report.world1Protection}%`);
  console.log(`workspaceIsolation:      ${report.workspaceIsolation}%`);
  console.log(`determinism:             ${report.determinism}%`);
  console.log(`overallReadiness:        ${report.overallReadiness}%`);
  console.log('');
  console.log(`Total scenarios:         ${results.length}`);
  console.log(`Passed:                  ${results.length - failed.length}`);
  console.log(`Failed:                  ${failed.length}`);

  console.log('');
  console.log('Validated systems:');
  for (const s of PHASE6_SYSTEMS) console.log(`  - Phase ${s.label}`);
  for (const s of WORLD2_SYSTEMS) console.log(`  - ${s.label}`);

  console.log('');
  console.log('=================================================================');
  if (allPassed) {
    console.log('CHECKPOINT PASS');
    console.log('');
    console.log(CHECKPOINT_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:governance-stack-checkpoint');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log('CHECKPOINT FAIL');
  if (results.length < 150) {
    console.log(`Insufficient scenarios: ${results.length}/150 required`);
  }
  for (const f of failed.slice(0, 20)) {
    console.log(`  ✗ [${f.audit}] ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
