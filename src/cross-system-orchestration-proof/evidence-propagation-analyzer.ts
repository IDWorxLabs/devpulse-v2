/**
 * Evidence Propagation Analyzer — evidence preserved, expanded, or invented (V1).
 */

import type {
  AuthorityProjectSnapshot,
  EvidencePropagationAnalysis,
  PropagationIssueItem,
} from './orchestration-proof-types.js';
import { normalizeToken } from './project-consistency-tracker.js';

let issueCounter = 0;

export function resetEvidencePropagationCountersForTests(): void {
  issueCounter = 0;
}

function nextIssueId(): string {
  issueCounter += 1;
  return `evidence-issue-${issueCounter}`;
}

const KNOWN_EVIDENCE_PREFIXES = [
  'TYPED_PROMPT',
  'VOICE_NOTES',
  'VISUAL_REFERENCE',
  'REQUIREMENT_COMPLETENESS',
  'UNIFIED_INTAKE',
  'PLANNING_GATE',
  'PLANNING_BRIEF',
  'ARCHITECTURE_BRIEF',
  'BUILD_PLAN',
  'FOUNDER_TEST',
  'PROJECT_VAULT',
  'UPLOAD',
];

function normalizeSource(source: string): string {
  return normalizeToken(source).toUpperCase();
}

function isKnownEvidence(source: string): boolean {
  const norm = normalizeSource(source);
  return KNOWN_EVIDENCE_PREFIXES.some((prefix) => norm.includes(normalizeToken(prefix).toUpperCase()));
}

export function analyzeEvidencePropagation(
  snapshots: readonly AuthorityProjectSnapshot[],
): EvidencePropagationAnalysis {
  const issues: PropagationIssueItem[] = [];
  if (snapshots.length === 0) {
    return {
      readOnly: true,
      preservedCount: 0,
      expandedCount: 0,
      inventedCount: 0,
      lostCount: 0,
      preservedSources: [],
      inventedSources: [],
      lostSources: [],
      issues,
    };
  }

  const baselineSources = new Set(snapshots[0].evidenceSources.map(normalizeSource));
  const allDownstreamSources = new Set<string>();
  const preserved = new Set<string>();
  const invented = new Set<string>();
  const lost = new Set<string>();

  for (const source of baselineSources) {
    preserved.add(source);
  }

  for (let i = 1; i < snapshots.length; i += 1) {
    const snap = snapshots[i];
    if (!snap.reached) continue;

    for (const source of snap.evidenceSources) {
      const norm = normalizeSource(source);
      allDownstreamSources.add(norm);
      if (baselineSources.has(norm) || [...baselineSources].some((b) => norm.includes(b) || b.includes(norm))) {
        preserved.add(norm);
      } else if (isKnownEvidence(source)) {
        preserved.add(norm);
      } else {
        invented.add(norm);
      }
    }
  }

  for (const source of baselineSources) {
    const foundDownstream = [...allDownstreamSources].some((d) => d.includes(source) || source.includes(d));
    if (!foundDownstream && snapshots.length > 2) {
      lost.add(source);
    }
  }

  if (invented.size > 0) {
    issues.push({
      readOnly: true,
      issueId: nextIssueId(),
      issueType: 'EVIDENCE_INVENTED',
      authorityId: snapshots[snapshots.length - 1]?.authorityId ?? 'UNIFIED_INTAKE_INTELLIGENCE',
      description: `${invented.size} evidence source(s) appear downstream without upstream basis.`,
      severity: invented.size >= 3 ? 'HIGH' : 'MEDIUM',
      evidence: [...invented],
    });
  }

  if (lost.size >= 2) {
    issues.push({
      readOnly: true,
      issueId: nextIssueId(),
      issueType: 'EVIDENCE_LOST',
      authorityId: snapshots[1]?.authorityId ?? 'PLANNING_GATE_AUTHORITY',
      description: `${lost.size} upstream evidence source(s) not propagated downstream.`,
      severity: lost.size >= 4 ? 'HIGH' : 'MEDIUM',
      evidence: [...lost],
    });
  }

  return {
    readOnly: true,
    preservedCount: preserved.size,
    expandedCount: Math.max(0, allDownstreamSources.size - baselineSources.size),
    inventedCount: invented.size,
    lostCount: lost.size,
    preservedSources: [...preserved],
    inventedSources: [...invented],
    lostSources: [...lost],
    issues,
  };
}
