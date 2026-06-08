/** DevPulse V2 Phase 11.1+ Unified Command Center Brain — types. */

import type { CrossSystemAwarenessSnapshot } from './cross-system-awareness/relationship-types.js';
import type { SharedMemoryContext } from '../shared-memory/shared-memory-types.js';

export type { CrossSystemAwarenessSnapshot };
export type { SharedMemoryContext };

export type BrainRequestCategory =
  | 'ROADMAP'
  | 'SYSTEM'
  | 'PROJECT'
  | 'ARCHITECTURE'
  | 'RISK'
  | 'STATUS'
  | 'DEPENDENCY'
  | 'IMPACT'
  | 'RELATIONSHIP'
  | 'MEMORY'
  | 'GENERAL';

export type BrainPipelineStage =
  | 'BRAIN_REQUEST_RECEIVED'
  | 'REQUEST_CLASSIFIED'
  | 'SYSTEM_AWARENESS_CHECKED'
  | 'CROSS_SYSTEM_AWARENESS_CHECKED'
  | 'SHARED_MEMORY_CHECKED'
  | 'ROADMAP_AWARENESS_CHECKED'
  | 'RESPONSE_GENERATED'
  | 'BRAIN_RESPONSE_READY'
  | 'BRAIN_REQUEST_BLOCKED';

export type OperatorFeedEventType =
  | 'Classifying Request'
  | 'Loading Memory'
  | 'Searching Memory'
  | 'Memory Context Ready'
  | 'Checking Systems'
  | 'Checking Roadmap'
  | 'Loading Relationships'
  | 'Checking Dependencies'
  | 'Performing Impact Analysis'
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
  crossSystemContext?: CrossSystemAwarenessSnapshot;
  crossSystemDiagnostics?: CrossSystemDiagnostics;
  crossSystemRoutingReport?: CrossSystemRoutingReport;
  sharedMemoryContext?: SharedMemoryContext;
  pipelineStages: BrainPipelineStage[];
  operatorFeedEvents: OperatorFeedEvent[];
  confirmation: BrainConfirmation;
  createdAt: number;
}

export interface CrossSystemDiagnostics {
  relationshipCount: number;
  dependencyCount: number;
  impactAnalysisAvailable: boolean;
  lastRelationshipQuery: string | null;
  lastDependencyQuery: string | null;
  lastImpactQuery: string | null;
  lastQueryType: string | null;
  lastAnalyzerUsed: string | null;
  lastRoutingResult: string | null;
}

export interface CrossSystemRoutingReport {
  classification: BrainRequestCategory;
  selectedAnalyzer: 'relationship_engine' | 'dependency_analyzer' | 'impact_analyzer' | 'none';
  analyzerExecuted: boolean;
  responseSource: 'relationship_engine' | 'dependency_analyzer' | 'impact_analyzer' | 'fallback' | 'none';
  operatorFeedStages: OperatorFeedEventType[];
  routingResult: 'routed' | 'fallback_blocked';
  timestamp: number;
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
  'DEPENDENCY',
  'IMPACT',
  'RELATIONSHIP',
  'MEMORY',
  'GENERAL',
] as const;

export const BRAIN_PIPELINE_SEQUENCE: readonly BrainPipelineStage[] = [
  'BRAIN_REQUEST_RECEIVED',
  'REQUEST_CLASSIFIED',
  'SYSTEM_AWARENESS_CHECKED',
  'CROSS_SYSTEM_AWARENESS_CHECKED',
  'SHARED_MEMORY_CHECKED',
  'ROADMAP_AWARENESS_CHECKED',
  'RESPONSE_GENERATED',
  'BRAIN_RESPONSE_READY',
] as const;

export const SHARED_MEMORY_OPERATOR_FEED_STAGES: readonly OperatorFeedEventType[] = [
  'Loading Memory',
  'Searching Memory',
  'Memory Context Ready',
] as const;

export function withSharedMemoryFeedStages(
  sequence: readonly OperatorFeedEventType[],
): OperatorFeedEventType[] {
  const classifyIndex = sequence.indexOf('Classifying Request');
  const insertAt = classifyIndex >= 0 ? classifyIndex + 1 : 0;
  return [
    ...sequence.slice(0, insertAt),
    ...SHARED_MEMORY_OPERATOR_FEED_STAGES,
    ...sequence.slice(insertAt),
  ];
}

export const OPERATOR_FEED_EVENT_SEQUENCE: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Checking Systems',
  'Checking Roadmap',
  'Generating Response',
  'Response Ready',
] as const;

export const CROSS_SYSTEM_FEED_DEPENDENCY: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Loading Relationships',
  'Checking Dependencies',
  'Generating Response',
  'Response Ready',
] as const;

export const CROSS_SYSTEM_FEED_IMPACT: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Loading Relationships',
  'Performing Impact Analysis',
  'Generating Response',
  'Response Ready',
] as const;

export const CROSS_SYSTEM_FEED_RELATIONSHIP: readonly OperatorFeedEventType[] = [
  'Classifying Request',
  'Loading Relationships',
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
