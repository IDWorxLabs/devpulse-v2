/** Feature module registry — Modular Feature Materialization V1 */
import AuthFeature from './auth';
import DashboardFeature from './dashboard';
import ProjectsFeature from './projects';
import TasksFeature from './tasks';
import TeamFeature from './team';
import TimelineFeature from './timeline';
import ReportsFeature from './reports';

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
    id: 'projects',
    name: 'Projects',
    route: '/projects',
    component: ProjectsFeature,
    sourcePath: 'src/features/projects/ProjectsFeature.tsx',
    contractId: 'feature-projects',
    promptTerms: ["projects","project"],
    status: 'generated' as const,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    route: '/tasks',
    component: TasksFeature,
    sourcePath: 'src/features/tasks/TasksFeature.tsx',
    contractId: 'feature-tasks',
    promptTerms: ["tasks","task"],
    status: 'generated' as const,
  },
  {
    id: 'team',
    name: 'Team',
    route: '/team',
    component: TeamFeature,
    sourcePath: 'src/features/team/TeamFeature.tsx',
    contractId: 'feature-team',
    promptTerms: ["team"],
    status: 'generated' as const,
  },
  {
    id: 'timeline',
    name: 'Timeline',
    route: '/timeline',
    component: TimelineFeature,
    sourcePath: 'src/features/timeline/TimelineFeature.tsx',
    contractId: 'feature-timeline',
    promptTerms: ["timeline"],
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
