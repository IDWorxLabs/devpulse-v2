/**
 * DevPulse V2 Execution Reality Validation — Phase 6 governance chain reality layer.
 * Does NOT execute, modify files, perform recovery, or auto-approve.
 */

import { assertSingleAnswerAuthorityRegistered } from '../chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../chat/types.js';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { formatExecutionRealityReport } from './execution-reality-report.js';
import {
  assertPhase6DependenciesPresent,
  buildRealityChainFromSystems,
} from './reality-bridge.js';
import { validateRealityChainCompleteness } from './reality-chain-validator.js';
import {
  checkApprovalLayer,
  checkAuthorityLayer,
  checkRecoveryLayer,
  checkRuntimeLayer,
  checkVerificationLayer,
  isApprovalRequired,
  isRecoveryRequired,
} from './reality-consistency-checker.js';
import {
  computeRealityConfidence,
  computeRealityVerdict,
} from './reality-confidence-engine.js';
import { detectRealityContradictions } from './reality-contradiction-detector.js';
import type {
  ExecutionRealityChainInput,
  ExecutionRealityResult,
  ExecutionRealityValidationState,
  RealityState,
} from './types.js';
import { REALITY_VALIDATION_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2ExecutionRealityValidation | null = null;

function createValidationId(): string {
  return `reality-val-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createValidatorId(): string {
  return `reality-validator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneResult(result: ExecutionRealityResult): ExecutionRealityResult {
  return {
    ...result,
    contradictions: result.contradictions.map((c) => ({ ...c })),
    stateSequence: [...result.stateSequence],
    warnings: [...result.warnings],
    errors: [...result.errors],
  };
}

function buildRealityStateSequence(chain: ExecutionRealityChainInput): RealityState[] {
  const states: RealityState[] = ['REALITY_INPUT_RECEIVED'];
  const rejected = chain.runtimeRecord?.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE';

  const authority = checkAuthorityLayer(chain);
  const runtime = checkRuntimeLayer(chain);
  const verification = checkVerificationLayer(chain);
  const recovery = checkRecoveryLayer(chain);
  const approval = checkApprovalLayer(chain);

  if (authority.present || rejected) {
    states.push('AUTHORITY_VALIDATED');
  }
  if (runtime.present) {
    states.push('RUNTIME_VALIDATED');
  }
  if (verification.present) {
    states.push('VERIFICATION_VALIDATED');
  }
  if (recovery.present || !isRecoveryRequired(chain)) {
    states.push('RECOVERY_VALIDATED');
  }
  if (approval.present || !isApprovalRequired(chain)) {
    states.push('APPROVAL_VALIDATED');
  }

  states.push(
    'CONSISTENCY_CHECK_COMPLETED',
    'CONTRADICTION_CHECK_COMPLETED',
    'CONFIDENCE_COMPUTED',
    'REALITY_VALIDATION_COMPLETE',
  );

  return states;
}

export function validateExecutionRealityChain(
  chain: ExecutionRealityChainInput,
): ExecutionRealityResult {
  const authorityStatus = checkAuthorityLayer(chain);
  const runtimeStatus = checkRuntimeLayer(chain);
  const verificationStatus = checkVerificationLayer(chain);
  const recoveryStatus = checkRecoveryLayer(chain);
  const approvalStatus = checkApprovalLayer(chain);

  const contradictions = detectRealityContradictions(chain);
  const chainComplete = validateRealityChainCompleteness(chain);
  const confidence = computeRealityConfidence(chain, chainComplete);
  const verdict = computeRealityVerdict(chain, confidence, chainComplete);

  const warnings = [
    'Execution Reality Validation — governance alignment check only, no execution performed.',
  ];
  const errors = contradictions
    .filter((c) => c.severity === 'CRITICAL')
    .map((c) => c.message);

  return {
    realityValidationId: createValidationId(),
    packageId: chain.packageId,
    createdAt: Date.now(),
    authorityStatus,
    runtimeStatus,
    verificationStatus,
    recoveryStatus,
    approvalStatus,
    contradictions,
    confidence,
    verdict,
    chainComplete,
    stateSequence: buildRealityStateSequence(chain),
    warnings,
    errors,
    noExecutionOccurred: true,
  };
}

export class DevPulseV2ExecutionRealityValidation {
  private readonly validatorId = createValidatorId();
  private readonly results: ExecutionRealityResult[] = [];
  private validatorWarnings: string[] = [
    'Execution Reality Validation Foundation V1 — reality layer only.',
  ];
  private validatorErrors: string[] = [];

  static readonly ownerModule = REALITY_VALIDATION_OWNER_MODULE;
  static readonly ownerDomain = 'execution_reality_validation' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('execution_reality_validation');
    return owner.ownerModule === REALITY_VALIDATION_OWNER_MODULE;
  }

  static assertDoesNotExecute(): boolean {
    const validator = new DevPulseV2ExecutionRealityValidation();
    return (
      typeof (validator as { execute?: unknown }).execute === 'undefined' &&
      typeof (validator as { runRecovery?: unknown }).runRecovery === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      assertPhase6DependenciesPresent() &&
      getDevPulseV2Owner('execution_authority').phase === 6.1 &&
      getDevPulseV2Owner('execution_package_runtime').phase === 6.2 &&
      getDevPulseV2Owner('execution_verification_loop').phase === 6.3 &&
      getDevPulseV2Owner('recovery_execution_engine').phase === 6.4 &&
      getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5 &&
      getDevPulseV2Owner('execution_reality_validation').phase === 6.6
    );
  }

  static assertDoesNotBecomeAnswerAuthority(): boolean {
    const chat = getDevPulseV2Owner('chat_authority');
    const answer = getDevPulseV2Owner('chat_answer_authority');
    const validation = getDevPulseV2Owner('execution_reality_validation');
    return (
      chat.ownerModule === CHAT_OWNER_MODULE &&
      answer.ownerModule === CHAT_OWNER_MODULE &&
      validation.ownerModule === REALITY_VALIDATION_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered()
    );
  }

  validatePackage(packageId: string): ExecutionRealityResult {
    const chain = buildRealityChainFromSystems(packageId);
    return this.validateChain(chain);
  }

  validateChain(chain: ExecutionRealityChainInput): ExecutionRealityResult {
    const result = validateExecutionRealityChain(chain);
    this.results.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  getResults(): ExecutionRealityResult[] {
    return this.results.map(cloneResult);
  }

  getValidatorState(): ExecutionRealityValidationState {
    return {
      validatorId: this.validatorId,
      validationCount: this.results.length,
      trustedCount: this.results.filter((r) => r.verdict === 'REALITY_TRUSTED').length,
      warningCount: this.results.filter((r) => r.verdict === 'REALITY_WARNING').length,
      failedCount: this.results.filter((r) => r.verdict === 'REALITY_FAILED').length,
      warnings: [...this.validatorWarnings],
      errors: [...this.validatorErrors],
    };
  }

  formatReport(): string {
    return formatExecutionRealityReport(this.getValidatorState(), this.getResults());
  }

  private publishSummary(result: ExecutionRealityResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Execution reality: ${result.verdict}`,
      summary: `Package ${result.packageId} — confidence ${result.confidence}. Validation only, no execution.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.realityValidationId,
      status: result.verdict === 'REALITY_TRUSTED' ? 'PASS' : result.verdict === 'REALITY_WARNING' ? 'WARN' : 'FAIL',
      warnings: [...result.warnings],
      errors: [...result.errors],
    });
  }
}

export function createDevPulseV2ExecutionRealityValidation(): DevPulseV2ExecutionRealityValidation {
  singleton = new DevPulseV2ExecutionRealityValidation();
  return singleton;
}

export function getDevPulseV2ExecutionRealityValidation(): DevPulseV2ExecutionRealityValidation {
  if (!singleton) {
    singleton = new DevPulseV2ExecutionRealityValidation();
  }
  return singleton;
}

export function resetDevPulseV2ExecutionRealityValidationForTests(): DevPulseV2ExecutionRealityValidation {
  singleton = new DevPulseV2ExecutionRealityValidation();
  return singleton;
}

export function realityStateIncludes(states: RealityState[], target: RealityState): boolean {
  return states.includes(target);
}
