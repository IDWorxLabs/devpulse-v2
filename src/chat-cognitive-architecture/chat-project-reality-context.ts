/**
 * Phase 25.37 — Bounded project reality context for chat reasoning.
 */

import { getLatestFounderTestAssessment } from '../founder-test-integration/founder-test-integration-history.js';
import { resolveExecutionConnectedForRoot } from '../founder-test-integration/founder-execution-connected-resolver.js';
import type { ChatProjectRealityContext, ChatProjectRealitySignal } from './chat-cognitive-types.js';

function signal(
  label: string,
  value: string,
  confidence: ChatProjectRealitySignal['confidence'],
  source: string,
): ChatProjectRealitySignal {
  return { readOnly: true, label, value, confidence, source };
}

export function buildChatProjectRealityContext(rootDir?: string): ChatProjectRealityContext {
  const signals: ChatProjectRealitySignal[] = [];
  const knownBlockers: string[] = [];
  const evidenceGaps: string[] = [];

  const founderTest = getLatestFounderTestAssessment();
  if (founderTest) {
    signals.push(
      signal(
        'Founder Test',
        `${founderTest.verdict} (${founderTest.score.overall}/100)`,
        'HIGH',
        'founder-test-integration-history',
      ),
    );
    knownBlockers.push(...founderTest.blockers.slice(0, 4));
    if (founderTest.executionProofSummary) {
      signals.push(
        signal(
          'Founder Execution Proof',
          `${founderTest.executionProofSummary.founderExecutionState} — ${founderTest.executionProofSummary.overallFounderProofPercent}%`,
          'HIGH',
          'founder-execution-proof-summary',
        ),
      );
    }
  } else {
    signals.push(signal('Founder Test', 'UNKNOWN — no recent run in session', 'UNKNOWN', 'none'));
    evidenceGaps.push('Founder Test not run in this process');
  }

  if (rootDir) {
    try {
      const resolved = resolveExecutionConnectedForRoot(rootDir);
      signals.push(
        signal(
          'Execution Connected',
          resolved.executionConnected ? 'true' : 'false',
          resolved.source.startsWith('founder-execution-proof') ? 'HIGH' : 'MEDIUM',
          resolved.source,
        ),
      );
      if (!resolved.executionConnected) {
        knownBlockers.push('Execution chain not proven by Founder Execution Proof');
      }
    } catch {
      signals.push(signal('Execution Connected', 'UNKNOWN', 'UNKNOWN', 'resolver-error'));
      evidenceGaps.push('Could not resolve execution connected truth');
    }
  }

  signals.push(
    signal(
      'Chat Intelligence',
      'Evaluated via Chat Cognitive Architecture and Chat Intelligence Reality validators',
      'MEDIUM',
      'chat-cognitive-architecture',
    ),
  );

  return {
    readOnly: true,
    signals,
    knownBlockers: [...new Set(knownBlockers)].slice(0, 8),
    currentPhase: 'DevPulse V2 — founder testing and bounded execution proof phases',
    evidenceGaps,
  };
}
