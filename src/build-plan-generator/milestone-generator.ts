/**
 * Milestone Generator — build milestones from evidence (V1).
 */

import type { BuildPlanEvidenceBundle, BuildPlanMilestone } from './build-plan-types.js';

let milestoneCounter = 0;

export function resetMilestoneCounterForTests(): void {
  milestoneCounter = 0;
}

export function generateMilestones(bundle: BuildPlanEvidenceBundle): BuildPlanMilestone[] {
  const milestones: BuildPlanMilestone[] = [];

  const push = (name: string, description: string, evidence: string[]) => {
    milestoneCounter += 1;
    milestones.push({
      readOnly: true,
      milestoneId: `milestone-${milestoneCounter}`,
      name,
      description,
      evidence,
    });
  };

  push('Foundation', 'Project scaffolding, platform setup, and core infrastructure.', ['FOUNDATION_REQUIRED']);

  if (bundle.hasAuth || bundle.workflows.some((w) => /auth|login|signup/i.test(w))) {
    push('Authentication', 'User authentication, session management, and role access.', [
      'AUTH_WORKFLOW',
      ...bundle.userRoles.slice(0, 2),
    ]);
  }

  if (bundle.entities.length > 0) {
    push(
      'Data Layer',
      `Data models and persistence for ${bundle.entities.slice(0, 4).join(', ')}.`,
      bundle.entities.slice(0, 4).map((e) => `ENTITY:${e}`),
    );
  }

  if (bundle.screens.length > 0 || bundle.workflows.length > 0) {
    push(
      'Core Features',
      `Core screens and workflows: ${[...bundle.screens.slice(0, 3), ...bundle.workflows.slice(0, 2)].join(', ')}.`,
      [`SCREENS_${bundle.screens.length}`, `WORKFLOWS_${bundle.workflows.length}`],
    );
  }

  if (bundle.integrations.length > 0) {
    push(
      'Integrations',
      `Third-party integrations: ${bundle.integrations.join(', ')}.`,
      bundle.integrations.map((i) => `INTEGRATION:${i}`),
    );
  }

  push('Testing', 'Verification, QA coverage, and founder acceptance readiness.', ['TESTING_REQUIRED']);
  push('Launch Readiness', 'Deployment preparation, monitoring, and launch checklist.', ['LAUNCH_READINESS']);

  return milestones;
}
