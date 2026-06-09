/**
 * Project Vault Intelligence diagnostics — bridge visibility only.
 */

import {
  PROJECT_VAULT_INTELLIGENCE_BRIDGE_TARGET,
  type ProjectVaultIntelligenceDiagnostics,
  type VaultBridgeResult,
} from './project-vault-intelligence-types.js';

let diagnostics: ProjectVaultIntelligenceDiagnostics = {
  projectVaultIntelligenceActive: false,
  vaultRecordsRead: 0,
  vaultFactsAdded: 0,
  lastVaultAwareQuestion: null,
  lastVaultFactCount: 0,
  bridgeTarget: PROJECT_VAULT_INTELLIGENCE_BRIDGE_TARGET,
  duplicateRisk: 'clear',
};

export function getProjectVaultIntelligenceDiagnostics(): ProjectVaultIntelligenceDiagnostics {
  return { ...diagnostics };
}

export function updateProjectVaultIntelligenceDiagnostics(
  query: string,
  bridge: VaultBridgeResult,
): ProjectVaultIntelligenceDiagnostics {
  diagnostics = {
    projectVaultIntelligenceActive: true,
    vaultRecordsRead: bridge.recordsRead,
    vaultFactsAdded: bridge.vaultFactsAdded,
    lastVaultAwareQuestion: query,
    lastVaultFactCount: bridge.vaultFactsAdded,
    bridgeTarget: bridge.bridgeTarget,
    duplicateRisk: bridge.duplicateRisk,
  };
  return { ...diagnostics };
}

export function resetProjectVaultIntelligenceDiagnostics(): void {
  diagnostics = {
    projectVaultIntelligenceActive: false,
    vaultRecordsRead: 0,
    vaultFactsAdded: 0,
    lastVaultAwareQuestion: null,
    lastVaultFactCount: 0,
    bridgeTarget: PROJECT_VAULT_INTELLIGENCE_BRIDGE_TARGET,
    duplicateRisk: 'clear',
  };
}

export function projectVaultIntelligenceKey(): string {
  const d = diagnostics;
  return [
    d.projectVaultIntelligenceActive ? 'active' : 'idle',
    String(d.vaultRecordsRead),
    String(d.vaultFactsAdded),
    d.duplicateRisk,
  ].join('|');
}
