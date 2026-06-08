/** DevPulse V2 Phase 10.1 Experience Layer Foundation — types. */

export type ExperienceSurface =
  | 'FOUNDER_HOME'
  | 'PROJECT_ENTRY'
  | 'PROJECT_WORKSPACE'
  | 'WORLD2_WORKSPACE'
  | 'VERIFICATION_WORKSPACE'
  | 'TRUST_WORKSPACE'
  | 'MOBILE_WORKSPACE'
  | 'SELF_EVOLUTION_WORKSPACE'
  | 'PROJECT_COMPLETION_WORKSPACE';

export type ExperienceJourneyStage =
  | 'IDEA_CAPTURE'
  | 'PROJECT_PLANNING'
  | 'WORLD2_SIMULATION'
  | 'BUILD_PREPARATION'
  | 'VERIFICATION'
  | 'TRUST_REVIEW'
  | 'MOBILE_MONITORING'
  | 'SELF_EVOLUTION_ANALYSIS'
  | 'PROJECT_COMPLETION';

export type ExperienceState =
  | 'EXPERIENCE_REQUEST_RECEIVED'
  | 'SURFACES_GENERATED'
  | 'JOURNEY_MAPPED'
  | 'SYSTEMS_SEQUENCED'
  | 'DECISIONS_MAPPED'
  | 'PATH_RECOMMENDED'
  | 'EXPERIENCE_MAP_READY'
  | 'EXPERIENCE_BLOCKED';

export type GovernanceStatus = 'PASS' | 'FAIL' | 'PENDING' | 'UNKNOWN';

export interface GateRecord {
  gateId: string;
  gateType: string;
  status: 'OPEN' | 'CLOSED' | 'REQUIRED';
  description: string;
}

export interface ExperienceMapInput {
  experienceId?: string;
  journeyId?: string;
  workspaceId: string;
  projectId: string;
  projectIdeaSummary: string;
  timestamp: number;
  governanceStatus: GovernanceStatus;
  targetWorkspaceId?: string;
  targetProjectId?: string;
}

export interface ExperienceSurfaceRecord {
  surfaceId: string;
  surfaceType: ExperienceSurface;
  surfaceLabel: string;
  surfaceDescription: string;
  connectedSystems: string[];
  founderPurpose: string;
}

export interface DecisionPoint {
  decisionId: string;
  stage: ExperienceJourneyStage;
  decisionQuestion: string;
  founderActionRequired: boolean;
  relatedSystems: string[];
}

export interface RecommendedPathStep {
  stepId: string;
  stage: ExperienceJourneyStage;
  surface: ExperienceSurface;
  founderAction: string;
  systemExposure: string;
  order: number;
}

export interface ExperienceConfirmation {
  experienceMappingOnly: true;
  noExecutionPerformed: true;
  noCommandsExecuted: true;
  noFilesModified: true;
  noCodeGenerated: true;
  noGovernanceModified: true;
  noOwnershipRegistryModified: true;
  noUiRenderingPerformed: true;
}

export interface ExperienceMapResult {
  experienceId: string;
  journeyId: string;
  workspaceId: string;
  projectId: string;
  surfaceSequence: ExperienceSurface[];
  systemSequence: string[];
  founderActions: string[];
  systemActions: string[];
  decisionPoints: DecisionPoint[];
  recommendedPath: RecommendedPathStep[];
  warnings: string[];
  surfaces: ExperienceSurfaceRecord[];
  journeyStages: ExperienceJourneyStage[];
  founderGuidance: string[];
  experienceState: ExperienceState;
  governanceGates: GateRecord[];
  ownershipGates: GateRecord[];
  confirmation: ExperienceConfirmation;
  stateSequence: ExperienceState[];
  createdAt: number;
}

export interface ExperienceLayerReportOutput {
  reportId: string;
  experienceId: string;
  journeyId: string;
  workspaceId: string;
  projectId: string;
  surfaceCount: number;
  journeyStageCount: number;
  systemCount: number;
  decisionPointCount: number;
  recommendedPathCount: number;
  confirmation: ExperienceConfirmation;
}

