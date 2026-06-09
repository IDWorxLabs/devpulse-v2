/**
 * Project History Intelligence — orchestrates evolution awareness and advisory answers.
 */

import { publishOperatorFeedStage } from '../operator-feed/index.js';
import { findCheckpointForCapability } from './history-checkpoint-analyzer.js';
import { findCapabilityIntroduction } from './history-change-analyzer.js';
import { analyzeProjectHistory } from './history-evolution-analyzer.js';
import { buildProjectHistorySnapshot } from './history-timeline-builder.js';
import {
  getProjectHistoryIntelligenceDiagnostics,
  updateProjectHistoryIntelligenceDiagnostics,
} from './project-history-intelligence-diagnostics.js';
import {
  isDuplicateHistoryBrainQuestion,
  type ProjectHistoryAnalysis,
  type ProjectHistoryAnswer,
  type ProjectHistoryIntelligenceDiagnostics,
} from './project-history-intelligence-types.js';

function composeResponse(query: string, analysis: ProjectHistoryAnalysis): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Project History Intelligence Response', ''];
  const { snapshot, matchedEvents } = analysis;

  if (isDuplicateHistoryBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push('Why: Timeline Intelligence (11.5) owns current phase and roadmap progression; Phase 12.4 only adds historical evolution awareness.');
    lines.push('Risk level: High if duplicated.');
    lines.push('Next safe action: Extend Project History Intelligence bridge — do not create timeline_v2 or history_brain.');
    return lines.join('\n');
  }

  if (lower.includes('changed recently') || lower.includes('recent')) {
    lines.push('Recent changes:');
    for (const change of snapshot.evolution.recentChanges.slice(0, 6)) {
      lines.push(`• ${change}`);
    }
  } else if (lower.includes('phase 11')) {
    lines.push('Changes during Phase 11:');
    for (const e of matchedEvents.slice(0, 8)) {
      lines.push(`• [${e.phase}] ${e.summary}`);
    }
  } else if (lower.includes('phase 12')) {
    lines.push('Changes during Phase 12:');
    for (const e of matchedEvents.slice(0, 8)) {
      lines.push(`• [${e.phase}] ${e.summary}`);
    }
  } else if (lower.includes('dependency intelligence') && lower.includes('introduced')) {
    const ev = findCapabilityIntroduction('dependency_intelligence', snapshot.events);
    const cp = findCheckpointForCapability('Dependency Intelligence', snapshot.checkpoints);
    lines.push(`Capability: Dependency Intelligence`);
    lines.push(`Introduced: Phase ${ev?.phase ?? '12.2'}`);
    lines.push(`When: ${ev ? new Date(ev.timestamp).toISOString().slice(0, 10) : 'Phase 12.2 foundation'}`);
    if (cp) lines.push(`Checkpoint: ${cp.passToken}`);
    if (ev) lines.push(`Reason: ${ev.reason}`);
  } else if (lower.includes('workspace intelligence') && lower.includes('introduced')) {
    const ev = findCapabilityIntroduction('workspace_intelligence', snapshot.events);
    const cp = findCheckpointForCapability('Workspace Intelligence', snapshot.checkpoints);
    lines.push(`Capability: Workspace Intelligence`);
    lines.push(`Introduced: Phase ${ev?.phase ?? '12.3'}`);
    if (cp) lines.push(`Checkpoint: ${cp.passToken}`);
    if (ev) lines.push(`Reason: ${ev.reason}`);
  } else if (lower.includes('checkpoint') && lower.includes('introduced')) {
    lines.push('Checkpoint introductions:');
    for (const cp of analysis.matchedCheckpoints.slice(0, 6)) {
      lines.push(`• ${cp.capability} — ${cp.passToken} (phase ${cp.phase})`);
    }
  } else if (lower.includes('rollback') || lower.includes('rolled back')) {
    lines.push('Rollbacks:');
    for (const rb of snapshot.rollbacks.filter((r) => r.summary.toLowerCase().includes('rollback') || !r.restoredBy)) {
      lines.push(`• ${rb.summary} — ${rb.reason}`);
    }
    if (snapshot.rollbacks.length === 0) lines.push('• No rollbacks registered.');
  } else if (lower.includes('restored') || lower.includes('restore')) {
    lines.push('Restorations:');
    for (const e of matchedEvents.filter((ev) => ev.changeType === 'RESTORE')) {
      lines.push(`• ${e.summary} — ${e.reason}`);
    }
  } else if (lower.includes('milestone')) {
    lines.push('Major milestones:');
    for (const m of snapshot.evolution.majorMilestones) {
      lines.push(`• ${m}`);
    }
  } else if (lower.includes('evolved') || lower.includes('evolution')) {
    lines.push('Project evolution:');
    lines.push(snapshot.evolution.evolutionNarrative);
    lines.push('');
    lines.push(`Total history events: ${snapshot.eventCount}`);
    lines.push(`Checkpoints: ${snapshot.checkpointCount}`);
    lines.push(`Phase transitions: ${snapshot.phaseTransitionCount}`);
  } else {
    lines.push(`History events: ${snapshot.eventCount}`);
    lines.push(`Checkpoints: ${snapshot.checkpointCount}`);
    lines.push(`Rollbacks: ${snapshot.rollbackCount}`);
    lines.push(`Confidence: ${snapshot.evolution.historyConfidence}`);
    for (const e of matchedEvents.slice(0, 5)) {
      lines.push(`• [${e.phase}] ${e.summary}`);
    }
  }

  lines.push('');
  lines.push('Timeline Intelligence unchanged — owns current phase/roadmap. Advisory only — no execution.');
  return lines.join('\n');
}

