/**
 * Phase 26.2 — Workspace Intelligence context adapter (read-only).
 */

import { buildWorkspaceSnapshot } from '../../../workspace-intelligence/workspace-context-builder.js';
import type { ContextSection } from '../context-hydration-types.js';

export function retrieveWorkspaceContext(): ContextSection[] {
  const snapshot = buildWorkspaceSnapshot('');
  const active = snapshot.workspaces.find((w) => w.active) ?? snapshot.workspaces[0];

  const sections: ContextSection[] = [
    {
      readOnly: true,
      id: 'workspace-active',
      label: 'Active workspace',
      content: active
        ? `${active.workspaceName} (${active.workspaceId}) — project: ${active.projectName}`
        : 'No active workspace identified — UNKNOWN.',
      confidence: active ? 'HIGH' : 'LOW',
      proofLevel: active ? 'PROVEN' : 'UNKNOWN',
      source: 'WORKSPACE',
    },
  ];

  if (snapshot.risks.length) {
    sections.push({
      readOnly: true,
      id: 'workspace-risks',
      label: 'Workspace risks',
      content: snapshot.risks.slice(0, 4).map((r) => `${r.riskType}: ${r.description}`).join('; '),
      confidence: 'MEDIUM',
      proofLevel: 'PARTIAL',
      source: 'WORKSPACE',
    });
  }

  return sections;
}
