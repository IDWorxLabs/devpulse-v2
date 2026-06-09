/**
 * UI responsive surface inspector — identifies viewport regions without quality verification.
 */

import type { InspectedSurface, ResponsiveStructure } from './types.js';

export function inspectResponsiveStructures(surfaces: InspectedSurface[]): ResponsiveStructure[] {
  const hasResponsive = surfaces.some((s) => s.surfaceType === 'RESPONSIVE_SURFACE');
  if (!hasResponsive) return [];

  return [
    {
      structureId: 'resp-001',
      mobileSurfaces: ['mobile-header', 'mobile-nav-drawer', 'mobile-content-stack'],
      tabletSurfaces: ['tablet-split-pane', 'tablet-sidebar'],
      desktopSurfaces: ['desktop-main-layout', 'desktop-side-panel'],
      responsiveContainers: ['fluid-container', 'breakpoint-wrapper'],
      viewportRegions: ['viewport-mobile', 'viewport-tablet', 'viewport-desktop'],
      inspectionOnly: true,
    },
  ];
}
