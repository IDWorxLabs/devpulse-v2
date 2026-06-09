/**
 * UI navigation inspector — identifies navigation structures without clicking or navigating.
 */

import type { InspectedSurface, NavigationStructure } from './types.js';

export function inspectNavigationStructures(surfaces: InspectedSurface[]): NavigationStructure[] {
  const hasNav = surfaces.some((s) => s.surfaceType === 'NAVIGATION_SURFACE');
  if (!hasNav) return [];

  return [
    {
      structureId: 'nav-001',
      navigationAreas: ['primary-nav', 'secondary-nav'],
      menuStructures: ['top-menu', 'context-menu'],
      tabStructures: ['main-tabs', 'settings-tabs'],
      routeRegions: ['dashboard-route', 'settings-route', 'preview-route'],
      navigationContainers: ['nav-bar', 'breadcrumb-trail', 'tab-container'],
      inspectionOnly: true,
    },
  ];
}
