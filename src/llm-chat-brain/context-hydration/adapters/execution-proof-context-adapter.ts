/**
 * Phase 26.2 — Founder Execution Proof context adapter (read-only).
 */

import { getLatestFounderExecutionProofHistoryEntry } from '../../../founder-execution-proof/founder-execution-proof-history.js';
import { resolveExecutionConnectedForRoot } from '../../../founder-test-integration/founder-execution-connected-resolver.js';
import type { ContextSection } from '../context-hydration-types.js';

export function retrieveExecutionProofContext(rootDir?: string): ContextSection[] {
  const sections: ContextSection[] = [];
  const entry = getLatestFounderExecutionProofHistoryEntry();

  if (!entry) {
    sections.push({
      readOnly: true,
      id: 'execution-proof-missing',
      label: 'Founder Execution Proof',
      content: 'Execution proof not recorded in session — autonomous build chain status UNKNOWN.',
      confidence: 'LOW',
      proofLevel: 'UNKNOWN',
      source: 'EXECUTION_PROOF',
    });
  } else {
    sections.push({
      readOnly: true,
      id: 'execution-proof-status',
      label: 'Founder Execution Proof',
      content: `Score: ${entry.founderExecutionScore}/100. State: ${entry.founderExecutionState}. Launch recommendation: ${entry.launchRecommendation}. Blockers: ${entry.blockerCount}. Warnings: ${entry.warningCount}.`,
      confidence: 'HIGH',
      proofLevel: entry.founderExecutionState === 'PROVEN' ? 'PROVEN' : 'PARTIAL',
      source: 'EXECUTION_PROOF',
    });
  }

  if (rootDir) {
    try {
      const connected = resolveExecutionConnectedForRoot(rootDir);
      sections.push({
        readOnly: true,
        id: 'execution-connected',
        label: 'Execution connected',
        content: `${connected.executionConnected ? 'CONNECTED' : 'DISCONNECTED'} — ${connected.source}`,
        confidence: connected.executionConnected ? 'HIGH' : 'MEDIUM',
        proofLevel: connected.executionConnected ? 'PROVEN' : 'UNKNOWN',
        source: 'EXECUTION_PROOF',
      });
    } catch {
      sections.push({
        readOnly: true,
        id: 'execution-connected-unknown',
        label: 'Execution connected',
        content: 'Could not resolve execution connected state — UNKNOWN.',
        confidence: 'LOW',
        proofLevel: 'UNKNOWN',
        source: 'EXECUTION_PROOF',
      });
    }
  }

  return sections;
}
