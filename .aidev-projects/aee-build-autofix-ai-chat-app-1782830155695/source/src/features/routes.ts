/** Route registry — Modular Feature Materialization V1 */
import { FEATURE_REGISTRY } from './registry';

export const APP_ROUTES = FEATURE_REGISTRY.map((entry) => ({
  path: entry.route,
  moduleId: entry.id,
  name: entry.name,
  component: entry.component,
  sourcePath: entry.sourcePath,
})) as const;

export type AppRouteEntry = (typeof APP_ROUTES)[number];
export type AppRoutePath = AppRouteEntry['path'];
