/**
 * Failure Visibility Engine — orchestrates visible failure advisory.
 */

import { publishFailureVisibilityFeedStages } from '../operator-feed/failure-visibility-feed-bridge.js';
import { analyzeFailureImpacts } from './failure-impact-analyzer.js';
import { analyzeFailureDependencyImpacts } from './failure-dependency-analyzer.js';
import { buildFailureRecords } from './failure-record-builder.js';
import { buildAggregateNextStep } from './failure-next-step-builder.js';
import { updateFailureVisibilityDiagnostics } from './failure-visibility-diagnostics.js';
import { compareFailureSeverity } from './failure-visibility-types.js';
import type {
  FailureAnalysis,
  FailureRecord,
  FailureVisibilityResult,
} from './failure-visibility-types.js';

function findMostSevere(records: FailureRecord[]): FailureRecord | null {
  if (records.length === 0) return null;
  return [...records].sort((a, b) => compareFailureSeverity(b.severity, a.severity))[0] ?? null;
}

export function analyzeFailures(query: string): FailureAnalysis {
  const records = buildFailureRecords(query);
  const impacts = analyzeFailureImpacts(query);
  const blockedCapabilityCount = new Set(records.flatMap((r) => r.blockedCapabilities)).size;
  const criticalCount = records.filter((r) => r.severity === 'Critical').length;

  return {
    query,
    records,
    impacts,
    mostSevere: findMostSevere(records),
    blockedCapabilityCount,
    criticalCount,
  };
}

function composeResponse(query: string, analysis: FailureAnalysis): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Failure Visibility Engine Response', ''];

  if (lower.includes('what failed') || lower.includes('failures exist')) {
    lines.push(`Failures visible: ${analysis.records.length}`);
    for (const r of analysis.records.slice(0, 8)) {
      lines.push(`• [${r.severity}] ${r.title} (${r.sourceSystem})`);
    }
  } else if (lower.includes('most severe')) {
    const worst = analysis.mostSevere;
    if (worst) {
      lines.push(`Most severe: ${worst.title}`);
      lines.push(`Severity: ${worst.severity}`);
      lines.push(`Source: ${worst.sourceSystem}`);
      lines.push(`Description: ${worst.description}`);
    }
  } else if (lower.includes('systems are affected') || lower.includes('affected')) {
    lines.push('Affected systems:');
    const systems = new Set(analysis.records.flatMap((r) => r.affectedSystems));
    for (const s of [...systems].slice(0, 10)) {
      lines.push(`• ${s}`);
    }
  } else if (lower.includes('capabilities are blocked')) {
    lines.push('Blocked capabilities:');
    const caps = new Set(analysis.records.flatMap((r) => r.blockedCapabilities));
    for (const c of [...caps].slice(0, 10)) {
      lines.push(`• ${c}`);
    }
  } else if (lower.includes('dependency chains') || lower.includes('dependency chain')) {
    lines.push('Impacted dependency chains:');
    const deps = analyzeFailureDependencyImpacts(query);
    for (const d of deps.slice(0, 8)) {
      lines.push(`• ${d.chainSummary} — ${d.blockedPath}`);
    }
  } else if (lower.includes('what should happen next') || lower.includes('happen next')) {
    lines.push(buildAggregateNextStep(analysis.records));
    const top = analysis.mostSevere;
    if (top) lines.push(`Top failure next step: ${top.recommendedNextStep}`);
  } else if (lower.includes('severity')) {
    for (const r of analysis.records.slice(0, 6)) {
      lines.push(`• ${r.title}: ${r.severity}`);
    }
  } else if (lower.includes('impact')) {
    lines.push('Failure impacts:');
    for (const i of analysis.impacts.slice(0, 6)) {
      lines.push(`• ${i.summary}`);
    }
  } else {
    lines.push(`Failure count: ${analysis.records.length}`);
    lines.push(`Critical: ${analysis.criticalCount}`);
    lines.push(`Blocked capabilities: ${analysis.blockedCapabilityCount}`);
    for (const r of analysis.records.slice(0, 5)) {
      lines.push(`• [${r.severity}] ${r.title}`);
    }
  }

  lines.push('');
  lines.push('Visibility only — failure advisory, no auto-fix or execution performed.');
  return lines.join('\n').trim();
}

export function processFailureVisibilityRequest(query: string): FailureVisibilityResult {
  publishFailureVisibilityFeedStages(query);
  const analysis = analyzeFailures(query);
  updateFailureVisibilityDiagnostics(query, analysis.records);

  return {
    query,
    analysis,
    responseText: composeResponse(query, analysis),
  };
}

export function getFailureVisibilityContext(query: string): {
  result: FailureVisibilityResult;
  primaryFailure: FailureRecord | null;
} {
  const result = processFailureVisibilityRequest(query);
  const primary = result.analysis.mostSevere ?? result.analysis.records[0] ?? null;
  return { result, primaryFailure: primary };
}
