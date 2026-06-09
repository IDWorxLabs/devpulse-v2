/**
 * UI surface classifier — maps observation targets to inspectable surfaces.
 */

import type { ObservationTargetItem } from '../self-vision-runtime/types.js';
import type { InspectedSurface, SurfaceType } from './types.js';

export function classifyInspectableSurfaces(
  observationTargets: ObservationTargetItem[],
): InspectedSurface[] {
  const surfaces: InspectedSurface[] = [];
  let counter = 0;

  for (const target of observationTargets) {
    counter += 1;
    surfaces.push({
      surfaceType: target.target as SurfaceType,
      identified: true,
      regionId: `surf-${counter.toString().padStart(3, '0')}`,
      description: `Inspectable ${target.target} region identified from observation target — structure only`,
      structureOnly: true,
    });
  }

  return surfaces;
}
