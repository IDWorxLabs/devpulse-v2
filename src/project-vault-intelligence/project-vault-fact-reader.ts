/**
 * Read-only Project Vault fact reader — vault authority remains storage owner.
 */

import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/index.js';
import type { ProjectRecord } from '../project-vault/types.js';
import type { VaultIntelligenceFact, VaultReadResult } from './project-vault-intelligence-types.js';

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function projectMatchesQuery(project: ProjectRecord, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = [project.name, project.summary, project.phase, project.status]
    .join(' ')
    .toLowerCase();
  return tokens.some((t) => haystack.includes(t));
}

export function readVaultProjectRecords(query: string): ProjectRecord[] {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const all = vault.listProjects();
  const tokens = tokenize(query);
  const matched = all.filter((p) => projectMatchesQuery(p, tokens));
  return matched.length > 0 ? matched : all;
}

export function readVaultFacts(query: string): VaultReadResult {
  const projects = readVaultProjectRecords(query);
  const vaultFacts: VaultIntelligenceFact[] = [];
  let rawFactCount = 0;

  for (const project of projects) {
    rawFactCount += project.facts.length;
    for (const fact of project.facts) {
      vaultFacts.push({
        factId: `vifact-${fact.factId}`,
        source: 'project_vault',
        confidence: fact.confidence,
        factType: inferFactType(fact.label, fact.value),
        summary: `${fact.label}: ${fact.value}`,
        supportingRecordId: fact.factId,
        readOnly: true,
        projectId: project.projectId,
        projectName: project.name,
        tags: ['vault', fact.source.toLowerCase(), fact.label.toLowerCase()],
      });
    }
  }

  return {
    query,
    recordsRead: projects.length,
    rawFactCount,
    vaultFacts,
    readOnly: true,
  };
}

function inferFactType(label: string, value: string): VaultIntelligenceFact['factType'] {
  const lower = `${label} ${value}`.toLowerCase();
  if (lower.includes('blocker') || lower.includes('blocked')) return 'blocker';
  if (lower.includes('risk')) return 'risk';
  if (lower.includes('goal')) return 'goal';
  if (lower.includes('module') || lower.includes('system')) return 'module';
  if (lower.includes('depend')) return 'dependency';
  if (lower.includes('history') || lower.includes('milestone')) return 'history';
  if (lower.includes('workspace') || lower.includes('link')) return 'workspace_link';
  if (lower.includes('status') || lower.includes('trust')) return 'status';
  if (lower.includes('record') || lower.includes('snapshot')) return 'record';
  return 'identity';
}
