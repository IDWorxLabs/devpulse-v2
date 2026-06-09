/**
 * DevPulse V2 Phase 13.1 — Operator Feed Foundation types.
 * Visibility authority only — describes intelligence activity, does not perform it.
 */

export const OPERATOR_FEED_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_OPERATOR_FEED_FOUNDATION_V1_PASS';
export const OPERATOR_FEED_FOUNDATION_OWNER_MODULE = 'devpulse_v2_operator_feed';

export type OperatorFeedStage =
  | 'Loading Context'
  | 'Reading Shared Memory'
  | 'Reading Project Understanding'
  | 'Reading Project Facts'
  | 'Reading Vault Facts'
  | 'Reading Vault Intelligence'
  | 'Reading Dependency Intelligence'
  | 'Reading Workspace Intelligence'
  | 'Reading History Intelligence'
  | 'Reading Summaries'
  | 'Reading Portfolio Intelligence'
  | 'Loading Portfolio'
  | 'Reading Project Inventory'
  | 'Computing Health'
  | 'Generating Portfolio Summary'
  | 'Evaluating Risks'
  | 'Generating Recommendation'
  | 'Generating Project Answer'
  | 'Generating Response'
  | 'Action Identified'
  | 'Action Evaluated'
  | 'Action Recommended'
  | 'Action Deferred'
  | 'Action Blocked'
  | 'Action Completed'
  | 'Reasoning Started'
  | 'Evidence Collected'
  | 'Risks Evaluated'
  | 'Blockers Evaluated'
  | 'Confidence Calculated'
  | 'Reasoning Ready'
  | 'Progress Evaluation Started'
  | 'Milestones Evaluated'
  | 'Progress Calculated'
  | 'Progress Ready'
  | 'Failure Detected'
  | 'Failure Evaluated'
  | 'Severity Calculated'
  | 'Impact Evaluated'
  | 'Next Step Generated'
  | 'Failure Ready'
  | 'Learning Analysis Started'
  | 'Patterns Evaluated'
  | 'Failures Evaluated'
  | 'Recommendations Evaluated'
  | 'Learning Ready'
  | 'Execution Evaluation Started'
  | 'Readiness Evaluation'
  | 'Dependency Check'
  | 'Safety Check'
  | 'Execution Readiness Ready'
  | 'Build Task Planning Started'
  | 'Task Request Parsed'
  | 'Dependencies Resolved'
  | 'Safety Gates Evaluated'
  | 'Verification Plan Created'
  | 'Build Task Plan Ready'
  | 'Code Generation Planning Started'
  | 'Generation Request Parsed'
  | 'Artifact Proposals Created'
  | 'Change Proposals Created'
  | 'Generation Risks Evaluated'
  | 'Validation Plan Created'
  | 'Code Generation Plan Ready'
  | 'Testing Planning Started'
  | 'Testing Request Parsed'
  | 'Test Cases Created'
  | 'Evidence Requirements Created'
  | 'Test Risks Evaluated'
  | 'Simulated Results Created'
  | 'Testing Plan Ready'
  | 'Auto Fix Planning Started'
  | 'Failure Analysis Complete'
  | 'Fix Proposals Created'
  | 'Alternatives Evaluated'
  | 'Rollback Plan Created'
  | 'Auto Fix Plan Ready'
  | 'Runtime Verification Started'
  | 'Verification Evidence Collected'
  | 'Verification Gaps Evaluated'
  | 'Trust Assessment Calculated'
  | 'Verification Score Calculated'
  | 'Runtime Verification Report Ready'
  | 'World 2 Activation Started'
  | 'Workspace Isolation Checked'
  | 'Governance Gates Checked'
  | 'Runtime Chain Linked'
  | 'Activation Readiness Evaluated'
  | 'World 2 Activation Plan Ready'
  | 'Builder Packet Execution Started'
  | 'Builder Packet Validated'
  | 'Builder Packet Steps Normalized'
  | 'Builder Packet Risks Classified'
  | 'Builder Packet Execution Packet Ready'
  | 'Builder Packet Execution Blocked'
  | 'Controlled Apply Started'
  | 'Controlled Apply Validated'
  | 'Controlled Apply Gates Evaluated'
  | 'Controlled Apply Risks Classified'
  | 'Controlled Apply Plan Ready'
  | 'Controlled Apply Blocked'
  | 'Rollback Planning Started'
  | 'Rollback Preconditions Validated'
  | 'Rollback Snapshot Requirements Evaluated'
  | 'Rollback Risks Classified'
  | 'Rollback Plan Ready'
  | 'Rollback Planning Blocked'
  | 'Recovery Planning Started'
  | 'Recovery Preconditions Validated'
  | 'Recovery Failure Classified'
  | 'Recovery Strategy Selected'
  | 'Recovery Escalation Evaluated'
  | 'Recovery Plan Ready'
  | 'Recovery Planning Blocked'
  | 'Completion Planning Started'
  | 'Completion Criteria Evaluated'
  | 'Completion Evidence Evaluated'
  | 'Completion Verification Evaluated'
  | 'Completion Risks Classified'
  | 'Completion Plan Ready'
  | 'Completion Planning Blocked'
  | 'Preview Target Discovered'
  | 'Preview Session Created'
  | 'Preview Session Validated'
  | 'Preview Runtime Ready'
  | 'Preview Runtime Blocked'
  | 'Preview Intelligence Started'
  | 'Preview Context Analyzed'
  | 'Preview Readiness Evaluated'
  | 'Preview Capabilities Analyzed'
  | 'Preview Limitations Identified'
  | 'Preview Observation Plan Prepared'
  | 'Preview Intelligence Ready'
  | 'Preview Intelligence Blocked'
  | 'Self Vision Started'
  | 'Self Vision Session Created'
  | 'Observation Targets Planned'
  | 'Capture Plan Prepared'
  | 'Self Vision Ready'
  | 'Self Vision Blocked'
  | 'UI Inspection Started'
  | 'Layout Structures Identified'
  | 'Navigation Structures Identified'
  | 'Loading Structures Identified'
  | 'Responsive Structures Identified'
  | 'UI Inspection Ready'
  | 'UI Inspection Blocked'
  | 'Interaction Testing Started'
  | 'Interaction Plans Generated'
  | 'Button Testing Executed'
  | 'Navigation Testing Executed'
  | 'Form Testing Executed'
  | 'Workflow Testing Executed'
  | 'Interaction Results Recorded'
  | 'Interaction Testing Ready'
  | 'Interaction Testing Blocked'
  | 'Visual Verification Started'
  | 'Verification Targets Identified'
  | 'Layout Verification Complete'
  | 'Navigation Verification Complete'
  | 'Loading Verification Complete'
  | 'Responsive Verification Complete'
  | 'Interaction Verification Complete'
  | 'Verification Evidence Built'
  | 'Visual Verification Ready'
  | 'Visual Verification Blocked'
  | 'Verification Provider Registered'
  | 'Verification Session Created'
  | 'Verification Session Started'
  | 'Verification Session Completed'
  | 'Verification Session Failed'
  | 'Verification Runtime Ready'
  | 'Verification Runtime Blocked'
  | 'Verification Target Registered'
  | 'Verification Dependency Registered'
  | 'Verification Requirement Registered'
  | 'Verification Capability Registered'
  | 'Verification Registry Ready'
  | 'Verification Registry Blocked'
  | 'Verification Dependencies Resolved'
  | 'Verification Schedule Prepared'
  | 'Verification Parallel Groups Identified'
  | 'Verification Targets Blocked'
  | 'Verification Orchestration Ready'
  | 'Verification Orchestration Blocked'
  | 'Response Ready';

