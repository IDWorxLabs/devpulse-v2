/**
 * Customer Operations Platform V1 — customer onboarding flow.
 */

import { DEMO_CUSTOMER_SUITE } from './customer-platform-registry.js';
import type { OnboardingMetrics } from './customer-operations-platform-v1-types.js';

export type OnboardingStage =
  | 'Signup'
  | 'Verification'
  | 'Tenant Creation'
  | 'Workspace Provisioning'
  | 'First Project'
  | 'Activation';

export interface OnboardingFlowRecord {
  readOnly: true;
  customerId: string;
  stages: readonly { stage: OnboardingStage; completedAt: string; completed: boolean }[];
  activated: boolean;
  timeToFirstProjectHours: number;
}

export function runCustomerOnboardingFlow(now = new Date()): {
  flows: OnboardingFlowRecord[];
  metrics: OnboardingMetrics;
} {
  const flows: OnboardingFlowRecord[] = [];
  const stages: OnboardingStage[] = [
    'Signup',
    'Verification',
    'Tenant Creation',
    'Workspace Provisioning',
    'First Project',
    'Activation',
  ];

  for (const customer of DEMO_CUSTOMER_SUITE) {
    const completedStages = stages.map((stage, index) => ({
      stage,
      completedAt: new Date(now.getTime() - (stages.length - index) * 3600_000).toISOString(),
      completed: true,
    }));

    flows.push({
      readOnly: true,
      customerId: customer.customerId,
      stages: completedStages,
      activated: customer.status === 'ACTIVE' || customer.status === 'TRIAL',
      timeToFirstProjectHours: 4 + customer.projects.length,
    });
  }

  const signupCount = flows.length;
  const activated = flows.filter((f) => f.activated).length;

  return {
    flows,
    metrics: {
      readOnly: true,
      signupCount,
      verificationComplete: signupCount,
      tenantCreated: signupCount,
      workspaceProvisioned: signupCount,
      firstProjectCreated: signupCount,
      activated,
      completionPercent: Math.round((activated / signupCount) * 100),
      activationRate: Math.round((activated / signupCount) * 100),
      averageTimeToFirstProjectHours: Math.round(
        flows.reduce((s, f) => s + f.timeToFirstProjectHours, 0) / flows.length,
      ),
    },
  };
}
