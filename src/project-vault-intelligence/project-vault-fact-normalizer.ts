/**
 * Normalize vault intelligence facts into 11.4 Project Knowledge model facts.
 */

import { nextProjectFactId, type ProjectFact, type ProjectFactCategory } from '../project-understanding/project-knowledge-model.js';
import type { ProjectRecord } from '../project-vault/types.js';
import type { VaultIntelligenceFact } from './project-vault-intelligence-types.js';

const FACT_TYPE_CATEGORY: Record<VaultIntelligenceFact['factType'], ProjectFactCategory> = {
  identity: 'identity',
  status: 'identity',
  record: 'identity',
  module: 'system',
  goal: 'identity',
  blocker: 'blocked',
  risk: 'risk',
  dependency: 'relationship',
  history: 'memory',
  workspace_link: 'system',
};

function confidenceImportance(confidence: VaultIntelligenceFact['confidence']): number {
  switch (confidence) {
    case 'HIGH':
      return 0.85;
    case 'MEDIUM':
      return 0.7;
    default:
      return 0.55;
  }
}

export function normalizeVaultFact(vaultFact: VaultIntelligenceFact): ProjectFact {
  const category = FACT_TYPE_CATEGORY[vaultFact.factType];
  return {
    factId: nextProjectFactId(),
    category,
    title: `Vault ${vaultFact.factType}`,
    statement: `${vaultFact.summary} (read-only from Project Vault record ${vaultFact.supportingRecordId ?? vaultFact.projectId})`,
    source: 'project_vault',
    importance: confidenceImportance(vaultFact.confidence),
    tags: [...vaultFact.tags, 'project_vault', 'read_only', vaultFact.factType],
  };
}

export function normalizeVaultFacts(vaultFacts: VaultIntelligenceFact[]): ProjectFact[] {
  return vaultFacts.map(normalizeVaultFact);
}

export function projectRecordToVaultFacts(project: ProjectRecord): VaultIntelligenceFact[] {
  const facts: VaultIntelligenceFact[] = [
    {
      factId: `vifact-identity-${project.projectId}`,
      source: 'project_vault',
      confidence: 'HIGH',
      factType: 'identity',
      summary: `${project.name}: ${project.summary}`,
      supportingRecordId: project.projectId,
      readOnly: true,
      projectId: project.projectId,
      projectName: project.name,
      tags: ['vault', 'identity', project.name.toLowerCase()],
    },
    {
      factId: `vifact-status-${project.projectId}`,
      source: 'project_vault',
      confidence: 'HIGH',
      factType: 'status',
      summary: `Project status ${project.status} at phase ${project.phase}`,
      supportingRecordId: project.projectId,
      readOnly: true,
      projectId: project.projectId,
      projectName: project.name,
      tags: ['vault', 'status'],
    },
  ];

  for (const fact of project.facts) {
    facts.push({
      factId: `vifact-${fact.factId}`,
      source: 'project_vault',
      confidence: fact.confidence,
      factType: inferFromLabel(fact.label),
      summary: `${fact.label}: ${fact.value}`,
      supportingRecordId: fact.factId,
      readOnly: true,
      projectId: project.projectId,
      projectName: project.name,
      tags: ['vault', fact.label.toLowerCase()],
    });
  }

  return facts;
}

function inferFromLabel(label: string): VaultIntelligenceFact['factType'] {
  const lower = label.toLowerCase();
  if (lower.includes('blocker')) return 'blocker';
  if (lower.includes('risk')) return 'risk';
  if (lower.includes('goal')) return 'goal';
  if (lower.includes('module')) return 'module';
  if (lower.includes('depend')) return 'dependency';
  if (lower.includes('history')) return 'history';
  if (lower.includes('workspace')) return 'workspace_link';
  return 'record';
}

export function normalizeProjectRecords(projects: ProjectRecord[]): ProjectFact[] {
  const vaultFacts = projects.flatMap(projectRecordToVaultFacts);
  return normalizeVaultFacts(vaultFacts);
}
