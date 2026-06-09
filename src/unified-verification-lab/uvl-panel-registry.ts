/**
 * UVL Panel registry — temporary Validators navigation panel (Phase 16.7).
 */

import { listVerificationProviders } from './verification-provider-registry.js';
import { listVerificationSessions } from './verification-session-manager.js';
import {
  listVerificationTargets,
  listVerificationOwners,
  listVerificationDependencies,
  listVerificationRequirements,
  listVerificationCapabilities,
} from '../verification-registry/index.js';
import { getVerificationOrchestratorContext } from '../verification-orchestrator/index.js';
import type { VerificationRuntimeState } from './types.js';

export interface UvlPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  registeredProviders: string[];
  verificationSessions: string[];
  runtimeState: VerificationRuntimeState;
  providerCount: number;
  sessionCount: number;
  temporary: true;
}

export function buildUvlPanelSnapshot(runtimeState: VerificationRuntimeState = 'READY'): UvlPanelSnapshot {
  const providers = listVerificationProviders();
  const sessions = listVerificationSessions();

  return {
    panelId: 'UNIFIED_VERIFICATION_LAB_RUNTIME',
    panelTitle: 'Unified Verification Lab Runtime',
    navigationPath: 'Left Navigation → Validators',
    registeredProviders: providers.map((p) => `${p.providerName} (${p.providerId})`),
    verificationSessions: sessions.map(
      (s) => `${s.verificationSessionId} — ${s.verificationType} — ${s.sessionState}`,
    ),
    runtimeState,
    providerCount: providers.length,
    sessionCount: sessions.length,
    temporary: true,
  };
}

export interface VerificationRegistryPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  targets: string[];
  owners: string[];
  dependencies: string[];
  requirements: string[];
  capabilities: string[];
  targetCount: number;
  temporary: true;
}

export function buildVerificationRegistryPanelSnapshot(): VerificationRegistryPanelSnapshot {
  const targets = listVerificationTargets().map(
    (t) => `${t.verificationTargetName} (${t.verificationTargetId})`,
  );
  const owners = listVerificationOwners().map((o) => `${o.ownerModule} — ${o.ownerDomain}`);
  const dependencies = listVerificationDependencies().map(
    (d) => `${d.targetId}: ${d.upstreamDependencies.join(', ') || 'none'}`,
  );
  const requirements = listVerificationRequirements().map(
    (r) => `${r.targetId}: ${r.requiredEvidence.join(', ')}`,
  );
  const capabilities = listVerificationCapabilities().map(
    (c) => `${c.targetId}: ${c.supportedModes.join(', ')}`,
  );

  return {
    panelId: 'VERIFICATION_REGISTRY',
    panelTitle: 'Verification Registry',
    navigationPath: 'Left Navigation → Validators',
    targets,
    owners,
    dependencies,
    requirements,
    capabilities,
    targetCount: targets.length,
    temporary: true,
  };
}

export interface VerificationOrchestratorPanelSnapshot {
  panelId: string;
  panelTitle: string;
  navigationPath: string;
  executionPlan: string[];
  executionOrder: string[];
  parallelGroups: string[];
  blockedTargets: string[];
  waitingTargets: string[];
  planCount: number;
  temporary: true;
}

export function buildVerificationOrchestratorPanelSnapshot(
  query = 'What should run first?',
): VerificationOrchestratorPanelSnapshot {
  const ctx = getVerificationOrchestratorContext(query);
  const report = ctx.orchestrationReport;

  return {
    panelId: 'VERIFICATION_ORCHESTRATOR',
    panelTitle: 'Verification Orchestrator',
    navigationPath: 'Left Navigation → Validators',
    executionPlan: ctx.executionPlan.map(
      (p) => `${p.verificationPlanId} — ${p.targetId} — ${p.executionState}`,
    ),
    executionOrder: report.executionOrder,
    parallelGroups: report.parallelGroups.map(
      (g) => `${g.groupId}: ${g.targetIds.join(', ')}`,
    ),
    blockedTargets: report.blockedTargets,
    waitingTargets: report.waitingTargets,
    planCount: ctx.executionPlan.length,
    temporary: true,
  };
}
