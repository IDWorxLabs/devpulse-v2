/**
 * Portfolio demo data — UI testing only. Clearly isolated from real project memory.
 * Every entry is marked isDemo / source: "demo".
 */

export const PORTFOLIO_DEMO_DISCLAIMER =
  'Demo data for visual testing only. These projects are not real and are not stored in Project Memory.';

export interface PortfolioDemoProject {
  projectId: string;
  name: string;
  label: 'DEMO';
  source: 'demo';
  isDemo: true;
  description: string;
  stage: string;
  health: 'Healthy' | 'At Risk' | 'Blocked';
  progress: number;
  verification: string;
  preview: string;
  risk: 'Low' | 'Medium' | 'High';
  recommendedAction: string;
  priorityRank: number;
  priorityReason: string;
  summary: string;
  blockers: string[];
  recentActivity: string[];
}

export interface PortfolioSummaryCounts {
  projects: number;
  healthy: number;
  atRisk: number;
  blocked: number;
  verificationReady: number;
  previewAvailable: number;
  building: number;
  ready: number;
}

export interface PortfolioPriorityItem {
  rank: number;
  projectId: string;
  name: string;
  reason: string;
  isDemo: true;
  source: 'demo';
}

export interface PortfolioInsightsDemo {
  disclaimer: string;
  source: 'demo';
  summary: PortfolioSummaryCounts;
  projects: PortfolioDemoProject[];
  priorityQueue: PortfolioPriorityItem[];
  recommendedActions: string[];
}

const DEMO_PROJECTS: PortfolioDemoProject[] = [
  {
    projectId: 'demo-aidevengine',
    name: 'AiDevEngine Demo',
    label: 'DEMO',
    source: 'demo',
    isDemo: true,
    description:
      'Autonomous software development engine for planning, validating, and executing app builds.',
    stage: 'Verification & Product Hardening',
    health: 'Healthy',
    progress: 82,
    verification: 'Ready',
    preview: 'Idle',
    risk: 'Medium',
    recommendedAction:
      'Continue manual founder testing across navigation, preview, memory, and verification.',
    priorityRank: 3,
    priorityReason: 'Ready for founder testing.',
    summary:
      'Product shell and portfolio insights are in active polish. Verification alignment complete.',
    blockers: [],
    recentActivity: [
      'Product navigation polish completed',
      'Validator alignment pass completed',
      'Portfolio insights layout in testing',
    ],
  },
  {
    projectId: 'demo-field-service',
    name: 'Field Service App Demo',
    label: 'DEMO',
    source: 'demo',
    isDemo: true,
    description:
      'A field-service management app for jobs, technicians, scheduling, and customer updates.',
    stage: 'Planning',
    health: 'At Risk',
    progress: 34,
    verification: 'Not Ready',
    preview: 'Not Available',
    risk: 'High',
    recommendedAction: 'Define mobile workflow, job lifecycle, and technician permissions.',
    priorityRank: 2,
    priorityReason: 'Requirements incomplete.',
    summary: 'Early planning stage — core workflows and permissions not fully defined.',
    blockers: ['Mobile workflow undefined', 'Technician permission model incomplete'],
    recentActivity: [
      'Idea captured in demo portfolio',
      'Requirements workshop not scheduled',
      'No preview target registered',
    ],
  },
  {
    projectId: 'demo-customer-portal',
    name: 'Customer Portal Demo',
    label: 'DEMO',
    source: 'demo',
    isDemo: true,
    description:
      'A customer self-service portal for requests, status tracking, documents, and notifications.',
    stage: 'Blocked',
    health: 'Blocked',
    progress: 18,
    verification: 'Blocked',
    preview: 'Not Available',
    risk: 'High',
    recommendedAction: 'Resolve missing authentication and notification requirements.',
    priorityRank: 1,
    priorityReason: 'Blocked by missing authentication and notification requirements.',
    summary: 'Blocked until authentication and notification requirements are resolved.',
    blockers: ['Authentication requirements missing', 'Notification channel requirements missing'],
    recentActivity: [
      'Blockers identified during planning review',
      'Verification gated until requirements clarified',
      'Preview not started',
    ],
  },
];

function computeSummary(projects: PortfolioDemoProject[]): PortfolioSummaryCounts {
  return {
    projects: projects.length,
    healthy: projects.filter((p) => p.health === 'Healthy').length,
    atRisk: projects.filter((p) => p.health === 'At Risk').length,
    blocked: projects.filter((p) => p.health === 'Blocked').length,
    verificationReady: projects.filter((p) => p.verification === 'Ready').length,
    previewAvailable: projects.filter((p) => p.preview === 'Available').length,
    building: projects.filter((p) => p.stage !== 'Blocked' && p.progress > 0 && p.progress < 100).length,
    ready: projects.filter((p) => p.verification === 'Ready' && p.health === 'Healthy').length,
  };
}

export function buildPortfolioInsightsDemo(): PortfolioInsightsDemo {
  const projects = DEMO_PROJECTS.slice();
  const priorityQueue = projects
    .slice()
    .sort((a, b) => a.priorityRank - b.priorityRank)
    .map((p, index) => ({
      rank: index + 1,
      projectId: p.projectId,
      name: p.name,
      reason: p.priorityReason,
      isDemo: true as const,
      source: 'demo' as const,
    }));

  return {
    disclaimer: PORTFOLIO_DEMO_DISCLAIMER,
    source: 'demo',
    summary: computeSummary(projects),
    projects,
    priorityQueue,
    recommendedActions: [
      'Resolve Customer Portal blockers.',
      'Complete Field Service App requirements.',
      'Continue AiDevEngine manual founder testing.',
      'Run verification after requirements are clarified.',
    ],
  };
}
