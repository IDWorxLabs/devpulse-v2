/**
 * Phase 26.2 — Project Vault context adapter (read-only).
 */

import { getDevPulseV2ProjectVaultAuthority } from '../../../project-vault/project-vault-authority.js';
import { getCurrentProjectProfile } from '../../../project-understanding/project-profile-store.js';
import type { ContextSection } from '../context-hydration-types.js';

export function retrieveProjectVaultContext(): ContextSection[] {
  const vault = getDevPulseV2ProjectVaultAuthority();
  const state = vault.getVaultState();
  const profile = getCurrentProjectProfile();
  const sections: ContextSection[] = [];

  sections.push({
    readOnly: true,
    id: 'vault-identity',
    label: 'Project identity',
    content: `Active project: ${profile.name} (${profile.projectId}). Phase: ${profile.currentPhase ?? 'UNKNOWN'}. Status: ${profile.status ?? 'UNKNOWN'}.`,
    confidence: profile.name ? 'HIGH' : 'MEDIUM',
    proofLevel: profile.name ? 'PROVEN' : 'UNKNOWN',
    source: 'PROJECT_VAULT',
  });

  if (state.projectCount > 0) {
    const projects = vault.listProjects().slice(0, 3);
    for (const project of projects) {
      const facts = project.facts.slice(0, 4).map((f) => `${f.label}: ${f.value}`).join('; ');
      sections.push({
        readOnly: true,
        id: `vault-project-${project.projectId}`,
        label: `Vault project: ${project.name}`,
        content: `${project.summary}${facts ? ` | Facts: ${facts}` : ''}`,
        confidence: 'MEDIUM',
        proofLevel: 'PARTIAL',
        source: 'PROJECT_VAULT',
      });
    }
  } else {
    sections.push({
      readOnly: true,
      id: 'vault-empty',
      label: 'Project Vault',
      content: 'No project records in vault session — project goals and facts UNKNOWN.',
      confidence: 'LOW',
      proofLevel: 'UNKNOWN',
      source: 'PROJECT_VAULT',
    });
  }

  return sections;
}
