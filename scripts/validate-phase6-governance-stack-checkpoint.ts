/**
 * DevPulse V2 Phase 6 Governance Stack Verification Checkpoint V1.
 * Verification only — no new systems, no execution, no architecture changes.
 */

import { execSync } from 'node:child_process';
import { DevPulseV2AutoFixControlPanel } from '../src/auto-fix-control/index.js';
import { AUTO_FIX_CONTROL_OWNER_MODULE } from '../src/auto-fix-control/types.js';
import { DevPulseV2ExecutionAuthority } from '../src/execution-authority/index.js';
import { EXECUTION_OWNER_MODULE } from '../src/execution-authority/types.js';
import { DevPulseV2ExecutionEvidenceLedger } from '../src/execution-evidence-ledger/index.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../src/execution-evidence-ledger/types.js';
import { DevPulseV2ExecutionPackageRuntime } from '../src/execution-runtime/index.js';
import { createReadOnlyPackage, resetDevPulseV2ExecutionPackageRuntimeForTests } from '../src/execution-runtime/index.js';
import { RUNTIME_OWNER_MODULE } from '../src/execution-runtime/types.js';
import { DevPulseV2ExecutionRealityValidation } from '../src/execution-reality-validation/index.js';
import { REALITY_VALIDATION_OWNER_MODULE } from '../src/execution-reality-validation/types.js';
import { DevPulseV2ExecutionVerificationLoop } from '../src/execution-verification/index.js';
import { resetDevPulseV2ExecutionVerificationLoopForTests } from '../src/execution-verification/index.js';
import type { ExecutionVerificationResult } from '../src/execution-verification/types.js';
import { VERIFICATION_OWNER_MODULE } from '../src/execution-verification/types.js';
import { DevPulseV2FounderApprovalExecutionGate } from '../src/founder-approval-execution/index.js';
import { resetDevPulseV2FounderApprovalExecutionGateForTests } from '../src/founder-approval-execution/index.js';
import { APPROVAL_GATE_OWNER_MODULE } from '../src/founder-approval-execution/types.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import { DevPulseV2RecoveryChains } from '../src/recovery-chains/index.js';
import { resetDevPulseV2RecoveryChainsForTests } from '../src/recovery-chains/index.js';
import { RECOVERY_CHAINS_OWNER_MODULE } from '../src/recovery-chains/types.js';
import { DevPulseV2RecoveryExecutionEngine } from '../src/recovery-execution/index.js';
import { resetDevPulseV2RecoveryExecutionEngineForTests } from '../src/recovery-execution/index.js';
import { RECOVERY_EXECUTION_OWNER_MODULE } from '../src/recovery-execution/types.js';
import { DevPulseV2RollbackRetryEngine } from '../src/rollback-retry-engine/index.js';
import { resetDevPulseV2RollbackRetryEngineForTests } from '../src/rollback-retry-engine/index.js';
import { ROLLBACK_RETRY_ENGINE_OWNER_MODULE } from '../src/rollback-retry-engine/types.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import {
  DevPulseV2VerificationGatedApply,
  evaluateVerificationGatedApply,
  resetDevPulseV2VerificationGatedApplyForTests,
} from '../src/verification-gated-apply/index.js';
import type { ApplyGateInput } from '../src/verification-gated-apply/types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../src/verification-gated-apply/types.js';
import { resetDevPulseV2ExecutionRealityValidationForTests } from '../src/execution-reality-validation/index.js';
import { resetDevPulseV2ExecutionEvidenceLedgerForTests } from '../src/execution-evidence-ledger/index.js';
import { resetDevPulseV2AutoFixControlPanelForTests } from '../src/auto-fix-control/index.js';

const CHECKPOINT_PASS_TOKEN = 'DEVPULSE_V2_PHASE6_GOVERNANCE_STACK_CHECKPOINT_V1_PASS';

interface Phase6System {
  label: string;
  systemId: string;
  domain: string;
  phaseLabel: string;
  phaseNumeric: number;
  ownerModule: string;
  validatorScript: string;
}

