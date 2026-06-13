/**
 * Phase 26.2 — Founder Test context adapter (read-only).
 */

import { getLatestFounderTestAssessment } from '../../../founder-test-integration/founder-test-integration-history.js';
import type { ContextSection } from '../context-hydration-types.js';

export function retrieveFounderTestContext(): ContextSection[] {
  const assessment = getLatestFounderTestAssessment();
  if (!assessment) {
    return [
      {
        readOnly: true,
        id: 'founder-test-missing',
        label: 'Founder Test',
        content: 'Founder Test not run in this session — launch readiness and blockers UNKNOWN.',
        confidence: 'LOW',
        proofLevel: 'UNKNOWN',
        source: 'FOUNDER_TEST',
      },
    ];
  }

  const sections: ContextSection[] = [
    {
      readOnly: true,
      id: 'founder-test-verdict',
      label: 'Founder Test verdict',
      content: `Score: ${assessment.score.overall}/100. Verdict: ${assessment.verdict}.`,
      confidence: 'HIGH',
      proofLevel: assessment.score.overall >= 70 ? 'PROVEN' : 'PARTIAL',
      source: 'FOUNDER_TEST',
    },
  ];

  if (assessment.blockers.length) {
    sections.push({
      readOnly: true,
      id: 'founder-test-blockers',
      label: 'Founder Test blockers',
      content: assessment.blockers.slice(0, 6).join('; '),
      confidence: 'HIGH',
      proofLevel: 'PROVEN',
      source: 'FOUNDER_TEST',
    });
  }

  if (assessment.warnings?.length) {
    sections.push({
      readOnly: true,
      id: 'founder-test-warnings',
      label: 'Founder Test warnings',
      content: assessment.warnings.slice(0, 4).join('; '),
      confidence: 'MEDIUM',
      proofLevel: 'PARTIAL',
      source: 'FOUNDER_TEST',
    });
  }

  return sections;
}