export function processProjectHistoryIntelligenceRequest(query: string): ProjectHistoryAnswer {
  publishOperatorFeedStage('Reading History Intelligence', 'project_history_intelligence', { query });
  const snapshot = buildProjectHistorySnapshot(query);
  const analysis = analyzeProjectHistory(query, snapshot);
  updateProjectHistoryIntelligenceDiagnostics(query, snapshot);

  return {
    query,
    analysis,
    responseText: composeResponse(query, analysis),
  };
}

export function historyFactsFromAnalysis(analysis: ProjectHistoryAnalysis): Array<{
  title: string;
  statement: string;
  tags: string[];
}> {
  const facts: Array<{ title: string; statement: string; tags: string[] }> = [];

  for (const e of analysis.matchedEvents.slice(0, 6)) {
    facts.push({
      title: `History: ${e.changeType}`,
      statement: `[${e.phase}] ${e.summary} — ${e.reason}`,
      tags: ['history', e.phase, e.changeType.toLowerCase(), e.source],
    });
  }

  for (const cp of analysis.matchedCheckpoints.slice(0, 4)) {
    facts.push({
      title: `Checkpoint: ${cp.capability}`,
      statement: `${cp.summary} — ${cp.passToken}`,
      tags: ['history', 'checkpoint', cp.phase],
    });
  }

  facts.push({
    title: 'Evolution summary',
    statement: analysis.snapshot.evolution.evolutionNarrative.slice(0, 200),
    tags: ['history', 'evolution'],
  });

  return facts;
}

export function getProjectHistoryIntelligenceContext(query: string): {
  analysis: ProjectHistoryAnalysis;
  diagnostics: ProjectHistoryIntelligenceDiagnostics;
  recentChanges: string[];
  majorMilestones: string[];
  historyConfidence: string;
  rollbackCount: number;
  phaseTransitionCount: number;
} {
  const snapshot = buildProjectHistorySnapshot(query);
  const analysis = analyzeProjectHistory(query, snapshot);
  updateProjectHistoryIntelligenceDiagnostics(query, snapshot);

  return {
    analysis,
    diagnostics: getProjectHistoryIntelligenceDiagnostics(),
    recentChanges: snapshot.evolution.recentChanges,
    majorMilestones: snapshot.evolution.majorMilestones,
    historyConfidence: snapshot.evolution.historyConfidence,
    rollbackCount: snapshot.rollbackCount,
    phaseTransitionCount: snapshot.phaseTransitionCount,
  };
}