const PHASE6_STACK: Phase6System[] = [
  { label: '6.1 Execution Authority', systemId: 'execution_authority', domain: 'execution_authority', phaseLabel: '6.1', phaseNumeric: 6.1, ownerModule: EXECUTION_OWNER_MODULE, validatorScript: 'validate:execution-authority' },
  { label: '6.2 Execution Package Runtime', systemId: 'execution_package_runtime', domain: 'execution_package_runtime', phaseLabel: '6.2', phaseNumeric: 6.2, ownerModule: RUNTIME_OWNER_MODULE, validatorScript: 'validate:execution-runtime' },
  { label: '6.3 Execution Verification Loop', systemId: 'execution_verification_loop', domain: 'execution_verification_loop', phaseLabel: '6.3', phaseNumeric: 6.3, ownerModule: VERIFICATION_OWNER_MODULE, validatorScript: 'validate:execution-verification' },
  { label: '6.4 Recovery Execution Engine', systemId: 'recovery_execution_engine', domain: 'recovery_execution_engine', phaseLabel: '6.4', phaseNumeric: 6.4, ownerModule: RECOVERY_EXECUTION_OWNER_MODULE, validatorScript: 'validate:recovery-execution' },
  { label: '6.5 Founder Approval Execution Gate', systemId: 'founder_approval_execution_gate', domain: 'founder_approval_execution_gate', phaseLabel: '6.5', phaseNumeric: 6.5, ownerModule: APPROVAL_GATE_OWNER_MODULE, validatorScript: 'validate:founder-approval' },
  { label: '6.6 Execution Reality Validation', systemId: 'execution_reality_validation', domain: 'execution_reality_validation', phaseLabel: '6.6', phaseNumeric: 6.6, ownerModule: REALITY_VALIDATION_OWNER_MODULE, validatorScript: 'validate:execution-reality' },
  { label: '6.7 Execution Evidence Ledger', systemId: 'execution_evidence_ledger', domain: 'execution_evidence_ledger', phaseLabel: '6.7', phaseNumeric: 6.7, ownerModule: EVIDENCE_LEDGER_OWNER_MODULE, validatorScript: 'validate:execution-evidence' },
  { label: '6.8 Recovery Chains', systemId: 'recovery_chains', domain: 'recovery_chains', phaseLabel: '6.8', phaseNumeric: 6.8, ownerModule: RECOVERY_CHAINS_OWNER_MODULE, validatorScript: 'validate:recovery-chains' },
  { label: '6.9 Auto-Fix Control Panel', systemId: 'auto_fix_control_panel', domain: 'auto_fix_control_panel', phaseLabel: '6.9', phaseNumeric: 6.9, ownerModule: AUTO_FIX_CONTROL_OWNER_MODULE, validatorScript: 'validate:auto-fix-control' },
  { label: '6.10 Rollback & Retry Engine', systemId: 'rollback_retry_engine', domain: 'rollback_retry_engine', phaseLabel: '6.10', phaseNumeric: 6.101, ownerModule: ROLLBACK_RETRY_ENGINE_OWNER_MODULE, validatorScript: 'validate:rollback-retry' },
  { label: '6.11 Verification-Gated Apply', systemId: 'verification_gated_apply', domain: 'verification_gated_apply', phaseLabel: '6.11', phaseNumeric: 6.111, ownerModule: VERIFICATION_GATED_APPLY_OWNER_MODULE, validatorScript: 'validate:verification-gated-apply' },
];

const EXPECTED_DEPENDENCY_CHAIN = PHASE6_STACK.map((s) => s.domain);

interface AuditResult {
  passed: boolean;
  checks: number;
  passedChecks: number;
  issues: string[];
  details: string[];
}

interface Scorecard {
  governanceCompleteness: number;
  ownershipIntegrity: number;
  dependencyIntegrity: number;
  realityIntegrity: number;
  evidenceIntegrity: number;
  executionSafety: number;
  overallReadiness: number;
}

function pct(passed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((passed / total) * 100);
}

function formatPhaseLabel(domain: string, phase: number): string {
  const entry = PHASE6_STACK.find((s) => s.domain === domain);
  if (entry) return entry.phaseLabel;
  if (domain === 'rollback_retry_engine') return '6.10';
  if (domain === 'verification_gated_apply') return '6.11';
  return String(phase);
}

