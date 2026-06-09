/**
 * Project Vault Intelligence — orchestrates read-only vault → understanding bridge.
 */

import { bridgeVaultFactsIntoUnderstanding } from './project-vault-understanding-bridge.js';
import {
  isDuplicateProjectUnderstandingQuestion,
  isVaultAwareQuestion,
  type ProjectVaultIntelligenceDiagnostics,
} from './project-vault-intelligence-types.js';
import { getProjectVaultIntelligenceDiagnostics } from './project-vault-intelligence-diagnostics.js';

export function processVaultIntelligenceForQuery(query: string): {
  vaultAware: boolean;
  duplicateRiskQuestion: boolean;
  diagnostics: ProjectVaultIntelligenceDiagnostics;
  factsAdded: number;
} {
  const vaultAware = isVaultAwareQuestion(query);
  const duplicateRiskQuestion = isDuplicateProjectUnderstandingQuestion(query);

  const bridge = bridgeVaultFactsIntoUnderstanding(query);
  const diagnostics = getProjectVaultIntelligenceDiagnostics();

  if (duplicateRiskQuestion) {
    diagnostics.duplicateRisk = 'warning';
  }

  return {
    vaultAware,
    duplicateRiskQuestion,
    diagnostics,
    factsAdded: bridge.vaultFactsAdded,
  };
}

export function getVaultFactsForUnderstanding(query: string) {
  return bridgeVaultFactsIntoUnderstanding(query);
}
