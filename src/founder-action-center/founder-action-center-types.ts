/**
 * Founder Action Center — prioritized next-step execution model.
 */

export const FOUNDER_ACTION_CENTER_PASS_TOKEN = 'FOUNDER_ACTION_CENTER_PASS';
export const FOUNDER_ACTION_CENTER_OWNER_MODULE = 'aidevengine_founder_action_center';

export type ActionType =
  | 'REVIEW_ACTION'
  | 'FIX_ACTION'
  | 'TEST_ACTION'
  | 'BUILD_ACTION'
  | 'APPROVAL_ACTION'
  | 'INFORMATION_ACTION';

export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FounderActionCenterState =
  | 'NO_ACTIONS'
  | 'ACTIONS_AVAILABLE'
  | 'ACTIONS_BLOCKED'
  | 'ACTIONS_READY'
  | 'ACTIONS_REQUIRING_REVIEW';

export interface FounderAction {
  id: string;
  type: ActionType;
  priority: ActionPriority;
  title: string;
  rationale: string;
  expectedImpact: string;
  evidence: string;
  executable: boolean;
  blockedReason?: string;
}

export interface FounderActionBlocker {
  title: string;
  impact: string;
  evidence: string;
}

export interface FounderOpportunity {
  title: string;
  detail: string;
  evidence: string;
}

export interface RecommendedNextStep {
  priority: ActionPriority;
  title: string;
  type: ActionType;
  reason: string;
  expectedImpact: string;
  evidence: string;
}

export interface ActionFeedEvent {
  section: string;
  action: string;
  detail: string;
  status: 'Queued' | 'Active' | 'Completed' | 'Blocked' | 'Warning';
  evidence?: string;
}

export interface FounderActionCenterAssessment {
  state: FounderActionCenterState;
  stateLabel: string;
  recommendedNextStep: RecommendedNextStep | null;
  topActions: FounderAction[];
  blockers: FounderActionBlocker[];
  opportunities: FounderOpportunity[];
  executionImpact: string[];
  insufficientInfo: boolean;
  insufficientInfoReason: string | null;
  operatorFeedEvents: ActionFeedEvent[];
  actionsGenerated: boolean;
  prioritiesVisible: boolean;
  blockersVisible: boolean;
  rationaleVisible: boolean;
  impactVisible: boolean;
  recommendationsActionable: boolean;
  noDuplicates: boolean;
  noTechnicalOnly: boolean;
}
