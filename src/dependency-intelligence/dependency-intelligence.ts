/**
 * Dependency Intelligence — orchestrates graph analysis and advisory answers.
 */

import { publishOperatorFeedStage } from '../operator-feed/index.js';
import { analyzeDependencies } from './dependency-analyzer.js';
import { findBlockedCapabilities } from './dependency-blocker-detector.js';
import { getDependencyGraph } from './dependency-graph-builder.js';
import {
  getDependencyIntelligenceDiagnostics,
  updateDependencyIntelligenceDiagnostics,
} from './dependency-intelligence-diagnostics.js';
import {
  displayNameFor,
  isDuplicateDependencyBrainQuestion,
  type DependencyAnswer,
  type DependencyIntelligenceDiagnostics,
} from './dependency-intelligence-types.js';
import { riskLevelLabel } from './dependency-risk-detector.js';

function composeResponse(query: string, analysis: ReturnType<typeof analyzeDependencies>): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Dependency Intelligence Response', ''];

  if (isDuplicateDependencyBrainQuestion(query)) {
    lines.push('Recommendation: No.');
    lines.push('Why: Phase 12.2 Dependency Intelligence extends relationship awareness — do not create dependency_brain or brain_v2.');
    lines.push('Risk level: High if duplicated.');
    lines.push('Next safe action: Extend Dependency Intelligence into existing Command Center routing.');
    return lines.join('\n');
  }

  if (lower.includes('what depends on') && analysis.targetSystem) {
    lines.push(`Systems depending on ${displayNameFor(analysis.targetSystem)}:`);
    if (analysis.downstream.length === 0) {
      lines.push('• No registered downstream dependents.');
    } else {
      for (const e of analysis.downstream) {
        lines.push(`• ${displayNameFor(e.source)} — ${e.reason}`);
      }
    }
  } else if (lower.includes('what does') && lower.includes('depend')) {
    lines.push(`Dependencies for ${displayNameFor(analysis.targetSystem ?? 'target')}:`);
    if (analysis.upstream.length === 0) {
      lines.push('• No registered upstream dependencies.');
    } else {
      for (const e of analysis.upstream) {
        lines.push(`• ${displayNameFor(e.target)} (${e.dependencyType}, risk: ${riskLevelLabel(e.riskLevel)}) — ${e.reason}`);
      }
    }
  } else if (lower.includes('what breaks if')) {
    const target = analysis.targetSystem ?? 'system';
    lines.push(`Impact if ${displayNameFor(target)} disappears:`);
    if (analysis.downstream.length === 0) {
      lines.push('• No registered breakage paths — system may be isolated or leaf node.');
    } else {
      for (const e of analysis.downstream) {
        lines.push(`• ${displayNameFor(e.source)} would lose ${displayNameFor(e.target)} — ${e.reason}`);
      }
    }
  } else if (lower.includes('blocked') || lower.includes('missing dependenc')) {
    const blocked = findBlockedCapabilities(getDependencyGraph());
    lines.push('Blocked capabilities / missing dependencies:');
    if (blocked.length === 0 && analysis.missingDependencies.length === 0) {
      lines.push('• No blocked dependency paths in current graph.');
    } else {
      for (const b of [...blocked, ...analysis.missingDependencies].slice(0, 8)) {
        lines.push(`• ${b}`);
      }
    }
  } else if (lower.includes('highest-risk') || lower.includes('highest risk')) {
    const hr = analysis.highestRisk;
    if (hr) {
      lines.push(`Highest-risk dependency: ${displayNameFor(hr.source)} → ${displayNameFor(hr.target)}`);
      lines.push(`Risk level: ${riskLevelLabel(hr.riskLevel)}`);
      lines.push(`Reason: ${hr.reason}`);
    } else {
      lines.push('No dependency risks registered.');
    }
  } else if (lower.includes('built before') || lower.includes('build before')) {
    const target = analysis.targetSystem ?? 'execution_runtime';
    const prereqs = analysis.upstream.filter((e) => e.required && !e.blocked);
    lines.push(`Build prerequisites before ${displayNameFor(target)}:`);
    if (prereqs.length === 0) {
      for (const e of analysis.upstream) {
        lines.push(`• ${displayNameFor(e.target)} — ${e.reason}`);
      }
    } else {
      for (const e of prereqs) {
        lines.push(`• ${displayNameFor(e.target)} — ${e.reason}`);
      }
    }
  } else if (lower.includes('isolated')) {
    lines.push('Isolated systems (no registered edges):');
    if (analysis.isolatedSystems.length === 0) {
      lines.push('• All registered systems participate in at least one dependency edge.');
    } else {
      for (const s of analysis.isolatedSystems) {
        lines.push(`• ${displayNameFor(s)}`);
      }
    }
  } else if (lower.includes('duplicate')) {
    lines.push('Duplicate dependency risks:');
    if (analysis.duplicateRisks.length === 0) {
      lines.push('• Clear — no duplicate dependency authority detected.');
    } else {
      for (const r of analysis.duplicateRisks) {
        lines.push(`• ${r}`);
      }
    }
  } else if (lower.includes('dependency path') || lower.includes('path from')) {
    const path = analysis.paths[0];
    if (path?.found) {
      lines.push(`Dependency path ${displayNameFor(path.source)} → ${displayNameFor(path.target)}:`);
      lines.push(path.path.map((s) => displayNameFor(s)).join(' → '));
    } else {
      lines.push('No direct dependency path found in registered graph.');
      lines.push('Advisory: trace through Project Vault → Project Vault Intelligence → Project Understanding → Unified Decision Layer.');
    }
  } else {
    lines.push('Dependency graph summary:');
    const graph = getDependencyGraph();
    lines.push(`• Total dependencies: ${graph.dependencyCount}`);
    lines.push(`• Blocked: ${graph.blockedCount}`);
    lines.push(`• Graph health: ${graph.graphHealth}`);
    if (analysis.highestRisk) {
      lines.push(`• Highest risk: ${displayNameFor(analysis.highestRisk.source)} → ${displayNameFor(analysis.highestRisk.target)}`);
    }
  }

  lines.push('');
  lines.push('Advisory only — no execution, file writes, or system replacement performed.');
  return lines.join('\n');
}

export function processDependencyIntelligenceRequest(query: string): DependencyAnswer {
  publishOperatorFeedStage('Reading Dependency Intelligence', 'dependency_intelligence', { query });
  const graph = getDependencyGraph();
  const analysis = analyzeDependencies(query);
  updateDependencyIntelligenceDiagnostics(query);

  return {
    query,
    analysis,
    responseText: composeResponse(query, analysis),
  };
}

export function getDependencyIntelligenceContext(query: string): {
  analysis: ReturnType<typeof analyzeDependencies>;
  diagnostics: DependencyIntelligenceDiagnostics;
  dependencyBlockers: string[];
  dependencyRisks: string[];
  dependencyPaths: string[];
  dependencyConfidence: string;
} {
  const analysis = analyzeDependencies(query);
  updateDependencyIntelligenceDiagnostics(query);

  return {
    analysis,
    diagnostics: getDependencyIntelligenceDiagnostics(),
    dependencyBlockers: analysis.missingDependencies,
    dependencyRisks: analysis.highestRisk
      ? [`${displayNameFor(analysis.highestRisk.source)} → ${displayNameFor(analysis.highestRisk.target)} (${analysis.highestRisk.riskLevel})`]
      : [],
    dependencyPaths: analysis.paths.filter((p) => p.found).map((p) => p.path.map(displayNameFor).join(' → ')),
    dependencyConfidence: analysis.paths[0]?.confidence ?? 'MEDIUM',
  };
}
