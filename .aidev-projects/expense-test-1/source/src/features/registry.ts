/** Feature module registry — Modular Feature Materialization V1 */
import AuthFeature from './auth';
import DashboardFeature from './dashboard';
import IncomeFeature from './income';
import ExpensesFeature from './expenses';
import CategoriesFeature from './categories';
import ReportsFeature from './reports';
import ChartsFeature from './charts';
import CsvExportFeature from './csv-export';

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
    id: 'income',
    name: 'Income',
    route: '/income',
    component: IncomeFeature,
    sourcePath: 'src/features/income/IncomeFeature.tsx',
    contractId: 'feature-income',
    promptTerms: ["income"],
    status: 'generated' as const,
  },
  {
    id: 'expenses',
    name: 'Expenses',
    route: '/expenses',
    component: ExpensesFeature,
    sourcePath: 'src/features/expenses/ExpensesFeature.tsx',
    contractId: 'feature-expenses',
    promptTerms: ["expenses","expense"],
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
    id: 'reports',
    name: 'Reports',
    route: '/reports',
    component: ReportsFeature,
    sourcePath: 'src/features/reports/ReportsFeature.tsx',
    contractId: 'feature-reports',
    promptTerms: ["reports"],
    status: 'generated' as const,
  },
  {
    id: 'charts',
    name: 'Charts',
    route: '/charts',
    component: ChartsFeature,
    sourcePath: 'src/features/charts/ChartsFeature.tsx',
    contractId: 'feature-charts',
    promptTerms: ["charts","chart"],
    status: 'generated' as const,
  },
  {
    id: 'csv-export',
    name: 'Csv Export',
    route: '/export',
    component: CsvExportFeature,
    sourcePath: 'src/features/csv-export/CsvExportFeature.tsx',
    contractId: 'feature-csv-export',
    promptTerms: ["csv export","csv"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
