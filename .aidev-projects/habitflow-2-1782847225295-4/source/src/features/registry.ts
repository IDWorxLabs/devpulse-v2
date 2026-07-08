/** Feature module registry — Modular Feature Materialization V1 */
import CsvExportFeature from './csv-export';
import NavigationRouterFeature from './navigation-router';
import FilterUiFeature from './filter-ui';
import DashboardFeature from './dashboard';
import SettingsFeature from './settings';
import HabitsFeature from './habits';
import StreaksFeature from './streaks';
import RoutinesFeature from './routines';
import GoalsFeature from './goals';
import AnalyticsFeature from './analytics';
import ExpensesFeature from './expenses';
import CategoriesFeature from './categories';
import ChartsFeature from './charts';
import ReportsFeature from './reports';

export const FEATURE_REGISTRY = [
  {
    id: 'csv-export',
    name: 'Csv Export',
    route: '/csv-export',
    component: CsvExportFeature,
    sourcePath: 'src/features/csv-export/CsvExportFeature.tsx',
    contractId: 'feature-csv-export',
    promptTerms: ["csv export","export"],
    status: 'generated' as const,
  },
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
    id: 'filter-ui',
    name: 'Filter Ui',
    route: '/filter-ui',
    component: FilterUiFeature,
    sourcePath: 'src/features/filter-ui/FilterUiFeature.tsx',
    contractId: 'feature-filter-ui',
    promptTerms: ["filter ui"],
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
  },
  {
    id: 'habits',
    name: 'Habits',
    route: '/habits',
    component: HabitsFeature,
    sourcePath: 'src/features/habits/HabitsFeature.tsx',
    contractId: 'feature-habits',
    promptTerms: ["habits","habit"],
    status: 'generated' as const,
  },
  {
    id: 'streaks',
    name: 'Streaks',
    route: '/streaks',
    component: StreaksFeature,
    sourcePath: 'src/features/streaks/StreaksFeature.tsx',
    contractId: 'feature-streaks',
    promptTerms: ["streaks","streak"],
    status: 'generated' as const,
  },
  {
    id: 'routines',
    name: 'Routines',
    route: '/routines',
    component: RoutinesFeature,
    sourcePath: 'src/features/routines/RoutinesFeature.tsx',
    contractId: 'feature-routines',
    promptTerms: ["routines"],
    status: 'generated' as const,
  },
  {
    id: 'goals',
    name: 'Goals',
    route: '/goals',
    component: GoalsFeature,
    sourcePath: 'src/features/goals/GoalsFeature.tsx',
    contractId: 'feature-goals',
    promptTerms: ["goals"],
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
    id: 'expenses',
    name: 'Expenses',
    route: '/expenses',
    component: ExpensesFeature,
    sourcePath: 'src/features/expenses/ExpensesFeature.tsx',
    contractId: 'feature-expenses',
    promptTerms: ["expenses"],
    status: 'generated' as const,
  },
  {
    id: 'categories',
    name: 'Categories',
    route: '/categories',
    component: CategoriesFeature,
    sourcePath: 'src/features/categories/CategoriesFeature.tsx',
    contractId: 'feature-categories',
    promptTerms: ["categories"],
    status: 'generated' as const,
  },
  {
    id: 'charts',
    name: 'Charts',
    route: '/charts',
    component: ChartsFeature,
    sourcePath: 'src/features/charts/ChartsFeature.tsx',
    contractId: 'feature-charts',
    promptTerms: ["charts"],
    status: 'generated' as const,
  },
  {
    id: 'reports',
    name: 'Reports',
    route: '/reports',
    component: ReportsFeature,
    sourcePath: 'src/features/reports/ReportsFeature.tsx',
    contractId: 'feature-reports',
    promptTerms: ["reports"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
