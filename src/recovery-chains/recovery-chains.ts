/**
 * DevPulse V2 Recovery Chains — Phase 6.8 planning/orchestration layer above governance stack.
 * Produces recovery step plans only. Does NOT execute, repair, rollback, or retry.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import {
  buildChainStateSequence,
  buildRecoveryStepsForFailure,
  createChainId,
  resolveFailureReason,
  resolveFailureType,
} from './recovery-chain-builder.js';
import { attachRecoveryChainEvidence } from './recovery-chain-evidence.js';
import { formatRecoveryChainReport } from './recovery-chain-report.js';
import {
  assertRecoveryChainsDependenciesPresent,
  buildGovernanceContextFromSystems,
} from './recovery-chains-bridge.js';
import { evaluateChainRisk } from './recovery-chain-risk-engine.js';
import { validateRecoveryChain } from './recovery-chain-validator.js';
import { deriveChainFlags } from './recovery-step-classifier.js';
import type {
  ChainState,
  RecoveryChain,
  RecoveryChainGovernanceContext,
  RecoveryChainsState,
} from './types.js';
import { RECOVERY_CHAINS_OWNER_MODULE } from './types.js';

let singleton: DevPulseV2RecoveryChains | null = null;

function createChainsId(): string {
  return `recovery-chains-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneChain(chain: RecoveryChain): RecoveryChain {
  return {
    ...chain,
    recoverySteps: chain.recoverySteps.map((s) => ({ ...s })),
    evidenceLinks: chain.evidenceLinks.map((l) => ({ ...l })),
    stateSequence: [...chain.stateSequence],
  };
}

export function planRecoveryChainFromContext(context: RecoveryChainGovernanceContext): RecoveryChain {
  const failureType = resolveFailureType(context);
  const failureReason = resolveFailureReason(context, failureType);
  const recoverySteps = buildRecoveryStepsForFailure(failureType, context);

  const validation = validateRecoveryChain(failureType, recoverySteps);
  if (!validation.valid) {
    throw new Error(`Invalid recovery chain: ${validation.errors.join('; ')}`);
  }

  const riskLevel = evaluateChainRisk(failureType, recoverySteps);
  const flags = deriveChainFlags(recoverySteps);
  const evidenceLinks = attachRecoveryChainEvidence(context);

  return {
    chainId: createChainId(),
    packageId: context.packageId,
    failureReason,
    failureType,
    recoverySteps,
    riskLevel,
    approvalRequired: flags.approvalRequired,
    verificationRequired: flags.verificationRequired,
    rollbackRequired: flags.rollbackRequired,
    retryRequired: flags.retryRequired,
    evidenceLinks,
    stateSequence: buildChainStateSequence(),
    createdAt: Date.now(),
    planningOnlyConfirmed: true,
    noRecoveryExecuted: true,
  };
}

export class DevPulseV2RecoveryChains {
  private readonly chainsId = createChainsId();
  private readonly chains: RecoveryChain[] = [];
  private chainsWarnings: string[] = ['Recovery Chains Foundation V1 — planning/orchestration only.'];
  private chainsErrors: string[] = [];

  static readonly ownerModule = RECOVERY_CHAINS_OWNER_MODULE;
  static readonly ownerDomain = 'recovery_chains' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('recovery_chains');
    return owner.ownerModule === RECOVERY_CHAINS_OWNER_MODULE;
  }

  static assertDoesNotExecute(): boolean {
    const chains = new DevPulseV2RecoveryChains();
    return (
      typeof (chains as { execute?: unknown }).execute === 'undefined' &&
      typeof (chains as { performRollback?: unknown }).performRollback === 'undefined' &&
      typeof (chains as { performRetry?: unknown }).performRetry === 'undefined' &&
      typeof (chains as { performRepair?: unknown }).performRepair === 'undefined'
    );
  }

  static assertDoesNotDuplicateRecoveryEngine(): boolean {
    const recovery = getDevPulseV2Owner('recovery_execution_engine');
    const chains = getDevPulseV2Owner('recovery_chains');
    return recovery.ownerModule !== chains.ownerModule;
  }

  static assertDependencyChain(): boolean {
    return (
      assertRecoveryChainsDependenciesPresent() &&
      getDevPulseV2Owner('recovery_execution_engine').phase === 6.4 &&
      getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5 &&
      getDevPulseV2Owner('execution_reality_validation').phase === 6.6 &&
      getDevPulseV2Owner('execution_evidence_ledger').phase === 6.7 &&
      getDevPulseV2Owner('recovery_chains').phase === 6.8
    );
  }

  planChain(context: RecoveryChainGovernanceContext): RecoveryChain {
    const chain = planRecoveryChainFromContext(context);
    this.chains.push(cloneChain(chain));
    this.publishSummary(chain);
    return cloneChain(chain);
  }

  planPackage(packageId: string): RecoveryChain {
    const context = buildGovernanceContextFromSystems(packageId);
    return this.planChain(context);
  }

  getChains(): RecoveryChain[] {
    return this.chains.map(cloneChain);
  }

  getChainsState(): RecoveryChainsState {
    return {
      chainsId: this.chainsId,
      chainCount: this.chains.length,
      warnings: [...this.chainsWarnings],
      errors: [...this.chainsErrors],
    };
  }

  formatReport(): string {
    return formatRecoveryChainReport(this.getChainsState(), this.getChains());
  }

  private publishSummary(chain: RecoveryChain): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Recovery chain planned: ${chain.packageId}`,
      summary: `Chain ${chain.chainId} — ${chain.recoverySteps.length} steps, risk ${chain.riskLevel}. Planning only.`,
      relatedEvidenceIds: chain.evidenceLinks.map((l) => l.linkId),
      relatedRecordId: chain.chainId,
      status: 'INFO',
      warnings: ['Recovery chain generated only — no recovery executed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2RecoveryChains(): DevPulseV2RecoveryChains {
  singleton = new DevPulseV2RecoveryChains();
  return singleton;
}

export function getDevPulseV2RecoveryChains(): DevPulseV2RecoveryChains {
  if (!singleton) {
    singleton = new DevPulseV2RecoveryChains();
  }
  return singleton;
}

export function resetDevPulseV2RecoveryChainsForTests(): DevPulseV2RecoveryChains {
  singleton = new DevPulseV2RecoveryChains();
  return singleton;
}

export function chainStateIncludes(states: ChainState[], target: ChainState): boolean {
  return states.includes(target);
}
