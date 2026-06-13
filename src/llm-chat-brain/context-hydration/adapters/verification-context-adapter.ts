/**
 * Phase 26.2 — Verification context adapter (read-only).
 */

import { listVerificationHistory } from '../../../verification-reality/verification-reality-history.js';
import type { ContextSection } from '../context-hydration-types.js';

export function retrieveVerificationContext(): ContextSection[] {
  const history = listVerificationHistory();
  if (!history.length) {
    return [
      {
        readOnly: true,
        id: 'verification-missing',
        label: 'Verification Reality',
        content: 'No verification assessment in session — pass/fail counts UNKNOWN.',
        confidence: 'LOW',
        proofLevel: 'UNKNOWN',
        source: 'VERIFICATION',
      },
    ];
  }

  const latest = history[0];
  const passHint = latest.verificationRealityScore >= 70 ? 'likely passing signals' : 'mixed or failing signals';

  return [
    {
      readOnly: true,
      id: 'verification-latest',
      label: 'Last verification',
      content: `Score: ${latest.verificationRealityScore}/100. Summary: ${latest.summary}. History entries: ${history.length}. Assessment: ${passHint}.`,
      confidence: 'HIGH',
      proofLevel: latest.verificationRealityScore >= 80 ? 'PROVEN' : latest.verificationRealityScore >= 50 ? 'PARTIAL' : 'CONTRADICTED',
      source: 'VERIFICATION',
    },
    {
      readOnly: true,
      id: 'verification-counts',
      label: 'Verification history',
      content: `Recorded assessments: ${history.length}. Most recent id: ${latest.assessmentId}.`,
      confidence: 'MEDIUM',
      proofLevel: 'PARTIAL',
      source: 'VERIFICATION',
    },
  ];
}