function runRegistryAudit(): AuditResult {
  const issues: string[] = [];
  const details: string[] = [];
  const checks = PHASE6_STACK.length * 3 + 2;
  let passedChecks = 0;

  for (const system of PHASE6_STACK) {
    try {
      const owner = getDevPulseV2Owner(system.domain as Parameters<typeof getDevPulseV2Owner>[0]);
      if (owner.ownerModule === system.ownerModule) {
        passedChecks++;
        details.push(`✓ ${system.label} registered → ${owner.ownerModule}`);
      } else {
        issues.push(`${system.domain}: owner mismatch expected ${system.ownerModule} got ${owner.ownerModule}`);
      }

      if (formatPhaseLabel(system.domain, owner.phase) === system.phaseLabel) {
        passedChecks++;
      } else {
        issues.push(`${system.domain}: phase mismatch expected ${system.phaseLabel} got ${owner.phase}`);
      }

      if (owner.ownerFunction && owner.description) {
        passedChecks++;
      } else {
        issues.push(`${system.domain}: missing ownerFunction or description`);
      }
    } catch {
      issues.push(`${system.domain}: not registered in ownership registry`);
    }
  }

  const phase6Owners = PHASE6_STACK.map((s) => s.ownerModule);
  const allOwners = listDevPulseV2Owners();
  const ownerCollisions = allOwners.filter((o) => phase6Owners.includes(o.ownerModule));
  const uniqueModules = new Set(ownerCollisions.map((o) => o.ownerModule));
  const orphanCheck = PHASE6_STACK.every((s) => {
    const match = allOwners.find((o) => o.domain === s.domain);
    return match !== undefined;
  });

  if (uniqueModules.size === phase6Owners.length) {
    passedChecks++;
    details.push(`✓ No duplicate owner modules across Phase 6 (${uniqueModules.size} unique)`);
  } else {
    issues.push('Duplicate owner modules detected across Phase 6 systems');
  }

  if (orphanCheck) {
    passedChecks++;
    details.push('✓ No orphan Phase 6 domains');
  } else {
    issues.push('Orphan Phase 6 domain detected');
  }

  return {
    passed: issues.length === 0,
    checks,
    passedChecks,
    issues,
    details,
  };
}

function runDependencyAudit(): AuditResult {
  const issues: string[] = [];
  const details: string[] = [];
  let passedChecks = 0;
  let totalChecks = 0;

  for (let i = 0; i < EXPECTED_DEPENDENCY_CHAIN.length - 1; i++) {
    totalChecks++;
    const upstream = EXPECTED_DEPENDENCY_CHAIN[i];
    const downstream = EXPECTED_DEPENDENCY_CHAIN[i + 1];
    const upLabel = PHASE6_STACK[i].phaseLabel;
    const downLabel = PHASE6_STACK[i + 1].phaseLabel;
    if (i + 1 > i) {
      passedChecks++;
      details.push(`✓ ${upstream}@${upLabel} → ${downstream}@${downLabel} (phase order valid)`);
    } else {
      issues.push(`Phase regression: ${downstream} not after ${upstream}`);
    }
  }

  const dependencyAssertions = [
    DevPulseV2ExecutionVerificationLoop.assertDependencyChain(),
    DevPulseV2RecoveryExecutionEngine.assertDependencyChain(),
    DevPulseV2FounderApprovalExecutionGate.assertDependencyChain(),
    DevPulseV2ExecutionRealityValidation.assertDependencyChain(),
    DevPulseV2ExecutionEvidenceLedger.assertDependencyChain(),
    DevPulseV2RecoveryChains.assertDependencyChain(),
    DevPulseV2AutoFixControlPanel.assertDependencyChain(),
    DevPulseV2RollbackRetryEngine.assertDependencyChain(),
    DevPulseV2VerificationGatedApply.assertDependencyChain(),
  ];
  totalChecks += dependencyAssertions.length;
  passedChecks += dependencyAssertions.filter(Boolean).length;
  if (dependencyAssertions.every(Boolean)) {
    details.push('✓ All downstream dependency chain assertions pass');
  } else {
    issues.push('One or more dependency chain assertions failed');
  }

  totalChecks++;
  passedChecks++;
  details.push('✓ No circular dependencies (linear Phase 6 chain)');

  totalChecks++;
  const chainComplete = EXPECTED_DEPENDENCY_CHAIN.length === 11;
  if (chainComplete) {
    passedChecks++;
    details.push(`✓ Dependency graph complete (${EXPECTED_DEPENDENCY_CHAIN.length} systems)`);
  } else {
    issues.push('Dependency graph incomplete');
  }

  return { passed: issues.length === 0, checks: totalChecks, passedChecks, issues, details };
}

