/**
 * Progress Intelligence — orchestrates visible progress advisory.
 */

import { publishProgressIntelligenceFeedStages } from '../operator-feed/progress-intelligence-feed-bridge.js';
import { analyzeProgressBlockers } from './progress-blocker-analyzer.js';
import { analyzeProgressMilestones } from './progress-milestone-analyzer.js';
import { buildProgressRecords } from './progress-model-builder.js';
import { updateProgressIntelligenceDiagnostics } from './progress-intelligence-diagnostics.js';
import { analyzeProgressStatuses } from './progress-status-analyzer.js';
import { averageCompletion } from './progress-percentage-calculator.js';
import type { ProgressAnalysis, ProgressIntelligenceResult, ProgressRecord } from './progress-intelligence-types.js';

function findHighest(records: ProgressRecord[]): ProgressRecord | null {
  if (records.length === 0) return null;
  return [...records].sort((a, b) => b.percentComplete - a.percentComplete)[0] ?? null;
}

function findLowest(records: ProgressRecord[]): ProgressRecord | null {
  if (records.length === 0) return null;
  return [...records].sort((a, b) => a.percentComplete - b.percentComplete)[0] ?? null;
}

export function analyzeProgress(query: string): ProgressAnalysis {
  const records = buildProgressRecords(query);
  const milestones = analyzeProgressMilestones(query);
  const blockers = analyzeProgressBlockers(query);
  const statuses = analyzeProgressStatuses(records);

  return {
    query,
    records,
    milestones,
    blockers,
    statuses,
    averageCompletion: averageCompletion(records.map((r) => r.percentComplete)),
    highestCompletion: findHighest(records),
    lowestCompletion: findLowest(records),
  };
}

function composeResponse(query: string, analysis: ProgressAnalysis): string {
  const lower = query.toLowerCase();
  const primary = analysis.records.find((r) => r.projectId === 'devpulse-v2') ?? analysis.records[0];
  const lines: string[] = ['Progress Intelligence Response', ''];

  if (lower.includes('how far') || lower.includes('percentage') || lower.includes('percent complete')) {
    if (primary) {
      lines.push(`${primary.projectName}: ${primary.percentComplete}% complete`);
      lines.push(`Phase: ${primary.phase}`);
      lines.push(`Confidence: ${primary.confidence}`);
    }
    lines.push(`Portfolio average: ${analysis.averageCompletion}%`);
  } else if (lower.includes('complete') && !lower.includes('incomplete')) {
    lines.push('Completed:');
    for (const item of primary?.completed.slice(0, 8) ?? []) {
      lines.push(`• ${item}`);
    }
  } else if (lower.includes('remains') || lower.includes('remaining') || lower.includes('incomplete')) {
    lines.push('Remaining:');
    for (const item of primary?.remaining ?? []) {
      lines.push(`• ${item}`);
    }
  } else if (lower.includes('milestone')) {
    lines.push(`Next milestone: ${primary?.nextMilestone ?? 'TBD'}`);
    const next = analysis.milestones.find((m) => !m.completed);
    if (next) lines.push(`Upcoming: ${next.title}`);
  } else if (lower.includes('blocked')) {
    lines.push('Blocked:');
    for (const b of analysis.blockers) {
      lines.push(`• ${b.summary}`);
    }
  } else if (lower.includes('furthest')) {
    const best = analysis.highestCompletion;
    if (best) {
      lines.push(`Furthest along: ${best.projectName} (${best.percentComplete}%)`);
    }
  } else if (lower.includes('behind')) {
    const worst = analysis.lowestCompletion;
    if (worst) {
      lines.push(`Behind: ${worst.projectName} (${worst.percentComplete}%)`);
      if (worst.behindSchedule) lines.push('Flagged behind schedule.');
    }
  } else {
    lines.push(`Projects tracked: ${analysis.records.length}`);
    lines.push(`Average completion: ${analysis.averageCompletion}%`);
    for (const r of analysis.records.slice(0, 5)) {
      lines.push(`• ${r.projectName}: ${r.percentComplete}% — ${r.phase}`);
    }
  }

  lines.push('');
  lines.push('Visibility only — progress advisory, no execution performed.');
  return lines.join('\n').trim();
}

export function processProgressIntelligenceRequest(query: string): ProgressIntelligenceResult {
  publishProgressIntelligenceFeedStages(query);
  const analysis = analyzeProgress(query);
  updateProgressIntelligenceDiagnostics(query, analysis.records);

  return {
    query,
    analysis,
    responseText: composeResponse(query, analysis),
  };
}

export function getProgressIntelligenceContext(query: string): {
  result: ProgressIntelligenceResult;
  primaryRecord: ProgressRecord | null;
} {
  const result = processProgressIntelligenceRequest(query);
  const primary = result.analysis.records.find((r) => r.projectId === 'devpulse-v2') ?? result.analysis.records[0] ?? null;
  return { result, primaryRecord: primary };
}
