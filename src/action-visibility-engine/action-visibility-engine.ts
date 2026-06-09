/**
 * Action Visibility Engine — orchestrates visible action intelligence.
 */

import {
  publishActionVisibilityFeedStages,
} from '../operator-feed/action-visibility-feed-bridge.js';
import {
  buildActionCandidates,
  buildActionRecommendation,
} from './action-candidate-builder.js';
import {
  filterActionsBySource,
  filterActionsByStatus,
  findHighestPriorityAction,
  rankActionsByPriority,
} from './action-priority-evaluator.js';
import { displaySourceSystem } from './action-source-resolver.js';
import { updateActionVisibilityDiagnostics } from './action-visibility-diagnostics.js';
import { buildReasoningVisibilityRecord } from '../reasoning-visibility-engine/reasoning-visibility-engine.js';
import { getProgressIntelligenceContext } from '../progress-intelligence/progress-intelligence.js';
import { buildFailureRecords } from '../failure-visibility-engine/failure-record-builder.js';
import type {
  ActionCandidate,
  ActionVisibilityRecord,
  ActionVisibilityResult,
} from './action-visibility-types.js';
import type { FailureRecord } from '../failure-visibility-engine/failure-visibility-types.js';

function actionMatchesFailure(action: ActionCandidate, failure: FailureRecord): boolean {
  if (action.blocked && failure.severity !== 'Info') return true;
  const actionText = `${action.title} ${action.reason}`.toLowerCase();
  return failure.blockedCapabilities.some((c) => actionText.includes(c.toLowerCase().slice(0, 20)));
}

function buildRecords(query: string): ActionVisibilityRecord[] {
  const candidates = buildActionCandidates(query);
  const reasoning = buildReasoningVisibilityRecord(query);
  const progress = getProgressIntelligenceContext(query);
  const failures = buildFailureRecords(query);
  return candidates.map((action, index) => ({
    recordId: `avr-${(index + 1).toString().padStart(4, '0')}`,
    query,
    action,
    recommendation: buildActionRecommendation(action),
    reasoningId: reasoning.reasoningId,
    progressId: progress.primaryRecord?.progressId ?? null,
    failureIds: failures
      .filter((f) => actionMatchesFailure(action, f))
      .map((f) => f.failureId),
    evaluatedAt: Date.now() + index,
    visibilityOnly: true,
  }));
}

function composeResponse(query: string, records: ActionVisibilityRecord[]): string {
  const lower = query.toLowerCase();
  const candidates = records.map((r) => r.action);
  const lines: string[] = ['Action Visibility Engine Response', ''];

  if (lower.includes('recommended action') || lower.includes('what is recommended')) {
    const rec = candidates.find((c) => c.recommended || c.status === 'Recommended');
    if (rec) {
      lines.push(`Recommended action: ${rec.title}`);
      lines.push(`Source: ${displaySourceSystem(rec.sourceSystem)}`);
      lines.push(`Reason: ${rec.reason}`);
      lines.push(`Status: ${rec.status}`);
    } else {
      lines.push('No explicitly recommended action — review suggested actions below.');
    }
  } else if (lower.includes('blocked')) {
    const blocked = filterActionsByStatus(candidates, 'Blocked');
    lines.push(`Blocked actions (${blocked.length}):`);
    for (const a of blocked) {
      lines.push(`• ${a.title} — ${a.reason}`);
    }
  } else if (lower.includes('deferred')) {
    const deferred = candidates.filter((c) => c.deferred || c.status === 'Deferred');
    lines.push(`Deferred actions (${deferred.length}):`);
    for (const a of deferred) {
      lines.push(`• ${a.title} — ${a.reason}`);
    }
  } else if (lower.includes('highest priority')) {
    const top = findHighestPriorityAction(candidates);
    if (top) {
      lines.push(`Highest priority action: ${top.title}`);
      lines.push(`Priority: ${top.priority}`);
      lines.push(`Source: ${displaySourceSystem(top.sourceSystem)}`);
      lines.push(`Status: ${top.status}`);
    }
  } else if (lower.includes('dependency')) {
    const dep = filterActionsBySource(candidates, 'dependency_intelligence');
    lines.push(`Actions from Dependency Intelligence (${dep.length}):`);
    for (const a of dep) {
      lines.push(`• ${a.title} — ${a.status}: ${a.reason}`);
    }
  } else if (lower.includes('what should we do') || lower.includes('next action')) {
    const ranked = rankActionsByPriority(candidates);
    const top = ranked.find((c) => c.recommended || c.status === 'Recommended') ?? ranked[0];
    if (top) {
      lines.push(`Next visible action: ${top.title}`);
      lines.push(`Why: ${top.reason}`);
      lines.push(`Source: ${displaySourceSystem(top.sourceSystem)}`);
      lines.push(`Status: ${top.status}`);
    }
  } else {
    lines.push(`Visible actions (${candidates.length}):`);
    for (const a of candidates.slice(0, 8)) {
      lines.push(
        `• [${a.status}] ${a.title} (priority ${a.priority}, ${displaySourceSystem(a.sourceSystem)})`,
      );
    }
  }

  lines.push('');
  lines.push('Visibility only — no execution, deployment, or file modification performed.');
  return lines.join('\n').trim();
}

export function analyzeActionVisibility(query: string): ActionVisibilityResult {
  publishActionVisibilityFeedStages(query);
  const records = buildRecords(query);
  const candidates = records.map((r) => r.action);
  updateActionVisibilityDiagnostics(query, candidates);

  return {
    query,
    records,
    candidates,
    responseText: composeResponse(query, records),
  };
}

export function processActionVisibilityRequest(query: string): ActionVisibilityResult {
  return analyzeActionVisibility(query);
}

export function getActionVisibilityContext(query: string): {
  result: ActionVisibilityResult;
  records: ActionVisibilityRecord[];
} {
  const result = analyzeActionVisibility(query);
  return { result, records: result.records };
}