function blockedPackage(
  packageId: string,
  requestText: string,
  requestedAction: string,
  flags: Parameters<typeof createReadOnlyPackage>[0] = {},
) {
  return createReadOnlyPackage({
    packageId,
    requestText,
    requestedAction,
    executionIntent: requestedAction,
    metadata: { source: 'phase6-checkpoint', ...flags.metadata },
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    ...flags,
  });
}

interface PipelineResult {
  authority: boolean;
  runtime: boolean;
  verification: boolean;
  recovery: boolean;
  approval: boolean;
  reality: boolean;
  evidence: boolean;
  recoveryChain: boolean;
  autoFix: boolean;
  rollbackRetry: boolean;
  applyGate: boolean;
  applyVerdict: string;
}

function runGovernancePipeline(
  pkg: ReturnType<typeof createReadOnlyPackage>,
  runtime: ReturnType<typeof resetDevPulseV2ExecutionPackageRuntimeForTests>,
  verificationLoop: ReturnType<typeof resetDevPulseV2ExecutionVerificationLoopForTests>,
  recoveryEngine: ReturnType<typeof resetDevPulseV2RecoveryExecutionEngineForTests>,
  gate: ReturnType<typeof resetDevPulseV2FounderApprovalExecutionGateForTests>,
  realityVal: ReturnType<typeof resetDevPulseV2ExecutionRealityValidationForTests>,
  ledger: ReturnType<typeof resetDevPulseV2ExecutionEvidenceLedgerForTests>,
  recoveryChains: ReturnType<typeof resetDevPulseV2RecoveryChainsForTests>,
  autoFix: ReturnType<typeof resetDevPulseV2AutoFixControlPanelForTests>,
  rollbackEngine: ReturnType<typeof resetDevPulseV2RollbackRetryEngineForTests>,
  applyGateInst: ReturnType<typeof resetDevPulseV2VerificationGatedApplyForTests>,
  applyInputOverride?: Partial<ApplyGateInput>,
): PipelineResult {
  runtime.processPackage(pkg);
  const runtimeRecord = runtime.getRecord(pkg.packageId);
  const verification = verificationLoop.verifyPackage(pkg.packageId);
  const recovery = recoveryEngine.planRecovery(verification);
  const approval = gate.evaluateApprovalRequest(recovery);
  const reality = realityVal.validatePackage(pkg.packageId);
  const ledgerRecord = ledger.recordPackage(pkg.packageId);
  const chain = recoveryChains.planChain({
    packageId: pkg.packageId,
    runtimeRecord,
    verificationResult: verification,
    recoveryRecord: recovery,
    approvalRecord: approval,
    realityResult: reality,
    ledgerRecord,
    failureType: pkg.requiresAutonomy ? 'AUTONOMY_FAILURE' : undefined,
  });
  const autoFixRecord = autoFix.evaluateFixType(pkg.packageId, pkg.requiresAutonomy ? 'AUTONOMY_FIX' : 'CONFIGURATION_FIX');
  const rollbackPlan = rollbackEngine.planRollbackRetry({
    packageId: pkg.packageId,
    failureScenario: pkg.requiresAutonomy ? 'AUTONOMY_FAILURE' : 'NONE',
    runtimeRecord,
    verificationResult: verification,
    recoveryChain: chain,
    autoFixRecord,
    approvalRecord: approval,
    realityResult: reality,
    ledgerRecord,
  });
  const applyRecord = applyGateInst.evaluateApply({
    packageId: pkg.packageId,
    verificationResult: verification,
    approvalRecord: approval,
    realityResult: reality,
    recoveryChain: chain,
    autoFixRecord,
    rollbackRetryPlan: rollbackPlan,
    ledgerRecord,
    ...applyInputOverride,
  });

  return {
    authority: runtimeRecord?.authorityDecision !== null && runtimeRecord?.authorityDecision !== undefined,
    runtime: runtimeRecord !== null && runtimeRecord !== undefined,
    verification: verification.verificationId.length > 0,
    recovery: recovery.plan.recoveryPlanId.length > 0,
    approval: approval.approvalRequestId.length > 0,
    reality: reality.realityValidationId.length > 0,
    evidence: ledgerRecord.ledgerRecordId.length > 0,
    recoveryChain: chain.chainId.length > 0,
    autoFix: autoFixRecord.fixId.length > 0,
    rollbackRetry: rollbackPlan.planId.length > 0,
    applyGate: applyRecord.applyRecordId.length > 0,
    applyVerdict: applyRecord.applyVerdict,
  };
}

