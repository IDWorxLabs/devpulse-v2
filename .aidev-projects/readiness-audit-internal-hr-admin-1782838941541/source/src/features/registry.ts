/** Feature module registry — Modular Feature Materialization V1 */
import NavigationRouterFeature from './navigation-router';
import DashboardFeature from './dashboard';
import SettingsFeature from './settings';
import CustomersFeature from './customers';
import PipelineFeature from './pipeline';
import ContactsFeature from './contacts';
import FollowUpsFeature from './follow-ups';
import ReportsFeature from './reports';
import EmployeesFeature from './employees';
import OnboardingFeature from './onboarding';
import TimeOffFeature from './time-off';
import PayrollFeature from './payroll';

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
  },
  {
    id: 'customers',
    name: 'Customers',
    route: '/customers',
    component: CustomersFeature,
    sourcePath: 'src/features/customers/CustomersFeature.tsx',
    contractId: 'feature-customers',
    promptTerms: ["customers","customer"],
    status: 'generated' as const,
  },
  {
    id: 'pipeline',
    name: 'Pipeline',
    route: '/pipeline',
    component: PipelineFeature,
    sourcePath: 'src/features/pipeline/PipelineFeature.tsx',
    contractId: 'feature-pipeline',
    promptTerms: ["pipeline"],
    status: 'generated' as const,
  },
  {
    id: 'contacts',
    name: 'Contacts',
    route: '/contacts',
    component: ContactsFeature,
    sourcePath: 'src/features/contacts/ContactsFeature.tsx',
    contractId: 'feature-contacts',
    promptTerms: ["contacts","contact"],
    status: 'generated' as const,
  },
  {
    id: 'follow-ups',
    name: 'Follow Ups',
    route: '/follow-ups',
    component: FollowUpsFeature,
    sourcePath: 'src/features/follow-ups/FollowUpsFeature.tsx',
    contractId: 'feature-follow-ups',
    promptTerms: ["follow ups","follow-up"],
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
    id: 'employees',
    name: 'Employees',
    route: '/employees',
    component: EmployeesFeature,
    sourcePath: 'src/features/employees/EmployeesFeature.tsx',
    contractId: 'feature-employees',
    promptTerms: ["employees"],
    status: 'generated' as const,
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    route: '/onboarding',
    component: OnboardingFeature,
    sourcePath: 'src/features/onboarding/OnboardingFeature.tsx',
    contractId: 'feature-onboarding',
    promptTerms: ["onboarding"],
    status: 'generated' as const,
  },
  {
    id: 'time-off',
    name: 'Time Off',
    route: '/time-off',
    component: TimeOffFeature,
    sourcePath: 'src/features/time-off/TimeOffFeature.tsx',
    contractId: 'feature-time-off',
    promptTerms: ["time off"],
    status: 'generated' as const,
  },
  {
    id: 'payroll',
    name: 'Payroll',
    route: '/payroll',
    component: PayrollFeature,
    sourcePath: 'src/features/payroll/PayrollFeature.tsx',
    contractId: 'feature-payroll',
    promptTerms: ["payroll"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
