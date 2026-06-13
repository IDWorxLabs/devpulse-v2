/**
 * Phase 26.2 — Project History context adapter (read-only).
 */

import { buildProjectHistorySnapshot } from '../../../project-history-intelligence/history-timeline-builder.js';
import { getBrainRoadmapContext } from '../../../command-center-brain/brain-roadmap-awareness.js';
import type { ContextSection } from '../context-hydration-types.js';

export function retrieveProjectHistoryContext(message: string): ContextSection[] {
  const snapshot = buildProjectHistorySnapshot(message);
  const roadmap = getBrainRoadmapContext();
  const sections: ContextSection[] = [];

  const recentChanges = snapshot.changes.slice(-5).map((c) => c.summary).join('; ');
  sections.push({
    readOnly: true,
    id: 'history-recent-changes',
    label: 'Recent changes',
    content: recentChanges || 'No recent changes recorded — UNKNOWN.',
    confidence: recentChanges ? 'MEDIUM' : 'LOW',
    proofLevel: recentChanges ? 'PARTIAL' : 'UNKNOWN',
    source: 'PROJECT_HISTORY',
  });

  if (roadmap.completedPhases.length) {
    sections.push({
      readOnly: true,
      id: 'history-phases',
      label: 'Recent validated phases',
      content: roadmap.completedPhases.slice(-8).join(', '),
      confidence: 'HIGH',
      proofLevel: 'PROVEN',
      source: 'PROJECT_HISTORY',
    });
  }

  if (snapshot.checkpoints.length) {
    sections.push({
      readOnly: true,
      id: 'history-checkpoints',
      label: 'Checkpoints',
      content: snapshot.checkpoints.slice(-4).map((c) => c.summary).join('; '),
      confidence: 'MEDIUM',
      proofLevel: 'PARTIAL',
      source: 'PROJECT_HISTORY',
    });
  }

  if (snapshot.rollbacks.length) {
    sections.push({
      readOnly: true,
      id: 'history-rollbacks',
      label: 'Rollbacks',
      content: `${snapshot.rollbackCount} rollback(s) recorded.`,
      confidence: 'MEDIUM',
      proofLevel: 'PARTIAL',
      source: 'PROJECT_HISTORY',
    });
  }

  return sections;
}
