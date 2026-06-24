/**
 * Production Observability Platform V1 — evidence loader.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_ARTIFACT_DIR,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
} from './production-observability-platform-v1-bounds.js';
import type { ProductionObservabilityPlatformAssessment } from './production-observability-platform-v1-types.js';

export function isProductionObservabilityPlatformProven(projectRootDir: string): boolean {
  const path = join(
    projectRootDir,
    PRODUCTION_OBSERVABILITY_PLATFORM_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as ProductionObservabilityPlatformAssessment;
    return data.passToken === PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}

export function loadProductionObservabilityPlatformAssessmentFromDisk(
  projectRootDir: string,
): ProductionObservabilityPlatformAssessment | null {
  const path = join(
    projectRootDir,
    PRODUCTION_OBSERVABILITY_PLATFORM_V1_ARTIFACT_DIR,
    'assessment.json',
  );
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as ProductionObservabilityPlatformAssessment;
  } catch {
    return null;
  }
}

export function loadProductionObservabilitySummaryForAudit(projectRootDir: string): {
  observedApplications: number;
  observedDeployments: number;
  openIncidents: number;
  overallAvailabilityScore: number;
  proven: boolean;
} {
  const assessment = loadProductionObservabilityPlatformAssessmentFromDisk(projectRootDir);
  if (!assessment) {
    return {
      observedApplications: 0,
      observedDeployments: 0,
      openIncidents: 0,
      overallAvailabilityScore: 0,
      proven: false,
    };
  }
  return {
    observedApplications: assessment.applicationsObserved,
    observedDeployments: assessment.deploymentsTracked,
    openIncidents: assessment.incidentRegistry.openIncidents,
    overallAvailabilityScore: assessment.availabilityAssessment.overallAvailabilityScore,
    proven: assessment.passToken === PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
  };
}

export function loadCommercializationImpactFromObservability(projectRootDir: string): {
  proven: boolean;
  projectedScore: number;
  priorScore: number;
} {
  const assessment = loadProductionObservabilityPlatformAssessmentFromDisk(projectRootDir);
  if (!assessment) {
    return { proven: false, projectedScore: 79, priorScore: 79 };
  }
  return {
    proven: assessment.passToken === PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
    projectedScore: assessment.commercializationImpact.projectedCommercializationScore,
    priorScore: assessment.commercializationImpact.priorCommercializationScore,
  };
}