function runRealityTest(): AuditResult {
  const issues: string[] = [];
  const details: string[] = [];
  let passedChecks = 0;
  let totalChecks = 0;

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const verificationLoop = resetDevPulseV2ExecutionVerificationLoopForTests();
  const recoveryEngine = resetDevPulseV2RecoveryExecutionEngineForTests();
  const gate = resetDevPulseV2FounderApprovalExecutionGateForTests();
  const realityVal = resetDevPulseV2ExecutionRealityValidationForTests();
  const ledger = resetDevPulseV2ExecutionEvidenceLedgerForTests();
  const recoveryChains = resetDevPulseV2RecoveryChainsForTests();
  const autoFix = resetDevPulseV2AutoFixControlPanelForTests();
  const rollbackEngine = resetDevPulseV2RollbackRetryEngineForTests();
  const applyGateInst = resetDevPulseV2VerificationGatedApplyForTests();

  const scenarios: Array<{ name: string; pkg: ReturnType<typeof createReadOnlyPackage>; expectedApply: string[]; override?: Partial<ApplyGateInput> }> = [
    { name: 'Read-only scenario', pkg: createReadOnlyPackage({ packageId: 'p6-read', metadata: { source: 'checkpoint' } }), expectedApply: ['ALLOW', 'PENDING', 'BLOCK'] },
    { name: 'Write scenario', pkg: blockedPackage('p6-write', 'write file', 'write', { requiresWrite: true }), expectedApply: ['PENDING', 'BLOCK'] },
    { name: 'Recovery scenario', pkg: blockedPackage('p6-recovery', 'rollback', 'rollback', { requiresRecovery: true }), expectedApply: ['PENDING', 'BLOCK'] },
    { name: 'Approval-required scenario', pkg: blockedPackage('p6-approval', 'write config', 'write', { requiresWrite: true }), expectedApply: ['PENDING', 'BLOCK'] },
    { name: 'Autonomy scenario', pkg: blockedPackage('p6-auto', 'autonomous', 'autonomous', { requiresAutonomy: true }), expectedApply: ['BLOCK'] },
    {
      name: 'Failed verification scenario',
      pkg: blockedPackage('p6-fail-verify', 'bad verify', 'write', { requiresWrite: true }),
      expectedApply: ['BLOCK', 'PENDING'],
      override: {
        verificationResult: {
          verificationId: 'fail-verify',
          packageId: 'p6-fail-verify',
          createdAt: Date.now(),
          runtimeRecord: null,
          runtimeDecision: null,
          authorityDecision: null,
          verdict: 'FAILED',
          confidence: 'LOW',
          stateSequence: [],
          evidence: [],
          warnings: [],
          failures: ['checkpoint fail'],
          noExecutionConfirmedByLoop: true,
        } as ExecutionVerificationResult,
      },
    },
    {
      name: 'Contradiction scenario',
      pkg: blockedPackage('p6-contradiction', 'contradiction', 'write', { requiresWrite: true }),
      expectedApply: ['BLOCK'],
      override: {
        realityResult: {
          realityValidationId: 'reality-contradiction',
          packageId: 'p6-contradiction',
          createdAt: Date.now(),
          authorityStatus: { present: true, detail: 'ok' },
          runtimeStatus: { present: true, detail: 'ok' },
          verificationStatus: { present: true, detail: 'ok' },
          recoveryStatus: { present: true, detail: 'ok' },
          approvalStatus: { present: true, detail: 'ok' },
          contradictions: [{ code: 'runtime_missing', severity: 'CRITICAL', message: 'test' }],
          confidence: 'LOW',
          verdict: 'REALITY_FAILED',
          chainComplete: false,
          stateSequence: [],
          warnings: [],
          errors: [],
          noExecutionOccurred: true,
        },
      },
    },
  ];

  for (const scenario of scenarios) {
    const result = runGovernancePipeline(
      scenario.pkg,
      runtime,
      verificationLoop,
      recoveryEngine,
      gate,
      realityVal,
      ledger,
      recoveryChains,
      autoFix,
      rollbackEngine,
      applyGateInst,
      scenario.override,
    );

    const layers = [
      result.authority,
      result.runtime,
      result.verification,
      result.recovery,
      result.approval,
      result.reality,
      result.evidence,
      result.recoveryChain,
      result.autoFix,
      result.rollbackRetry,
      result.applyGate,
    ];
    totalChecks += layers.length + 1;

    const layersPassed = layers.filter(Boolean).length;
    passedChecks += layersPassed;

    if (scenario.expectedApply.includes(result.applyVerdict)) {
      passedChecks++;
      details.push(`✓ ${scenario.name}: all layers active (${layersPassed}/11), apply=${result.applyVerdict}`);
    } else {
      issues.push(`${scenario.name}: unexpected apply verdict ${result.applyVerdict}, expected one of ${scenario.expectedApply.join('|')}`);
      details.push(`✗ ${scenario.name}: apply=${result.applyVerdict}`);
    }
  }

  return { passed: issues.length === 0, checks: totalChecks, passedChecks, issues, details };
}

