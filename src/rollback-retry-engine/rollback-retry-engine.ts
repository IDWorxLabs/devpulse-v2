/**
 * DevPulse V2 Rollback & Retry Engine — Phase 6.10 planning layer.
 * Plans safe rollback/retry strategies only. Does NOT execute rollback, retry, or modify files.
 */

import {
  AUTO_FIX_CONTROL_OWNER_MODULE,
  getDevPulseV2AutoFixControlPanel,
} from '../auto-fix-control/index.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  APPROVAL_GATE_OWNER_MODULE,
  getDevPulseV2FounderApprovalExecutionGate,
} from '../founder-approval-execution/index.js';
import {
  EVIDENCE_LEDGER_OWNER_MODULE,
  getDevPulseV2ExecutionEvidenceLedger,
} from '../execution-evidence-ledger/index.js';
import {
  getDevPulseV2ExecutionRealityValidation,
  REALITY_VALIDATION_OWNER_MODULE,
} from '../execution-reality-validation/index.js';
import {
  buildGovernanceContextFromSystems,
  getDevPulseV2RecoveryChains,
  RECOVERY_CHAINS_OWNER_MODULE,
} from '../recovery-chains/index.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { buildAdditionalCheckpoints, CheckpointStore } from './checkpoint-selector.js';
import { attachRollbackRetryEvidence } from './rollback-retry-evidence.js';
import { formatRollbackRetryReport } from './rollback-retry-report.js';
import { evaluateRollbackRetryPolicy } from './rollback-retry-policy-engine.js';
import type {
  EngineState,
  FailureScenario,
  RollbackRetryEngineState,
  RollbackRetryPlan,
  RollbackRetryPlanInput,
} from './types.js';
import { ROLLBACK_RETRY_ENGINE_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2RollbackRetryEngine | null = null;

function createEngineId(): string {
  return `rollback-retry-engine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPlanId(): string {
  return `rollback-retry-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clonePlan(plan: RollbackRetryPlan): RollbackRetryPlan {
  return {
    ...plan,
    checkpoint: { ...plan.checkpoint },
    evidenceLinks: plan.evidenceLinks.map((l) => ({ ...l })),
    stateSequence: [...plan.stateSequence],
  };
}

export function resolveFailureScenario(input: RollbackRetryPlanInput): FailureScenario {
  if (input.failureScenario) {
    return input.failureScenario;
  }

  if (!input.runtimeRecord) {
    return 'MISSING_RUNTIME';
  }

  if (!input.verificationResult) {
    return 'MISSING_VERIFICATION';
  }

  if (input.realityResult?.verdict === 'REALITY_FAILED') {
    return 'FAILED_REALITY_VALIDATION';
  }

  if (input.realityResult && input.realityResult.contradictions.some((c) => c.severity === 'CRITICAL')) {
    return 'CONTRADICTION_PRESENT';
  }

  if (input.recoveryChain?.failureType === 'AUTONOMY_FAILURE') {
    return 'AUTONOMY_FAILURE';
  }

  if (input.recoveryChain?.failureType === 'WRONG_GATE_MAPPING') {
    return 'WRONG_GATE_MAPPING';
  }

  if (!input.approvalRecord || input.approvalRecord.decision === 'PENDING') {
    return 'APPROVAL_MISSING';
  }

  return 'NONE';
}

function buildEngineStateSequence(): EngineState[] {
  return [
    'INPUT_RECEIVED',
    'FAILURE_CLASSIFIED',
    'CHECKPOINT_SELECTED',
    'ROLLBACK_EVALUATED',
    'RETRY_EVALUATED',
    'POLICY_CHECK_COMPLETED',
    'EVIDENCE_ATTACHED',
    'PLAN_CREATED',
  ];
}

export function planStructuralKey(plan: RollbackRetryPlan): string {
  return [
    plan.failureScenario,
    plan.rollbackState,
    plan.retryState,
    plan.approvalRequired,
    plan.verificationRequired,
    plan.riskLevel,
    plan.checkpoint.checkpointType,
    plan.checkpoint.confidence,
    plan.evidenceLinks.length,
  ].join('|');
}

export function createRollbackRetryPlan(
  input: RollbackRetryPlanInput,
  checkpointStore: CheckpointStore,
): RollbackRetryPlan {
  const scenario = resolveFailureScenario(input);
  const policy = evaluateRollbackRetryPolicy(scenario);
  const checkpoint = checkpointStore.selectCheckpoint(input.packageId, scenario);
  const evidenceLinks = attachRollbackRetryEvidence(input);

  return {
    planId: createPlanId(),
    packageId: input.packageId,
    failureScenario: scenario,
    rollbackState: policy.rollbackState,
    retryState: policy.retryState,
    checkpoint,
    approvalRequired: policy.approvalRequired,
    verificationRequired: policy.verificationRequired,
    riskLevel: policy.riskLevel,
    evidenceLinks,
    stateSequence: buildEngineStateSequence(),
    createdAt: Date.now(),
    planningOnlyConfirmed: true,
    noRollbackExecuted: true,
    noRetryExecuted: true,
  };
}

export class DevPulseV2RollbackRetryEngine {
  private readonly engineId = createEngineId();
  private readonly plans: RollbackRetryPlan[] = [];
  private readonly checkpointStore = new CheckpointStore();
  private engineWarnings: string[] = ['Rollback & Retry Engine Foundation V1 — planning only.'];
  private engineErrors: string[] = [];

  static readonly ownerModule = ROLLBACK_RETRY_ENGINE_OWNER_MODULE;
  static readonly ownerDomain = 'rollback_retry_engine' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('rollback_retry_engine');
    return owner.ownerModule === ROLLBACK_RETRY_ENGINE_OWNER_MODULE;
  }

  static assertDuplicateCheckPasses(): boolean {
    const engine = getDevPulseV2Owner('rollback_retry_engine');
    const recoveryEngine = getDevPulseV2Owner('recovery_execution_engine');
    const recoveryChains = getDevPulseV2Owner('recovery_chains');
    const autoFix = getDevPulseV2Owner('auto_fix_control_panel');
    return (
      engine.ownerModule === ROLLBACK_RETRY_ENGINE_OWNER_MODULE &&
      engine.ownerModule !== recoveryEngine.ownerModule &&
      engine.ownerModule !== recoveryChains.ownerModule &&
      engine.ownerModule !== autoFix.ownerModule
    );
  }

  static assertDoesNotExecute(): boolean {
    const eng = new DevPulseV2RollbackRetryEngine();
    return (
      typeof (eng as { executeRollback?: unknown }).executeRollback === 'undefined' &&
      typeof (eng as { executeRetry?: unknown }).executeRetry === 'undefined' &&
      typeof (eng as { modifyFiles?: unknown }).modifyFiles === 'undefined'
    );
  }

  static assertNoRollbackExecutionPath(): boolean {
    const eng = new DevPulseV2RollbackRetryEngine();
    return typeof (eng as { executeRollback?: unknown }).executeRollback === 'undefined';
  }

  static assertNoRetryExecutionPath(): boolean {
    const eng = new DevPulseV2RollbackRetryEngine();
    return typeof (eng as { executeRetry?: unknown }).executeRetry === 'undefined';
  }

  static assertNoFileModificationPath(): boolean {
    const eng = new DevPulseV2RollbackRetryEngine();
    return (
      typeof (eng as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (eng as { writeFile?: unknown }).writeFile === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      getDevPulseV2Owner('recovery_chains').ownerModule === RECOVERY_CHAINS_OWNER_MODULE &&
      getDevPulseV2Owner('auto_fix_control_panel').ownerModule === AUTO_FIX_CONTROL_OWNER_MODULE &&
      getDevPulseV2Owner('founder_approval_execution_gate').ownerModule === APPROVAL_GATE_OWNER_MODULE &&
      getDevPulseV2Owner('execution_reality_validation').ownerModule === REALITY_VALIDATION_OWNER_MODULE &&
      getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE &&
      getDevPulseV2Owner('rollback_retry_engine').phase === 6.10
    );
  }

  planRollbackRetry(input: RollbackRetryPlanInput): RollbackRetryPlan {
    const plan = createRollbackRetryPlan(input, this.checkpointStore);
    this.plans.push(clonePlan(plan));
    this.publishSummary(plan);
    return clonePlan(plan);
  }

  planPackage(packageId: string): RollbackRetryPlan {
    const context = buildGovernanceContextFromSystems(packageId);
    const chains = getDevPulseV2RecoveryChains().getChains().filter((c) => c.packageId === packageId);
    let recoveryChain = chains.length > 0 ? chains[chains.length - 1] : null;
    if (!recoveryChain) {
      recoveryChain = getDevPulseV2RecoveryChains().planPackage(packageId);
    }

    const autoFixRecords = getDevPulseV2AutoFixControlPanel()
      .getAllFixPermissions()
      .filter((r) => r.packageId === packageId);
    const autoFixRecord = autoFixRecords.length > 0 ? autoFixRecords[autoFixRecords.length - 1] : null;

    return this.planRollbackRetry({
      packageId,
      runtimeRecord: context.runtimeRecord,
      verificationResult: context.verificationResult ?? null,
      recoveryChain,
      autoFixRecord,
      approvalRecord: context.approvalRecord,
      realityResult: context.realityResult,
      ledgerRecord: context.ledgerRecord,
    });
  }

  getPlans(): RollbackRetryPlan[] {
    return this.plans.map(clonePlan);
  }

  getCheckpoints(packageId: string) {
    return this.checkpointStore.getCheckpoints(packageId);
  }

  lookupCheckpoint(checkpointId: string) {
    return this.checkpointStore.lookupCheckpoint(checkpointId);
  }

  registerAdditionalCheckpoints(packageId: string) {
    return buildAdditionalCheckpoints(packageId, this.checkpointStore);
  }

  getEngineState(): RollbackRetryEngineState {
    return {
      engineId: this.engineId,
      planCount: this.plans.length,
      warnings: [...this.engineWarnings],
      errors: [...this.engineErrors],
    };
  }

  formatReport(): string {
    return formatRollbackRetryReport(this.getEngineState(), this.getPlans());
  }

  getDependencySummary(): string {
    return [
      `recovery_chains@${getDevPulseV2Owner('recovery_chains').phase}`,
      `auto_fix_control_panel@${getDevPulseV2Owner('auto_fix_control_panel').phase}`,
      `founder_approval_execution_gate@${getDevPulseV2Owner('founder_approval_execution_gate').phase}`,
      `execution_reality_validation@${getDevPulseV2Owner('execution_reality_validation').phase}`,
      `execution_evidence_ledger@${getDevPulseV2Owner('execution_evidence_ledger').phase}`,
    ].join(' → ');
  }

  private publishSummary(plan: RollbackRetryPlan): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Rollback/retry plan: ${plan.packageId}`,
      summary: `Plan ${plan.planId} — rollback ${plan.rollbackState}, retry ${plan.retryState}. Planning only.`,
      relatedEvidenceIds: plan.evidenceLinks.map((l) => l.linkId),
      relatedRecordId: plan.planId,
      status: 'INFO',
      warnings: ['Rollback/retry planning only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2RollbackRetryEngine(): DevPulseV2RollbackRetryEngine {
  singleton = new DevPulseV2RollbackRetryEngine();
  return singleton;
}

export function getDevPulseV2RollbackRetryEngine(): DevPulseV2RollbackRetryEngine {
  if (!singleton) {
    singleton = new DevPulseV2RollbackRetryEngine();
  }
  return singleton;
}

export function resetDevPulseV2RollbackRetryEngineForTests(): DevPulseV2RollbackRetryEngine {
  singleton = new DevPulseV2RollbackRetryEngine();
  return singleton;
}

export function engineStateIncludes(states: EngineState[], target: EngineState): boolean {
  return states.includes(target);
}

void getDevPulseV2FounderApprovalExecutionGate;
void getDevPulseV2ExecutionRealityValidation;
void getDevPulseV2ExecutionEvidenceLedger;