export type OperatorFeedEventStatus = 'PENDING' | 'ACTIVE' | 'COMPLETE';
export type OperatorFeedConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface OperatorFeedEvent {
  eventId: string;
  timestamp: number;
  sourceSystem: string;
  stage: OperatorFeedStage;
  status: OperatorFeedEventStatus;
  summary: string;
  confidence: OperatorFeedConfidence;
  relatedProject: string | null;
  relatedWorkspace: string | null;
  visibilityOnly: true;
}

export interface OperatorFeedContext {
  query: string;
  primaryCapability: string | null;
  sourceSystems: string[];
  relatedProject: string | null;
  relatedWorkspace: string | null;
  stagesPlanned: OperatorFeedStage[];
}

export interface OperatorFeedTimeline {
  timelineId: string;
  query: string;
  events: OperatorFeedEvent[];
  stageCount: number;
  sourceSystems: string[];
  primaryCapability: string | null;
  finalStage: OperatorFeedStage;
  responseReady: boolean;
  startedAt: number;
  completedAt: number;
}

export interface OperatorFeedDiagnostics {
  operatorFeedActive: boolean;
  eventCount: number;
  stageCount: number;
  lastQuery: string | null;
  lastPrimaryCapability: string | null;
  lastSourceSystem: string | null;
  responseReadyEmitted: boolean;
  timelineOrdered: boolean;
}

export const STANDARD_VISIBILITY_STAGES: readonly OperatorFeedStage[] = [
  'Loading Context',
  'Reading Shared Memory',
  'Reading Project Understanding',
  'Reading Vault Intelligence',
  'Reading Dependency Intelligence',
  'Reading Workspace Intelligence',
  'Reading History Intelligence',
  'Reading Summaries',
  'Reading Portfolio Intelligence',
  'Generating Recommendation',
  'Generating Response',
  'Response Ready',
] as const;

export const FORBIDDEN_OPERATOR_FEED_DUPLICATES = [
  'operator_feed_v2',
  'feed_brain',
  'visibility_brain',
  'brain_v2',
  'memory_brain',
  'visibility_layer',
  'activity_feed',
  'feed_runtime',
  'second_operator_feed',
] as const;

export function isDuplicateOperatorFeedBrainQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return (
    lower.includes('create operator feed v2') ||
    lower.includes('operator feed v2') ||
    lower.includes('feed brain') ||
    lower.includes('visibility brain') ||
    lower.includes('replace operator feed')
  );
}
