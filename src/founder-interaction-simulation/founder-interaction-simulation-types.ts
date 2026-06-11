/**
 * Founder Interaction Simulation Engine — types.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FounderSensemakingAssessment } from '../founder-sensemaking-engine/founder-sensemaking-types.js';

export type InteractionFindingType =
  | 'INTERACTION_FAILURE'
  | 'BLOCKED_WORKFLOW'
  | 'HIDDEN_CONTENT'
  | 'TRAPPED_FOCUS'
  | 'DEAD_CONTROL'
  | 'OVERLAY_CONFLICT'
  | 'SCROLL_TRAP'
  | 'RECOVERY_FAILURE';

export type InteractionCategory =
  | 'BUTTON'
  | 'MODAL'
  | 'NAVIGATION'
  | 'COMMAND_CENTER'
  | 'SCROLL'
  | 'RECOVERY';

export type InteractionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface InteractionFinding {
  id: string;
  type: InteractionFindingType;
  category: InteractionCategory;
  severity: InteractionSeverity;
  whatFailed: string;
  founderActionAttempted: string;
  expectedBehavior: string;
  observedBehavior: string;
  whyItMatters: string;
  recommendedFix: string;
  regressionScenario: string;
}

export interface InteractionScenarioResult {
  id: string;
  category: InteractionCategory;
  name: string;
  passed: boolean;
  detail: string;
}

export interface InteractionFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
}

export interface FounderInteractionSimulationAssessment {
  interactionScore: number;
  testedInteractions: number;
  passedInteractions: number;
  scenarios: InteractionScenarioResult[];
  findings: InteractionFinding[];
  blockedWorkflows: InteractionFinding[];
  hiddenContentIssues: InteractionFinding[];
  recoveryIssues: InteractionFinding[];
  recommendedFixes: string[];
  operatorFeedEvents: InteractionFeedEvent[];
  modalCloseRegressionPass: boolean;
  commandCenterReadableAfterClosePass: boolean;
  copyReportAvailablePass: boolean;
  sendInputUsableAfterClosePass: boolean;
  findingsGenerated: boolean;
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
}

export interface FounderInteractionShellSources {
  appJs: string;
  html: string;
  css: string;
}

export interface AssessFounderInteractionSimulationInput {
  shellSources: FounderInteractionShellSources;
  liveResults?: import('../founder-testing-mode/founder-testing-types.js').LiveScreenResultInput[];
}

export interface EnrichedAssessments {
  founderActionCenter: FounderActionCenterAssessment;
  founderSensemaking: FounderSensemakingAssessment;
}
