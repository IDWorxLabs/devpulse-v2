/**
 * Founder Testing V5 — six unified evaluation phases for operator feed.
 */

import { FOUNDER_TEST_V5_MAX_PHASES } from './founder-testing-v5-bounds.js';

export interface FounderTestPhaseEvent {
  phase: number;
  phaseName: string;
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export const FOUNDER_TEST_V5_PHASES: FounderTestPhaseEvent[] = [
  {
    phase: 1,
    phaseName: 'Project Understanding',
    section: 'Planning',
    action: 'Understanding Product',
    detail: 'Evaluating Project Memory, Project Insights, concept clarity, and first-time user reality.',
    status: 'Active',
  },
  {
    phase: 2,
    phaseName: 'Execution Reality',
    section: 'Execution',
    action: 'Checking Execution Reality',
    detail: 'Evaluating Live Preview, Running Application, promise reality, and execution readiness.',
    status: 'Active',
  },
  {
    phase: 3,
    phaseName: 'Verification Reality',
    section: 'Verification',
    action: 'Reviewing Verification Evidence',
    detail: 'Evaluating verification results, readiness, and evidence quality.',
    status: 'Active',
  },
  {
    phase: 4,
    phaseName: 'Product Evolution',
    section: 'Learning',
    action: 'Analyzing Product Evolution',
    detail: 'Evaluating Change Intelligence, progress, and regressions.',
    status: 'Active',
  },
  {
    phase: 5,
    phaseName: 'Founder Experience',
    section: 'Approvals',
    action: 'Evaluating Founder Experience',
    detail: 'Evaluating Action Center, sensemaking, interaction simulation, customer journey simulation, visual quality, adoption prediction, product economics, product evolution, competitive reality, founder decision readiness, digital founder board, and workflow quality.',
    status: 'Active',
  },
  {
    phase: 6,
    phaseName: 'Launch Evaluation',
    section: 'Learning',
    action: 'Preparing Launch Recommendation',
    detail: 'Synthesizing launch readiness, adoption prediction, product economics, product evolution roadmap, competitive reality, founder decision, digital founder board, and final recommendation.',
    status: 'Completed',
  },
];

export function buildFounderTestV5PhaseFeed(completedPhase = FOUNDER_TEST_V5_MAX_PHASES): FounderTestPhaseEvent[] {
  return FOUNDER_TEST_V5_PHASES.map((p, i): FounderTestPhaseEvent => ({
    ...p,
    status: i < completedPhase - 1 ? 'Completed' : i === completedPhase - 1 ? 'Completed' : 'Queued',
  }));
}
