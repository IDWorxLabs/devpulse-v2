/**
 * Phase Sequencer — ordered build phases from milestones (V1).
 */

import type { BuildPlanMilestone, BuildPlanPhase } from './build-plan-types.js';

const PHASE_ORDER = [
  'Foundation',
  'Authentication',
  'Data Layer',
  'Core Features',
  'Integrations',
  'Testing',
  'Launch Readiness',
];

export function sequencePhases(milestones: readonly BuildPlanMilestone[]): BuildPlanPhase[] {
  const byName = new Map(milestones.map((m) => [m.name, m]));
  const phases: BuildPlanPhase[] = [];
  let phaseNumber = 0;

  for (const name of PHASE_ORDER) {
    const milestone = byName.get(name);
    if (!milestone) continue;
    phaseNumber += 1;
    phases.push({
      readOnly: true,
      phaseNumber,
      phaseId: `phase-${phaseNumber}`,
      name: milestone.name,
      milestoneIds: [milestone.milestoneId],
      evidence: [...milestone.evidence],
    });
  }

  return phases;
}
