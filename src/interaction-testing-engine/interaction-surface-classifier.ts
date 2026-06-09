/**
 * Interaction surface classifier — maps inspection structures to interaction surfaces.
 */

import type { UiInspectionReport } from '../ui-inspection-engine/types.js';

export interface ClassifiedInteractionSurface {
  surfaceId: string;
  surfaceType: string;
  regionId: string;
  interactable: boolean;
  description: string;
}

export function classifyInteractionSurfaces(
  inspectionReport: UiInspectionReport | null,
): ClassifiedInteractionSurface[] {
  if (!inspectionReport) return [];

  const surfaces: ClassifiedInteractionSurface[] = [];
  let counter = 0;

  for (const s of inspectionReport.inspectedSurfaces) {
    if (s.surfaceType === 'INTERACTION_SURFACE' || s.surfaceType === 'NAVIGATION_SURFACE') {
      counter += 1;
      surfaces.push({
        surfaceId: `isurf-${counter.toString().padStart(3, '0')}`,
        surfaceType: s.surfaceType,
        regionId: s.regionId,
        interactable: true,
        description: `Interaction surface from ${s.surfaceType}`,
      });
    }
  }

  for (const nav of inspectionReport.navigationStructures) {
    for (const area of nav.navigationAreas) {
      counter += 1;
      surfaces.push({
        surfaceId: `isurf-${counter.toString().padStart(3, '0')}`,
        surfaceType: 'NAVIGATION_SURFACE',
        regionId: area,
        interactable: true,
        description: `Navigation area: ${area}`,
      });
    }
  }

  return surfaces;
}