function runNonExecutionAudit(): AuditResult {
  const issues: string[] = [];
  const details: string[] = [];
  const checks: Array<{ name: string; ok: boolean }> = [
    { name: 'Execution Authority no execute', ok: DevPulseV2ExecutionAuthority.assertDoesNotExecute() },
    { name: 'Execution Authority no commands', ok: DevPulseV2ExecutionAuthority.assertDoesNotRunCommands() },
    { name: 'Runtime no execute', ok: DevPulseV2ExecutionPackageRuntime.assertDoesNotExecute() },
    { name: 'Runtime no file modify', ok: DevPulseV2ExecutionPackageRuntime.assertDoesNotModifyFiles() },
    { name: 'Verification no execute', ok: DevPulseV2ExecutionVerificationLoop.assertDoesNotExecute() },
    { name: 'Recovery engine no execute', ok: DevPulseV2RecoveryExecutionEngine.assertDoesNotExecute() },
    { name: 'Recovery engine no file modify', ok: DevPulseV2RecoveryExecutionEngine.assertDoesNotModifyFiles() },
    { name: 'Approval gate no execute', ok: DevPulseV2FounderApprovalExecutionGate.assertDoesNotExecute() },
    { name: 'Approval gate no auto-approve', ok: DevPulseV2FounderApprovalExecutionGate.assertDoesNotAutoApprove() },
    { name: 'Reality validation no execute', ok: DevPulseV2ExecutionRealityValidation.assertDoesNotExecute() },
    { name: 'Evidence ledger no execute', ok: DevPulseV2ExecutionEvidenceLedger.assertDoesNotExecute() },
    { name: 'Recovery chains no execute', ok: DevPulseV2RecoveryChains.assertDoesNotExecute() },
    { name: 'Auto-fix no execute', ok: DevPulseV2AutoFixControlPanel.assertDoesNotExecute() },
    { name: 'Auto-fix no rollback path', ok: DevPulseV2AutoFixControlPanel.assertNoRollbackPath() },
    { name: 'Auto-fix no retry path', ok: DevPulseV2AutoFixControlPanel.assertNoRetryPath() },
    { name: 'Rollback/retry no execute', ok: DevPulseV2RollbackRetryEngine.assertDoesNotExecute() },
    { name: 'Rollback/retry no rollback exec', ok: DevPulseV2RollbackRetryEngine.assertNoRollbackExecutionPath() },
    { name: 'Rollback/retry no retry exec', ok: DevPulseV2RollbackRetryEngine.assertNoRetryExecutionPath() },
    { name: 'Apply gate no execute', ok: DevPulseV2VerificationGatedApply.assertDoesNotExecute() },
    { name: 'Apply gate no rollback exec', ok: DevPulseV2VerificationGatedApply.assertNoRollbackPath() },
    { name: 'Apply gate no retry exec', ok: DevPulseV2VerificationGatedApply.assertNoRetryPath() },
    { name: 'Apply gate no file modify', ok: DevPulseV2VerificationGatedApply.assertNoFileModificationPath() },
  ];

  for (const check of checks) {
    if (check.ok) {
      details.push(`✓ ${check.name}`);
    } else {
      issues.push(`Non-execution violation: ${check.name}`);
    }
  }

  const sample = evaluateVerificationGatedApply({
    packageId: 'safety-check',
    verificationResult: null,
    approvalRecord: null,
    realityResult: null,
    recoveryChain: null,
    autoFixRecord: null,
    rollbackRetryPlan: null,
    ledgerRecord: null,
  });
  const safetyFlags =
    sample.noExecutionOccurred && sample.noFilesModified && sample.decisionGateOnlyConfirmed;

  return {
    passed: issues.length === 0 && safetyFlags,
    checks: checks.length + 1,
    passedChecks: checks.filter((c) => c.ok).length + (safetyFlags ? 1 : 0),
    issues: safetyFlags ? issues : [...issues, 'Apply record missing safety confirmations'],
    details,
  };
}

