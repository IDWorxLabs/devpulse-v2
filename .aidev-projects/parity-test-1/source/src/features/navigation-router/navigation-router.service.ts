/** Service adapter for navigation-router — Custom App */
import type { NavigationRouterRecord } from './navigation-router.types';

const DEMO_NAVIGATION_ROUTER_RECORDS: NavigationRouterRecord[] = [
  { id: 'navigation-router-1', label: 'Sample Navigation Router record', createdAt: new Date().toISOString() },
  { id: 'navigation-router-2', label: 'Navigation Router preview entry', createdAt: new Date().toISOString() },
];

export function listNavigationRouterRecords(): NavigationRouterRecord[] {
  return DEMO_NAVIGATION_ROUTER_RECORDS;
}
