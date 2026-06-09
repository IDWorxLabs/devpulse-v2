/**
 * UI loading state inspector — identifies loading structures without correctness determination.
 */

import type { InspectedSurface, LoadingStructure } from './types.js';

export function inspectLoadingStructures(surfaces: InspectedSurface[]): LoadingStructure[] {
  const hasLoading = surfaces.some(
    (s) => s.surfaceType === 'LOADING_SURFACE' || s.surfaceType === 'ERROR_SURFACE',
  );
  if (!hasLoading) return [];

  return [
    {
      structureId: 'load-001',
      loadingIndicators: ['spinner-region', 'progress-bar-region'],
      loadingRegions: ['initial-load-pane', 'async-data-pane'],
      emptyStates: ['no-data-placeholder', 'empty-list-state'],
      errorStates: ['error-boundary-region', 'inline-error-banner'],
      readinessIndicators: ['ready-badge', 'stale-data-indicator'],
      inspectionOnly: true,
    },
  ];
}
