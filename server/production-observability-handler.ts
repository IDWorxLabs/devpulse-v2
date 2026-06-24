/**
 * Production Observability Platform V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadProductionObservabilityPlatformAssessmentFromDisk,
  runProductionObservabilityPlatformV1,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
} from '../src/production-observability-platform-v1/index.js';
import type { ProductionObservabilityPlatformAssessment } from '../src/production-observability-platform-v1/production-observability-platform-v1-types.js';

export { PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface ProductionObservabilityPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_production_observability_platform_v1';
  canonicalOwner: 'Production Observability Platform V1';
  passToken: string;
  healthyApps: number;
  warningApps: number;
  criticalApps: number;
  availabilityScore: number;
  openIncidents: number;
  incidentSeveritySummary: string;
  observabilityProofStatus: string;
  assessment: ProductionObservabilityPlatformAssessment | null;
}

export function buildProductionObservabilityPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): ProductionObservabilityPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment = input?.refresh
    ? runProductionObservabilityPlatformV1({ projectRootDir })
    : loadProductionObservabilityPlatformAssessmentFromDisk(projectRootDir) ??
      runProductionObservabilityPlatformV1({ projectRootDir });

  const healthyApps = assessment.applicationHealth.filter((a) => a.status === 'HEALTHY').length;
  const warningApps = assessment.applicationHealth.filter(
    (a) => a.status === 'WARNING' || a.status === 'DEGRADED',
  ).length;
  const criticalApps = assessment.applicationHealth.filter(
    (a) => a.status === 'CRITICAL' || a.status === 'OFFLINE',
  ).length;

  const severityCounts = assessment.incidentRegistry.incidents
    .filter((i) => i.status !== 'RESOLVED')
    .reduce<Record<string, number>>((acc, i) => {
      acc[i.severity] = (acc[i.severity] ?? 0) + 1;
      return acc;
    }, {});

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_production_observability_platform_v1',
    canonicalOwner: 'Production Observability Platform V1',
    passToken: assessment.passToken,
    healthyApps,
    warningApps,
    criticalApps,
    availabilityScore: assessment.availabilityAssessment.overallAvailabilityScore,
    openIncidents: assessment.incidentRegistry.openIncidents + assessment.incidentRegistry.escalatedIncidents,
    incidentSeveritySummary: Object.entries(severityCounts)
      .map(([sev, count]) => `${sev} ${count}`)
      .join(' · ') || 'None',
    observabilityProofStatus: assessment.observabilityProofStatus,
    assessment,
  };
}

export function sendProductionObservabilityJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildProductionObservabilityPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'production-observability-platform-v1',
    'X-DevPulse-Canonical-Owner': 'Production Observability Platform V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