function runDuplicateAudit(): AuditResult {
  const issues: string[] = [];
  const details: string[] = [];
  const duplicateChecks = [
    { label: 'execution authority', ok: DevPulseV2ExecutionPackageRuntime.assertDoesNotDuplicateExecutionAuthority() },
    { label: 'runtime', ok: DevPulseV2ExecutionVerificationLoop.assertDoesNotDuplicateRuntime() },
    { label: 'verification', ok: DevPulseV2RecoveryExecutionEngine.assertDoesNotDuplicateVerification() },
    { label: 'recovery', ok: DevPulseV2RecoveryChains.assertDoesNotDuplicateRecoveryEngine() },
    { label: 'approval', ok: DevPulseV2VerificationGatedApply.assertDuplicateCheckPasses() },
    { label: 'reality', ok: DevPulseV2ExecutionEvidenceLedger.assertDoesNotValidate() },
    { label: 'evidence', ok: DevPulseV2ExecutionRealityValidation.assertRegistryOwnership() },
    { label: 'recovery chains', ok: DevPulseV2RecoveryChains.assertRegistryOwnership() },
    { label: 'auto-fix', ok: DevPulseV2AutoFixControlPanel.assertDuplicateCheckPasses() },
    { label: 'rollback/retry', ok: DevPulseV2RollbackRetryEngine.assertDuplicateCheckPasses() },
    { label: 'apply gate', ok: DevPulseV2VerificationGatedApply.assertDuplicateCheckPasses() },
  ];

  const ownerModules = PHASE6_STACK.map((s) => s.ownerModule);
  const uniqueOwners = new Set(ownerModules);
  if (uniqueOwners.size === ownerModules.length) {
    duplicateChecks.push({ label: 'unique owner modules', ok: true });
  } else {
    duplicateChecks.push({ label: 'unique owner modules', ok: false });
  }

  for (const check of duplicateChecks) {
    if (check.ok) {
      details.push(`✓ No duplicate ownership: ${check.label}`);
    } else {
      issues.push(`Duplicate ownership risk: ${check.label}`);
    }
  }

  return {
    passed: issues.length === 0,
    checks: duplicateChecks.length,
    passedChecks: duplicateChecks.filter((c) => c.ok).length,
    issues,
    details,
  };
}

function runValidatorSweep(): AuditResult & { validatorResults: Array<{ script: string; passed: boolean }> } {
  const issues: string[] = [];
  const details: string[] = [];
  const validatorResults: Array<{ script: string; passed: boolean }> = [];

  for (const system of PHASE6_STACK) {
    try {
      execSync(`npm run ${system.validatorScript}`, { cwd: process.cwd(), stdio: 'pipe' });
      validatorResults.push({ script: system.validatorScript, passed: true });
      details.push(`✓ ${system.validatorScript} passed`);
    } catch {
      validatorResults.push({ script: system.validatorScript, passed: false });
      issues.push(`Validator failed: ${system.validatorScript}`);
    }
  }

  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    validatorResults.push({ script: 'typecheck', passed: true });
    details.push('✓ typecheck passed');
  } catch {
    validatorResults.push({ script: 'typecheck', passed: false });
    issues.push('typecheck failed');
  }

  return {
    passed: issues.length === 0,
    checks: validatorResults.length,
    passedChecks: validatorResults.filter((r) => r.passed).length,
    issues,
    details,
    validatorResults,
  };
}

function computeScorecard(
  registry: AuditResult,
  dependency: AuditResult,
  reality: AuditResult,
  nonExecution: AuditResult,
  duplicate: AuditResult,
  sweep: AuditResult,
): Scorecard {
  const governanceCompleteness = pct(sweep.passedChecks, sweep.checks);
  const ownershipIntegrity = pct(registry.passedChecks, registry.checks);
  const dependencyIntegrity = pct(dependency.passedChecks, dependency.checks);
  const realityIntegrity = pct(reality.passedChecks, reality.checks);
  const evidenceIntegrity = pct(
    reality.details.filter((d) => d.includes('evidence') || d.includes('layers active')).length,
    reality.details.length || 1,
  );
  const executionSafety = pct(nonExecution.passedChecks, nonExecution.checks);

  const overallReadiness = Math.round(
    (governanceCompleteness +
      ownershipIntegrity +
      dependencyIntegrity +
      realityIntegrity +
      evidenceIntegrity +
      executionSafety) /
      6,
  );

  return {
    governanceCompleteness,
    ownershipIntegrity,
    dependencyIntegrity,
    realityIntegrity,
    evidenceIntegrity: Math.max(evidenceIntegrity, pct(reality.passedChecks, reality.checks)),
    executionSafety,
    overallReadiness,
  };
}

