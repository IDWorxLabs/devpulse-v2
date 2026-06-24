/**
 * Canonical Ownership V2 Registration — duplicate-risk resolution.
 */

import type { DuplicateRiskResolution } from './canonical-ownership-v2-types.js';

export const DUPLICATE_RISK_RESOLUTIONS: readonly DuplicateRiskResolution[] = [
  {
    readOnly: true,
    pair: 'Real Build Execution Pipeline ↔ UVL Verification Execution',
    resolution: 'RBEP owns build/preview/execution proof; UVL owns verification proof',
    resolved: true,
    boundary: 'Build layer vs verification layer — evidence split in pipeline integration',
  },
  {
    readOnly: true,
    pair: 'Production Readiness Gate ↔ AFLA',
    resolution: 'AFLA owns launch decision; Production Readiness Gate owns production decision',
    resolved: true,
    boundary: 'Launch readiness vs production deployment readiness',
  },
  {
    readOnly: true,
    pair: 'Cloud Execution Path ↔ World2',
    resolution: 'Cloud Execution owns job contract; World2 owns isolated disposable environment',
    resolved: true,
    boundary: 'Cloud job execution vs World2 filesystem isolation',
  },
  {
    readOnly: true,
    pair: 'Validation Runtime Governance ↔ UVL',
    resolution: 'Governance owns validation runtime policy; UVL owns verification execution',
    resolved: true,
    boundary: 'Tiering/caching/reuse vs verification proof generation',
  },
  {
    readOnly: true,
    pair: 'CQI Maturity V1 ↔ Requirement Completeness Intelligence',
    resolution: 'CQI is canonical owner for requirement completeness domain',
    resolved: true,
    boundary: 'Clarifying Question Intelligence delegates completeness intelligence',
  },
  {
    readOnly: true,
    pair: 'Capability Audit V2 ↔ Capability Audit V3',
    resolution: 'V3 supersedes V2 roadmap; lineage preserved in audit artifacts',
    resolved: true,
    boundary: 'Meta audit versioning — V3.1 extends V3 with UVL refresh',
  },
];

export function buildDuplicateRiskResolutions(): readonly DuplicateRiskResolution[] {
  return DUPLICATE_RISK_RESOLUTIONS;
}

export function countResolvedDuplicateRisks(): number {
  return DUPLICATE_RISK_RESOLUTIONS.filter((r) => r.resolved).length;
}
