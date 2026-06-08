/**
 * DevPulse V2 World 2 Workspace Foundation — Phase 7.1 isolated project workspace system.
 * Foundation only — no autonomous builder, execution planner, simulation, or learning loop.
 */

import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { resetWorkspaceIdentityCounterForTests } from './workspace-identity.js';
import { WorkspaceManager } from './workspace-manager.js';
import {
  isCommunicationAllowed,
  isCommunicationBlocked,
  boundaryOutputKey,
} from './workspace-boundary-rules.js';
import {
  evaluateWorkspaceIsolation,
  isolationOutputKey,
  assertFileOwnership,
  rejectOrphanFile,
} from './workspace-isolation-policy.js';
import {
  assertConstitutionReferenced,
  assertDistinctFromWorld2IsolationGate,
  assertGovernanceStackPresent,
  assertNoGovernanceBypassAttempt,
  assertWorld1FoundationProtected,
  getGovernanceBridgeSummary,
} from './world2-governance-bridge.js';
import { buildWorld2WorkspaceReport, formatWorld2WorkspaceReport } from './world2-report.js';
import type { WorkspaceCreateInput, World2WorkspaceFoundationState } from './types.js';
import {
  DUPLICATE_PATTERNS,
  MAX_WORKSPACES,
  WORLD2_WORKSPACE_OWNER_MODULE,
  WORLD2_WORKSPACE_PASS_TOKEN,
} from './types.js';

let singleton: DevPulseV2World2WorkspaceFoundation | null = null;

function createFoundationId(): string {
  return `world2-workspace-foundation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DevPulseV2World2WorkspaceFoundation {
  private readonly foundationId = createFoundationId();
  private readonly manager = new WorkspaceManager();
  private foundationWarnings: string[] = [
    'World 2 Workspace Foundation V1 — isolated project workspaces only.',
    'No autonomous builder, execution planner, simulation runtime, or learning loop.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = WORLD2_WORKSPACE_OWNER_MODULE;
  static readonly ownerDomain = 'world2_workspace_foundation' as const;
  static readonly passToken = WORLD2_WORKSPACE_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('world2_workspace_foundation');
    return owner.ownerModule === WORLD2_WORKSPACE_OWNER_MODULE && owner.phase === 7.1;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const workspaceOwner = getDevPulseV2Owner('world2_workspace_foundation').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== workspaceOwner,
      );
      return competing.length === 0;
    });

    return (
      noDuplicateModules &&
      assertDistinctFromWorld2IsolationGate() &&
      getDevPulseV2Owner('world2_workspace_foundation').ownerModule !==
        getDevPulseV2Owner('world2_isolation').ownerModule
    );
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2World2WorkspaceFoundation();
    return (
      typeof (foundation as { execute?: unknown }).execute === 'undefined' &&
      typeof (foundation as { runBuilder?: unknown }).runBuilder === 'undefined' &&
      typeof (foundation as { runExecutionPlanner?: unknown }).runExecutionPlanner === 'undefined' &&
      typeof (foundation as { runSimulation?: unknown }).runSimulation === 'undefined' &&
      typeof (foundation as { runLearningLoop?: unknown }).runLearningLoop === 'undefined' &&
      typeof (foundation as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (foundation as { deploy?: unknown }).deploy === 'undefined'
    );
  }

  static assertDependencyChain(): boolean {
    return (
      assertGovernanceStackPresent() &&
      assertConstitutionReferenced() &&
      assertNoGovernanceBypassAttempt() &&
      assertWorld1FoundationProtected() &&
      getDevPulseV2Owner('execution_authority').phase === 6.1 &&
      getDevPulseV2Owner('verification_gated_apply').phase === 6.11 &&
      getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1
    );
  }

  createWorkspace(input: WorkspaceCreateInput) {
    const workspace = this.manager.createWorkspace(input);
    this.publishSummary(`Workspace created: ${workspace.projectName}`, workspace.workspaceId);
    return workspace;
  }

  getManager(): WorkspaceManager {
    return this.manager;
  }

  getFoundationState(): World2WorkspaceFoundationState {
    return {
      foundationId: this.foundationId,
      workspaceCount: this.manager.getWorkspaceCount(),
      activeWorkspaceCount: this.manager.getActiveWorkspaceCount(),
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport() {
    return buildWorld2WorkspaceReport(this.getFoundationState());
  }

  formatReport(): string {
    return formatWorld2WorkspaceReport(this.getFoundationState());
  }

  getGovernanceSummary(): string {
    return getGovernanceBridgeSummary();
  }

  private publishSummary(title: string, workspaceId: string): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title,
      summary: `World 2 workspace ${workspaceId} — foundation only, no execution.`,
      relatedEvidenceIds: [],
      relatedRecordId: workspaceId,
      status: 'INFO',
      warnings: ['World 2 workspace foundation — no autonomous builder enabled.'],
      errors: [],
    });
  }
}

export function createDevPulseV2World2WorkspaceFoundation(): DevPulseV2World2WorkspaceFoundation {
  singleton = new DevPulseV2World2WorkspaceFoundation();
  return singleton;
}

export function getDevPulseV2World2WorkspaceFoundation(): DevPulseV2World2WorkspaceFoundation {
  if (!singleton) {
    singleton = new DevPulseV2World2WorkspaceFoundation();
  }
  return singleton;
}

export function resetDevPulseV2World2WorkspaceFoundationForTests(): DevPulseV2World2WorkspaceFoundation {
  resetWorkspaceIdentityCounterForTests();
  singleton = new DevPulseV2World2WorkspaceFoundation();
  return singleton;
}

export {
  isCommunicationAllowed,
  isCommunicationBlocked,
  boundaryOutputKey,
  evaluateWorkspaceIsolation,
  isolationOutputKey,
  assertFileOwnership,
  rejectOrphanFile,
  MAX_WORKSPACES,
  WORLD2_WORKSPACE_OWNER_MODULE,
  WORLD2_WORKSPACE_PASS_TOKEN,
};
