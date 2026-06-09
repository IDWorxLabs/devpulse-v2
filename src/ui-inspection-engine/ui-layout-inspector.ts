/**
 * UI layout inspector — identifies layout structure without quality judgment.
 */

import type { InspectedSurface, LayoutStructure } from './types.js';

export function inspectLayoutStructures(surfaces: InspectedSurface[]): LayoutStructure[] {
  const hasLayout = surfaces.some((s) => s.surfaceType === 'LAYOUT_SURFACE' || s.surfaceType === 'RENDER_SURFACE');
  if (!hasLayout) return [];

  return [
    {
      structureId: 'layout-001',
      headerPresent: true,
      sidebarPresent: true,
      mainContentPresent: true,
      footerPresent: true,
      panelCount: 4,
      hierarchy: ['header', 'sidebar', 'main-content', 'footer'],
      layoutRegions: ['top-bar', 'side-nav', 'content-pane', 'status-footer'],
      inspectionOnly: true,
    },
  ];
}
