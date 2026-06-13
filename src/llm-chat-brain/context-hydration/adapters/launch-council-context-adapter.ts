/**
 * Phase 26.2 — Launch Council context adapter (read-only).
 */

import { getLatestLaunchCouncilAssessment } from '../../../launch-council/launch-council-history.js';
import type { ContextSection } from '../context-hydration-types.js';

export function retrieveLaunchCouncilContext(): ContextSection[] {
  const council = getLatestLaunchCouncilAssessment();
  if (!council) {
    return [
      {
        readOnly: true,
        id: 'launch-council-missing',
        label: 'Launch Council',
        content: 'Launch Council assessment not run in session — launch verdict UNKNOWN.',
        confidence: 'LOW',
        proofLevel: 'UNKNOWN',
        source: 'LAUNCH_COUNCIL',
      },
    ];
  }

  const sections: ContextSection[] = [
    {
      readOnly: true,
      id: 'launch-council-verdict',
      label: 'Launch Council verdict',
      content: `Score: ${council.overallScore}/100. Readiness: ${council.readinessState}. Blocker count: ${council.launchBlockerCount}.`,
      confidence: 'HIGH',
      proofLevel: council.overallScore >= 75 ? 'PROVEN' : 'PARTIAL',
      source: 'LAUNCH_COUNCIL',
    },
  ];

  if (council.findings?.length) {
    sections.push({
      readOnly: true,
      id: 'launch-council-findings',
      label: 'Launch findings',
      content: council.findings.slice(0, 5).join('; '),
      confidence: 'HIGH',
      proofLevel: 'PROVEN',
      source: 'LAUNCH_COUNCIL',
    });
  }

  if (council.recommendations?.length) {
    sections.push({
      readOnly: true,
      id: 'launch-council-recommendations',
      label: 'Launch recommendations',
      content: council.recommendations.slice(0, 4).join('; '),
      confidence: 'MEDIUM',
      proofLevel: 'PARTIAL',
      source: 'LAUNCH_COUNCIL',
    });
  }

  return sections;
}