export interface ExperienceLayerReport {
  ownerModule: string;
  reportId: string;
  experienceId: string;
  journeyId: string;
  workspaceId: string;
  projectId: string;
  surfaceCount: number;
  journeyStageCount: number;
  systemCount: number;
  decisionPointCount: number;
  recommendedPathCount: number;
  confirmation: ExperienceConfirmation;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface ExperienceLayerFoundationState {
  foundationId: string;
  mapCount: number;
  warnings: string[];
  errors: string[];
}

export const EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE = 'devpulse_v2_experience_layer_foundation';
export const EXPERIENCE_LAYER_FOUNDATION_PASS_TOKEN =
  'DEVPULSE_V2_EXPERIENCE_LAYER_FOUNDATION_V1_PASS';

export const EXPERIENCE_STATE_SEQUENCE: readonly ExperienceState[] = [
  'EXPERIENCE_REQUEST_RECEIVED',
  'SURFACES_GENERATED',
  'JOURNEY_MAPPED',
  'SYSTEMS_SEQUENCED',
  'DECISIONS_MAPPED',
  'PATH_RECOMMENDED',
  'EXPERIENCE_MAP_READY',
] as const;

export const KNOWN_EXPERIENCE_SURFACES: readonly ExperienceSurface[] = [
  'FOUNDER_HOME',
  'PROJECT_ENTRY',
  'PROJECT_WORKSPACE',
  'WORLD2_WORKSPACE',
  'VERIFICATION_WORKSPACE',
  'TRUST_WORKSPACE',
  'MOBILE_WORKSPACE',
  'SELF_EVOLUTION_WORKSPACE',
  'PROJECT_COMPLETION_WORKSPACE',
] as const;

export const KNOWN_JOURNEY_STAGES: readonly ExperienceJourneyStage[] = [
  'IDEA_CAPTURE',
  'PROJECT_PLANNING',
  'WORLD2_SIMULATION',
  'BUILD_PREPARATION',
  'VERIFICATION',
  'TRUST_REVIEW',
  'MOBILE_MONITORING',
  'SELF_EVOLUTION_ANALYSIS',
  'PROJECT_COMPLETION',
] as const;

export const FOUNDER_QUESTIONS: readonly string[] = [
  'How do I start?',
  'What should I do next?',
  'What is DevPulse doing?',
  'What stage am I in?',
  'What systems are involved?',
  'What decision is required from me?',
] as const;

export const EXPOSED_SYSTEM_DOMAINS = [
  'execution_authority',
  'founder_approval_execution_gate',
  'execution_evidence_ledger',
  'verification_gated_apply',
  'trust_engine',
  'world2_workspace_foundation',
  'world2_execution_planner',
  'world2_simulation_runtime',
  'world2_autonomous_builder',
  'world2_completion_verifier',
  'world2_learning_loop',
  'controlled_execution_bridge',
  'mobile_command_foundation',
  'mobile_chat_interface',
  'mobile_live_preview_foundation',
  'mobile_approval_flow_foundation',
  'cross_device_continuity_foundation',
  'missing_capability_detector',
  'safe_capability_acquisition',
  'self_learning_engine',
  'architecture_drift_detection',
  'complexity_score_foundation',
  'future_problem_prediction',
] as const;

export const DUPLICATE_PATTERNS = [
  'experience_layer_foundation',
  'founder_experience_map',
  'experience_navigation_model',
  'experience_surface_registry',
] as const;

export const EXECUTION_BLOCKED_PATTERNS = ['execute', 'run command', 'self execute'] as const;
export const CODE_GEN_BLOCKED_PATTERNS = ['generate code', 'write code'] as const;
export const FILE_MOD_BLOCKED_PATTERNS = ['modify file', 'write file', 'delete file'] as const;
export const GOVERNANCE_MUTATION_BLOCKED_PATTERNS = ['mutate governance', 'modify governance'] as const;
export const REGISTRY_MUTATION_BLOCKED_PATTERNS = ['update ownership registry', 'mutate registry'] as const;
export const UI_RENDER_BLOCKED_PATTERNS = ['render ui', 'deploy ui', 'css theme update'] as const;

let experienceCounter = 0;
let journeyCounter = 0;

export function nextExperienceId(): string {
  experienceCounter += 1;
  return `exp-${experienceCounter.toString().padStart(4, '0')}`;
}

export function nextJourneyId(): string {
  journeyCounter += 1;
  return `journey-${journeyCounter.toString().padStart(4, '0')}`;
}

export function resetExperienceCountersForTests(): void {
  experienceCounter = 0;
  journeyCounter = 0;
}
