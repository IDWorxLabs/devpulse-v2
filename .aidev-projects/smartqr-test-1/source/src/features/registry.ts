/** Feature module registry — Modular Feature Materialization V1 */
import AuthFeature from './auth';
import DashboardFeature from './dashboard';
import GeneratorFeature from './generator';
import ScannerFeature from './scanner';
import CodeHistoryFeature from './code-history';
import AnalyticsFeature from './analytics';
import SettingsFeature from './settings';

export const FEATURE_REGISTRY = [
  {
    id: 'auth',
    name: 'Auth',
    route: '/',
    component: AuthFeature,
    sourcePath: 'src/features/auth/AuthFeature.tsx',
    contractId: 'feature-auth',
    promptTerms: ["auth"],
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
    id: 'generator',
    name: 'Generator',
    route: '/generator',
    component: GeneratorFeature,
    sourcePath: 'src/features/generator/GeneratorFeature.tsx',
    contractId: 'feature-generator',
    promptTerms: ["generator"],
    status: 'generated' as const,
  },
  {
    id: 'scanner',
    name: 'Scanner',
    route: '/scanner',
    component: ScannerFeature,
    sourcePath: 'src/features/scanner/ScannerFeature.tsx',
    contractId: 'feature-scanner',
    promptTerms: ["scanner","scan"],
    status: 'generated' as const,
  },
  {
    id: 'code-history',
    name: 'Code History',
    route: '/code-history',
    component: CodeHistoryFeature,
    sourcePath: 'src/features/code-history/CodeHistoryFeature.tsx',
    contractId: 'feature-code-history',
    promptTerms: ["code history","code","history"],
    status: 'generated' as const,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    route: '/analytics',
    component: AnalyticsFeature,
    sourcePath: 'src/features/analytics/AnalyticsFeature.tsx',
    contractId: 'feature-analytics',
    promptTerms: ["analytics"],
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
