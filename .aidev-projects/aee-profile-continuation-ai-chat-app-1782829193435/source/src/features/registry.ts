/** Feature module registry — Modular Feature Materialization V1 */
import NavigationRouterFeature from './navigation-router';
import DashboardFeature from './dashboard';
import SettingsFeature from './settings';

export const FEATURE_REGISTRY = [
  {
    id: 'navigation-router',
    name: 'Navigation Router',
    route: '/navigation-router',
    component: NavigationRouterFeature,
    sourcePath: 'src/features/navigation-router/NavigationRouterFeature.tsx',
    contractId: 'feature-navigation-router',
    promptTerms: ["navigation router"],
    status: 'generated' as const,
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    route: '/dashboard',
    component: DashboardFeature,
    sourcePath: 'src/features/dashboard/DashboardFeature.tsx',
    contractId: 'feature-dashboard',
    promptTerms: ["dashboard"],
    status: 'generated' as const,
  },
  {
    id: 'settings',
    name: 'Settings',
    route: '/settings',
    component: SettingsFeature,
    sourcePath: 'src/features/settings/SettingsFeature.tsx',
    contractId: 'feature-settings',
    promptTerms: ["settings"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
