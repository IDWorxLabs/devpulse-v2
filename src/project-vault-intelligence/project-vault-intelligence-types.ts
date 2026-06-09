/**
 * DevPulse V2 Phase 12.1 — Project Vault Intelligence types.
 * Read-only bridge into 11.4 Project Understanding. No duplicate PU engine.
 */

export const PROJECT_VAULT_INTELLIGENCE_PASS_TOKEN =
  'DEVPULSE_V2_PROJECT_VAULT_INTELLIGENCE_FOUNDATION_V1_PASS';
export const PROJECT_VAULT_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_project_vault_intelligence';
export const PROJECT_VAULT_INTELLIGENCE_BRIDGE_TARGET = 'project_understanding_engine';

export type VaultFactType =
  | 'identity'
  | 'status'
  | 'record'
  | 'module'
  | 'goal'
  | 'blocker'
  | 'risk'
  | 'dependency'
  | 'history'
  | 'workspace_link';

export type VaultFactConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface VaultIntelligenceFact {
  factId: string;
  source: 'project_vault';
  confidence: VaultFactConfidence;
  factType: VaultFactType;
  summary: string;
  supportingRecordId: string | null;
  readOnly: true;
  projectId: string;
  projectName: string;
  tags: string[];
}

export interface VaultReadResult {
  query: string;
  recordsRead: number;
  rawFactCount: number;
  vaultFacts: VaultIntelligenceFact[];
  readOnly: true;
}

export interface VaultBridgeResult {
  query: string;
  recordsRead: number;
  vaultFactsAdded: number;
  bridgeTarget: typeof PROJECT_VAULT_INTELLIGENCE_BRIDGE_TARGET;
  duplicateRisk: 'clear' | 'warning';
  readOnly: true;
}

export interface ProjectVaultIntelligenceDiagnostics {
  projectVaultIntelligenceActive: boolean;
  vaultRecordsRead: number;
  vaultFactsAdded: number;
  lastVaultAwareQuestion: string | null;
  lastVaultFactCount: number;
  bridgeTarget: string;
  duplicateRisk: 'clear' | 'warning';
}

export const VAULT_QUESTION_SIGNALS = [
  'project vault',
  'saved project',
  'stored project',
  'project records',
  'what do we know about this project',
  'project memory',
  'project history from vault',
  'vault context',
  'vault facts',
  'from vault',
  'from the vault',
  'missing from the vault',
  'from project records',
  'saved project facts',
  'project records support',
] as const;

export const FORBIDDEN_VAULT_INTELLIGENCE_DUPLICATES = [
  'project_understanding_v2',
  'project-brain',
  'project_brain',
  'vault_brain',
  'memory_brain',
  'command_center_brain_v2',
  'second_project_understanding',
  'project_memory_authority',
] as const;

export function isVaultAwareQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return VAULT_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isDuplicateProjectUnderstandingQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('create a new project understanding') ||
    lower.includes('second project understanding') ||
    lower.includes('new project understanding system') ||
    lower.includes('project understanding v2') ||
    lower.includes('replace project understanding')
  );
}
