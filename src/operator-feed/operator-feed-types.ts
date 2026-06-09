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
  | 'Evidence Registered'
  | 'Evidence Ownership Assigned'
  | 'Evidence Lineage Updated'
  | 'Evidence Traceability Linked'
  | 'Evidence Validation Complete'
  | 'Evidence Report Generated'
  | 'Verification Evidence Ready'
  | 'Verification Evidence Blocked'
  | 'Report Created'
  | 'Report Updated'
  | 'Report Validated'
  | 'Evidence Linked'
  | 'History Updated'
  | 'Trend Updated'
  | 'Report Exported'
  | 'Report Generated'
  | 'Verification Reporting Ready'
  | 'Verification Reporting Blocked'
  | 'Verification Requested'
  | 'Verification Routed'
  | 'Verification Scope Built'
  | 'Verification Context Built'
  | 'Unified Verification Session Created'
  | 'Verification State Updated'
  | 'Verification Response Generated'
  | 'Verification Complete'
  | 'Unified Verification Ready'
  | 'Unified Verification Blocked'
  | 'Cloud Runtime Created'
  | 'Cloud Runtime Initialized'
  | 'Cloud Runtime Activated'
  | 'Cloud Runtime Paused'
  | 'Cloud Runtime Resumed'
  | 'Cloud Runtime Completed'
  | 'Cloud Runtime Failed'
  | 'Cloud Runtime Archived'
  | 'Cloud Runtime Ready'
  | 'Cloud Runtime Blocked'
  | 'Workspace Created'
  | 'Workspace Initialized'
  | 'Workspace Activated'
  | 'Workspace Isolated'
  | 'Workspace Paused'
  | 'Workspace Resumed'
  | 'Workspace Completed'
  | 'Workspace Failed'
  | 'Workspace Archived'
  | 'Workspace Linked To Runtime'
  | 'Workspace Hosting Ready'
  | 'Workspace Hosting Blocked'
  | 'Persistent Build Created'
  | 'Persistent Build Initialized'
  | 'Persistent Build Activated'
  | 'Persistent Build Paused'
  | 'Persistent Build Resumed'
  | 'Persistent Build Waiting For Approval'
  | 'Persistent Build Waiting For Verification'
  | 'Persistent Build Waiting For Recovery'
  | 'Persistent Build Completed'
  | 'Persistent Build Failed'
  | 'Persistent Build Archived'
  | 'Persistent Build Linked To Runtime'
  | 'Persistent Build Linked To Workspace'
  | 'Persistent Build Runtime Ready'
  | 'Persistent Build Runtime Blocked'
  | 'Cloud Verification Created'
  | 'Cloud Verification Initialized'
  | 'Cloud Verification Requested'
  | 'Cloud Verification Linked To Unified Entry'
  | 'Cloud Verification Linked To Runtime'
  | 'Cloud Verification Linked To Workspace'
  | 'Cloud Verification Linked To Persistent Build'
  | 'Cloud Verification Evidence Linked'
  | 'Cloud Verification Report Linked'
  | 'Cloud Verification Completed'
  | 'Cloud Verification Failed'
  | 'Cloud Verification Archived'
  | 'Cloud Verification Foundation Ready'
  | 'Cloud Verification Foundation Blocked'
  | 'Cloud Failure Identified'
  | 'Cloud Recovery Candidate Identified'
  | 'Cloud Recovery Plan Registered'
  | 'Cloud Recovery Linked To Runtime'
  | 'Cloud Recovery Linked To Workspace'
  | 'Cloud Recovery Linked To Build'
  | 'Cloud Recovery Linked To Verification'
  | 'Cloud Recovery Ready'
  | 'Cloud Recovery Completed'
  | 'Cloud Recovery Failed'
  | 'Cloud Recovery Archived'
  | 'Cloud Recovery Foundation Blocked'
  | 'Cloud Monitoring Created'
  | 'Cloud Monitoring Activated'
  | 'Health Updated'
  | 'Alert Created'
  | 'Alert Acknowledged'
  | 'Monitoring Linked To Runtime'
  | 'Monitoring Linked To Workspace'
  | 'Monitoring Linked To Build'
  | 'Monitoring Linked To Verification'
  | 'Monitoring Linked To Recovery'
  | 'Cloud Monitoring Completed'
  | 'Cloud Monitoring Failed'
  | 'Cloud Monitoring Archived'
  | 'Cloud Monitoring Foundation Blocked'
  | 'Mobile Command Session Created'
  | 'Mobile Command Connected To Cloud'
  | 'Mobile Command Connected To Workspace'
  | 'Mobile Command Connected To Build'
  | 'Mobile Command Connected To Verification'
  | 'Mobile Command Connected To Recovery'
  | 'Mobile Command Connected To Monitoring'
  | 'Mobile Command Action Allowed'
  | 'Mobile Command Action Blocked'
  | 'Mobile Command Requires Approval'
  | 'Mobile Command Desktop Recommended'
  | 'Mobile Command Completed'
  | 'Mobile Command Failed'
  | 'Mobile Command Archived'
  | 'Mobile Chat Session Created'
  | 'Mobile Chat Prompt Received'
  | 'Mobile Chat Context Ready'
  | 'Mobile Chat Routed To Command'
  | 'Mobile Chat Action Allowed'
  | 'Mobile Chat Action Blocked'
  | 'Mobile Chat Requires Approval'
  | 'Mobile Chat Desktop Recommended'
  | 'Mobile Chat Response Pending'
  | 'Mobile Chat Response Ready'
  | 'Mobile Chat Completed'
  | 'Mobile Chat Failed'
  | 'Mobile Chat Archived'
  | 'Mobile Preview Session Created'
  | 'Eligibility Checked'
  | 'Safety Checked'
  | 'Allowed'
  | 'Blocked'
  | 'Desktop Recommended'
  | 'Link Registered'
  | 'Pending'
  | 'Ready'
  | 'Completed'
  | 'Failed'
  | 'Archived'
  | 'Mobile Approval Session Created'
  | 'Approval Request Registered'
  | 'Waiting For Decision'
  | 'Decision Recorded'
  | 'Approval Approved'
  | 'Approval Rejected'
  | 'Approval Completed'
  | 'Approval Failed'
  | 'Approval Archived'
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