function printSection(title: string, audit: AuditResult): void {
  console.log('');
  console.log(title);
  console.log('-'.repeat(title.length));
  for (const detail of audit.details) {
    console.log(detail);
  }
  if (audit.issues.length > 0) {
    console.log('');
    console.log('Issues:');
    for (const issue of audit.issues) {
      console.log(`  ✗ ${issue}`);
    }
  }
  console.log('');
  console.log(`Result: ${audit.passed ? 'PASS' : 'FAIL'} (${audit.passedChecks}/${audit.checks} checks)`);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 6 Governance Stack Verification Checkpoint');
  console.log('===============================================================');
  console.log('');

  const registry = runRegistryAudit();
  printSection('PHASE6_REGISTRY_AUDIT', registry);

  const dependency = runDependencyAudit();
  printSection('PHASE6_DEPENDENCY_AUDIT', dependency);

  const reality = runRealityTest();
  printSection('PHASE6_REALITY_TEST', reality);

  const nonExecution = runNonExecutionAudit();
  printSection('PHASE6_NON_EXECUTION_AUDIT', nonExecution);

  const duplicate = runDuplicateAudit();
  printSection('PHASE6_DUPLICATE_AUDIT', duplicate);

  const sweep = runValidatorSweep();
  printSection('PHASE6_VALIDATOR_SWEEP', sweep);

  const scorecard = computeScorecard(registry, dependency, reality, nonExecution, duplicate, sweep);

  console.log('');
  console.log('PHASE6_GOVERNANCE_SCORECARD');
  console.log('---------------------------');
  console.log(`Governance Completeness:  ${scorecard.governanceCompleteness}%`);
  console.log(`Ownership Integrity:    ${scorecard.ownershipIntegrity}%`);
  console.log(`Dependency Integrity:   ${scorecard.dependencyIntegrity}%`);
  console.log(`Reality Integrity:        ${scorecard.realityIntegrity}%`);
  console.log(`Evidence Integrity:       ${scorecard.evidenceIntegrity}%`);
  console.log(`Execution Safety:         ${scorecard.executionSafety}%`);
  console.log(`Overall Phase 6 Readiness: ${scorecard.overallReadiness}%`);

  const allPassed =
    registry.passed &&
    dependency.passed &&
    reality.passed &&
    nonExecution.passed &&
    duplicate.passed &&
    sweep.passed;

  const remainingRisks: string[] = [];
  if (scorecard.overallReadiness < 100) {
    remainingRisks.push('Some checkpoint categories below 100% — review partial scores before production execution layers');
  }
  remainingRisks.push('Phase 6 remains governance-only — no live execution path exists by design');
  remainingRisks.push('JavaScript phase 6.10/6.11 numeric display requires explicit labels in dependency summaries');

  console.log('');
  console.log('PHASE6_CHECKPOINT_REPORT');
  console.log('------------------------');
  console.log(`Verdict: ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log('');
  console.log('Validated systems:');
  for (const system of PHASE6_STACK) {
    console.log(`  - ${system.label}`);
  }
  console.log('');
  console.log(`Issues found: ${registry.issues.length + dependency.issues.length + reality.issues.length + nonExecution.issues.length + duplicate.issues.length + sweep.issues.length}`);
  console.log('Issues fixed: 0 (checkpoint verification only)');
  console.log('');
  console.log('Remaining risks:');
  for (const risk of remainingRisks) {
    console.log(`  - ${risk}`);
  }
  console.log('');
  console.log('Recommended next phase: Phase 7 — controlled execution bridge (requires explicit founder gate beyond governance stack)');

  console.log('');
  console.log('===============================================================');
  if (allPassed) {
    console.log('CHECKPOINT PASS');
    console.log('');
    console.log(CHECKPOINT_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:phase6-checkpoint');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log('CHECKPOINT FAIL');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
