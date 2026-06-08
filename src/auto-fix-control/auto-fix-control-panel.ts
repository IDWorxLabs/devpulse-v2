/**
 * DevPulse V2 Auto-Fix Control Panel — Phase 6.9 fix permission control layer.
 * Governs what fixes would be allowed. Does NOT execute fixes, rollback, or retry.
 */

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
import { classifyFixType } from './auto-fix-classifier.js';
import { attachAutoFixEvidence } from './auto-fix-evidence.js';
import { formatAutoFixControlReport } from './auto-fix-report.js';
import { AutoFixPermissionStore } from './auto-fix-permission-store.js';
import { buildFixStateSequence, evaluateFixPolicy } from './auto-fix-policy-engine.js';
import type {
  AutoFixControlPanelState,
  AutoFixEvaluationInput,
  AutoFixPermissionRecord,
  AutoFixState,
  FixType,
} from './types.js';
import {
  AUTO_FIX_CONTROL_OWNER_MODULE,
  DEPENDENCY_SYSTEMS,
} from './types.js';

let singleton: DevPulseV2AutoFixControlPanel | null = null;

function createPanelId(): string {
  return `auto-fix-panel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createFixId(): string {
  return `auto-fix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneRecord(record: AutoFixPermissionRecord): AutoFixPermissionRecord {
  return {
    ...record,
    evidenceLinks: record.evidenceLinks.map((l) => ({ ...l })),
    stateSequence: [...record.stateSequence],
  };
}

export function evaluateAutoFixPermission(input: AutoFixEvaluationInput): AutoFixPermissionRecord {
  const fixType = classifyFixType(input);
  const policy = evaluateFixPolicy(fixType);
  const evidenceLinks = attachAutoFixEvidence(input);
  const riskLevel = input.recoveryChain?.riskLevel ?? 'MEDIUM';
  const now = Date.now();

  return {
    fixId: createFixId(),
    packageId: input.packageId,
    fixType,
    permissionState: policy.permissionState,
    approvalRequired: policy.approvalRequired,
    verificationRequired: policy.verificationRequired,
    riskLevel,
    evidenceLinks,
    stateSequence: buildFixStateSequence(policy.permissionState),
    createdAt: now,
    updatedAt: now,
    controlLayerOnlyConfirmed: true,
    noFixExecuted: true,
  };
}

export class DevPulseV2AutoFixControlPanel {
  private readonly panelId = createPanelId();
  private readonly store = new AutoFixPermissionStore();
  private panelWarnings: string[] = ['Auto-Fix Control Panel Foundation V1 — permission control only.'];
  private panelErrors: string[] = [];

  static readonly ownerModule = AUTO_FIX_CONTROL_OWNER_MODULE;
  static readonly ownerDomain = 'auto_fix_control_panel' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('auto_fix_control_panel');
    return owner.ownerModule === AUTO_FIX_CONTROL_OWNER_MODULE;
  }

  static assertDuplicateCheckPasses(): boolean {
    const recoveryEngine = getDevPulseV2Owner('recovery_execution_engine');
    const panel = getDevPulseV2Owner('auto_fix_control_panel');
    const recoveryChains = getDevPulseV2Owner('recovery_chains');
    return (
      recoveryEngine.ownerModule !== panel.ownerModule &&
      recoveryChains.ownerModule !== panel.ownerModule &&
      panel.ownerModule === AUTO_FIX_CONTROL_OWNER_MODULE
    );
  }

  static assertDoesNotExecute(): boolean {
    const panel = new DevPulseV2AutoFixControlPanel();
    return (
      typeof (panel as { executeFix?: unknown }).executeFix === 'undefined' &&
      typeof (panel as { performRollback?: unknown }).performRollback === 'undefined' &&
      typeof (panel as { performRetry?: unknown }).performRetry === 'undefined' &&
      typeof (panel as { modifyFiles?: unknown }).modifyFiles === 'undefined'
    );
  }

  static assertNoExecutionPath(): boolean {
    return DevPulseV2AutoFixControlPanel.assertDoesNotExecute();
  }

  static assertNoRollbackPath(): boolean {
    const panel = new DevPulseV2AutoFixControlPanel();
    return typeof (panel as { performRollback?: unknown }).performRollback === 'undefined';
  }

  static assertNoRetryPath(): boolean {
    const panel = new DevPulseV2AutoFixControlPanel();
    return typeof (panel as { performRetry?: unknown }).performRetry === 'undefined';
  }

  static assertNoFileModificationPath(): boolean {
    const panel = new DevPulseV2AutoFixControlPanel();
    return (
      typeof (panel as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (panel as { writeFile?: unknown }).writeFile === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      getDevPulseV2Owner('recovery_chains').ownerModule === RECOVERY_CHAINS_OWNER_MODULE &&
      getDevPulseV2Owner('founder_approval_execution_gate').ownerModule === APPROVAL_GATE_OWNER_MODULE &&
      getDevPulseV2Owner('execution_reality_validation').ownerModule === REALITY_VALIDATION_OWNER_MODULE &&
      getDevPulseV2Owner('execution_evidence_ledger').ownerModule === EVIDENCE_LEDGER_OWNER_MODULE &&
      getDevPulseV2Owner('auto_fix_control_panel').phase === 6.9
    );
  }

  evaluateFix(input: AutoFixEvaluationInput): AutoFixPermissionRecord {
    const record = evaluateAutoFixPermission(input);
    const stored = this.store.setPermission(record);
    this.publishSummary(stored);
    return cloneRecord(stored);
  }

  evaluatePackage(packageId: string): AutoFixPermissionRecord {
    const context = buildGovernanceContextFromSystems(packageId);
    const chains = getDevPulseV2RecoveryChains().getChains().filter((c) => c.packageId === packageId);
    const recoveryChain = chains.length > 0 ? chains[chains.length - 1] : null;

    if (!recoveryChain) {
      getDevPulseV2RecoveryChains().planPackage(packageId);
    }

    const latestChain =
      getDevPulseV2RecoveryChains()
        .getChains()
        .filter((c) => c.packageId === packageId)
        .pop() ?? null;

    return this.evaluateFix({
      packageId,
      recoveryChain: latestChain,
      approvalRecord: context.approvalRecord,
      realityResult: context.realityResult,
      ledgerRecord: context.ledgerRecord,
    });
  }

  evaluateFixType(packageId: string, fixType: FixType): AutoFixPermissionRecord {
    return this.evaluateFix({ packageId, fixType });
  }

  allowFix(fixId: string): AutoFixPermissionRecord | null {
    const updated = this.store.allowFix(fixId);
    return updated ? cloneRecord(updated) : null;
  }

  blockFix(fixId: string): AutoFixPermissionRecord | null {
    const updated = this.store.blockFix(fixId);
    return updated ? cloneRecord(updated) : null;
  }

  rejectFix(fixId: string): AutoFixPermissionRecord | null {
    const updated = this.store.rejectFix(fixId);
    return updated ? cloneRecord(updated) : null;
  }

  getFixPermission(fixId: string): AutoFixPermissionRecord | null {
    return this.store.getFixPermission(fixId);
  }

  getAllFixPermissions(): AutoFixPermissionRecord[] {
    return this.store.getAllFixPermissions();
  }

  getPanelState(): AutoFixControlPanelState {
    const all = this.store.getAllFixPermissions();
    return {
      panelId: this.panelId,
      fixCount: all.length,
      allowedCount: all.filter((r) => r.permissionState === 'ALLOWED').length,
      blockedCount: all.filter((r) => r.permissionState === 'BLOCKED').length,
      pendingCount: all.filter((r) => r.permissionState === 'PENDING_APPROVAL').length,
      rejectedCount: all.filter((r) => r.permissionState === 'REJECTED').length,
      warnings: [...this.panelWarnings],
      errors: [...this.panelErrors],
    };
  }

  formatReport(): string {
    return formatAutoFixControlReport(this.getPanelState(), this.getAllFixPermissions());
  }

  getDependencySummary(): string {
    return DEPENDENCY_SYSTEMS.map((id) => `${id}@${getDevPulseV2Owner(id).phase}`).join(' → ');
  }

  private publishSummary(record: AutoFixPermissionRecord): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Auto-fix permission evaluated: ${record.packageId}`,
      summary: `Fix ${record.fixId} — ${record.fixType} → ${record.permissionState}. Control layer only.`,
      relatedEvidenceIds: record.evidenceLinks.map((l) => l.linkId),
      relatedRecordId: record.fixId,
      status: 'INFO',
      warnings: ['Auto-fix control layer only — no fix executed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2AutoFixControlPanel(): DevPulseV2AutoFixControlPanel {
  singleton = new DevPulseV2AutoFixControlPanel();
  return singleton;
}

export function getDevPulseV2AutoFixControlPanel(): DevPulseV2AutoFixControlPanel {
  if (!singleton) {
    singleton = new DevPulseV2AutoFixControlPanel();
  }
  return singleton;
}

export function resetDevPulseV2AutoFixControlPanelForTests(): DevPulseV2AutoFixControlPanel {
  singleton = new DevPulseV2AutoFixControlPanel();
  return singleton;
}

export function fixStateIncludes(states: AutoFixState[], target: AutoFixState): boolean {
  return states.includes(target);
}

// Ensure upstream singletons are reachable for dependency wiring without unused import warnings.
void getDevPulseV2FounderApprovalExecutionGate;
void getDevPulseV2ExecutionRealityValidation;
void getDevPulseV2ExecutionEvidenceLedger;
