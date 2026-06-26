/**
 * Materialization Quality Score V1 — category registry and weights.
 */

import type { MaterializationQualityCategoryId } from './materialization-quality-score-types.js';

export interface MaterializationQualityCategoryDefinition {
  readOnly: true;
  id: MaterializationQualityCategoryId;
  label: string;
  weight: number;
}

export const MATERIALIZATION_QUALITY_CATEGORIES: MaterializationQualityCategoryDefinition[] = [
  { readOnly: true, id: 'blueprint', label: 'Blueprint', weight: 0.08 },
  { readOnly: true, id: 'promptAlignment', label: 'Prompt Alignment', weight: 0.08 },
  { readOnly: true, id: 'featureCoverage', label: 'Feature Coverage', weight: 0.12 },
  { readOnly: true, id: 'modularArchitecture', label: 'Modular Architecture', weight: 0.1 },
  { readOnly: true, id: 'routeReachability', label: 'Routes', weight: 0.07 },
  { readOnly: true, id: 'serviceTypesValidation', label: 'Services/Types/Validation', weight: 0.07 },
  { readOnly: true, id: 'build', label: 'Build', weight: 0.08 },
  { readOnly: true, id: 'preview', label: 'Preview', weight: 0.08 },
  { readOnly: true, id: 'productionValidation', label: 'Production Validation', weight: 0.1 },
  { readOnly: true, id: 'buildHistory', label: 'Build History', weight: 0.05 },
  { readOnly: true, id: 'persistentProjectReality', label: 'Persistent Project Reality', weight: 0.08 },
  { readOnly: true, id: 'genericityAvoidance', label: 'Genericity Avoidance', weight: 0.08 },
  { readOnly: true, id: 'launchReadiness', label: 'Launch Readiness', weight: 0.11 },
];

export function categoryWeight(id: MaterializationQualityCategoryId): number {
  return MATERIALIZATION_QUALITY_CATEGORIES.find((entry) => entry.id === id)?.weight ?? 0;
}

export function categoryLabel(id: MaterializationQualityCategoryId): string {
  return MATERIALIZATION_QUALITY_CATEGORIES.find((entry) => entry.id === id)?.label ?? id;
}
