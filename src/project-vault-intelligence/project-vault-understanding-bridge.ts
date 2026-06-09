/**
 * Read-only bridge: Project Vault → Project Understanding fact collector.
 */

import { getDevPulseV2ProjectVaultAuthority, resetDevPulseV2ProjectVaultAuthorityForTests } from '../project-vault/index.js';
import type { ProjectFact } from '../project-understanding/project-knowledge-model.js';
import { readVaultProjectRecords } from './project-vault-fact-reader.js';
import { normalizeProjectRecords } from './project-vault-fact-normalizer.js';
import { updateProjectVaultIntelligenceDiagnostics } from './project-vault-intelligence-diagnostics.js';
import {
  PROJECT_VAULT_INTELLIGENCE_BRIDGE_TARGET,
  type VaultBridgeResult,
} from './project-vault-intelligence-types.js';

const SEED_PROJECT_NAME = 'DevPulse V2';

export function ensureProjectVaultIntelligenceSeeded(): void {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const existing = vault.listProjects().find((p) => p.name === SEED_PROJECT_NAME);
  if (existing) return;

  const project = vault.createProject(
    SEED_PROJECT_NAME,
    'Governed chat-first intelligent development command center — vault-backed project record for Phase 12.1 intelligence bridge.',
  );
  if (!project.projectId || project.errors.length > 0) return;

  const pid = project.projectId;
  const seedFacts: Array<{ label: string; value: string; source: 'SYSTEM' | 'FOUNDATION' }> = [
    { label: 'project_goal', value: 'Build governed DevPulse V2 with honest foundation maturity', source: 'FOUNDATION' },
    { label: 'known_module', value: 'Command Center Brain', source: 'SYSTEM' },
    { label: 'known_module', value: 'Project Understanding Engine', source: 'SYSTEM' },
    { label: 'known_module', value: 'Shared Memory Layer', source: 'SYSTEM' },
    { label: 'known_module', value: 'Timeline Intelligence', source: 'SYSTEM' },
    { label: 'known_module', value: 'Unified Decision Layer', source: 'SYSTEM' },
    { label: 'known_blocker', value: 'Execution must not start until intelligence layers complete', source: 'FOUNDATION' },
    { label: 'known_blocker', value: 'Cloud runtime deferred until local foundations stable', source: 'FOUNDATION' },
    { label: 'known_risk', value: 'Duplicate project understanding would fragment comprehension', source: 'FOUNDATION' },
    { label: 'known_dependency', value: 'Project Vault Intelligence feeds project_understanding_engine read-only', source: 'SYSTEM' },
    { label: 'history_reference', value: 'Phase 11.4 established project comprehension owner', source: 'FOUNDATION' },
    { label: 'workspace_link', value: 'Founder Reality Surface hosts Command Center runtime shell', source: 'SYSTEM' },
    { label: 'vault_bridge', value: 'Phase 12.1 connects vault records into 11.4 reasoning context', source: 'FOUNDATION' },
  ];

  for (const f of seedFacts) {
    vault.addProjectFact(pid, {
      source: f.source,
      label: f.label,
      value: f.value,
      confidence: 'HIGH',
    });
  }
}

export function bridgeVaultFactsIntoUnderstanding(query: string): VaultBridgeResult & { normalizedFacts: ProjectFact[] } {
  ensureProjectVaultIntelligenceSeeded();
  const projects = readVaultProjectRecords(query);
  const normalizedFacts = normalizeProjectRecords(projects);

  const bridge: VaultBridgeResult = {
    query,
    recordsRead: projects.length,
    vaultFactsAdded: normalizedFacts.length,
    bridgeTarget: PROJECT_VAULT_INTELLIGENCE_BRIDGE_TARGET,
    duplicateRisk: 'clear',
    readOnly: true,
  };

  updateProjectVaultIntelligenceDiagnostics(query, bridge);

  return { ...bridge, normalizedFacts };
}

export function resetProjectVaultIntelligenceBridgeForTests(): void {
  resetDevPulseV2ProjectVaultAuthorityForTests();
  ensureProjectVaultIntelligenceSeeded();
}
