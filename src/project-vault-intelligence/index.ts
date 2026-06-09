/**
 * DevPulse V2 Phase 12.1 — Project Vault Intelligence public API.
 */

export {
  PROJECT_VAULT_INTELLIGENCE_PASS_TOKEN,
  PROJECT_VAULT_INTELLIGENCE_OWNER_MODULE,
  PROJECT_VAULT_INTELLIGENCE_BRIDGE_TARGET,
  VAULT_QUESTION_SIGNALS,
  FORBIDDEN_VAULT_INTELLIGENCE_DUPLICATES,
  isVaultAwareQuestion,
  isDuplicateProjectUnderstandingQuestion,
  type VaultFactType,
  type VaultFactConfidence,
  type VaultIntelligenceFact,
  type VaultReadResult,
  type VaultBridgeResult,
  type ProjectVaultIntelligenceDiagnostics,
} from './project-vault-intelligence-types.js';

export { readVaultFacts, readVaultProjectRecords } from './project-vault-fact-reader.js';
export {
  normalizeVaultFact,
  normalizeVaultFacts,
  normalizeProjectRecords,
  projectRecordToVaultFacts,
} from './project-vault-fact-normalizer.js';

export {
  ensureProjectVaultIntelligenceSeeded,
  bridgeVaultFactsIntoUnderstanding,
  resetProjectVaultIntelligenceBridgeForTests,
} from './project-vault-understanding-bridge.js';

export {
  getProjectVaultIntelligenceDiagnostics,
  updateProjectVaultIntelligenceDiagnostics,
  resetProjectVaultIntelligenceDiagnostics,
  projectVaultIntelligenceKey,
} from './project-vault-intelligence-diagnostics.js';

export { processVaultIntelligenceForQuery, getVaultFactsForUnderstanding } from './project-vault-intelligence.js';
import { bridgeVaultFactsIntoUnderstanding } from './project-vault-understanding-bridge.js';

let singleton: DevPulseV2ProjectVaultIntelligence | null = null;

export class DevPulseV2ProjectVaultIntelligence {
  static readonly ownerModule = 'devpulse_v2_project_vault_intelligence';
  static readonly passToken = 'DEVPULSE_V2_PROJECT_VAULT_INTELLIGENCE_FOUNDATION_V1_PASS';

  bridge(query: string) {
    return bridgeVaultFactsIntoUnderstanding(query);
  }
}

export function getDevPulseV2ProjectVaultIntelligence(): DevPulseV2ProjectVaultIntelligence {
  if (!singleton) singleton = new DevPulseV2ProjectVaultIntelligence();
  return singleton;
}

export function resetDevPulseV2ProjectVaultIntelligenceForTests(): DevPulseV2ProjectVaultIntelligence {
  singleton = new DevPulseV2ProjectVaultIntelligence();
  return singleton;
}
