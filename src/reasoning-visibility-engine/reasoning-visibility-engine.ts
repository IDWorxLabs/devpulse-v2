/**
 * Reasoning Visibility Engine — structured visible reasoning orchestrator.
 */

import { publishReasoningVisibilityFeedStages } from '../operator-feed/reasoning-visibility-feed-bridge.js';
import { getProgressIntelligenceContext } from '../progress-intelligence/progress-intelligence.js';
import { buildFailureRecords } from '../failure-visibility-engine/failure-record-builder.js';
import { analyzeRecurringBlockers } from '../learning-visibility-engine/learning-blocker-analyzer.js';
import { analyzeRecurringFailures } from '../learning-visibility-engine/learning-failure-analyzer.js';
import { analyzeRecurringRecommendations } from '../learning-visibility-engine/learning-recommendation-analyzer.js';
import { analyzeReasoningBlockers } from './reasoning-blocker-analyzer.js';
import { calculateReasoningConfidence } from './reasoning-confidence-builder.js';
import { buildReasoningEvidence } from './reasoning-evidence-builder.js';
import { analyzeReasoningRisks } from './reasoning-risk-analyzer.js';
import { analyzeReasoningSources, systemsConsulted } from './reasoning-source-analyzer.js';
import { updateReasoningVisibilityDiagnostics } from './reasoning-visibility-diagnostics.js';
import type {
  ReasoningVisibilityRecord,
  ReasoningVisibilityResult,
} from './reasoning-visibility-types.js';

let reasoningCounter = 0;

function nextReasoningId(): string {
  reasoningCounter += 1;
  return `rsn-${reasoningCounter.toString().padStart(4, '0')}`;
}

export function buildReasoningVisibilityRecord(query: string): ReasoningVisibilityRecord {
  const evidence = buildReasoningEvidence(query);
  const sources = analyzeReasoningSources(query);
  const blockers = analyzeReasoningBlockers(query);
  const risks = analyzeReasoningRisks(query);
  const { confidence, confidenceBasis, recommendationBasis } = calculateReasoningConfidence(
    evidence,
    blockers,
    risks,
    query,
  );

  const contextDeps = evidence
    .filter((e) => e.statement.includes('Dependency'))
    .map((e) => e.statement);

  const progress = getProgressIntelligenceContext(query);
  const progressBasis = progress.primaryRecord
    ? `${progress.primaryRecord.projectName}: ${progress.primaryRecord.percentComplete}% complete — ${progress.primaryRecord.summary}`
    : 'Progress basis unavailable';

  const failures = buildFailureRecords(query);
  const failureEvidence = failures
    .filter((f) => f.severity !== 'Info')
    .slice(0, 6)
    .map((f) => `[${f.severity}] ${f.title} (${f.sourceSystem}): ${f.description}`);

  const blockerLearn = analyzeRecurringBlockers(query);
  const failureLearn = analyzeRecurringFailures(query);
  const recLearn = analyzeRecurringRecommendations(query);
  const learningObservations = [
    ...blockerLearn.observations.slice(0, 2).map((o) => o.text),
    ...failureLearn.observations.slice(0, 2).map((o) => o.text),
    ...recLearn.observations.slice(0, 2).map((o) => o.text),
  ];

  return {
    reasoningId: nextReasoningId(),
    query,
    sourceSystem: 'unified_decision_layer',
    evidence,
    sources,
    blockers,
    risks,
    dependencies: contextDeps,
    confidence,
    confidenceBasis,
    recommendationBasis,
    summary: recommendationBasis,
    systemsConsulted: systemsConsulted(sources),
    progressBasis,
    failureEvidence,
    learningObservations,
    visibilityOnly: true,
  };
}

function composeResponse(query: string, record: ReasoningVisibilityRecord): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Reasoning Visibility Engine Response', ''];

  if (lower.includes('why') && (lower.includes('recommended') || lower.includes('recommendation'))) {
    lines.push('Recommendation basis:');
    lines.push(record.recommendationBasis);
  } else if (lower.includes('why') && lower.includes('blocked')) {
    lines.push('Why blocked:');
    if (record.blockers.length === 0) {
      lines.push('No active blockers identified in visible reasoning.');
    } else {
      for (const b of record.blockers) {
        lines.push(`• ${b.summary} (${b.sourceSystem})`);
      }
    }
  } else if (lower.includes('why') && lower.includes('confidence')) {
    lines.push(`Confidence: ${record.confidence}`);
    lines.push(`Basis: ${record.confidenceBasis}`);
  } else if (lower.includes('evidence')) {
    lines.push('Evidence used:');
    for (const e of record.evidence.slice(0, 8)) {
      lines.push(`• ${e.statement} [${e.sourceSystem}]`);
    }
  } else if (lower.includes('systems contributed') || lower.includes('systems consulted')) {
    lines.push('Systems consulted:');
    for (const s of record.sources) {
      lines.push(`• ${s.sourceSystem}: ${s.contribution}`);
    }
  } else if (lower.includes('risks')) {
    lines.push('Risks considered:');
    for (const r of record.risks.slice(0, 8)) {
      lines.push(`• ${r.summary} (${r.sourceSystem})`);
    }
  } else if (lower.includes('blockers')) {
    lines.push('Blockers considered:');
    for (const b of record.blockers) {
      lines.push(`• ${b.summary} (${b.sourceSystem})`);
    }
  } else {
    lines.push(`Summary: ${record.summary}`);
    lines.push(`Confidence: ${record.confidence} — ${record.confidenceBasis}`);
    lines.push(`Systems consulted: ${record.systemsConsulted.join(', ')}`);
    lines.push(`Evidence count: ${record.evidence.length}`);
    lines.push(`Blockers: ${record.blockers.length} | Risks: ${record.risks.length}`);
  }

  lines.push('');
  lines.push('Structured visible reasoning only — no chain-of-thought, no execution.');
  return lines.join('\n').trim();
}

export function analyzeReasoningVisibility(query: string): ReasoningVisibilityResult {
  publishReasoningVisibilityFeedStages(query);
  const record = buildReasoningVisibilityRecord(query);
  updateReasoningVisibilityDiagnostics(query, [record]);

  return {
    query,
    records: [record],
    responseText: composeResponse(query, record),
  };
}

export function processReasoningVisibilityRequest(query: string): ReasoningVisibilityResult {
  return analyzeReasoningVisibility(query);
}

export function getReasoningVisibilityContext(query: string): {
  result: ReasoningVisibilityResult;
  primaryRecord: ReasoningVisibilityRecord;
} {
  const result = analyzeReasoningVisibility(query);
  return {
    result,
    primaryRecord: result.records[0]!,
  };
}

export function resetReasoningVisibilityCounterForTests(): void {
  reasoningCounter = 0;
}
