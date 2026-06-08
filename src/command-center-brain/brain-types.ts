/** DevPulse V2 Phase 11.1 Unified Command Center Brain — types. */

export type BrainRequestCategory =
  | 'ROADMAP'
  | 'SYSTEM'
  | 'PROJECT'
  | 'ARCHITECTURE'
  | 'RISK'
  | 'STATUS'
  | 'GENERAL';

export type BrainPipelineStage =
  | 'BRAIN_REQUEST_RECEIVED'
  | 'REQUEST_CLASSIFIED'
  | 'SYSTEM_AWARENESS_CHECKED'
  | 'ROADMAP_AWARENESS_CHECKED'
  | 'RESPONSE_GENERATED'
  | 'BRAIN_RESPONSE_READY'
  | 'BRAIN_REQUEST_BLOCKED';

export type OperatorFeedEventType =
  | 'Classifying Request'
  | 'Checking Systems'
  | 'Checking Roadmap'
  | 'Generating Response'
  | 'Response Ready';

export interface BrainRequestInput {
  message: string;
  timestamp?: number;
}

export interface BrainClassification {
  category: BrainRequestCategory;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedSignals: string[];
  reason: string;
}

export interface BrainSystemRecord {
  systemId: string;
  displayName: string;
  phase: number | string;
  purpose: string;
  status: 'FOUNDATION_COMPLETE' | 'RUNTIME_NOT_CONNECTED' | 'SHELL_ONLY';
  ownerModule: string;
}

export interface BrainRoadmapContext {
  currentPhase: string;
  completedPhases: string[];
  nextPhase: string;
  nextPhaseDescription: string;
  recommendedNextStep: string;
  stackMaturitySummary: string;
}

export interface OperatorFeedEvent {
  eventId: string;
  eventType: OperatorFeedEventType;
  timestamp: number;
  informationalOnly: true;
}

export interface BrainConfirmation {
  intelligenceOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noDeploymentPerformed: true;
  noAutoFixPerformed: true;
  noRuntimeMutation: true;
  noExternalAiCalls: true;
  noPersistence: true;
  noSystemReplacement: true;
}

export interface BrainResponseResult {
  responseId: string;
  userMessage: string;
  brainResponse: string;
  category: BrainRequestCategory;
  classification: BrainClassification;
  systemsReferenced: string[];
  roadmapContext: BrainRoadmapContext;
  pipelineStages: BrainPipelineStage[];
  operatorFeedEvents: OperatorFeedEvent[];
  confirmation: BrainConfirmation;
  createdAt: number;
}

export const COMMAND_CENTER_BRAIN_OWNER_MODULE = 'devpulse_v2_command_center_brain';
export const COMMAND_CENTER_BRAIN_PASS_TOKEN = 'DEVPULSE_V2_UNIFIED_COMMAND_CENTER_BRAIN_FOUNDATION_V1_PASS';

export const BRAIN_REQUEST_CATEGORIES: readonly BrainRequestCategory[] = [
  'ROADMAP',
  'SYSTEM',
  'PROJECT',
  'ARCHITECTURE',
  'RISK',
  'STATUS',
  'GENERAL',
] as const;

export const BRAIN_PIPELINE_SEQUENCE: readonly BrainPipelineStage[] = [
  'BRAIN_REQUEST_RECEIVED',
  'REQUEST_CLASSIFIED',
  'SYSTEM_AWARENESS_CHECKED',
  'ROADMAP_AWARENESS_CHECKED',
  'RESPONSE_GENERATED',
  'BRAIN_RESPONSE_READY',
] as const;

export const OPERATOR_FEED_EVENT_SEQUENCE: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Checking Systems',
  'Checking Roadmap',
  'Generating Response',
  'Response Ready',
] as const;

export const DUPLICATE_BRAIN_PATTERNS = [
  'command_center_brain',
  'unified_command_center_brain',
  'brain_core',
  'command_center_intelligence',
] as const;

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'deploy now', 'auto-fix', 'auto fix'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code', 'create files'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;

let responseCounter = 0;

export function nextBrainResponseId(): string {
  responseCounter += 1;
  return `brain-resp-${responseCounter.toString().padStart(4, '0')}`;
}

export function resetBrainCountersForTests(): void {
  responseCounter = 0;
}
